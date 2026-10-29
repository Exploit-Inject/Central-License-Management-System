import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { initDatabase } from "@/lib/db-init";
import { signLicensePayload } from "@/lib/rsa";
import { getSystemSettings } from "@/lib/settings";
import { sendTelegramNotification } from "@/lib/telegram";
import { recordAuditLog, extractClientIp } from "@/lib/audit";

interface VerificationResponse {
  status: "valid" | "invalid" | "suspended" | "expired" | "mismatch";
  message: string;
  type?: string;
  expiry?: string | null;
  timestamp?: number;
  grace_period_days?: number;
  valid_until?: number;
  signature?: string;
}

function respondWithSignature(
  responseData: VerificationResponse,
  productSlug: string,
  licenseKey: string,
  domain: string,
  clientIp: string,
  userAgent: string
) {
  const timestamp = Math.floor(Date.now() / 1000);
  responseData.timestamp = timestamp;
  const status = responseData.status || "invalid";

  const signature = signLicensePayload(status, productSlug, licenseKey, domain, timestamp);
  responseData.signature = signature;

  // Asynchronously record audit log in background
  recordAuditLog({
    product_slug: productSlug || "unknown",
    license_key: licenseKey || "unknown",
    domain: domain || "unknown",
    ip: clientIp,
    status: status,
    message: responseData.message,
    user_agent: userAgent,
  }).catch((err) => console.error("Audit log error:", err));

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  await initDatabase();

  const clientIp = extractClientIp(req.headers);
  const userAgent = req.headers.get("user-agent") || "Unknown Client";

  let productSlug = "";
  let licenseKey = "";
  let domain = "";

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = await req.json();
      productSlug = (body.product_slug || "").trim();
      licenseKey = (body.license_key || "").trim();
      domain = (body.domain || "").trim();
    } catch {
      // JSON parse failed
    }
  } else {
    try {
      const formData = await req.formData();
      productSlug = (formData.get("product_slug")?.toString() || "").trim();
      licenseKey = (formData.get("license_key")?.toString() || "").trim();
      domain = (formData.get("domain")?.toString() || "").trim();
    } catch {
      try {
        const text = await req.text();
        const params = new URLSearchParams(text);
        productSlug = (params.get("product_slug") || "").trim();
        licenseKey = (params.get("license_key") || "").trim();
        domain = (params.get("domain") || "").trim();
      } catch {
        // failed
      }
    }
  }

  if (!productSlug || !licenseKey || !domain) {
    return respondWithSignature(
      { status: "invalid", message: "Required parameters missing." },
      productSlug,
      licenseKey,
      domain,
      clientIp,
      userAgent
    );
  }

  try {
    const db = await getDb();
    const settings = await getSystemSettings();
    const graceDays = settings.offline_grace_days ?? 3;

    // 1. Verify product
    const product = await db.collection("lm_products").findOne({ slug: productSlug });
    if (!product) {
      return respondWithSignature(
        { status: "invalid", message: "Product is not registered on this licensing server." },
        productSlug,
        licenseKey,
        domain,
        clientIp,
        userAgent
      );
    }

    // 2. Fetch license key
    const license = await db.collection("lm_licenses").findOne({
      license_key: licenseKey,
      product_slug: productSlug,
    });

    if (!license) {
      return respondWithSignature(
        { status: "invalid", message: "Invalid license key for this product." },
        productSlug,
        licenseKey,
        domain,
        clientIp,
        userAgent
      );
    }

    // Check suspended status
    if (license.status === "suspended") {
      if (settings.telegram_enabled && settings.notify_on_suspended) {
        sendTelegramNotification(
          `🔴 <b>Suspended Key Attempt</b>\n` +
          `📦 <b>Product:</b> <code>${productSlug}</code>\n` +
          `🌐 <b>Domain:</b> <code>${domain}</code>\n` +
          `🔑 <b>Key:</b> <code>${licenseKey}</code>\n` +
          `📍 <b>IP:</b> <code>${clientIp}</code>`
        ).catch(() => {});
      }

      return respondWithSignature(
        { status: "suspended", message: "This license key has been suspended by the developer." },
        productSlug,
        licenseKey,
        domain,
        clientIp,
        userAgent
      );
    }

    // Check manual expired / payment pending status
    if (license.status === "expired") {
      if (settings.telegram_enabled && settings.notify_on_expired) {
        sendTelegramNotification(
          `🟠 <b>Domain Expired Blocked (Payment Pending)</b>\n` +
          `📦 <b>Product:</b> <code>${productSlug}</code>\n` +
          `🌐 <b>Domain:</b> <code>${domain}</code>\n` +
          `👤 <b>Client:</b> ${license.client_name || "N/A"}\n` +
          `🔑 <b>Key:</b> <code>${licenseKey}</code>\n` +
          `📍 <b>IP:</b> <code>${clientIp}</code>`
        ).catch(() => {});
      }

      return respondWithSignature(
        {
          status: "expired",
          message: "This domain license has expired due to pending payment. Please contact support or complete payment to renew access.",
        },
        productSlug,
        licenseKey,
        domain,
        clientIp,
        userAgent
      );
    }

    const licenseType = license.license_type || "single";

    // 3. Process Yearly Expiry check
    if (licenseType === "yearly") {
      if (license.expiry_date) {
        const expiryTime = new Date(license.expiry_date).getTime();
        if (expiryTime < Date.now()) {
          const dateStr = new Date(license.expiry_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return respondWithSignature(
            { status: "expired", message: `This yearly license key has expired on ${dateStr}` },
            productSlug,
            licenseKey,
            domain,
            clientIp,
            userAgent
          );
        }
      }
    }

    // 4. Process Domain Lock
    if (licenseType === "single" || licenseType === "yearly") {
      // If not locked yet, lock to the current domain (FIRST-TIME ACTIVATION)
      if (!license.activated_domain) {
        await db.collection("lm_licenses").updateOne(
          { _id: license._id },
          { $set: { activated_domain: domain } }
        );
        license.activated_domain = domain;

        if (settings.telegram_enabled && settings.notify_on_activation) {
          sendTelegramNotification(
            `🟢 <b>New License Activation</b>\n` +
            `📦 <b>Product:</b> <code>${product.name || productSlug}</code>\n` +
            `🌐 <b>Domain:</b> <code>${domain}</code>\n` +
            `🔑 <b>Key:</b> <code>${licenseKey}</code>\n` +
            `👤 <b>Client:</b> ${license.client_name || "N/A"}\n` +
            `📍 <b>IP:</b> <code>${clientIp}</code>`
          ).catch(() => {});
        }
      }

      // Mismatch check
      if (license.activated_domain !== domain) {
        if (settings.telegram_enabled && settings.notify_on_mismatch) {
          sendTelegramNotification(
            `⚠️ <b>Domain Mismatch / Piracy Alert</b>\n` +
            `📦 <b>Product:</b> <code>${productSlug}</code>\n` +
            `🔑 <b>Key:</b> <code>${licenseKey}</code>\n` +
            `🔒 <b>Authorized Domain:</b> <code>${license.activated_domain}</code>\n` +
            `🚫 <b>Attempted Domain:</b> <code>${domain}</code>\n` +
            `📍 <b>IP:</b> <code>${clientIp}</code>`
          ).catch(() => {});
        }

        return respondWithSignature(
          {
            status: "mismatch",
            message: `License key is already locked to another domain: ${license.activated_domain}`,
          },
          productSlug,
          licenseKey,
          domain,
          clientIp,
          userAgent
        );
      }
    } else if (licenseType === "reseller") {
      // Record/update reseller domain
      const existingReseller = await db.collection("lm_reseller_domains").findOne({
        license_key: licenseKey,
        domain,
      });

      if (!existingReseller && settings.telegram_enabled && settings.notify_on_activation) {
        sendTelegramNotification(
          `🌐 <b>New Reseller Domain Activated</b>\n` +
          `📦 <b>Product:</b> <code>${productSlug}</code>\n` +
          `🌐 <b>Domain:</b> <code>${domain}</code>\n` +
          `🔑 <b>Key:</b> <code>${licenseKey}</code>\n` +
          `📍 <b>IP:</b> <code>${clientIp}</code>`
        ).catch(() => {});
      }

      await db.collection("lm_reseller_domains").updateOne(
        { license_key: licenseKey, domain },
        {
          $set: {
            license_key: licenseKey,
            domain,
            last_verified: new Date(),
          },
        },
        { upsert: true }
      );
    }

    // 5. Valid Response (with Offline Grace Period Info)
    const validUntilTimestamp = Math.floor(Date.now() / 1000) + graceDays * 86400;

    return respondWithSignature(
      {
        status: "valid",
        message: "License key is valid and active.",
        type: licenseType,
        expiry: license.expiry_date || null,
        grace_period_days: graceDays,
        valid_until: validUntilTimestamp,
      },
      productSlug,
      licenseKey,
      domain,
      clientIp,
      userAgent
    );
  } catch (error) {
    console.error("Verification API Error:", error);
    return respondWithSignature(
      { status: "invalid", message: "Internal server verification error." },
      productSlug,
      licenseKey,
      domain,
      clientIp,
      userAgent
    );
  }
}
