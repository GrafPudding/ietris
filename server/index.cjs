const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();
const io = new Server(server, { cors: { origin: true, methods: ["GET","POST"] } });

const rooms = new Map();

function defaultWords() {
  return [
    { id: 1, text: "programming", status: "pending" },
    { id: 2, text: "javascript",  status: "pending" },
    { id: 3, text: "vuejs",       status: "pending" },
    { id: 4, text: "component",   status: "pending" },
    { id: 5, text: "reactive",    status: "pending" },
  ];
}

io.on("connection", (socket) => {
  socket.data.username = socket.handshake.auth?.username || `user_${socket.id.slice(0,5)}`;
  socket.emit("connected", { id: socket.id, username: socket.data.username });

  socket.on("room:join", async ({ roomId }) => {
    if (!roomId) return;
    for (const r of socket.rooms) if (r !== socket.id) socket.leave(r);
    await socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        words: defaultWords(),
        players: new Map(),
        started: false,
        startTs: null,
      });
    }
    const room = rooms.get(roomId);
    room.players.set(socket.id, {
      id: socket.id,
      username: socket.data.username,
      index: 0,
      finished: false,
      time: 0,
      errors: 0,
    });

    socket.to(roomId).emit("room:user:joined", { id: socket.id, username: socket.data.username });

    socket.emit("room:state", {
      roomId,
      players: Array.from(room.players.values()),
      words: room.words,
      started: room.started,
      startTs: room.startTs,
    });
  });

  socket.on("chat:send", ({ roomId, text }) => {
    if (!roomId || !text) return;
    io.to(roomId).emit("chat:new", { from: socket.data.username, text, ts: Date.now() });
  });

  socket.on("game:start", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.started) return;
    room.started = true;
    room.startTs = Date.now();
    io.to(roomId).emit("game:start", { startTs: room.startTs, words: room.words });
  });

  socket.on("game:progress", ({ roomId, index, errors }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.index = index ?? p.index;
    if (typeof errors === "number") p.errors = errors;
    socket.to(roomId).emit("player:progress", { id: p.id, index: p.index, errors: p.errors });
  });

  socket.on("game:finished", ({ roomId, totalTime, errors }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.finished = true;
    p.time = totalTime;
    p.errors = errors;
    io.to(roomId).emit("player:finished", {
      id: p.id, username: p.username, totalTime: p.time, errors: p.errors
    });

    const allDone = Array.from(room.players.values()).every(x => x.finished);
    if (allDone) {
      const leaderboard = Array.from(room.players.values()).sort((a,b)=>a.time-b.time);
      io.to(roomId).emit("game:results", { leaderboard });
      // reset for next round
      room.started = false; room.startTs = null; room.words = defaultWords();
      for (const pl of room.players.values()) Object.assign(pl,{ index:0, finished:false, time:0, errors:0 });
    }
  });

  socket.on("disconnect", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const room = rooms.get(roomId);
      if (!room) continue;
      room.players.delete(socket.id);
      socket.to(roomId).emit("room:user:left", { id: socket.id });
      if (room.players.size === 0) rooms.delete(roomId);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✓ Socket server listening on :${PORT}`));