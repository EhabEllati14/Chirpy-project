import dotenv from "dotenv";
dotenv.config();
if (!process.env.DB_URL) {
    throw new Error("DB_URL is not set");
}
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
}
export const config = {
    db: {
        url: process.env.DB_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    api: {
        fileserverHits: 0,
    },
};
