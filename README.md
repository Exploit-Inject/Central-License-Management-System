# 🛡️ ExploitInject | Enterprise Central License Management System

> **CONFIDENTIAL & PROPRIETARY**  
> *Internal Enterprise Infrastructure for Software Licensing, Anti-Piracy Protection & Remote Client Telemetry.*

---

## 📋 Executive Overview

**ExploitInject Central License Manager** is an enterprise-grade, high-performance licensing and cryptographic verification server built on **Next.js 14 (App Router)**, **TypeScript**, and **MongoDB Atlas**. Designed to govern proprietary digital assets, SaaS distribution, and cross-platform client deployments, the portal provides real-time license lifecycle management, automated hardware/domain locking, offline grace periods, and instant developer alerts.

### 🌟 Core Architectural Highlights

* **Cryptographic Integrity:** Every verification response is digitally signed using an asymmetric **RSA 2048-bit Private Key (`SHA-256`)**. Client applications verify payloads locally via a public key without trusting plain HTTP transport.
* **Resilient Offline Grace Period:** Configurable grace duration (default 3 days) allowing client scripts to withstand transient network failures or maintenance without interrupting service.
* **Automated Telemetry & IP Intelligence:** Captures real-time client verification logs including IP address, Geo-location (Country & City), ISP provider, User-Agent, and verification outcome.
* **Instant Administrator Alerts:** Automated Telegram Bot integration delivering real-time notifications for domain locks, unauthorized domain-tampering attempts, license suspensions, and expirations.
* **Modern Cyberpunk UI/UX:** Dark-mode glassmorphic interface with top-right animated Toast notifications, custom confirmation modals, single-line pill search, shimmer skeletons, and custom 404 security pages.
* **Drop-in Cross-Platform SDKs:** Ready-to-deploy verification libraries for **PHP**, **Node.js / Express**, and **Python**.

---

## 🏗️ System Architecture & Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2 (App Router) | High-performance serverless & edge-ready React framework |
| **Language** | TypeScript | Strict type safety and maintainable enterprise codebase |
| **Database** | MongoDB Atlas | Distributed document store with connection pooling and schema enforcement |
| **Security / Auth** | JWT + HTTP-Only Cookies | Encrypted session tokens with `SameSite=Lax` and Bcrypt password hashing |
| **Signatures** | Node.js Crypto (RSA-2048) | SHA-256 PKCS#1 v1.5 digital signature generation |
| **Design System** | Montserrat + Bootstrap 5.3 + FontAwesome 6 | Custom Cyberpunk Glassmorphism with CSS variables & backdrop filters |
| **Notifications** | Telegram Bot API | Instant asynchronous alerts dispatched to secure admin chat |

---

## ⚙️ Environment Variables Configuration (`.env`)

This project requires sensitive credentials to communicate with MongoDB and cryptographically sign sessions. **Never commit actual `.env` files to source control.**

### 1. Generating your Local `.env` File

Copy the provided `.env.example` template to initialize your local environment:

```bash
# On Windows PowerShell
Copy-Item .env.example .env

# On Linux / macOS / Bash
cp .env.example .env
```

### 2. Environment Variables Reference

Open `.env` in your editor and supply your private credentials:

```dotenv
# ==============================================================================
# DATABASE CONFIGURATION (MongoDB Atlas)
# ==============================================================================
# Standard MongoDB Atlas SRV connection URI.
# Format: You can copy it from your MongoDB Atlas -> Connect -> Drivers

# Target database name inside MongoDB Atlas
MONGODB_DB_NAME=license-ei

# ==============================================================================
# AUTHENTICATION & SECURITY CREDENTIALS
# ==============================================================================
# High-entropy random secret key used to sign and verify JWT authentication tokens.
# Generate via: openssl rand -base64 32
JWT_SECRET=your_jwt_super_secret_key_change_in_production

# ==============================================================================
# CRYPTOGRAPHIC SIGNING KEYS (Optional for Serverless)
# ==============================================================================
# By default, the server reads the private key from keys/private.pem on the filesystem.
# When deploying to serverless platforms (such as Vercel) where keys/ is not committed,
# export the entire 2048-bit PEM key content here (including newlines encoded as \n).
# RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIC...\n-----END RSA PRIVATE KEY-----"
```

> [!IMPORTANT]
> * **MongoDB Atlas IP Whitelist:** Ensure your server's public IP address (or `0.0.0.0/0` with secure username/password) is allowed under MongoDB Atlas *Network Access*.
> * **JWT Secret Security:** Generate a unique 256-bit key for production environments. You can quickly generate one using the command: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
> * **Telegram Configuration:** Telegram Bot Token and Chat ID are configured dynamically via the web dashboard at **Settings (`/settings`)** and safely persisted to the database.

