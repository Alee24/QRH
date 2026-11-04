import { queryOne, queryAll, execute, runInTransaction } from '../../db/index.js';
import { emitTicketUpdated, emitOrderStatusUpdated } from '../../socket/index.js';

export class KdsService {
  /**
   * Fetch active kitchen tickets with items, optionally filtered by kitchen station and tenant
   */
  static getActiveTickets(stationId?: string, tenantId?: string) {
    let sql = `
      SELECT 
        kt.*,
        ks.name as station_name,
        ks.code as station_code,
        ks.color_code as station_color,
        o.order_number,
        o.special_instructions as order_notes,
        s.session_code
      FROM kitchen_tickets kt
      JOIN kitchen_stations ks ON kt.station_id = ks.id
      JOIN orders o ON kt.order_id = o.id
      JOIN table_sessions s ON o.table_session_id = s.id
      WHERE kt.status IN ('pending', 'preparing', 'ready')
    `;

    const params: any[] = [];
    if (tenantId) {
      sql += ' AND kt.tenant_id = ?';
      params.push(tenantId);
    }

    if (stationId && stationId !== 'all') {
      sql += ' AND kt.station_id = ?';
      params.push(stationId);
    }

    sql += ' ORDER BY CASE kt.priority WHEN \'rush\' THEN 1 WHEN \'delayed\' THEN 2 ELSE 3 END, kt.created_at ASC';

    const tickets = queryAll(sql, params);

    for (const t of tickets) {
      t.items = queryAll(`
        SELECT kti.*, oi.station_id
        FROM kitchen_ticket_items kti
        JOIN order_items oi ON kti.order_item_id = oi.id
        WHERE kti.ticket_id = ?
      `, [t.id]);
    }

    return tickets;
  }

  /**
   * Update ticket status (e.g. pending -> preparing -> ready -> served)
   */
  static updateTicketStatus(ticketId: string, status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled') {
    return runInTransaction(() => {
      const ticket = queryOne(`
        SELECT kt.*, o.table_session_id, o.id as order_id, s.session_code, o.table_id
        FROM kitchen_tickets kt
        JOIN orders o ON kt.order_id = o.id
        JOIN table_sessions s ON o.table_session_id = s.id
        WHERE kt.id = ?
      `, [ticketId]);

      if (!ticket) throw new Error('Kitchen ticket not found');

      let timeUpdateSql = '';
      if (status === 'preparing') {
        timeUpdateSql = ', started_at = CURRENT_TIMESTAMP';
      } else if (status === 'ready') {
        timeUpdateSql = ', ready_at = CURRENT_TIMESTAMP';
      } else if (status === 'served') {
        timeUpdateSql = ', served_at = CURRENT_TIMESTAMP';
      }

      execute(`
        UPDATE kitchen_tickets 
        SET status = ? ${timeUpdateSql}
        WHERE id = ?
      `, [status, ticketId]);

      // Update all items in this ticket
      execute(`
        UPDATE kitchen_ticket_items 
        SET status = ? 
        WHERE ticket_id = ?
      `, [status, ticketId]);

      // Check all sibling tickets for the parent order
      const siblingTickets = queryAll(`SELECT status FROM kitchen_tickets WHERE order_id = ?`, [ticket.order_id]);
      const allReady = siblingTickets.every(st => st.status === 'ready' || st.status === 'served');
      const anyPreparing = siblingTickets.some(st => st.status === 'preparing' || st.status === 'ready');
      const allServed = siblingTickets.every(st => st.status === 'served');

      let orderStatus = 'received';
      if (allServed) {
        orderStatus = 'served';
      } else if (allReady) {
        orderStatus = 'ready';
      } else if (anyPreparing) {
        orderStatus = 'preparing';
      }

      execute(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [orderStatus, ticket.order_id]);

      // Also update table status
      if (orderStatus === 'ready') {
        execute(`UPDATE restaurant_tables SET status = 'ready' WHERE id = ?`, [ticket.table_id]);
      } else if (orderStatus === 'preparing') {
        execute(`UPDATE restaurant_tables SET status = 'preparing' WHERE id = ?`, [ticket.table_id]);
      }

      const updatedTicket = queryOne(`
        SELECT kt.*, ks.name as station_name, ks.code as station_code, ks.color_code as station_color, o.order_number
        FROM kitchen_tickets kt
        JOIN kitchen_stations ks ON kt.station_id = ks.id
        JOIN orders o ON kt.order_id = o.id
        WHERE kt.id = ?
      `, [ticketId]);

      updatedTicket.items = queryAll('SELECT * FROM kitchen_ticket_items WHERE ticket_id = ?', [ticketId]);

      emitTicketUpdated(updatedTicket);
      emitOrderStatusUpdated(ticket.order_id, ticket.session_code, orderStatus, { id: ticket.order_id, status: orderStatus });

      return updatedTicket;
    });
  }

  /**
   * Update individual ticket item status (toggle checkbox)
   */
  static updateItemStatus(ticketItemId: string, status: string) {
    return runInTransaction(() => {
      execute(`
        UPDATE kitchen_ticket_items 
        SET status = ? 
        WHERE id = ?
      `, [status, ticketItemId]);

      const item = queryOne(`SELECT ticket_id FROM kitchen_ticket_items WHERE id = ?`, [ticketItemId]);
      if (item) {
        // If all items ready, automatically set ticket to ready
        const allItems = queryAll(`SELECT status FROM kitchen_ticket_items WHERE ticket_id = ?`, [item.ticket_id]);
        if (allItems.every(i => i.status === 'ready')) {
          this.updateTicketStatus(item.ticket_id, 'ready');
        }
      }
      return { success: true };
    });
  }

  /**
   * Toggle rush priority for an urgent ticket
   */
  static setTicketPriority(ticketId: string, priority: 'normal' | 'rush' | 'delayed') {
    execute(`UPDATE kitchen_tickets SET priority = ? WHERE id = ?`, [priority, ticketId]);
    return { success: true, priority };
  }
}

