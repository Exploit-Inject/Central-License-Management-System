import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest, hashPassword } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username cannot be empty." }, { status: 400 });
    }

    const db = await getDb();
    const updateDoc: { username: string; password?: string } = {
      username: username.trim(),
    };

    if (password && password.trim()) {
      updateDoc.password = await hashPassword(password.trim());
    }

    await db.collection("lm_admins").updateOne(
      { _id: new ObjectId(user.id) },
      { $set: updateDoc }
    );

    return NextResponse.json({
      success: true,
      message: "Credentials updated successfully.",
      user: { id: user.id, username: updateDoc.username },
    });
  } catch (error) {
    console.error("Change credentials error:", error);
    return NextResponse.json(
      { error: "Failed to update credentials." },
      { status: 500 }
    );
  }
}

