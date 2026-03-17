import express from "express";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { updateUser } from "./db/queries/users.js";
import { config } from "./config.js";
import { db } from "./db/index.js";
import { users, chirps } from "./db/schema.js";
import { getUserByEmail } from "./db/queries/users.js";
import { createChirp } from "./db/queries/chirps.js";
import { createRefreshToken, getRefreshToken, revokeRefreshToken, } from "./db/queries/refreshTokens.js";
import { hashPassword } from "./auth.js";
import { checkPasswordHash, makeJWT, validateJWT, getBearerToken, makeRefreshToken, } from "./auth.js";
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), {
    migrationsFolder: "src/db/migrations",
});
const app = express();
const PORT = 8080;
app.use(express.json());
class BadRequestError extends Error {
}
/* RESET */
app.post("/admin/reset", async (req, res) => {
    await db.delete(chirps);
    await db.delete(users);
    config.api.fileserverHits = 0;
    res.status(200).send("OK");
});
app.put("/api/users", async (req, res) => {
    try {
        const token = getBearerToken(req);
        const userId = validateJWT(token, config.jwt.secret);
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        const hashedPassword = await hashPassword(password);
        const updatedUser = await updateUser(userId, {
            email,
            hashedPassword,
        });
        const { hashedPassword: _, ...safeUser } = updatedUser;
        res.status(200).json(safeUser);
    }
    catch {
        res.status(401).json({ error: "Unauthorized" });
    }
});
/* REGISTER */
/* =========================
   UPDATE USER (AUTH REQUIRED)
========================= */
app.put("/api/users", async (req, res) => {
    try {
        const token = getBearerToken(req);
        const userID = validateJWT(token, config.jwt.secret);
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        const hashedPassword = await hashPassword(password);
        const updatedUser = await updateUser(userID, {
            email,
            hashedPassword,
        });
        const { hashedPassword: _, ...safeUser } = updatedUser;
        res.status(200).json(safeUser);
    }
    catch {
        res.status(401).json({ error: "Unauthorized" });
    }
});
/* LOGIN */
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: "incorrect email or password" });
    }
    const valid = await checkPasswordHash(password, user.hashedPassword);
    if (!valid) {
        return res.status(401).json({ error: "incorrect email or password" });
    }
    const accessToken = makeJWT(user.id, 60 * 60, config.jwt.secret);
    const refreshToken = makeRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    await createRefreshToken({
        token: refreshToken,
        userId: user.id,
        expiresAt,
    });
    const { hashedPassword: _, ...safeUser } = user;
    res.status(200).json({
        ...safeUser,
        token: accessToken,
        refreshToken,
    });
});
/* AUTH CHIRP */
app.post("/api/chirps", async (req, res) => {
    try {
        const token = getBearerToken(req);
        const userID = validateJWT(token, config.jwt.secret);
        const { body } = req.body;
        const chirp = await createChirp({
            body,
            userId: userID,
        });
        res.status(201).json(chirp);
    }
    catch {
        res.status(401).json({ error: "Unauthorized" });
    }
});
/* REFRESH */
app.post("/api/refresh", async (req, res) => {
    try {
        const token = getBearerToken(req);
        const stored = await getRefreshToken(token);
        if (!stored)
            return res.status(401).json({ error: "Invalid token" });
        if (stored.revokedAt) {
            return res.status(401).json({ error: "Token revoked" });
        }
        if (new Date(stored.expiresAt) < new Date()) {
            return res.status(401).json({ error: "Token expired" });
        }
        const newAccessToken = makeJWT(stored.userId, 60 * 60, config.jwt.secret);
        res.status(200).json({ token: newAccessToken });
    }
    catch {
        res.status(401).json({ error: "Invalid token" });
    }
});
/* REVOKE */
app.post("/api/revoke", async (req, res) => {
    try {
        const token = getBearerToken(req);
        await revokeRefreshToken(token);
        res.status(204).send();
    }
    catch {
        res.status(401).json({ error: "Invalid token" });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
