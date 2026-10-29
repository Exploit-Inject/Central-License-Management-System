"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid username or password.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#05070e",
        position: "relative",
      }}
    >
      <div className="background-animation">
        <div className="grid"></div>
      </div>

      <div
        className="glass-panel"
        style={{
          borderRadius: "20px",
          padding: "45px 35px",
          width: "100%",
          maxWidth: "430px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(0, 234, 255, 0.08)",
          border: "1px solid rgba(0, 234, 255, 0.22)",
          background: "rgba(9, 14, 26, 0.88)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Top Glow Accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #00eaff, transparent)",
            borderRadius: "2px",
          }}
        />

        {/* Logo Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          <div
            className="logo-img"
            style={{
              width: "68px",
              height: "68px",
              marginBottom: "14px",
              filter: "drop-shadow(0 0 15px rgba(0, 234, 255, 0.35))",
            }}
          >
            <img
              src="https://i.ibb.co/5g8CCRhM/Logo-Transparent.png"
              alt="ExploitInject Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div
            className="logo-text"
            style={{
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "1.5px",
              marginBottom: "4px",
              color: "#00eaff",
              textShadow: "0 0 18px rgba(0, 234, 255, 0.4)",
            }}
          >
            ExploitInject
          </div>
          <div
            style={{
              color: "#8fa1b6",
              fontSize: "12px",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Central License Portal
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: "rgba(255, 59, 48, 0.12)",
              border: "1px solid rgba(255, 59, 48, 0.3)",
              padding: "12px 16px",
              borderRadius: "10px",
              color: "#ff453a",
              fontSize: "13px",
              marginBottom: "22px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "14px" }}></i>
            <div>{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="username"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#a0aec0",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              <span>Developer Username</span>
              <span style={{ color: "#00eaff", fontSize: "10px" }}>Required</span>
            </label>

            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "#00eaff",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <i className="fa-solid fa-user-shield"></i>
              </div>

              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter username"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(5, 8, 18, 0.75)",
                  border: "1px solid rgba(0, 234, 255, 0.22)",
                  padding: "13px 16px 13px 42px",
                  borderRadius: "10px",
                  color: "#ffffff",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: '"Montserrat", sans-serif',
                  transition: "all 0.25s ease",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#00eaff";
                  e.currentTarget.style.boxShadow =
                    "0 0 15px rgba(0, 234, 255, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.4)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 234, 255, 0.22)";
                  e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.4)";
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="password"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#a0aec0",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              <span>Password</span>
              <span style={{ color: "#00eaff", fontSize: "10px" }}>Encrypted</span>
            </label>

            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "#00eaff",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <i className="fa-solid fa-lock"></i>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(5, 8, 18, 0.75)",
                  border: "1px solid rgba(0, 234, 255, 0.22)",
                  padding: "13px 44px 13px 42px",
                  borderRadius: "10px",
                  color: "#ffffff",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: '"Montserrat", sans-serif',
                  transition: "all 0.25s ease",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#00eaff";
                  e.currentTarget.style.boxShadow =
                    "0 0 15px rgba(0, 234, 255, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.4)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 234, 255, 0.22)";
                  e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.4)";
                }}
              />

              {/* Show/Hide Password Eye Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  color: "#8fa1b6",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "4px 6px",
                  transition: "color 0.2s",
                }}
                title={showPassword ? "Hide password" : "Show password"}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00eaff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8fa1b6")}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-theme"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "14px 20px",
              borderRadius: "10px",
              border: "none",
              color: "#05070e",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 8px 20px rgba(0, 234, 255, 0.25)",
            }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Log In to Server</span>
                <i
                  className="fa-solid fa-arrow-right-to-bracket"
                  style={{ marginLeft: "10px", fontSize: "14px" }}
                ></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
