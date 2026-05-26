const clients = new Map();
const crypto = require("crypto");

function getCacheKey(config) {
  return crypto.createHash("md5").update(JSON.stringify(config)).digest("hex");
}

async function createClient(config) {
  const key = getCacheKey(config);

  if (clients.has(key)) {
    return clients.get(key);
  }

  let ClientClass;

  switch (config.type) {
    case "rabbitmq":
      ClientClass = require("../adapters/RabbitMQAdapter");
      break;

    default:
      throw new Error(`Unsupported queue type: ${config.type}`);
  }

  const client = new ClientClass(config);

  await client.connect();

  clients.set(key, client);

  return client;
}

module.exports = {
  createClient,
};
