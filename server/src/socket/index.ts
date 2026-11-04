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

    // Join room for kitchen display (station or all)
    socket.on('join:kds', (stationId: string = 'all') => {
      socket.join(`kds:${stationId}`);
    });

    // Join room for Cashier / POS
    socket.on('join:pos', () => {
      socket.join('pos');
    });

    // Join room for Service staff / Waiters
    socket.on('join:service', () => {
      socket.join('service');
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
  // Notify customer
  io.to(`session:${order.session_code}`).emit('order:received', { order });
  // Notify all stations and specific stations
  io.to('kds:all').emit('kds:new_order', { order, tickets });
  for (const t of tickets) {
    io.to(`kds:${t.station_id}`).emit('kds:new_ticket', { ticket: t });
  }
  // Notify POS
  io.to('pos').emit('pos:order_received', { order });
}

export function emitTicketUpdated(ticket: any) {
  if (!io) return;
  io.to('kds:all').emit('kds:ticket_updated', { ticket });
  io.to(`kds:${ticket.station_id}`).emit('kds:ticket_updated', { ticket });
  if (ticket.status === 'ready') {
    io.to('service').emit('service:ticket_ready', { ticket });
  }
}

export function emitOrderStatusUpdated(orderId: string, sessionCode: string, status: string, order: any) {
  if (!io) return;
  io.to(`session:${sessionCode}`).emit('order:status_change', { orderId, status, order });
  io.to('pos').emit('pos:order_status_change', { orderId, status, order });
}

export function emitTableStatusUpdated(tableId: string, status: string, table: any) {
  if (!io) return;
  io.to('pos').emit('pos:table_status', { tableId, status, table });
}

export function emitAssistanceRequested(req: any) {
  if (!io) return;
  io.to('pos').emit('pos:assistance_requested', req);
  io.to('service').emit('service:assistance_requested', req);
}

export function emitPaymentSettled(sessionCode: string, payment: any) {
  if (!io) return;
  io.to(`session:${sessionCode}`).emit('payment:settled', payment);
  io.to('pos').emit('pos:payment_settled', payment);
}