---

## 🚀 Deployment & Operations

### Prerequisites
* **Node.js:** v18.17.0 or higher (v20+ recommended)
* **Package Manager:** npm or yarn

### 1. Local Development Setup

```bash
# 1. Clone repository (Private)
git clone <repository_url>
cd license-manager-portal-official

# 2. Install dependencies
npm install

# 3. Configure environment file
cp .env.example .env
# Edit .env with your MongoDB credentials

# 4. Start local development server
npm run dev
```

Navigate to `http://localhost:3000` (or the configured port).

### 2. Local / Dedicated Server Production Run

```bash
# 1. Compile optimized production build
npm run build

# 2. Launch production server
npm run start
# Or bind to a custom port (e.g. 3001)
npx next start -p 3001
```

### 3. Vercel Cloud Deployment

1. Create a private repository on GitHub / GitLab.
2. Link the repository to your **[Vercel Dashboard](https://vercel.com)**.
3. In **Project Settings -> Environment Variables**, configure:
   * `MONGODB_URL`: Your production MongoDB connection string.
   * `MONGODB_DB_NAME`: Database name (e.g., `license-ei`).
   * `JWT_SECRET`: Your production JWT secret string.
   * `RSA_PRIVATE_KEY`: Content of `keys/private.pem` (if keeping the private key out of git).
4. Click **Deploy**. Vercel will build and serve the application serverlessly.

---

## 🔐 Administrative Access & Initial Setup

When the system boots up against an empty or freshly initialized MongoDB database, an administrator account is provisioned:

* **Default Username:** `admin`
* **Default Password:** `Admin@123`

> [!WARNING]
> Upon your initial sign-in, navigate immediately to **Settings (`/settings`)** to update your username and set a strong production password.

---

## 📡 Verification API Specification

The verification engine supports both modern JSON payloads and legacy PHP `application/x-www-form-urlencoded` payloads on two identical endpoints:
* `POST /api/verify`
* `POST /api/verify.php` *(Maintains 100% backward compatibility with legacy applications)*

### Request Format
```http
POST /api/verify HTTP/1.1
Host: your-domain.com
Content-Type: application/json

{
  "product_slug": "healthcare",
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "domain": "clientportal.com"
}
```

### Response Codes & Cryptographic Signatures

Every verification response returns a signed JSON structure:

```json
{
  "status": "valid",
  "message": "License key is valid and active.",
  "type": "single",
  "expiry": null,
  "timestamp": 1793257392,
  "signature": "WvGwwA2q4FEivkInb+ZFhiAyjxeA9XLrSOpILY..."
}
```

#### Status Outcomes:
* `valid`: License is active and domain matches the authorized hardware lock.
* `invalid`: License key does not exist or product slug mismatch.
* `mismatch`: License key is bound to a different domain (prevents unauthorized sharing/piracy).
* `suspended`: License was manually revoked by the administrator.
* `expired`: Yearly or time-limited license term has elapsed.

---

## 💻 Client Integration SDKs

Drop-in verification libraries are available in the portal under **SDKs & Code (`/sdks`)**:

### 1. PHP SDK Integration
```php
require_once __DIR__ . '/includes/LicenseVerifier.php';

// Verify license with Automatic UI Modal & Offline Grace Period
LicenseVerifier::check('healthcare', __DIR__ . '/config.php');
```

### 2. Node.js / Express Middleware
```javascript
const NodeLicenseVerifier = require('./NodeLicenseVerifier');

const verifier = new NodeLicenseVerifier({
  productSlug: 'healthcare',
  licenseKey: process.env.LICENSE_KEY,
  apiUrl: 'https://license.yourdomain.com/api/verify'
});

app.use(verifier.expressMiddleware());
```

### 3. Python CLI / FastApi / Flask
```python
from license_verifier import LicenseVerifier

verifier = LicenseVerifier(
    product_slug="healthcare",
    license_key="XXXX-XXXX-XXXX-XXXX",
    api_url="https://license.yourdomain.com/api/verify"
)

result = verifier.verify(domain="localhost")
if not result["valid"]:
    raise SystemExit(f"License verification failed: {result['message']}")
```

---

## 🛡️ Security & Privacy Notice

* **Private Intellectual Property:** This repository and all associated licensing algorithms, cryptographic keys, and database schemas are proprietary and confidential.
* **Key Preservation:** The RSA private key (`keys/private.pem`) must remain strictly protected. If the private key is altered or re-generated, all deployed client software must be updated with the corresponding public key.

---

*ExploitInject Licensing Infrastructure &copy; 2026. All Rights Reserved.*
"# Central-License-Management-System" 
