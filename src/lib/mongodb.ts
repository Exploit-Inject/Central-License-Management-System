import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoUri(): string {
  return process.env.MONGODB_URL || process.env.MONGODB_URI || "";
}

export function getDbName(): string {
  return process.env.MONGODB_DB_NAME || "license-ei";
}

export async function getDb(): Promise<Db> {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error(
      "MONGODB_URL environment variable is missing on Vercel! Please go to Vercel Dashboard -> Settings -> Environment Variables and add MONGODB_URL."
    );
  }

  const dbName = getDbName();

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 10000,
      tls: true,
    });
    global._mongoClientPromise = client.connect();
  }

  try {
    const client = await global._mongoClientPromise;
    return client.db(dbName);
  } catch (err: any) {
    // Reset client promise so subsequent requests can retry
    global._mongoClientPromise = undefined;
    const msg = err?.message || String(err);
    if (
      msg.includes("SSL alert number 80") ||
      msg.includes("tlsv1 alert internal error") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("Server selection timed out") ||
      msg.includes("whitelist")
    ) {
      throw new Error(
        "MongoDB Atlas IP Blocked! Go to MongoDB Atlas -> Network Access -> Add IP Address -> Select 'Allow Access from Anywhere' (0.0.0.0/0)."
      );
    }
    throw new Error(`MongoDB connection failed: ${msg}`);
  }
}

export default getDb;
