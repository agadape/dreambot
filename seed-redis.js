const fs = require("fs");
const { Redis } = require("@upstash/redis");
const mock = JSON.parse(fs.readFileSync("packages/agent/data/signals.json", "utf8"));
const redis = new Redis({ url: "https://wondrous-goblin-169856.upstash.io", token: "gQAAAAAAApeAAAIgcDEyYjQyM2IxNTg2Zjg0ZjFkODQ2N2JlY2FkNzhhMDU4NQ" });
redis.set("dreambot:signals", mock).then(() => console.log("Mock data pushed to Redis!")).catch(console.error);
