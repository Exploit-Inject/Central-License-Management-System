"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useToast } from "@/context/ToastContext";

export default function SdksPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState("admin");
  const [activeTab, setActiveTab] = useState<"php" | "node" | "python">("php");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/login");
        } else {
          setUsername(data.user?.username || "admin");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    showToast(`Copied ${label} to clipboard!`, "info");
    setTimeout(() => setCopied(null), 2500);
  };

  const phpSnippet = `// 1. Require SDK in your PHP application bootstrap
require_once __DIR__ . '/includes/LicenseVerifier.php';

// 2. Define your product slug and path to config file
$product_slug = 'healthcare'; // Change to your registered product slug
$config_file  = __DIR__ . '/config.php';

// 3. Run license check (Automatic Activation UI + Offline Grace Period)
LicenseVerifier::check($product_slug, $config_file);

// Application code executes below once verified...`;

  const nodeSnippet = `// 1. Require NodeLicenseVerifier
const NodeLicenseVerifier = require('./NodeLicenseVerifier');

// 2. Initialize verifier
const verifier = new NodeLicenseVerifier({
  productSlug: 'healthcare',
  licenseKey: process.env.LICENSE_KEY || 'XXXX-XXXX-XXXX-XXXX',
  apiUrl: 'http://localhost:3001/api/verify', // Or your production URL
});

// 3. Drop-in Express.js Middleware
const express = require('express');
const app = express();

app.use(verifier.expressMiddleware());

app.get('/api/data', (req, res) => {
  res.json({ success: true, message: 'License verified successfully!' });
});

app.listen(3000);`;

  const pythonSnippet = `# 1. Import LicenseVerifier
from license_verifier import LicenseVerifier

# 2. Initialize verifier
verifier = LicenseVerifier(
    product_slug="healthcare",
    license_key="XXXX-XXXX-XXXX-XXXX",
    api_url="http://localhost:3001/api/verify"
)

# 3. Verify before running (CLI / Script / Flask / FastAPI)
result = verifier.verify(domain="localhost")
if not result["valid"]:
    print(f"Access Denied: {result['message']}")
    exit(1)

print("License verified! Starting application...")`;

  return (
    <>
      <div className="background-animation">
        <div className="grid"></div>
      </div>

      <Navbar username={username} />

      <div className="container mb-5" style={{ position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold text-white mb-1" style={{ letterSpacing: "0.5px" }}>
              <i className="fa-solid fa-code me-2 text-cyan" style={{ color: "#00eaff" }}></i>
              Developer SDKs & Client Libraries
            </h1>
            <p className="small text-muted mb-0">
              Ready-to-use drop-in verification libraries with RSA-2048 Cryptographic Verification and Offline Grace Period.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="d-flex gap-2 mb-4">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-4 py-2 ${
              activeTab === "php" ? "btn-theme shadow-sm" : "btn-outline-theme border-secondary text-secondary"
            }`}
            onClick={() => setActiveTab("php")}
          >
            <i className="fa-brands fa-php me-2"></i> PHP Client SDK
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-4 py-2 ${
              activeTab === "node" ? "btn-theme shadow-sm" : "btn-outline-theme border-secondary text-secondary"
            }`}
            onClick={() => setActiveTab("node")}
          >
            <i className="fa-brands fa-node-js me-2"></i> Node.js / Express SDK
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-4 py-2 ${
              activeTab === "python" ? "btn-theme shadow-sm" : "btn-outline-theme border-secondary text-secondary"
            }`}
            onClick={() => setActiveTab("python")}
          >
            <i className="fa-brands fa-python me-2"></i> Python SDK
          </button>
        </div>

        {/* Content Box */}
        <div className="glass-panel p-4 mb-4">
          {activeTab === "php" && (
            <div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-3">
                <div>
                  <h4 className="h5 fw-bold text-white mb-1">
                    <i className="fa-brands fa-php me-2 text-cyan" style={{ color: "#00eaff" }}></i>
                    PHP Client SDK (v2.0.0)
                  </h4>
                  <p className="small text-muted mb-0">
                    Includes automatic beautiful Web Activation UI, cURL error recovery, and 3-day Offline Grace Period cache.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-theme btn-sm rounded-pill px-3"
                    onClick={() => handleCopy(phpSnippet, "php_snippet")}
                  >
                    <i className="fa-solid fa-copy me-1"></i>
                    {copied === "php_snippet" ? "Copied!" : "Copy Quick Start"}
                  </button>
                  <a
                    href="/sdks/LicenseVerifier.php"
                    download="LicenseVerifier.php"
                    className="btn btn-theme btn-sm rounded-pill px-3"
                  >
                    <i className="fa-solid fa-download me-1"></i> Download LicenseVerifier.php
                  </a>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-cyan small fw-bold text-uppercase mb-2" style={{ color: "#00eaff" }}>
                  Quick Start Code
                </h6>
                <div
                  style={{
                    background: "rgba(5, 8, 16, 0.95)",
                    border: "1px solid rgba(0, 234, 255, 0.2)",
                    borderRadius: "12px",
                    padding: "16px",
                    overflowX: "auto",
                  }}
                >
                  <pre className="mb-0" style={{ color: "#dcdcdc", fontSize: "12.5px", fontFamily: "monospace" }}>
                    {phpSnippet}
                  </pre>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <h6 className="fw-bold text-white small mb-1">
                      <i className="fa-solid fa-shield-halved text-success me-2"></i>
                      Cryptographic Protection
                    </h6>
                    <p className="text-muted small mb-0">
                      Response payloads are signed with RSA-2048 SHA-256 by your portal private key. Tampering or spoofing HTTP responses will fail verification immediately.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <h6 className="fw-bold text-white small mb-1">
                      <i className="fa-solid fa-network-wired text-warning me-2"></i>
                      Offline Grace Period
                    </h6>
                    <p className="text-muted small mb-0">
                      If the client hosting has temporary DNS/network outages, the script seamlessly runs without crashing under the offline grace period set in your admin settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "node" && (
            <div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-3">
                <div>
                  <h4 className="h5 fw-bold text-white mb-1">
                    <i className="fa-brands fa-node-js me-2 text-success" style={{ color: "#30d158" }}></i>
                    Node.js & Express SDK (v2.0.0)
                  </h4>
                  <p className="small text-muted mb-0">
                    Zero external dependencies (uses native Node.js crypto and fetch). Includes Express middleware & cache.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-theme btn-sm rounded-pill px-3"
                    onClick={() => handleCopy(nodeSnippet, "node_snippet")}
                  >
                    <i className="fa-solid fa-copy me-1"></i>
                    {copied === "node_snippet" ? "Copied!" : "Copy Quick Start"}
                  </button>
                  <a
                    href="/sdks/NodeLicenseVerifier.js"
                    download="NodeLicenseVerifier.js"
                    className="btn btn-theme btn-sm rounded-pill px-3"
                  >
                    <i className="fa-solid fa-download me-1"></i> Download NodeLicenseVerifier.js
                  </a>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-cyan small fw-bold text-uppercase mb-2" style={{ color: "#00eaff" }}>
                  Quick Start Code (Express.js)
                </h6>
                <div
                  style={{
                    background: "rgba(5, 8, 16, 0.95)",
                    border: "1px solid rgba(0, 234, 255, 0.2)",
                    borderRadius: "12px",
                    padding: "16px",
                    overflowX: "auto",
                  }}
                >
                  <pre className="mb-0" style={{ color: "#dcdcdc", fontSize: "12.5px", fontFamily: "monospace" }}>
                    {nodeSnippet}
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h6 className="fw-bold text-white small mb-1">
                  <i className="fa-solid fa-bolt text-cyan me-2" style={{ color: "#00eaff" }}></i>
                  Zero npm Dependencies
                </h6>
                <p className="text-muted small mb-0">
                  Built purely with Node’s native <code>crypto</code>, <code>fs</code>, and <code>os</code> modules. Works out-of-the-box on Node 18+ without installing external npm packages.
                </p>
              </div>
            </div>
          )}

          {activeTab === "python" && (
            <div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-3">
                <div>
                  <h4 className="h5 fw-bold text-white mb-1">
                    <i className="fa-brands fa-python me-2 text-warning" style={{ color: "#ff9f0a" }}></i>
                    Python SDK (v2.0.0)
                  </h4>
                  <p className="small text-muted mb-0">
                    Supports Flask, FastAPI, Django, and standalone automation / CLI scripts with offline grace cache.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-theme btn-sm rounded-pill px-3"
                    onClick={() => handleCopy(pythonSnippet, "python_snippet")}
                  >
                    <i className="fa-solid fa-copy me-1"></i>
                    {copied === "python_snippet" ? "Copied!" : "Copy Quick Start"}
                  </button>
                  <a
                    href="/sdks/license_verifier.py"
                    download="license_verifier.py"
                    className="btn btn-theme btn-sm rounded-pill px-3"
                  >
                    <i className="fa-solid fa-download me-1"></i> Download license_verifier.py
                  </a>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-cyan small fw-bold text-uppercase mb-2" style={{ color: "#00eaff" }}>
                  Quick Start Code (Python)
                </h6>
                <div
                  style={{
                    background: "rgba(5, 8, 16, 0.95)",
                    border: "1px solid rgba(0, 234, 255, 0.2)",
                    borderRadius: "12px",
                    padding: "16px",
                    overflowX: "auto",
                  }}
                >
                  <pre className="mb-0" style={{ color: "#dcdcdc", fontSize: "12.5px", fontFamily: "monospace" }}>
                    {pythonSnippet}
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h6 className="fw-bold text-white small mb-1">
                  <i className="fa-solid fa-terminal text-info me-2"></i>
                  Python Requirements
                </h6>
                <p className="text-muted small mb-0">
                  Run <code>pip install requests cryptography</code> to enable high-speed RSA verification in your Python environment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

