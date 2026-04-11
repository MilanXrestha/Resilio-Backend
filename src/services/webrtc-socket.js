const { Server } = require('socket.io');

/**
 * WebRTC Signaling Server
 * Event names aligned with Flutter flutter_webrtc / socket_io_client client.
 *
 * Flutter client emits:  join-room | offer | answer | ice-candidate
 * Flutter client listens: user-joined | user-left | receive-offer | receive-answer | receive-ice-candidate
 */
function initWebRTCSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track rooms: roomId → Set of { socketId, userId }
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log(`[WebRTC] Client connected: ${socket.id}`);

    // ── JOIN ROOM ────────────────────────────────────────────────────────────
    socket.on('join-room', ({ roomId, userId }) => {
      if (!roomId || !userId) return;
      socket.join(roomId);

      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      rooms.get(roomId).set(socket.id, userId);

      console.log(`[WebRTC] ${userId} joined room ${roomId} (${rooms.get(roomId).size} total)`);

      // Notify existing peers
      socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });

      // Send the list of existing peers back to the joiner
      const existing = [...rooms.get(roomId).entries()]
        .filter(([sid]) => sid !== socket.id)
        .map(([sid, uid]) => ({ socketId: sid, userId: uid }));
      socket.emit('room-peers', { peers: existing });
    });

    // ── OFFER ────────────────────────────────────────────────────────────────
    socket.on('offer', ({ roomId, targetUserId, offer, fromUserId }) => {
      // Relay to target only (or broadcast to room if no target)
      if (targetUserId) {
        const targetSocketId = _findSocket(rooms, roomId, targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('receive-offer', {
            offer,
            fromUserId: fromUserId || _socketUser(rooms, roomId, socket.id),
            fromSocketId: socket.id,
          });
          return;
        }
      }
      socket.to(roomId).emit('receive-offer', {
        offer,
        fromUserId: fromUserId || _socketUser(rooms, roomId, socket.id),
        fromSocketId: socket.id,
      });
    });

    // ── ANSWER ───────────────────────────────────────────────────────────────
    socket.on('answer', ({ roomId, targetUserId, answer, fromUserId }) => {
      if (targetUserId) {
        const targetSocketId = _findSocket(rooms, roomId, targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('receive-answer', {
            answer,
            fromUserId: fromUserId || _socketUser(rooms, roomId, socket.id),
          });
          return;
        }
      }
      socket.to(roomId).emit('receive-answer', {
        answer,
        fromUserId: fromUserId || _socketUser(rooms, roomId, socket.id),
      });
    });

    // ── ICE CANDIDATE ────────────────────────────────────────────────────────
    socket.on('ice-candidate', ({ roomId, targetUserId, candidate, fromUserId }) => {
      if (targetUserId) {
        const targetSocketId = _findSocket(rooms, roomId, targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('receive-ice-candidate', {
            candidate,
            fromUserId: fromUserId || _socketUser(rooms, roomId, socket.id),
          });
          return;
        }
      }
      socket.to(roomId).emit('receive-ice-candidate', {
        candidate,
        fromUserId: fromUserId || _socketUser(rooms, roomId, socket.id),
      });
    });

    // ── LEAVE ROOM ───────────────────────────────────────────────────────────
    socket.on('leave-room', ({ roomId, userId }) => {
      _leaveRoom(io, rooms, socket, roomId, userId);
    });

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[WebRTC] Client disconnected: ${socket.id}`);
      rooms.forEach((members, roomId) => {
        if (members.has(socket.id)) {
          const userId = members.get(socket.id);
          _leaveRoom(io, rooms, socket, roomId, userId);
        }
      });
    });
  });

  return io;
}

function _findSocket(rooms, roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  for (const [sid, uid] of room.entries()) {
    if (uid === userId) return sid;
  }
  return null;
}

function _socketUser(rooms, roomId, socketId) {
  return rooms.get(roomId)?.get(socketId) ?? null;
}

function _leaveRoom(io, rooms, socket, roomId, userId) {
  socket.leave(roomId);
  const room = rooms.get(roomId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) rooms.delete(roomId);
  }
  io.to(roomId).emit('user-left', { userId, socketId: socket.id });
  console.log(`[WebRTC] ${userId} left room ${roomId}`);
}

module.exports = { initWebRTCSocket };
