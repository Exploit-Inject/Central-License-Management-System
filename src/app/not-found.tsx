"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="not-found-wrapper">
      {/* Ambient background glows */}
      <div className="not-found-glow-cyan" />
      <div className="not-found-glow-violet" />

      {/* Cyber Grid Pattern Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "linear-gradient(rgba(0, 234, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 234, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      <div className="not-found-card text-center">
        {/* Brand Header */}
        <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
          <img
            src="https://i.ibb.co/5g8CCRhM/Logo-Transparent.png"
            alt="ExploitInject Logo"
            width={34}
            height={34}
            style={{ filter: "drop-shadow(0 0 10px rgba(0,234,255,0.6))" }}
          />
          <span
            className="fw-bold text-white text-uppercase"
            style={{ fontSize: "15px", letterSpacing: "1.5px" }}
          >
            Exploit<span style={{ color: "#00eaff" }}>Inject</span>
          </span>
        </div>

        {/* Status Badge */}
        <div className="mb-3">
          <span className="not-found-badge">
            <span className="not-found-pulse-dot" />
            <span>ERROR CODE: 404 // HYPERSPACE ANOMALY</span>
          </span>
        </div>

        {/* Hero Cyberpunk 404 Image */}
        <div className="not-found-image-container mb-3">
          <Image
            src="/images/404-cyber.png"
            alt="404 Page Not Found - Cyber Security Void"
            width={480}
            height={360}
            priority
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Futuristic Headlines */}
        <h1 className="not-found-title">Coordinates Not Found</h1>
        <p className="not-found-desc">
          The license node, portal endpoint, or page vector you requested does
          not exist or has been shifted into an alternate digital dimension.
        </p>

        {/* Cyber Diagnostics Terminal Box */}
        <div className="not-found-terminal">
          <div className="not-found-terminal-header">
            <span
              className="not-found-terminal-dot"
              style={{ backgroundColor: "#ff5f56" }}
            />
            <span
              className="not-found-terminal-dot"
              style={{ backgroundColor: "#ffbd2e" }}
            />
            <span
              className="not-found-terminal-dot"
              style={{ backgroundColor: "#27c93f" }}
            />
            <span
              className="ms-2"
              style={{ color: "#64748b", fontSize: "11px" }}
            >
              diagnostic_tracerout.sh
            </span>
          </div>
          <div style={{ color: "#94a3b8" }}>
            <div>
              <span style={{ color: "#00eaff" }}>root@exploit-inject:~$</span>{" "}
              ping --target endpoint
            </div>
            <div style={{ color: "#ff453a", marginTop: "4px" }}>
              [!] 404 DESTINATION_UNREACHABLE (Packet Loss: 100%)
            </div>
            <div style={{ color: "#30d158", marginTop: "2px" }}>
              [*] Core Security Signature: RSA-2048 VALID // Portal Guard Active
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <button
            type="button"
            className="btn btn-outline-theme rounded-pill px-4 py-2"
            onClick={() => router.back()}
          >
            <i className="fa-solid fa-arrow-left me-2"></i> Go Back
          </button>

          <Link
            href="/"
            className="btn btn-theme rounded-pill px-4 py-2 shadow-sm"
          >
            <i className="fa-solid fa-gauge-high me-2"></i> Dashboard
          </Link>

          <Link
            href="/products"
            className="btn btn-outline-theme rounded-pill px-4 py-2"
          >
            <i className="fa-solid fa-cube me-2"></i> Scripts List
          </Link>
        </div>

        {/* Subtle Footer Note */}
        <div
          className="mt-4 pt-2"
          style={{ fontSize: "11px", color: "rgba(148, 163, 184, 0.6)" }}
        >
          ExploitInject Central License Infrastructure &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

