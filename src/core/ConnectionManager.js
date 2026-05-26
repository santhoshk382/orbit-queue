const EventEmitter = require("events");

class ConnectionManager extends EventEmitter {
  constructor(connectFn, config = {}) {
    super();

    this.connectFn = connectFn;

    this.retries = 0;

    this.reconnecting = false;

    this.maxRetries = config.reconnect?.retries ?? Infinity;

    this.minDelay = config.reconnect?.minDelay ?? 1000;

    this.maxDelay = config.reconnect?.maxDelay ?? 30000;

    this.factor = config.reconnect?.factor ?? 2;

    this.connect();
  }

  async connect() {
    try {
      await this.connectFn();

      this.retries = 0;

      this.reconnecting = false;

      this.emit("connected");
    } catch (err) {
      this.emit("error", err);

      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnecting) return;

    if (this.retries >= this.maxRetries) {
      return;
    }

    this.reconnecting = true;

    const delay = Math.min(
      this.minDelay * Math.pow(this.factor, this.retries),
      this.maxDelay,
    );

    this.retries++;

    this.emit("reconnecting", delay);

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

module.exports = ConnectionManager;
