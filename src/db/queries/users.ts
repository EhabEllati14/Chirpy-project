import { db } from "../index.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { users, chirps } from "../schema.js";
export async function createUser({
  email,
  hashedPassword,
}: {
  email: string;
  hashedPassword: string;
}) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      hashedPassword,
      isChirpyRed: false,
    })
    .returning();

  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return user;
}

export async function updateUser(
  userId: string,
  email: string,
  hashedPassword: string
) {
  const [user] = await db
    .update(users)
    .set({
      email,
      hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

export async function deleteUsers() {
  await db.delete(chirps);
  await db.delete(users);
}

export async function upgradeUserToChirpyRed(userId: string) {
  const [user] = await db
    .update(users)
    .set({
      isChirpyRed: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}
