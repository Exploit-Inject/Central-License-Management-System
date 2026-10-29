/**
 * ExploitInject Central Licensing System - Node.js / Express SDK
 * Features: Native RSA-2048 Verification + Configurable Offline Grace Period Cache
 * Zero external dependencies (uses native Node.js crypto & fetch)
 *
 * @version 2.0.0
 * @author ExploitInject Security
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");

const DEFAULT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtFQySUD6XK4RcrDVRN5N
Iqnq9OGM6DGULA4EennLv4wmEnGdJwsgouY7f6Qu3G6+mwzdYMlcpxNgBpWfAQWe
XaZ59U+tzkGACTiUx9/fcsbUrzZ69hJp22lEeQKJf1W6Go9ckwq0r7YRSTNN3i3D
eCVAQxCIGB3zE5kBsGB7+2kxAGoW3yUqds7X45p0N0z+xAOofpgthYlhSz/9mptW
pDglWV/3ZfB3EgYwL9meHAeKdRYR/GLgwWxAIJp0fKOQBqKVKRpfpzEcbXn/Uhj9
afh7i9zS1RXvACgFK62GgVttT+wGqMA08unOYYmeqzcMuwEHPlgsf+ichTTTVKgq
VwIDAQAB
-----END PUBLIC KEY-----`;

class NodeLicenseVerifier {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || "http://localhost:3001/api/verify";
    this.productSlug = options.productSlug;
    this.licenseKey = options.licenseKey || process.env.LICENSE_KEY;
    this.publicKey = options.publicKey || DEFAULT_PUBLIC_KEY;
    this.cacheDir = options.cacheDir || path.join(os.tmpdir(), ".ei_license_cache");
    this.cacheFile = path.join(this.cacheDir, `node_${crypto.createHash("md5").update(this.productSlug || "").digest("hex")}.json`);

    if (!fs.existsSync(this.cacheDir)) {
      try {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      } catch (e) {
        // Ignore permission error
      }
    }
  }

  verifySignature(payloadStr, signatureBase64) {
    try {
      const verifier = crypto.createVerify("SHA256");
      verifier.update(payloadStr);
      verifier.end();
      return verifier.verify(this.publicKey, signatureBase64, "base64");
    } catch (err) {
      console.error("[LicenseVerifier] Cryptographic validation error:", err.message);
      return false;
    }
  }

  readCache() {
    try {
      if (!fs.existsSync(this.cacheFile)) return null;
      const content = fs.readFileSync(this.cacheFile, "utf-8");
      const data = JSON.parse(content);
      if (data.key === this.licenseKey && data.status === "valid") {
        return data;
      }
    } catch {
      // invalid cache
    }
    return null;
  }

  saveCache(data) {
    try {
      const cacheData = {
        key: this.licenseKey,
        status: "valid",
        timestamp: data.timestamp || Math.floor(Date.now() / 1000),
        valid_until: data.valid_until || Math.floor(Date.now() / 1000) + 3 * 86400,
        signature: data.signature,
      };
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (err) {
      console.warn("[LicenseVerifier] Failed to write offline grace cache:", err.message);
    }
  }

  clearCache() {
    try {
      if (fs.existsSync(this.cacheFile)) fs.unlinkSync(this.cacheFile);
    } catch {}
  }

  async verify(domain = "localhost") {
    if (!this.productSlug || !this.licenseKey) {
      return {
        valid: false,
        status: "missing_config",
        message: "Product slug and license key are required.",
      };
    }

    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_slug: this.productSlug,
          license_key: this.licenseKey,
          domain: domain,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const data = await res.json();
      const status = data.status || "invalid";

      // Verify RSA-2048 Signature
      const expectedPayload = `${status}|${this.productSlug}|${this.licenseKey}|${domain}|${data.timestamp}`;
      const isSignatureValid = this.verifySignature(expectedPayload, data.signature);

      if (!isSignatureValid) {
        return {
          valid: false,
          status: "signature_failed",
          message: "Security Alert: Response signature is invalid or forged.",
        };
      }

      if (status === "valid") {
        this.saveCache(data);
        return {
          valid: true,
          status: "valid",
          message: data.message || "License is valid and active.",
          type: data.type,
          valid_until: data.valid_until,
        };
      }

      // Explicit status: suspended, expired, mismatch
      this.clearCache();
      return {
        valid: false,
        status: status,
        message: data.message || `License is ${status}.`,
      };
    } catch (networkError) {
      // Server unreachable: Check Offline Grace Period
      const cached = this.readCache();
      const nowSec = Math.floor(Date.now() / 1000);

      if (cached && cached.valid_until && nowSec <= cached.valid_until) {
        const hoursLeft = Math.round((cached.valid_until - nowSec) / 3600);
        console.warn(`[LicenseVerifier] Licensing server unreachable. Operating under offline grace period (${hoursLeft} hours remaining).`);
        return {
          valid: true,
          status: "offline_grace",
          message: `Operating under offline grace period (${hoursLeft}h remaining).`,
          grace_active: true,
        };
      }

      return {
        valid: false,
        status: "unreachable_expired",
        message: "Licensing server unreachable and offline grace period has expired. Please check internet connection.",
      };
    }
  }

  /**
   * Express.js Middleware Helper
   */
  expressMiddleware() {
    return async (req, res, next) => {
      const host = req.hostname || req.headers.host || "localhost";
      const domain = host.split(":")[0];
      const result = await this.verify(domain);

      if (result.valid) {
        req.license = result;
        return next();
      }

      return res.status(403).json({
        error: "License Verification Failed",
        status: result.status,
        message: result.message,
      });
    };
  }
}

module.exports = NodeLicenseVerifier;

