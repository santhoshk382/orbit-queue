class BatchManager {
  constructor(size, interval, handler) {
    this.size = size;

    this.interval = interval;

    this.handler = handler;

    this.batch = [];

    this.timer = setInterval(() => this.flush(), interval);
  }

  add(message) {
    this.batch.push(message);

    if (this.batch.length >= this.size) {
      this.flush();
    }
  }

  async flush() {
    if (!this.batch.length) return;

    const batch = this.batch;

    this.batch = [];

    await this.handler(batch);
  }

  async close() {
    clearInterval(this.timer);

    await this.flush();
  }
}

module.exports = BatchManager;
