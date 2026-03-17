import { db } from "../index.js";
import { chirps } from "../schema.js";
import { eq } from "drizzle-orm";

/* CREATE */
export async function createChirp({
  body,
  userId,
}: {
  body: string;
  userId: string;
}) {
  const [chirp] = await db
    .insert(chirps)
    .values({
      body,
      userId,
    })
    .returning();

  return chirp;
}

/* GET ALL */
export async function getAllChirps() {
  return await db.select().from(chirps);
}

/* GET BY AUTHOR */
export async function getChirpsByAuthorId(authorId: string) {
  return await db
    .select()
    .from(chirps)
    .where(eq(chirps.userId, authorId));
}

/* GET BY ID */
export async function getChirpById(id: string) {
  const [chirp] = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, id));

  return chirp;
}

/* DELETE */
export async function deleteChirp(id: string) {
  await db.delete(chirps).where(eq(chirps.id, id));
}
