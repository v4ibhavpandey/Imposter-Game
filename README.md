# Imposter Game

A real-time multiplayer word party game for 3 to 10 players. Everyone gets a secret word except the imposter, who gets a similar-but-different word. Players discuss, vote, and try to find the imposter.

**Play it live:** https://imposter-game-vtyn.onrender.com/

> The game runs on Render's free tier, so the first visit after a period of inactivity can take about a minute to wake up.

## How to play

1. One player creates a room and shares the 4-letter room code.
2. The others join with the code (3 to 10 players per room).
3. The host starts the game. Each player privately sees their own word.
4. Everyone takes turns describing their word without saying it. The discussion lasts 2 minutes, and the host can start voting early.
5. Everyone votes. The game reveals the imposter, both words, and the vote tally.

There is also a single-device pass-and-play mode.

## Tech stack

- Node.js and Express.js (static files and a small API)
- Socket.IO for real-time rooms and events
- Plain HTML, CSS, and JavaScript on the front end
- Deployed on Render from this repository

## How it works

The server owns the game state. It picks the word pair and the imposter, and sends each player only their own word over a private socket message, so the imposter cannot be found by inspecting the browser. Rooms, players, votes, and timers are kept in server memory. Clients only send actions such as create-room, join-room, start-game, and cast-vote, and the server validates them before broadcasting updates. It also handles tie votes, host transfer, and players leaving mid-game.

## Run it locally

```bash
git clone https://github.com/v4ibhavpandey/Imposter-Game.git
cd Imposter-Game
npm install
npm start
```

Then open http://localhost:8000. Open it in several browser tabs to simulate multiple players.

## Known limits

- Rooms are stored in memory, so they are lost if the server restarts.
- There are no automated tests yet.

## Project files

| File | Purpose |
| --- | --- |
| `server.js` | Express server, Socket.IO rooms, and game logic |
| `words.js` | Word pairs |
| `imposter.html`, `imposter.css`, `imposter.js` | Front end |
