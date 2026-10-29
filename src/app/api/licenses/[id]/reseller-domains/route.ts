import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const db = await getDb();

    let query: Record<string, any>;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { license_key: id };
    }

    const license = await db.collection("lm_licenses").findOne(query);
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const domains = await db
      .collection("lm_reseller_domains")
      .find({ license_key: license.license_key })
      .sort({ last_verified: -1 })
      .toArray();

    return NextResponse.json({
      license_key: license.license_key,
      product_name: license.product_name,
      domains: domains.map((d) => ({
        _id: d._id.toString(),
        domain: d.domain,
        last_verified: d.last_verified,
      })),
    });
  } catch (error) {
    console.error("Reseller domains GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reseller domains" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { domain } = await req.json();

    if (!domain) {
      return NextResponse.json({ error: "Domain parameter missing." }, { status: 400 });
    }

    const db = await getDb();
    let query: Record<string, any>;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { license_key: id };
    }

    const license = await db.collection("lm_licenses").findOne(query);
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    await db.collection("lm_reseller_domains").deleteOne({
      license_key: license.license_key,
      domain: domain.trim(),
    });

    return NextResponse.json({
      success: true,
      message: `Domain ${domain} removed from reseller key.`,
    });
  } catch (error) {
    console.error("Reseller domain DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete reseller domain" }, { status: 500 });
  }
}

