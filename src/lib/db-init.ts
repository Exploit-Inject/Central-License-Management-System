import { getDb } from "./mongodb";
import { hashPassword } from "./auth";

let isInitialized = false;

const DEFAULT_PRODUCTS = [
  { name: "Import Business Website", slug: "import-business-website" },
  { name: "Cleaning Service", slug: "cleaning-service" },
  { name: "EX-House", slug: "ex-house" },
  { name: "Fitness", slug: "fitness" },
  { name: "GauKaRoti", slug: "gaukaroti" },
  { name: "MobiMart", slug: "mobimart" },
  { name: "VortexMart", slug: "vortexmart" },
  { name: "eCommerce Single", slug: "ecommerce-single" },
  { name: "Healthcare", slug: "healthcare" },
  { name: "Visa Agency", slug: "visa_agency" }
];

export async function initDatabase(): Promise<void> {
  if (isInitialized) return;

  try {
    const db = await getDb();

    // 1. Indexes for Collections
    const productsColl = db.collection("lm_products");
    await productsColl.createIndex({ slug: 1 }, { unique: true });

    const licensesColl = db.collection("lm_licenses");
    await licensesColl.createIndex({ license_key: 1 }, { unique: true });
    await licensesColl.createIndex({ product_slug: 1 });
    await licensesColl.createIndex({ status: 1 });

    const resellerColl = db.collection("lm_reseller_domains");
    await resellerColl.createIndex({ license_key: 1, domain: 1 }, { unique: true });

    const adminsColl = db.collection("lm_admins");
    await adminsColl.createIndex({ username: 1 }, { unique: true });

    // 2. Default Admin User (admin / Admin@123)
    const adminCount = await adminsColl.countDocuments();
    if (adminCount === 0) {
      const defaultPasswordHash = await hashPassword("Admin@123");
      await adminsColl.insertOne({
        username: "admin",
        password: defaultPasswordHash,
        created_at: new Date()
      });
      console.log("Seeded default admin user: admin / Admin@123");
    }

    // 3. Seed Default Products
    for (const prod of DEFAULT_PRODUCTS) {
      const existing = await productsColl.findOne({ slug: prod.slug });
      if (!existing) {
        await productsColl.insertOne({
          name: prod.name,
          slug: prod.slug,
          created_at: new Date()
        });
      }
    }

    isInitialized = true;
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

