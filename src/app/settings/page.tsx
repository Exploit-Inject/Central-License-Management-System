"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useToast } from "@/context/ToastContext";

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Admin Credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Offline Grace Period
  const [graceDays, setGraceDays] = useState(3);

  // Telegram Settings
  const [tgEnabled, setTgEnabled] = useState(false);
  const [tgToken, setTgToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [notifyActivation, setNotifyActivation] = useState(true);
  const [notifyExpired, setNotifyExpired] = useState(true);
  const [notifySuspended, setNotifySuspended] = useState(true);
  const [notifyMismatch, setNotifyMismatch] = useState(true);

  // Status & Notifications
  const [loading, setLoading] = useState(false);
  const [testingTg, setTestingTg] = useState(false);

  useEffect(() => {
    // 1. Check Auth & Load Admin Info
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) {
          router.push("/login");
        } else {
          setUsername(d.user.username);
        }
      })
      .catch(() => router.push("/login"));

    // 2. Load System Settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setGraceDays(d.settings.offline_grace_days ?? 3);
          setTgEnabled(d.settings.telegram_enabled ?? false);
          setTgToken(d.settings.telegram_bot_token ?? "");
          setTgChatId(d.settings.telegram_chat_id ?? "");
          setNotifyActivation(d.settings.notify_on_activation ?? true);
          setNotifyExpired(d.settings.notify_on_expired ?? true);
          setNotifySuspended(d.settings.notify_on_suspended ?? true);
          setNotifyMismatch(d.settings.notify_on_mismatch ?? true);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update Admin Credentials
      const credRes = await fetch("/api/auth/change-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: password.trim() || undefined,
        }),
      });
      const credData = await credRes.json();
      if (!credRes.ok) {
        throw new Error(credData.error || "Failed to update admin credentials.");
      }

      // 2. Update System Settings (Grace Period + Telegram)
      const setRes = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offline_grace_days: Number(graceDays),
          telegram_enabled: tgEnabled,
          telegram_bot_token: tgToken.trim(),
          telegram_chat_id: tgChatId.trim(),
          notify_on_activation: notifyActivation,
          notify_on_expired: notifyExpired,
          notify_on_suspended: notifySuspended,
          notify_on_mismatch: notifyMismatch,
        }),
      });
      const setData = await setRes.json();
      if (!setRes.ok) {
        throw new Error(setData.error || "Failed to update system settings.");
      }

      showToast("System configuration & security settings saved successfully.", "success");
      setPassword("");
    } catch (err: any) {
      showToast(err.message || "Failed to save settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTg(true);

    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tgToken.trim(),
          chat_id: tgChatId.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Telegram test message sent successfully!", "success");
      } else {
        showToast(data.error || "Telegram test failed. Please verify Bot Token and Chat ID.", "error");
      }
    } catch {
      showToast("Network error trying to contact Telegram API.", "error");
    } finally {
      setTestingTg(false);
    }
  };

  return (
    <>
      <div className="background-animation">
        <div className="grid"></div>
      </div>

      <Navbar username={username} />

      <div className="container mb-5" style={{ maxWidth: "840px", position: "relative", zIndex: 10 }}>
        <div className="mb-4">
          <h1 className="h3 fw-bold text-white mb-1" style={{ letterSpacing: "0.5px" }}>
            <i className="fa-solid fa-sliders me-2 text-cyan" style={{ color: "#00eaff" }}></i>
            System & Security Settings
          </h1>
          <p className="small text-muted mb-0">
            Configure Offline Grace Period, Telegram Bot alerts, and Admin security credentials.
          </p>
        </div>

        <form onSubmit={handleSaveAll}>
          {/* SECTION 1: OFFLINE GRACE PERIOD */}
          <div className="glass-panel p-4 mb-4">
            <h4 className="h5 fw-bold text-white mb-2">
              <i className="fa-solid fa-hourglass-half me-2 text-warning" style={{ color: "#ff9f0a" }}></i>
              Offline Grace Period Control
            </h4>
            <p className="small text-muted mb-4">
              When client servers cannot contact this licensing portal (e.g. server restart, temporary DNS/hosting outage), client applications will continue operating uninterrupted for this grace duration before locking.
            </p>

            <div className="row g-3 align-items-center">
              <div className="col-sm-6">
                <label className="form-label">Grace Period (Days)</label>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    className="form-control"
                    value={graceDays}
                    onChange={(e) => setGraceDays(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                  <span className="input-group-text bg-dark border-secondary text-secondary">Days</span>
                </div>
                <span className="small text-muted mt-1 d-block" style={{ fontSize: "11px" }}>
                  Default is 3 days. Set to 0 to disable offline grace period.
                </span>
              </div>
              <div className="col-sm-6">
                <div className="p-3 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="small fw-bold text-white mb-1">
                    <i className="fa-solid fa-shield-check text-success me-1"></i> Current Policy:
                  </div>
                  <div className="small text-secondary" style={{ fontSize: "12px" }}>
                    Clients will remain active for <strong className="text-cyan">{graceDays} days</strong> offline if connection is lost, seamlessly preventing downtime for legitimate buyers.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TELEGRAM BOT NOTIFICATIONS */}
          <div className="glass-panel p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4 className="h5 fw-bold text-white mb-0">
                <i className="fa-brands fa-telegram me-2 text-info" style={{ color: "#00eaff" }}></i>
                Instant Telegram Bot Alerts
              </h4>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="tgSwitch"
                  checked={tgEnabled}
                  onChange={(e) => setTgEnabled(e.target.checked)}
                  style={{ cursor: "pointer", width: "42px", height: "22px" }}
                />
                <label className="form-check-label text-white small ms-2" htmlFor="tgSwitch">
                  {tgEnabled ? "Active" : "Disabled"}
                </label>
              </div>
            </div>
            <p className="small text-muted mb-4">
              Get instant push notifications on your Telegram app when new licenses are activated or tamper attempts are blocked.
            </p>

            {/* Telegram Credentials */}
            <div className="row g-3 mb-3">
              <div className="col-md-7">
                <label className="form-label">Telegram Bot Token</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={tgToken}
                  onChange={(e) => setTgToken(e.target.value)}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label">Telegram Chat ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 987654321"
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                />
              </div>
            </div>

            {/* Test Button & Guide */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 pt-2">
              <button
                type="button"
                className="btn btn-outline-theme btn-sm rounded-pill px-3"
                onClick={handleTestTelegram}
                disabled={testingTg || !tgToken || !tgChatId}
              >
                {testingTg ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin me-1"></i> Testing...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane me-1"></i> Send Test Notification
                  </>
                )}
              </button>

              <span className="small text-muted" style={{ fontSize: "11px" }}>
                Need help? See the setup guide below.
              </span>
            </div>

            {/* Notification Event Toggles */}
            <h6 className="small fw-bold text-uppercase text-secondary mb-3">
              Notification Trigger Events
            </h6>
            <div className="row g-2 mb-4">
              <div className="col-sm-6">
                <label className="d-flex align-items-center gap-2 p-2 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={notifyActivation}
                    onChange={(e) => setNotifyActivation(e.target.checked)}
                  />
                  <span className="small text-white">New License Activation</span>
                </label>
              </div>
              <div className="col-sm-6">
                <label className="d-flex align-items-center gap-2 p-2 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={notifyExpired}
                    onChange={(e) => setNotifyExpired(e.target.checked)}
                  />
                  <span className="small text-white">Expired Domain (Payment Pending) Check</span>
                </label>
              </div>
              <div className="col-sm-6">
                <label className="d-flex align-items-center gap-2 p-2 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={notifySuspended}
                    onChange={(e) => setNotifySuspended(e.target.checked)}
                  />
                  <span className="small text-white">Suspended Key Access Attempt</span>
                </label>
              </div>
              <div className="col-sm-6">
                <label className="d-flex align-items-center gap-2 p-2 rounded border border-secondary border-opacity-25" style={{ background: "rgba(255,255,255,0.02)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={notifyMismatch}
                    onChange={(e) => setNotifyMismatch(e.target.checked)}
                  />
                  <span className="small text-white">Domain Mismatch / Piracy Attempt</span>
                </label>
              </div>
            </div>

            {/* Telegram 2-Minute Setup Instructions */}
            <div className="p-3 rounded border border-info border-opacity-25" style={{ background: "rgba(0, 234, 255, 0.04)" }}>
              <div className="small fw-bold text-cyan mb-2" style={{ color: "#00eaff" }}>
                <i className="fa-solid fa-circle-info me-1"></i> Quick Telegram Bot Setup (Takes 60 seconds):
              </div>
              <ol className="small text-muted mb-0 ps-3" style={{ fontSize: "12px", lineHeight: "1.7" }}>
                <li>
                  Open Telegram and search for <code>@BotFather</code>. Send <code>/newbot</code>, give it a name and username, and copy the <strong>HTTP API Token</strong> into the field above.
                </li>
                <li>
                  Send <code>/start</code> to your newly created bot, or open <code>@userinfobot</code> in Telegram to get your numeric <strong>Chat ID</strong> (e.g. <code>123456789</code>).
                </li>
                <li>
                  Paste both above, turn on <strong>Active</strong>, and click <strong>"Send Test Notification"</strong> to confirm!
                </li>
              </ol>
            </div>
          </div>

          {/* SECTION 3: ADMIN CREDENTIALS */}
          <div className="glass-panel p-4 mb-4">
            <h4 className="h5 fw-bold text-white mb-2">
              <i className="fa-solid fa-user-shield me-2 text-cyan" style={{ color: "#00eaff" }}></i>
              Admin Security Credentials
            </h4>
            <p className="small text-muted mb-4">
              Update the username or password used to authenticate into this licensing management portal.
            </p>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Admin Username</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  New Password <span className="text-muted fw-normal">(Leave empty to keep current)</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="d-flex justify-content-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-theme rounded-pill px-5 py-2 fw-bold"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin me-2"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk me-2"></i> Save All Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
