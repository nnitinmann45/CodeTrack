import "dotenv/config";
export function readConfig(env = process.env) {
  const secret = env.JWT_SECRET || "";
  if (secret.length < 32 || secret.startsWith("replace-"))
    throw new Error(
      "Set JWT_SECRET to a random value of at least 32 characters in .env.",
    );
  if (!env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env.");
  const url = new URL(env.APP_URL || "http://localhost:5173");
  const production = env.NODE_ENV === "production";
  if (production && url.protocol !== "https:")
    throw new Error("APP_URL must use HTTPS in production.");
  return {
    secret,
    mongoUri: env.MONGODB_URI,
    origin: url.origin,
    production,
    port: Number(env.PORT || 5000),
  };
}
