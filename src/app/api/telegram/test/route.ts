import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const token = body.token?.trim();
    const chatId = body.chat_id?.trim();

    const timestamp = new Date().toLocaleString();
    const testMessage =
      `🤖 <b>ExploitInject License Bot Connection Test</b>\n\n` +
      `✅ <b>Status:</b> Online & Connected!\n` +
      `🕒 <b>Time:</b> <code>${timestamp}</code>\n` +
      `🛡️ <b>Security Node:</b> <code>RSA-2048 SHA-256</code>\n\n` +
      `<i>Your Telegram alert system is configured and ready to send real-time notifications for activations, expired checks, and security alerts.</i>`;

    const result = await sendTelegramNotification(testMessage, token, chatId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send Telegram test message" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test message sent! Check your Telegram app.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to execute Telegram test" },
      { status: 500 }
    );
  }
}

