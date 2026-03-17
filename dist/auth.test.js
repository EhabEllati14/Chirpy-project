import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword, checkPasswordHash, makeJWT, validateJWT, } from "./auth";
describe("Password Hashing", () => {
    const password1 = "correctPassword123!";
    const password2 = "anotherPassword456!";
    let hash1;
    let hash2;
    beforeAll(async () => {
        hash1 = await hashPassword(password1);
        hash2 = await hashPassword(password2);
    });
    it("should return true for correct password", async () => {
        const result = await checkPasswordHash(password1, hash1);
        expect(result).toBe(true);
    });
    it("should return false for incorrect password", async () => {
        const result = await checkPasswordHash(password2, hash1);
        expect(result).toBe(false);
    });
});
describe("JWT", () => {
    const userID = "123e4567-e89b-12d3-a456-426614174000";
    const secret = "supersecret";
    const wrongSecret = "wrongsecret";
    it("should create and validate a JWT", () => {
        const token = makeJWT(userID, 60, secret);
        const validatedUserID = validateJWT(token, secret);
        expect(validatedUserID).toBe(userID);
    });
    it("should reject JWT signed with wrong secret", () => {
        const token = makeJWT(userID, 60, secret);
        expect(() => {
            validateJWT(token, wrongSecret);
        }).toThrow();
    });
    it("should reject expired JWT", () => {
        const token = makeJWT(userID, -10, secret);
        expect(() => {
            validateJWT(token, secret);
        }).toThrow();
    });
});
