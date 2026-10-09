const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const wordPairs = require('./words');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 8000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'imposter.html'));
});

app.get('/api/round', (req, res) => {
    const players = Number(req.query.players);

    if (!Number.isInteger(players) || players < 3 || players > 10) {
        return res.status(400).json({ error: 'Players must be between 3 and 10' });
    }

    const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
    const imposterIndex = Math.floor(Math.random() * players);

    res.json({ imposterIndex, mainWord: pair[0], imposterWord: pair[1] });
});

// ---------- Rooms ----------

const rooms = {};
const MAX_PLAYERS = 10;
const MIN_PLAYERS = 3;
const DISCUSSION_SECONDS = 120;

function generateCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O, they look like 1 and 0
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += letters[Math.floor(Math.random() * letters.length)];
        }
    } while (rooms[code]);
    return code;
}

function cleanName(name) {
    return String(name || '').trim().slice(0, 15);
}

function sendRoomUpdate(code) {
    const room = rooms[code];
    if (!room) return;
    io.to(code).emit('room-update', {
        code,
        host: room.host,
        players: room.players,
    });
}

function startVoting(code) {
    const room = rooms[code];
    if (!room || room.phase !== 'discussion') return;

    clearTimeout(room.timer);
    room.phase = 'voting';
    room.votes = {};

    io.to(code).emit('voting-start', {
        players: room.players.map((p) => ({ id: p.id, name: p.name })),
    });
    io.to(code).emit('vote-progress', { voted: 0, total: room.players.length });
}

function finishGame(code, imposterLeft = false) {
    const room = rooms[code];
    if (!room || room.phase === 'result' || room.phase === 'lobby') return;

    clearTimeout(room.timer);
    room.phase = 'result';

    // Count votes
    const counts = {};
    Object.values(room.votes).forEach((targetId) => {
        counts[targetId] = (counts[targetId] || 0) + 1;
    });

    const tally = room.players.map((p) => ({ name: p.name, votes: counts[p.id] || 0 }));
    const max = Math.max(0, ...tally.map((t) => t.votes));
    const top = room.players.filter((p) => (counts[p.id] || 0) === max);

    // A tie, or no votes at all, means nobody is voted out
    const votedOut = max > 0 && top.length === 1 ? top[0] : null;
    const crewWins = imposterLeft || (votedOut !== null && votedOut.id === room.imposterId);

    io.to(code).emit('game-result', {
        imposterName: room.imposterName,
        imposterWord: room.imposterWord,
        mainWord: room.mainWord,
        votedOutName: votedOut ? votedOut.name : null,
        imposterLeft,
        crewWins,
        tally,
    });
}

