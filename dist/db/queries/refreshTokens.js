import { db } from "../index.js";
import { refreshTokens } from "../schema.js";
import { eq } from "drizzle-orm";
export async function createRefreshToken(data) {
    const [result] = await db
        .insert(refreshTokens)
        .values(data)
        .returning();
    return result;
}
export async function getRefreshToken(token) {
    const [result] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token));
    return result;
}
export async function revokeRefreshToken(token) {
    await db
        .update(refreshTokens)
        .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
    })
        .where(eq(refreshTokens.token, token));
}
