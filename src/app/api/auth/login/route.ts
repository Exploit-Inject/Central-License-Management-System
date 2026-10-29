import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { initDatabase } from "@/lib/db-init";
import { comparePassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await initDatabase();

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const admin = await db.collection("lm_admins").findOne({ username: username.trim() });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const token = signToken({
      id: admin._id.toString(),
      username: admin.username,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin._id.toString(),
        username: admin.username,
      },
    });

    const isHttps = req.nextUrl.protocol === "https:";
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err?.message || "An internal error occurred during login." },
      { status: 500 }
    );
  }
}

