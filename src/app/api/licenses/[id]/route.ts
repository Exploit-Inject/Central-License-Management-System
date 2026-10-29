import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(
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
    const body = await req.json();
    const { action } = body;

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

    if (action === "set_status") {
      const { status } = body;
      if (!["active", "suspended", "expired"].includes(status)) {
        return NextResponse.json({ error: "Invalid status value. Choose active, suspended, or expired." }, { status: 400 });
      }
      await db.collection("lm_licenses").updateOne(
        { _id: license._id },
        { $set: { status } }
      );
      return NextResponse.json({
        success: true,
        status,
        message: `License status changed to ${status}.`,
      });
    }

    if (action === "toggle_status") {
      const newStatus = license.status === "active" ? "suspended" : "active";
      await db.collection("lm_licenses").updateOne(
        { _id: license._id },
        { $set: { status: newStatus } }
      );
      return NextResponse.json({
        success: true,
        status: newStatus,
        message: `License status changed to ${newStatus}.`,
      });
    }

    if (action === "reset_domain") {
      await db.collection("lm_licenses").updateOne(
        { _id: license._id },
        { $set: { activated_domain: null } }
      );
      await db.collection("lm_reseller_domains").deleteMany({
        license_key: license.license_key,
      });

      return NextResponse.json({
        success: true,
        message: "Domain lock reset successfully. Client can now re-activate on a new domain.",
      });
    }

    if (action === "edit") {
      const {
        client_name,
        client_email,
        client_phone,
        client_address,
        license_type,
        activated_domain,
        expiry_date,
        status,
      } = body;

      const updateData: Record<string, any> = {
        client_name: client_name !== undefined ? (client_name?.trim() || null) : license.client_name,
        client_email: client_email !== undefined ? (client_email?.trim() || null) : license.client_email,
        client_phone: client_phone !== undefined ? (client_phone?.trim() || null) : license.client_phone,
        client_address: client_address !== undefined ? (client_address?.trim() || null) : license.client_address,
        license_type: license_type || license.license_type,
        activated_domain: activated_domain !== undefined ? (activated_domain?.trim() || null) : license.activated_domain,
        expiry_date: expiry_date !== undefined ? (expiry_date?.trim() || null) : license.expiry_date,
        status: status && ["active", "suspended", "expired"].includes(status) ? status : license.status,
      };

      await db.collection("lm_licenses").updateOne(
        { _id: license._id },
        { $set: updateData }
      );

      return NextResponse.json({
        success: true,
        message: "License details updated successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error) {
    console.error("License PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update license" }, { status: 500 });
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

    await db.collection("lm_licenses").deleteOne({ _id: license._id });
    await db.collection("lm_reseller_domains").deleteMany({ license_key: license.license_key });

    return NextResponse.json({
      success: true,
      message: "License key permanently deleted.",
    });
  } catch (error) {
    console.error("License DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
  }
}

