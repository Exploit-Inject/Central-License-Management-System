"""
ExploitInject Central Licensing System - Python SDK
Features: RSA-2048 Digital Signature Verification + Offline Grace Period Cache
Supports: Flask, FastAPI, Django, and standalone scripts/CLI

Requires: pip install requests cryptography
"""

import os
import sys
import time
import json
import base64
import hashlib
import tempfile
import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_public_key

DEFAULT_PUBLIC_KEY = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtFQySUD6XK4RcrDVRN5N
Iqnq9OGM6DGULA4EennLv4wmEnGdJwsgouY7f6Qu3G6+mwzdYMlcpxNgBpWfAQWe
XaZ59U+tzkGACTiUx9/fcsbUrzZ69hJp22lEeQKJf1W6Go9ckwq0r7YRSTNN3i3D
eCVAQxCIGB3zE5kBsGB7+2kxAGoW3yUqds7X45p0N0z+xAOofpgthYlhSz/9mptW
pDglWV/3ZfB3EgYwL9meHAeKdRYR/GLgwWxAIJp0fKOQBqKVKRpfpzEcbXn/Uhj9
afh7i9zS1RXvACgFK62GgVttT+wGqMA08unOYYmeqzcMuwEHPlgsf+ichTTTVKgq
VwIDAQAB
-----END PUBLIC KEY-----"""


class LicenseVerifier:
    def __init__(self, product_slug: str, license_key: str = None, api_url: str = None, public_key_pem: bytes = None):
        self.product_slug = product_slug
        self.license_key = license_key or os.getenv("LICENSE_KEY", "")
        self.api_url = api_url or "http://localhost:3001/api/verify"
        self.public_key_pem = public_key_pem or DEFAULT_PUBLIC_KEY
        
        # Cache file path
        slug_hash = hashlib.md5(self.product_slug.encode()).hexdigest()
        cache_dir = os.path.join(tempfile.gettempdir(), ".ei_license_cache")
        os.makedirs(cache_dir, exist_ok=True)
        self.cache_file = os.path.join(cache_dir, f"py_{slug_hash}.json")

    def _verify_rsa_signature(self, payload_str: str, signature_b64: str) -> bool:
        try:
            pub_key = load_pem_public_key(self.public_key_pem)
            raw_sig = base64.b64decode(signature_b64)
            pub_key.verify(
                raw_sig,
                payload_str.encode("utf-8"),
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            return True
        except Exception as e:
            print(f"[LicenseVerifier] RSA Signature verification failed: {e}", file=sys.stderr)
            return False

    def _read_cache(self):
        try:
            if not os.path.exists(self.cache_file):
                return None
            with open(self.cache_file, "r") as f:
                data = json.load(f)
            if data.get("key") == self.license_key and data.get("status") == "valid":
                return data
        except Exception:
            pass
        return None

    def _save_cache(self, data):
        try:
            cache_payload = {
                "key": self.license_key,
                "status": "valid",
                "timestamp": data.get("timestamp", int(time.time())),
                "valid_until": data.get("valid_until", int(time.time()) + 3 * 86400),
                "signature": data.get("signature", ""),
            }
            with open(self.cache_file, "w") as f:
                json.dump(cache_payload, f)
        except Exception as e:
            print(f"[LicenseVerifier] Could not write cache: {e}", file=sys.stderr)

    def _clear_cache(self):
        try:
            if os.path.exists(self.cache_file):
                os.remove(self.cache_file)
        except Exception:
            pass

    def verify(self, domain: str = "localhost") -> dict:
        if not self.product_slug or not self.license_key:
            return {"valid": False, "status": "missing_credentials", "message": "Product slug and license key are required."}

        try:
            resp = requests.post(
                self.api_url,
                json={
                    "product_slug": self.product_slug,
                    "license_key": self.license_key,
                    "domain": domain
                },
                timeout=8
            )
            data = resp.json()
            status = data.get("status", "invalid")
            timestamp = data.get("timestamp", int(time.time()))
            sig = data.get("signature", "")

            # Cryptographic RSA Verification
            expected_payload = f"{status}|{self.product_slug}|{self.license_key}|{domain}|{timestamp}"
            if not self._verify_rsa_signature(expected_payload, sig):
                return {"valid": False, "status": "signature_error", "message": "Cryptographic signature mismatch! Tampered payload detected."}

            if status == "valid":
                self._save_cache(data)
                return {
                    "valid": True,
                    "status": "valid",
                    "message": data.get("message", "License is valid and active."),
                    "type": data.get("type"),
                    "valid_until": data.get("valid_until"),
                }

            # Rejected (suspended, expired, mismatch)
            self._clear_cache()
            return {"valid": False, "status": status, "message": data.get("message", f"License is {status}")}

        except Exception as e:
            # Server unreachable -> Check Offline Grace Period
            cached = self._read_cache()
            now = int(time.time())
            if cached and "valid_until" in cached and now <= cached["valid_until"]:
                hours_left = round((cached["valid_until"] - now) / 3600)
                print(f"[LicenseVerifier] Server unreachable. Operating under offline grace period ({hours_left}h left).", file=sys.stderr)
                return {
                    "valid": True,
                    "status": "offline_grace",
                    "message": f"Operating under offline grace period ({hours_left} hours left).",
                    "grace_active": True
                }

            return {
                "valid": False,
                "status": "unreachable_expired",
                "message": "Licensing server unreachable and offline grace period expired. Reconnection required."
            }

    def require_valid(self, domain: str = "localhost"):
        """Convenience method to exit process if license is invalid"""
        res = self.verify(domain)
        if not res["valid"]:
            print(f"FATAL: License Verification Blocked - {res['message']}", file=sys.stderr)
            sys.exit(1)
        return res

