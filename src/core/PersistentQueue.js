const fs = require("fs");
const path = require("path");

class PersistentQueue {
  constructor(config = {}) {
    this.enabled = config.enabled ?? false;

    this.file =
      config.file || path.join(process.cwd(), "orbit-queue-persistence.json");

    if (!this.enabled) return;

    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, JSON.stringify([]));
    }
  }

  push(item) {
    if (!this.enabled) return;

    const queue = JSON.parse(fs.readFileSync(this.file));

    queue.push(item);

    fs.writeFileSync(this.file, JSON.stringify(queue));
  }

  async drain(handler) {
    if (!this.enabled) return;

    const items = JSON.parse(fs.readFileSync(this.file));

    fs.writeFileSync(this.file, JSON.stringify([]));

    await handler(items);
  }
}

module.exports = PersistentQueue;
