import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { initDatabase } from "@/lib/db-init";
import { getUserFromRequest } from "@/lib/auth";
import crypto from "crypto";

function generateFormattedKey(): string {
  const bytes = crypto.randomBytes(8);
  const hex = bytes.toString("hex").toUpperCase();
  // 16 hex chars -> XXXX-XXXX-XXXX-XXXX
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDatabase();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const productSlug = searchParams.get("product") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const filter: Record<string, any> = {};

    if (productSlug && productSlug !== "all") {
      filter.product_slug = productSlug;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (type && type !== "all") {
      filter.license_type = type;
    }

    if (search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { license_key: regex },
        { client_name: regex },
        { client_email: regex },
        { activated_domain: regex },
        { product_name: regex },
      ];
    }

    const db = await getDb();
    const licenses = await db
      .collection("lm_licenses")
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    // Also get reseller domain counts or list for reseller licenses
    const resellerDomains = await db.collection("lm_reseller_domains").find({}).toArray();
    const resellerMap: Record<string, string[]> = {};
    resellerDomains.forEach((rd) => {
      if (!resellerMap[rd.license_key]) {
        resellerMap[rd.license_key] = [];
      }
      resellerMap[rd.license_key].push(rd.domain);
    });

    const formatted = licenses.map((lic) => ({
      ...lic,
      _id: lic._id.toString(),
      reseller_domains: resellerMap[lic.license_key] || [],
    }));

    return NextResponse.json({ licenses: formatted });
  } catch (error) {
    console.error("Licenses GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDatabase();

  try {
    const body = await req.json();
    const {
      product_slug,
      license_type = "single",
      client_name,
      client_email,
      client_phone,
      client_address,
      expiry_date,
      custom_key,
    } = body;

    if (!product_slug) {
      return NextResponse.json({ error: "Product selection is required." }, { status: 400 });
    }

    const db = await getDb();
    const product = await db.collection("lm_products").findOne({ slug: product_slug });
    if (!product) {
      return NextResponse.json({ error: "Selected product does not exist." }, { status: 404 });
    }

    const licenseKey = (custom_key && custom_key.trim()) || generateFormattedKey();

    // Check uniqueness
    const existing = await db.collection("lm_licenses").findOne({ license_key: licenseKey });
    if (existing) {
      return NextResponse.json(
        { error: "License key already exists. Please generate a new one." },
        { status: 409 }
      );
    }

    const newLicense = {
      product_slug: product.slug,
      product_name: product.name,
      license_key: licenseKey,
      license_type: license_type as "single" | "yearly" | "reseller",
      client_name: client_name?.trim() || null,
      client_email: client_email?.trim() || null,
      client_phone: client_phone?.trim() || null,
      client_address: client_address?.trim() || null,
      activated_domain: null,
      expiry_date: expiry_date?.trim() || null,
      status: "active" as const,
      created_at: new Date(),
    };

    const result = await db.collection("lm_licenses").insertOne(newLicense);

    return NextResponse.json({
      success: true,
      license: {
        _id: result.insertedId.toString(),
        ...newLicense,
        reseller_domains: [],
      },
    });
  } catch (error) {
    console.error("Generate License Error:", error);
    return NextResponse.json({ error: "Failed to generate license" }, { status: 500 });
  }
}

