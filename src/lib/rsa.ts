import crypto from "crypto";
import fs from "fs";
import path from "path";

let cachedPrivateKey: string | null = null;

function getPrivateKey(): string | null {
  if (cachedPrivateKey) return cachedPrivateKey;

  if (process.env.RSA_PRIVATE_KEY) {
    cachedPrivateKey = process.env.RSA_PRIVATE_KEY.replace(/\\n/g, "\n");
    return cachedPrivateKey;
  }

  const keyPath = path.join(process.cwd(), "keys", "private.pem");
  if (fs.existsSync(keyPath)) {
    cachedPrivateKey = fs.readFileSync(keyPath, "utf-8");
    return cachedPrivateKey;
  }

  return null;
}

export function signLicensePayload(
  status: string,
  product_slug: string,
  license_key: string,
  domain: string,
  timestamp: number
): string {
  try {
    const privateKey = getPrivateKey();
    if (!privateKey) {
      console.warn("RSA Private key not found. Signature generation skipped.");
      return "";
    }

    const payloadStr = `${status}|${product_slug}|${license_key}|${domain}|${timestamp}`;
    const signer = crypto.createSign("SHA256");
    signer.update(payloadStr);
    signer.end();

    const signature = signer.sign(privateKey, "base64");
    return signature;
  } catch (error) {
    console.error("Failed to generate RSA signature:", error);
    return "";
  }
}

