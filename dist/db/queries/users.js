import { db } from "../index.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";
export async function createUser(data) {
    const [result] = await db
        .insert(users)
        .values(data)
        .returning();
    return result;
}
export async function getUserByEmail(email) {
    const [result] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
    return result;
}
export async function updateUser(userId, data) {
    const [result] = await db
        .update(users)
        .set({
        email: data.email,
        hashedPassword: data.hashedPassword,
        updatedAt: new Date(),
    })
        .where(eq(users.id, userId))
        .returning();
    return result;
}
