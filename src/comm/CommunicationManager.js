import { io } from "socket.io-client";

export default class CommunicationManager {
  constructor() {
    this.socket = null;
    this.callbacks = new Map();
  }

  //callbacks
  on(event, fn) {
    if (!this.callbacks.has(event)) this.callbacks.set(event, new Set());
    this.callbacks.get(event).add(fn);
    return () => this.callbacks.get(event)?.delete(fn);
  }
  #emitLocal(event, payload) {
    const set = this.callbacks.get(event);
    if (set) for (const fn of set) fn(payload);
  }

  connect({ username } = {}) {
    // Use Vite proxy so we can just connect to "/"
    this.socket = io("/", { autoConnect: true, auth: { username } });

    this.socket.on("connect", () => this.#emitLocal("connect", { id: this.socket.id }));
    this.socket.on("connected", (data) => this.#emitLocal("connected", data));

    // room lifecycle
    this.socket.on("room:state", (data) => this.#emitLocal("room:state", data));
    this.socket.on("room:user:joined", (p) => this.#emitLocal("room:user:joined", p));
    this.socket.on("room:user:left", (p) => this.#emitLocal("room:user:left", p));

    // chat
    this.socket.on("chat:new", (msg) => this.#emitLocal("chat:new", msg));

    // game
    this.socket.on("game:start", (data) => this.#emitLocal("game:start", data));
    this.socket.on("player:progress", (p) => this.#emitLocal("player:progress", p));
    this.socket.on("player:finished", (p) => this.#emitLocal("player:finished", p));
    this.socket.on("game:results", (data) => this.#emitLocal("game:results", data));
  }

  joinRoom(roomId) { this.socket?.emit("room:join", { roomId }); }
  sendChat(roomId, text) { this.socket?.emit("chat:send", { roomId, text }); }
  startGame(roomId) { this.socket?.emit("game:start", { roomId }); }
  sendProgress(roomId, index, errors) {
    this.socket?.emit("game:progress", { roomId, index, errors });
  }
  finishGame(roomId, totalTime, errors) {
    this.socket?.emit("game:finished", { roomId, totalTime, errors });
  }
}