import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { initDatabase } from "@/lib/db-init";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDatabase();

  try {
    const db = await getDb();

    const [totalLicenses, activeLicenses, suspendedLicenses, expiredLicenses, totalProducts] = await Promise.all([
      db.collection("lm_licenses").countDocuments(),
      db.collection("lm_licenses").countDocuments({ status: "active" }),
      db.collection("lm_licenses").countDocuments({ status: "suspended" }),
      db.collection("lm_licenses").countDocuments({ status: "expired" }),
      db.collection("lm_products").countDocuments(),
    ]);

    return NextResponse.json({
      stats: {
        total: totalLicenses,
        active: activeLicenses,
        suspended: suspendedLicenses,
        expired: expiredLicenses,
        products: totalProducts,
      },
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

