import { getDb } from "./mongodb";

export interface SystemSettings {
  telegram_bot_token: string;
  telegram_chat_id: string;
  telegram_enabled: boolean;
  offline_grace_days: number;
  notify_on_activation: boolean;
  notify_on_expired: boolean;
  notify_on_suspended: boolean;
  notify_on_mismatch: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  telegram_bot_token: "",
  telegram_chat_id: "",
  telegram_enabled: false,
  offline_grace_days: 3,
  notify_on_activation: true,
  notify_on_expired: true,
  notify_on_suspended: true,
  notify_on_mismatch: true,
};

let cachedSettings: SystemSettings | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

export async function getSystemSettings(): Promise<SystemSettings> {
  const now = Date.now();
  if (cachedSettings && now - cacheTime < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const db = await getDb();
    const doc = await db.collection("lm_settings").findOne({ key: "system_settings" });
    if (!doc) {
      cachedSettings = { ...DEFAULT_SETTINGS };
    } else {
      cachedSettings = {
        telegram_bot_token: doc.telegram_bot_token || "",
        telegram_chat_id: doc.telegram_chat_id || "",
        telegram_enabled: doc.telegram_enabled ?? false,
        offline_grace_days: typeof doc.offline_grace_days === "number" ? doc.offline_grace_days : 3,
        notify_on_activation: doc.notify_on_activation ?? true,
        notify_on_expired: doc.notify_on_expired ?? true,
        notify_on_suspended: doc.notify_on_suspended ?? true,
        notify_on_mismatch: doc.notify_on_mismatch ?? true,
      };
    }
    cacheTime = now;
    return cachedSettings;
  } catch (error) {
    console.error("Failed to load system settings from MongoDB:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSystemSettings(
  settings: Partial<SystemSettings>
): Promise<SystemSettings> {
  const db = await getDb();
  const current = await getSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...settings,
    offline_grace_days:
      typeof settings.offline_grace_days === "number"
        ? Math.max(0, Math.min(365, settings.offline_grace_days))
        : current.offline_grace_days,
  };

  await db.collection("lm_settings").updateOne(
    { key: "system_settings" },
    { $set: { ...updated, updated_at: new Date() } },
    { upsert: true }
  );

  cachedSettings = updated;
  cacheTime = Date.now();
  return updated;
}