function allVoted(room) {
    return room.players.every((p) => room.votes[p.id]);
}

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);
    let currentRoom = null;

    socket.on('create-room', (name, callback) => {
        name = cleanName(name);
        if (!name) return callback({ error: 'Enter your name' });

        const code = generateCode();
        rooms[code] = {
            host: socket.id,
            players: [{ id: socket.id, name }],
            phase: 'lobby',
            imposterId: null,
            imposterName: null,
            imposterWord: null,
            mainWord: null,
            votes: {},
            timer: null,
        };
        socket.join(code);
        currentRoom = code;

        console.log(`Room ${code} created by ${name}`);
        callback({ code });
        sendRoomUpdate(code);
    });

    socket.on('join-room', (code, name, callback) => {
        code = String(code || '').trim().toUpperCase();
        name = cleanName(name);

        if (!name) return callback({ error: 'Enter your name' });
        const room = rooms[code];
        if (!room) return callback({ error: 'Room not found' });
        if (room.phase !== 'lobby') return callback({ error: 'Game already started' });
        if (room.players.length >= MAX_PLAYERS) return callback({ error: 'Room is full' });
        if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
            return callback({ error: 'That name is already taken in this room' });
        }

        room.players.push({ id: socket.id, name });
        socket.join(code);
        currentRoom = code;

        console.log(`${name} joined room ${code}`);
        callback({ code });
        sendRoomUpdate(code);
    });

    socket.on('start-game', (callback) => {
        const room = rooms[currentRoom];
        if (!room) return callback({ error: 'You are not in a room' });
        if (room.host !== socket.id) return callback({ error: 'Only the host can start' });
        if (room.phase !== 'lobby') return callback({ error: 'Game already started' });
        if (room.players.length < MIN_PLAYERS) {
            return callback({ error: `Need at least ${MIN_PLAYERS} players` });
        }

        const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
        // Randomly swap so the imposter's word isn't always the second one
        const [mainWord, imposterWord] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
        const imposter = room.players[Math.floor(Math.random() * room.players.length)];

        room.phase = 'discussion';
        room.imposterId = imposter.id;
        room.imposterName = imposter.name;
        room.mainWord = mainWord;
        room.imposterWord = imposterWord;
        room.votes = {};

        // Each player gets a private message with only their own word
        room.players.forEach((p) => {
            io.to(p.id).emit('your-word', {
                word: p.id === imposter.id ? imposterWord : mainWord,
                seconds: DISCUSSION_SECONDS,
            });
        });

        const code = currentRoom;
        room.timer = setTimeout(() => startVoting(code), DISCUSSION_SECONDS * 1000);

        console.log(`Room ${code} started. Imposter: ${imposter.name}`);
        callback({ ok: true });
    });

    socket.on('skip-discussion', (callback) => {
        const room = rooms[currentRoom];
        if (!room) return callback({ error: 'You are not in a room' });
        if (room.host !== socket.id) return callback({ error: 'Only the host can do this' });
        if (room.phase !== 'discussion') return callback({ error: 'Not in discussion' });

        startVoting(currentRoom);
        callback({ ok: true });
    });

    socket.on('cast-vote', (targetId, callback) => {
        const room = rooms[currentRoom];
        if (!room) return callback({ error: 'You are not in a room' });
        if (room.phase !== 'voting') return callback({ error: 'Voting is not open' });
        if (room.votes[socket.id]) return callback({ error: 'You already voted' });
        if (targetId === socket.id) return callback({ error: "You can't vote for yourself" });
        if (!room.players.some((p) => p.id === targetId)) {
            return callback({ error: 'Invalid player' });
        }

        room.votes[socket.id] = targetId;
        callback({ ok: true });

        io.to(currentRoom).emit('vote-progress', {
            voted: Object.keys(room.votes).length,
            total: room.players.length,
        });

        if (allVoted(room)) finishGame(currentRoom);
    });

    socket.on('play-again', (callback) => {
        const room = rooms[currentRoom];
        if (!room) return callback({ error: 'You are not in a room' });
        if (room.host !== socket.id) return callback({ error: 'Only the host can do this' });
        if (room.phase !== 'result') return callback({ error: 'Round is not finished' });

        room.phase = 'lobby';
        room.votes = {};
        room.imposterId = null;

        io.to(currentRoom).emit('back-to-lobby');
        sendRoomUpdate(currentRoom);
        callback({ ok: true });
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
        const code = currentRoom;
        const room = rooms[code];
        if (!room) return;

        room.players = room.players.filter((p) => p.id !== socket.id);

        if (room.players.length === 0) {
            clearTimeout(room.timer);
            delete rooms[code];
            console.log(`Room ${code} deleted (empty)`);
            return;
        }

        if (room.host === socket.id) {
            room.host = room.players[0].id; // pass host to the next player
        }

        // Remove the leaver's vote and any votes cast for them
        delete room.votes[socket.id];
        Object.keys(room.votes).forEach((voterId) => {
            if (room.votes[voterId] === socket.id) delete room.votes[voterId];
        });

        sendRoomUpdate(code);

        if (room.phase === 'discussion' || room.phase === 'voting') {
            if (socket.id === room.imposterId) {
                finishGame(code, true); // imposter left, crew wins
            } else if (room.phase === 'voting') {
                io.to(code).emit('vote-progress', {
                    voted: Object.keys(room.votes).length,
                    total: room.players.length,
                });
                if (allVoted(room)) finishGame(code);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});