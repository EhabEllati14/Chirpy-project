import express, { Request, Response } from "express";
import { config } from "./config.js";

import {
  createUser,
  deleteUsers,
  getUserByEmail,
} from "./db/queries/users.js";

import {
  createChirp,
  getAllChirps,
} from "./db/queries/chirps.js";

import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  validateJWT,
  getBearerToken,
} from "./auth.js";

const app = express();
const PORT = 8080;

app.use(express.json());

/* -------- RESET -------- */
app.post("/admin/reset", async (_req: Request, res: Response) => {
  await deleteUsers();
  return res.status(200).json({ status: "ok" });
});

/* -------- CREATE USER -------- */
app.post("/api/users", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const hashedPassword = await hashPassword(password);
  const user = await createUser({ email, hashedPassword });

  return res.status(201).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
  });
});

/* -------- LOGIN -------- */
app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "incorrect email or password" });
  }

  const valid = await checkPasswordHash(password, user.hashedPassword);
  if (!valid) {
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

/* -------- CREATE CHIRP -------- */
app.post("/api/chirps", async (req: Request, res: Response) => {
  const token = getBearerToken(req);
  const userId = validateJWT(token, config.api.jwtSecret);

  const { body } = req.body;

  const chirp = await createChirp({
    body,
    userId,
  });

  return res.status(201).json({
    id: chirp.id,
    body: chirp.body,
    userId: chirp.userId,
    createdAt: chirp.createdAt,
    updatedAt: chirp.updatedAt,
  });
});

/* -------- GET CHIRPS (SORT ONLY) -------- */
app.get("/api/chirps", async (req: Request, res: Response) => {
  const { sort } = req.query;

  let chirps = await getAllChirps();

  const order = sort === "desc" ? "desc" : "asc";

  chirps.sort((a, b) => {
    const diff =
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime();

    return order === "asc" ? diff : -diff;
  });

  return res.status(200).json(
    chirps.map((c) => ({
      id: c.id,
      body: c.body,
      userId: c.userId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  );
});

/* -------- START -------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
