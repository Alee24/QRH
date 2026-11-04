import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Join room for specific table session (customer order tracking)
    socket.on('join:session', (sessionCode: string) => {
      socket.join(`session:${sessionCode}`);
    });

    // Join room for kitchen display (station or all, with optional tenant scoping)
    socket.on('join:kds', (stationId: string = 'all', tenantId?: string) => {
      socket.join(`kds:${stationId}`);
      if (tenantId) {
        socket.join(`tenant:${tenantId}:kds:${stationId}`);
        socket.join(`tenant:${tenantId}:kds:all`);
      }
    });

    // Join room for Cashier / POS
    socket.on('join:pos', (tenantId?: string) => {
      socket.join('pos');
      if (tenantId) {
        socket.join(`tenant:${tenantId}:pos`);
      }
    });

    // Join room for Service staff / Waiters
    socket.on('join:service', (tenantId?: string) => {
      socket.join('service');
      if (tenantId) {
        socket.join(`tenant:${tenantId}:service`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return io;
}

// Broadcaster helpers
export function emitOrderCreated(order: any, tickets: any[]) {
  if (!io) return;
  const tenantId = order.tenant_id;
  // Notify customer
  io.to(`session:${order.session_code}`).emit('order:received', { order });
  // Notify all stations and specific stations
  io.to('kds:all').emit('kds:new_order', { order, tickets });
  if (tenantId) {
    io.to(`tenant:${tenantId}:kds:all`).emit('kds:new_order', { order, tickets });
    io.to(`tenant:${tenantId}:pos`).emit('pos:order_received', { order });
  }
  for (const t of tickets) {
    io.to(`kds:${t.station_id}`).emit('kds:new_ticket', { ticket: t });
    if (tenantId) {
      io.to(`tenant:${tenantId}:kds:${t.station_id}`).emit('kds:new_ticket', { ticket: t });
    }
  }
  // Notify POS
  io.to('pos').emit('pos:order_received', { order });

  // Global Staff Order Alert Notification (for top bar notification bell & audio chime)
  io.emit('order:new_notification', {
    order_id: order.id,
    order_number: order.order_number,
    table_number: order.table_number,
    table_id: order.table_id,
    total_amount: order.total_amount,
    currency: order.currency || 'KES',
    item_count: order.items?.length || (tickets?.length || 1),
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
  });
}

export function emitTicketUpdated(ticket: any) {
  if (!io) return;
  const tenantId = ticket.tenant_id;
  io.to('kds:all').emit('kds:ticket_updated', { ticket });
  io.to(`kds:${ticket.station_id}`).emit('kds:ticket_updated', { ticket });
  if (tenantId) {
    io.to(`tenant:${tenantId}:kds:all`).emit('kds:ticket_updated', { ticket });
    io.to(`tenant:${tenantId}:kds:${ticket.station_id}`).emit('kds:ticket_updated', { ticket });
  }
  if (ticket.status === 'ready') {
    io.to('service').emit('service:ticket_ready', { ticket });
    if (tenantId) {
      io.to(`tenant:${tenantId}:service`).emit('service:ticket_ready', { ticket });
    }
  }
}

export function emitOrderStatusUpdated(orderId: string, sessionCode: string, status: string, order: any) {
  if (!io) return;
  const tenantId = order?.tenant_id;
  io.to(`session:${sessionCode}`).emit('order:status_change', { orderId, status, order });
  io.to('pos').emit('pos:order_status_change', { orderId, status, order });
  if (tenantId) {
    io.to(`tenant:${tenantId}:pos`).emit('pos:order_status_change', { orderId, status, order });
  }
}

export function emitTableStatusUpdated(tableId: string, status: string, table: any) {
  if (!io) return;
  const tenantId = table?.tenant_id;
  io.to('pos').emit('pos:table_status', { tableId, status, table });
  if (tenantId) {
    io.to(`tenant:${tenantId}:pos`).emit('pos:table_status', { tableId, status, table });
  }
}

export function emitAssistanceRequested(req: any) {
  if (!io) return;
  const tenantId = req.tenant_id;
  io.to('pos').emit('pos:assistance_requested', req);
  io.to('service').emit('service:assistance_requested', req);
  if (tenantId) {
    io.to(`tenant:${tenantId}:pos`).emit('pos:assistance_requested', req);
    io.to(`tenant:${tenantId}:service`).emit('service:assistance_requested', req);
  }
}

export function emitPaymentSettled(sessionCode: string, payment: any) {
  if (!io) return;
  const tenantId = payment?.tenant_id;
  io.to(`session:${sessionCode}`).emit('payment:settled', payment);
  io.to('pos').emit('pos:payment_settled', payment);
  if (tenantId) {
    io.to(`tenant:${tenantId}:pos`).emit('pos:payment_settled', payment);
  }
}

