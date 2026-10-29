import { getSystemSettings } from "./settings";

export async function sendTelegramNotification(
  messageText: string,
  overrideToken?: string,
  overrideChatId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getSystemSettings();
    const token = (overrideToken || settings.telegram_bot_token || "").trim();
    const chatId = (overrideChatId || settings.telegram_chat_id || "").trim();

    // If not enabled and no override, skip sending silently
    if (!overrideToken && (!settings.telegram_enabled || !token || !chatId)) {
      return { success: false, error: "Telegram notifications not configured or disabled." };
    }

    if (!token || !chatId) {
      return { success: false, error: "Missing Bot Token or Chat ID." };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn("Telegram notification API returned error:", data);
      return { success: false, error: data.description || "Telegram API error" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to deliver Telegram notification:", error);
    return { success: false, error: error?.message || "Network error" };
  }
}

