class OfflineQueue {
  constructor(config = {}) {
    this.queue = [];

    this.maxSize = config.maxSize ?? 100000;
  }

  push(item) {
    if (this.queue.length >= this.maxSize) {
      throw new Error("Offline queue full");
    }

    this.queue.push(item);
  }

  async drain(handler) {
    const items = [...this.queue];

    this.queue = [];

    await handler(items);
  }
}

module.exports = OfflineQueue;
