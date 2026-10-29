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
    const products = await db.collection("lm_products").find({}).sort({ created_at: -1 }).toArray();

    // Compute key counts per product
    const productSlugs = products.map((p) => p.slug);
    const countAgg = await db.collection("lm_licenses").aggregate([
      { $match: { product_slug: { $in: productSlugs } } },
      { $group: { _id: "$product_slug", count: { $sum: 1 } } },
    ]).toArray();

    const countMap: Record<string, number> = {};
    countAgg.forEach((item) => {
      countMap[item._id] = item.count;
    });

    const productsWithCounts = products.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      created_at: p.created_at,
      keys_count: countMap[p.slug] || 0,
    }));

    return NextResponse.json({ products: productsWithCounts });
  } catch (error) {
    console.error("Products GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDatabase();

  try {
    const { name, slug } = await req.json();

    const cleanName = (name || "").trim();
    const cleanSlug = (slug || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");

    if (!cleanName || !cleanSlug) {
      return NextResponse.json(
        { error: "Product name and slug are required." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = await db.collection("lm_products").findOne({ slug: cleanSlug });

    if (existing) {
      return NextResponse.json(
        { error: "Product slug must be unique." },
        { status: 409 }
      );
    }

    const doc = {
      name: cleanName,
      slug: cleanSlug,
      created_at: new Date(),
    };

    const result = await db.collection("lm_products").insertOne(doc);

    return NextResponse.json({
      success: true,
      product: {
        _id: result.insertedId.toString(),
        ...doc,
        keys_count: 0,
      },
    });
  } catch (error) {
    console.error("Products POST Error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

