import crypto from "node:crypto";
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);
const keyFor = (id) => "token:" + id;

/**
 * Issue a single-use token storing a JSON payload with an atomic TTL.
 * @param {Object} payload - Data to store in the token.
 * @param {number} ttlSeconds - Time-to-live in seconds.
 * @returns {Promise<string>} The generated token ID.
 */
export async function issueToken(payload, ttlSeconds) {
  const tokenId = crypto.randomBytes(16).toString("hex");
  const value = JSON.stringify(payload);

  // Atomic set with TTL (EX) and non-exist check (NX)
  await redis.set(keyFor(tokenId), value, "EX", ttlSeconds, "NX");

  return tokenId;
}

/**
 * Atomically consume a token exactly once using GETDEL.
 * @param {string} tokenId - The token ID to consume.
 * @returns {Promise<{ok: boolean, payload?: Object, reason?: string}>} Typed result object.
 */
export async function consumeToken(tokenId) {
  // Atomic read-and-delete in a single Redis command
  const value = await redis.getdel(keyFor(tokenId));

  if (value === null) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, payload: JSON.parse(value) };
}

export function closeRedis() {
  return redis.quit();
}
