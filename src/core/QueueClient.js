const EventEmitter = require("events");

const OfflineQueue = require("./OfflineQueue");

const PersistentQueue = require("./PersistentQueue");

const DEFAULT_CONFIG = {
  heartbeat: 30,

  prefetch: 100,

  reconnect: {
    retries: Infinity,

    minDelay: 1000,

    maxDelay: 30000,

    factor: 2,
  },

  buffer: {
    maxSize: 100000,
  },

  persistence: {
    enabled: false,
  },
};

class QueueClient extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      ...DEFAULT_CONFIG,

      ...config,

      reconnect: {
        ...DEFAULT_CONFIG.reconnect,

        ...(config.reconnect || {}),
      },

      buffer: {
        ...DEFAULT_CONFIG.buffer,

        ...(config.buffer || {}),
      },

      persistence: {
        ...DEFAULT_CONFIG.persistence,

        ...(config.persistence || {}),
      },
    };

    this.connected = false;

    this.subscriptions = new Map();

    this.offlineQueue = new OfflineQueue(this.config.buffer);

    this.persistentQueue = new PersistentQueue(this.config.persistence);
  }

  async publish(queue, message, options = {}) {
    if (!this.connected) {
      const item = {
        queue,
        message,
        options,
      };

      if (this.config.persistence?.enabled) {
        this.persistentQueue.push(item);
      } else {
        this.offlineQueue.push(item);
      }

      this.emit("buffered");

      return;
    }

    return this._publishNow(queue, message, options);
  }

  async flushOfflineQueue() {
    await this.offlineQueue.drain(async (items) => {
      for (const item of items) {
        await this._publishNow(item.queue, item.message, item.options);
      }

      this.emit("offlineQueueFlushed", items.length);
    });
  }

  async flushPersistentQueue() {
    await this.persistentQueue.drain(async (items) => {
      for (const item of items) {
        await this._publishNow(item.queue, item.message, item.options);
      }

      this.emit("persistentQueueFlushed", items.length);
    });
  }

  async restoreSubscriptions() {
    for (const [queue, handler] of this.subscriptions) {
      await this.subscribe(queue, handler, true);
    }
  }
}

module.exports = QueueClient;
