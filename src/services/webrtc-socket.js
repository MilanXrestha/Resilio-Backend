const { Server } = require('socket.io');

function initWebRTCSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Typically restricted to allowed origins in prod
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected for WebRTC: ${socket.id}`);

    // Join a specific meeting room
    socket.on('join_room', (roomId, userId) => {
      socket.join(roomId);
      console.log(`User ${userId} (Socket: ${socket.id}) joined room: ${roomId}`);
      // Notify others in room
      socket.to(roomId).emit('user_joined', { userId, socketId: socket.id });
    });

    // Exchange ICE Candidates
    socket.on('ice_candidate', (data) => {
      // data: { roomId, candidate, from }
      socket.to(data.roomId).emit('ice_candidate', data);
    });

    // Exchange SDP Offers
    socket.on('sdp_offer', (data) => {
      // data: { roomId, offer, from }
      socket.to(data.roomId).emit('sdp_offer', data);
    });

    // Exchange SDP Answers
    socket.on('sdp_answer', (data) => {
      // data: { roomId, answer, from }
      socket.to(data.roomId).emit('sdp_answer', data);
    });

    // Handle Leave
    socket.on('leave_room', (roomId, userId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user_left', { userId, socketId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Clean up rooms automatically done by socket.io
    });
  });

  return io;
}

module.exports = { initWebRTCSocket };
