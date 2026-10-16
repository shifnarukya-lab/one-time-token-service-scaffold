import assert from "node:assert/strict";
import { issueToken, consumeToken, closeRedis } from "./token-service.js";

async function main() {
  try {
    const payload = { userId: 42, purpose: "password-reset" };
    const tokenId = await issueToken(payload, 60);

    console.log(`issued token: ${tokenId}`);

    const results = await Promise.all([
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
    ]);

    const winners = results.filter((result) => result.ok).length;

    console.log(`winners: ${winners}`);
    assert.equal(winners, 1, "SINGLE-USE VIOLATED!");
    console.log("PASS: token was single-use.");
  } finally {
    await closeRedis();
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exitCode = 1;
});
