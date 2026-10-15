import assert from "node:assert";
import test from "node:test";
import { assertSlotFree } from "./availability";

test("availability slot module imports cleanly", () => {
  assert.strictEqual(typeof assertSlotFree, "function");
});
