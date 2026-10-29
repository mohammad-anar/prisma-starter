import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidObjectId, validateObjectId } from "../utils/objectId.js";

describe("MongoDB ObjectId Validator", () => {
  it("should recognize valid 24-character hexadecimal MongoDB ObjectIds", () => {
    assert.equal(isValidObjectId("507f1f77bcf86cd799439011"), true);
    assert.equal(isValidObjectId("660c1abf8d74567890abcdef"), true);
    assert.equal(isValidObjectId("000000000000000000000000"), true);
  });

  it("should reject invalid MongoDB ObjectIds", () => {
    assert.equal(isValidObjectId("invalid-id"), false);
    assert.equal(isValidObjectId("123"), false);
    assert.equal(isValidObjectId(""), false);
    assert.equal(isValidObjectId(null), false);
    assert.equal(isValidObjectId(undefined), false);
    assert.equal(isValidObjectId("507f1f77bcf86cd79943901z"), false); // 'z' is not hex
    assert.equal(isValidObjectId("507f1f77bcf86cd7994390111"), false); // 25 chars
  });

  it("validateObjectId should return the valid id or throw ApiError", () => {
    const valid = "507f1f77bcf86cd799439011";
    assert.equal(validateObjectId(valid), valid);

    assert.throws(
      () => validateObjectId("bad-id", "testField"),
      (err: any) => err.statusCode === 400 && err.message.includes("testField"),
    );
  });
});
