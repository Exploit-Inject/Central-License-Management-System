import { getDb } from "./mongodb";

export interface AuditLogEntry {
  _id?: any;
  product_slug: string;
  license_key: string;
  domain: string;
  ip: string;
  status: "valid" | "invalid" | "suspended" | "expired" | "mismatch";
  message: string;
  user_agent?: string;
  country?: string;
  city?: string;
  isp?: string;
  created_at: Date;
}

const geoCache = new Map<string, { country: string; city: string; isp: string }>();

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    if (parts[0] && parts[0].trim()) {
      return parts[0].trim();
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  return "127.0.0.1";
}

async function lookupIpGeo(ip: string): Promise<{ country: string; city: string; isp: string }> {
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  ) {
    return { country: "Local / Intranet", city: "Localhost", isp: "Internal Network" };
  }

  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const info = {
          country: data.country || "Unknown",
          city: data.city || "Unknown",
          isp: data.isp || "Unknown",
        };
        geoCache.set(ip, info);
        return info;
      }
    }
  } catch {
    // Timeout or network error
  }

  return { country: "Global", city: "Unresolved", isp: "Internet Provider" };
}

export async function recordAuditLog(
  logData: Omit<AuditLogEntry, "created_at" | "country" | "city" | "isp">
): Promise<void> {
  try {
    const geo = await lookupIpGeo(logData.ip);
    const db = await getDb();
    await db.collection("lm_audit_logs").insertOne({
      ...logData,
      country: geo.country,
      city: geo.city,
      isp: geo.isp,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("Failed to record license audit log:", err);
  }
}

