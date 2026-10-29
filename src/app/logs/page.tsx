"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

interface AuditLog {
  _id: string;
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
  created_at: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "40");

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        showToast("Failed to load audit logs.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setLoading(false);
    }
  }, [router, search, statusFilter, page, showToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearLogs = async () => {
    const ok = await confirm({
      title: "Clear All Audit Logs?",
      message: "Are you sure you want to permanently clear all verification audit logs? Historical records will be erased.",
      confirmText: "Yes, Clear Logs",
      cancelText: "No, Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch("/api/audit-logs", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Audit logs cleared.", "warning");
        loadLogs();
      } else {
        showToast(data.error || "Failed to clear logs.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <span className="badge badge-active">Valid / Active</span>;
      case "expired":
        return <span className="badge badge-expired">Expired</span>;
      case "suspended":
        return <span className="badge badge-suspended">Suspended</span>;
      case "mismatch":
        return (
          <span
            className="badge rounded-pill border"
            style={{
              color: "#bf5af2",
              borderColor: "rgba(191,90,242,0.4)",
              background: "rgba(191,90,242,0.1)",
            }}
          >
            Mismatch
          </span>
        );
      default:
        return (
          <span
            className="badge rounded-pill border"
            style={{
              color: "#94a3b8",
              borderColor: "rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {status || "Invalid"}
          </span>
        );
    }
  };

  return (
    <>
      <div className="background-animation">
        <div className="grid"></div>
      </div>

      <Navbar />

      <div className="container mb-5" style={{ position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold text-white mb-1" style={{ letterSpacing: "0.5px" }}>
              <i className="fa-solid fa-satellite-dish me-2 text-cyan" style={{ color: "#00eaff" }}></i>
              Verification Audit Logs & IP Intelligence
            </h1>
            <p className="small text-muted mb-0">
              Live incoming verification requests, domain checks, IP geolocations, and tamper attempts.
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-theme btn-sm rounded-pill px-3"
              onClick={loadLogs}
              title="Refresh logs"
            >
              <i className="fa-solid fa-rotate me-1"></i> Refresh
            </button>
            <button
              type="button"
              className="btn btn-outline-danger-theme btn-sm rounded-pill px-3"
              onClick={handleClearLogs}
              title="Clear all logs"
            >
              <i className="fa-solid fa-trash-can me-1"></i> Clear Logs
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-panel p-3 mb-4">
          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3">
            <div className="flex-grow-1" style={{ maxWidth: "460px" }}>
              <div className="portal-search-bar">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by IP, Domain, License Key, Country, or Product..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    className="search-clear-btn"
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    title="Clear"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Buttons - STRICTLY ALL IN ONE SINGLE LINE */}
            <div
              className="d-flex align-items-center gap-2 flex-nowrap overflow-x-auto pb-1 pb-lg-0"
              style={{ whiteSpace: "nowrap" }}
            >
              {[
                { id: "all", label: "All", icon: "fa-solid fa-layer-group" },
                { id: "valid", label: "Valid", icon: "fa-solid fa-circle-check", color: "#30d158" },
                { id: "expired", label: "Expired", icon: "fa-solid fa-clock-rotate-left", color: "#ff9f0a" },
                { id: "suspended", label: "Suspended", icon: "fa-solid fa-ban", color: "#ff453a" },
                { id: "mismatch", label: "Mismatch", icon: "fa-solid fa-triangle-exclamation", color: "#bf5af2" },
              ].map((st) => {
                const isActive = statusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 ${
                      isActive
                        ? "btn-theme shadow-sm"
                        : "btn-outline-theme border-0 text-secondary"
                    }`}
                    onClick={() => {
                      setStatusFilter(st.id);
                      setPage(1);
                    }}
                    style={{
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      fontSize: "12px",
                      fontWeight: 600,
                      ...(isActive
                        ? {}
                        : {
                            color: "#8fa1b6 !important",
                            background: "rgba(255, 255, 255, 0.04)",
                          }),
                    }}
                  >
                    <i className={`${st.icon} me-1`} style={st.color ? { color: st.color } : {}}></i>
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="glass-panel p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="small text-muted">
              Showing <strong className="text-white">{logs.length}</strong> of{" "}
              <strong className="text-cyan" style={{ color: "#00eaff" }}>
                {total}
              </strong>{" "}
              recorded requests
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle small mb-0">
              <thead>
                <tr>
                  <th className="text-nowrap">Timestamp</th>
                  <th>Status</th>
                  <th>Product</th>
                  <th>Domain</th>
                  <th>License Key</th>
                  <th>IP & Location</th>
                  <th>Server Response</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={`skel-log-${i}`}>
                      <td>
                        <div className="skeleton-shimmer" style={{ width: "120px", height: "14px" }} />
                      </td>
                      <td>
                        <div className="skeleton-shimmer skeleton-pill" style={{ width: "70px", height: "20px" }} />
                      </td>
                      <td>
                        <div className="skeleton-shimmer" style={{ width: "90px", height: "14px" }} />
                      </td>
                      <td>
                        <div className="skeleton-shimmer" style={{ width: "110px", height: "14px" }} />
                      </td>
                      <td>
                        <div className="skeleton-shimmer" style={{ width: "140px", height: "18px" }} />
                      </td>
                      <td>
                        <div className="skeleton-shimmer" style={{ width: "130px", height: "14px" }} />
                      </td>
                      <td>
                        <div className="skeleton-shimmer" style={{ width: "160px", height: "14px" }} />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="fa-solid fa-inbox fa-2x mb-3 d-block opacity-50"></i>
                      No verification logs recorded matching your filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td className="text-nowrap" style={{ color: "#94a3b8", fontSize: "11.5px" }}>
                        <i className="fa-regular fa-clock me-1 opacity-75"></i>
                        {new Date(log.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      <td className="text-nowrap">{getStatusBadge(log.status)}</td>

                      <td className="text-nowrap">
                        <code style={{ color: "#00eaff", fontSize: "11px" }}>
                          {log.product_slug}
                        </code>
                      </td>

                      <td className="text-nowrap">
                        <span className="fw-semibold text-white">
                          <i className="fa-solid fa-globe me-1 text-cyan" style={{ color: "#00eaff" }}></i>
                          {log.domain}
                        </span>
                      </td>

                      <td className="text-nowrap">
                        <code className="license-code" style={{ fontSize: "11.5px" }}>
                          {log.license_key}
                        </code>
                      </td>

                      <td className="text-nowrap">
                        <div>
                          <strong className="text-white" style={{ fontFamily: "monospace" }}>
                            {log.ip}
                          </strong>
                        </div>
                        <div style={{ fontSize: "11px", color: "#8fa1b6" }}>
                          <i className="fa-solid fa-location-dot me-1 text-warning"></i>
                          {log.city ? `${log.city}, ` : ""}
                          {log.country || "Global"}
                        </div>
                      </td>

                      <td style={{ color: "#c9c9c9", maxWidth: "260px" }}>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: "260px" }} title={log.message}>
                          {log.message}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary border-opacity-25">
              <span className="small text-muted">
                Page {page} of {totalPages}
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-theme btn-sm rounded-pill px-3"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <i className="fa-solid fa-chevron-left me-1"></i> Prev
                </button>
                <button
                  type="button"
                  className="btn btn-outline-theme btn-sm rounded-pill px-3"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <i className="fa-solid fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

