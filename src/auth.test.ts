import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT } from "./auth";

describe("JWT", () => {
  const userID = "123e4567-e89b-12d3-a456-426614174000";
  const secret = "my-secret";
  const wrongSecret = "wrong-secret";

  it("should create and validate a JWT", () => {
    const token = makeJWT(userID, 60, secret);
    const result = validateJWT(token, secret);
    expect(result).toBe(userID);
  });

  it("should reject expired JWTs", () => {
    const token = makeJWT(userID, -1, secret);
    expect(() => validateJWT(token, secret)).toThrow();
  });

  it("should reject JWTs signed with the wrong secret", () => {
    const token = makeJWT(userID, 60, secret);
    expect(() => validateJWT(token, wrongSecret)).toThrow();
  });
});
