import jwt from "jsonwebtoken";
import argon2 from "argon2";
import type { Request } from "express";
import type { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { UnauthorizedError } from "./errors.js";

type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);

  const payload: Payload = {
    iss: "chirpy",
    sub: userID,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decoded = jwt.verify(tokenString, secret);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.sub !== "string"
    ) {
      throw new UnauthorizedError("invalid token");
    }

    return decoded.sub;
  } catch {
    throw new UnauthorizedError("invalid token");
  }
}
export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new UnauthorizedError("missing authorization header");
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new UnauthorizedError("invalid authorization header");
  }

  return parts[1];
}

export function makeRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
export function getAPIKey(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new Error("missing authorization header");
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "ApiKey") {
    throw new Error("malformed authorization header");
  }

  return parts[1];
}
