import express, { Request, Response } from "express";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";

import { config } from "./config.js";
import { users } from "./db/schema.js";

import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  validateJWT,
  getBearerToken,
} from "./auth.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const client = postgres(config.db.url);
const db = drizzle(client);

const app = express();
const PORT = 8080;

app.use(express.json());

app.post("/admin/reset", async (_req: Request, res: Response) => {
  if (config.api.platform !== "dev") {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(users);

  return res.status(200).send("OK");
});

app.post("/api/users", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Something went wrong" });
  }

  const hashedPassword = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email,
      hashedPassword,
    })
    .returning();

  return res.status(201).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
  });
});

app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    return res.status(401).json({ error: "incorrect email or password" });
  }

  const match = await checkPasswordHash(password, user.hashedPassword);

  if (!match) {
    return res.status(401).json({ error: "incorrect email or password" });
  }

  const token = makeJWT(user.id, 3600, config.api.jwtSecret);

  return res.status(200).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
    token,
  });
});

app.put("/api/users", async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.api.jwtSecret);

    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Something went wrong" });
    }

    const hashedPassword = await hashPassword(password);

    const [user] = await db
      .update(users)
      .set({
        email,
        hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return res.status(200).json({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isChirpyRed: user.isChirpyRed,
    });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
