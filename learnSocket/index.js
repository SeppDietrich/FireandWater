import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
var rooms = new Map();

// Define maximum users per room
var MAX_USERS_PER_ROOM = 2;

// Socket.io event handling
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Event: User wants to join a room
    socket.on('joinRoom', (roomId) => {
        // Check if room exists
        if (!rooms.has(roomId)) {
            // Create a new room if it doesn't exist
            rooms.set(roomId, []);
        }

        var room = rooms.get(roomId);

        // Check if room is full
        if (room.length >= MAX_USERS_PER_ROOM) {
            socket.emit('roomFull');
            return;
        }

        // Add user to room
        room.push(socket.id);
        socket.join(roomId);

        console.log(`User ${socket.id} joined room ${roomId}`);

        // Notify user about successful room entry
        socket.emit('roomJoined', roomId);

        // If room is full, notify all users in the room
        if (room.length === MAX_USERS_PER_ROOM) {
            io.to(roomId).emit('roomReady');
        }
    });

    // Event: User disconnects
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);

        // Remove user from all rooms
        rooms.forEach((users, roomId) => {
            var index = users.indexOf(socket.id);
            if (index !== -1) {
                users.splice(index, 1);
                io.to(roomId).emit('userLeft', socket.id);
                console.log(`User ${socket.id} left room ${roomId}`);
            }
        });
    });
});
server.listen(3000, '192.168.100.28', () => {
  console.log('server running at http://192.168.100.28:3000');
});
