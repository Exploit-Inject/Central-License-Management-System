"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

interface License {
  _id: string;
  product_slug: string;
  product_name?: string;
  license_key: string;
  license_type: "single" | "yearly" | "reseller";
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  activated_domain?: string | null;
  expiry_date?: string | null;
  status: "active" | "suspended" | "expired";
  created_at: string;
  reseller_domains?: string[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
}

interface Stats {
  total: number;
  active: number;
  suspended: number;
  expired?: number;
  products: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, suspended: 0, expired: 0, products: 0 });
  const [licenses, setLicenses] = useState<License[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [adminUsername, setAdminUsername] = useState("admin");

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showResellerModal, setShowResellerModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);

  // Selected License for Modals
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  // Generate Key Form
  const [genProductSlug, setGenProductSlug] = useState("");
  const [genLicenseType, setGenLicenseType] = useState<"single" | "yearly" | "reseller">("single");
  const [genClientName, setGenClientName] = useState("");
  const [genClientEmail, setGenClientEmail] = useState("");
  const [genClientPhone, setGenClientPhone] = useState("");
  const [genClientAddress, setGenClientAddress] = useState("");
  const [genExpiryDate, setGenExpiryDate] = useState("");

  // Edit Key Form
  const [editStatus, setEditStatus] = useState<"active" | "suspended" | "expired">("active");
  const [editType, setEditType] = useState<"single" | "yearly" | "reseller">("single");
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientAddress, setEditClientAddress] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editExpiry, setEditExpiry] = useState("");

  // Owner Info Form
  const [ownerClientName, setOwnerClientName] = useState("");
  const [ownerClientEmail, setOwnerClientEmail] = useState("");
  const [ownerClientPhone, setOwnerClientPhone] = useState("");
  const [ownerClientAddress, setOwnerClientAddress] = useState("");

  // Change Creds Form
  const [credsUsername, setCredsUsername] = useState("");
  const [credsPassword, setCredsPassword] = useState("");
  const [showCredsPassword, setShowCredsPassword] = useState(false);

  // Reseller Domains List & Search
  const [resellerDomains, setResellerDomains] = useState<{ _id: string; domain: string; last_verified: string }[]>([]);
  const [resellerSearch, setResellerSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      setAdminUsername(authData.user.username);
      setCredsUsername(authData.user.username);

      const [statsRes, prodRes, licRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/products"),
        fetch("/api/licenses"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products);
        if (prodData.products.length > 0 && !genProductSlug) {
          setGenProductSlug(prodData.products[0].slug);
        }
      }

      if (licRes.ok) {
        const licData = await licRes.json();
        setLicenses(licData.licenses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router, genProductSlug]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied license key: ${text}`, "info");
  };

  // Generate Key
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_slug: genProductSlug,
          license_type: genLicenseType,
          client_name: genClientName,
          client_email: genClientEmail,
          client_phone: genClientPhone,
          client_address: genClientAddress,
          expiry_date: genLicenseType === "yearly" ? genExpiryDate : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`License key generated: ${data.license.license_key}`, "success");
        setShowGenerateModal(false);
        setGenClientName("");
        setGenClientEmail("");
        setGenClientPhone("");
        setGenClientAddress("");
        setGenExpiryDate("");
        loadData();
      } else {
        showToast(data.error || "Failed to generate key.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Open Edit Modal
  const openEditModal = (lic: License) => {
    setSelectedLicense(lic);
    setEditStatus(lic.status);
    setEditType(lic.license_type);
    setEditClientName(lic.client_name || "");
    setEditClientEmail(lic.client_email || "");
    setEditClientPhone(lic.client_phone || "");
    setEditClientAddress(lic.client_address || "");
    setEditDomain(lic.activated_domain || "");
    setEditExpiry(lic.expiry_date || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense) return;
    try {
      const res = await fetch(`/api/licenses/${selectedLicense._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          status: editStatus,
          license_type: editType,
          client_name: editClientName,
          client_email: editClientEmail,
          client_phone: editClientPhone,
          client_address: editClientAddress,
          activated_domain: editDomain,
          expiry_date: editType === "yearly" ? editExpiry : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("License key details updated successfully.", "success");
        setShowEditModal(false);
        loadData();
      } else {
        showToast(data.error || "Failed to update license key.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Open Owner Info Modal
  const openOwnerModal = (lic: License) => {
    setSelectedLicense(lic);
    setOwnerClientName(lic.client_name || "");
    setOwnerClientEmail(lic.client_email || "");
    setOwnerClientPhone(lic.client_phone || "");
    setOwnerClientAddress(lic.client_address || "");
    setShowOwnerModal(true);
  };

  const handleSaveOwnerInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense) return;
    try {
      const res = await fetch(`/api/licenses/${selectedLicense._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          client_name: ownerClientName,
          client_email: ownerClientEmail,
          client_phone: ownerClientPhone,
          client_address: ownerClientAddress,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Owner details updated successfully.", "success");
        setShowOwnerModal(false);
        loadData();
      } else {
        showToast(data.error || "Failed to update owner information.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Reset Domain
  const handleResetDomain = async (lic: License) => {
    const ok = await confirm({
      title: "Reset Activated Domain?",
      message: `Are you sure you want to reset the activated domain "${lic.activated_domain || 'current domain'}" for license key ${lic.license_key}? The client will need to re-verify.`,
      confirmText: "Yes, Reset",
      cancelText: "No, Cancel",
      type: "warning",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/licenses/${lic._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_domain" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "License domain reset successfully.", "warning");
        loadData();
      } else {
        showToast(data.error || "Failed to reset domain.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Set Status
  const handleSetStatus = async (lic: License, newStatus: "active" | "suspended" | "expired") => {
    try {
      const res = await fetch(`/api/licenses/${lic._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_status", status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        const toastType =
          newStatus === "active" ? "success" : newStatus === "expired" ? "warning" : "error";
        showToast(data.message || `Status updated to ${newStatus}.`, toastType);
        loadData();
      } else {
        showToast(data.error || "Failed to update status.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Toggle Status
  const handleToggleStatus = async (lic: License) => {
    try {
      const res = await fetch(`/api/licenses/${lic._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "License status updated.", "info");
        loadData();
      } else {
        showToast(data.error || "Failed to update status.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Delete Key
  const handleDeleteKey = async (lic: License) => {
    const ok = await confirm({
      title: "Permanently Delete License Key?",
      message: `Are you sure you want to permanently delete license key "${lic.license_key}"? This action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "No, Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/licenses/${lic._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "License key permanently deleted.", "error");
        loadData();
      } else {
        showToast(data.error || "Failed to delete key.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Open Reseller Domains Modal
  const openResellerModal = async (lic: License) => {
    setSelectedLicense(lic);
    setShowResellerModal(true);
    setResellerSearch("");
    try {
      const res = await fetch(`/api/licenses/${lic._id}/reseller-domains`);
      if (res.ok) {
        const data = await res.json();
        setResellerDomains(data.domains || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Reseller Domain
  const handleDeleteResellerDomain = async (domain: string) => {
    if (!selectedLicense) return;
    const ok = await confirm({
      title: "Reset & Remove Reseller Domain?",
      message: `Are you sure you want to reset and remove domain "${domain}" from this reseller license?`,
      confirmText: "Yes, Remove",
      cancelText: "No, Cancel",
      type: "warning",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/licenses/${selectedLicense._id}/reseller-domains`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Domain ${domain} reset successfully.`, "warning");
        setResellerDomains(resellerDomains.filter((d) => d.domain !== domain));
        loadData();
      } else {
        showToast(data.error || "Failed to reset domain.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Change Admin Settings
  const handleChangeCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/change-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credsUsername,
          password: credsPassword || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Admin credentials updated successfully.", "success");
        setShowCredsModal(false);
        setCredsPassword("");
        setAdminUsername(credsUsername);
      } else {
        showToast(data.error || "Failed to update credentials.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // Filter licenses by search input
  const filteredLicenses = licenses.filter((lic) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const str = [
      lic.product_name,
      lic.product_slug,
      lic.license_key,
      lic.client_name,
      lic.client_email,
      lic.client_phone,
      lic.client_address,
      lic.activated_domain,
      lic.reseller_domains?.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return str.includes(q);
  });

  const filteredResellerDomains = resellerDomains.filter((d) =>
    d.domain.toLowerCase().includes(resellerSearch.toLowerCase().trim())
  );

  return (
    <>
      <div className="background-animation">
        <div className="grid"></div>
      </div>

      {/* NAVBAR */}
      <Navbar onOpenSettings={() => router.push("/settings")} />

      <div className="container" style={{ position: "relative", zIndex: 10 }}>
        {/* Dashboard Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold text-white mb-0" style={{ letterSpacing: "0.5px" }}>
              Licensing Dashboard
            </h1>
            <p className="small mb-0" style={{ color: "#a0aec0" }}>
              Control license domains, products, and statuses dynamically.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/products" className="btn btn-outline-theme rounded-pill btn-sm px-3">
              <i className="fa-solid fa-cube me-1"></i> Scripts List
            </Link>
            <button
              type="button"
              className="btn btn-theme rounded-pill btn-sm px-4 shadow-sm"
              onClick={() => setShowGenerateModal(true)}
            >
              <i className="fa-solid fa-plus-circle me-1"></i> Generate License Key
            </button>
          </div>
        </div>

        {/* Stats Overview Row */}
        <div className="row g-3 mb-4 row-cols-2 row-cols-md-3 row-cols-lg-5">
          <div className="col">
            <div className="glass-panel stat-card" style={{ borderLeftColor: "#00eaff" }}>
              <span className="stat-title">Total Keys</span>
              {loading ? (
                <div className="skeleton-shimmer" style={{ width: "45px", height: "30px", marginTop: "4px" }} />
              ) : (
                <div className="stat-value">{stats.total}</div>
              )}
            </div>
          </div>
          <div className="col">
            <div className="glass-panel stat-card" style={{ borderLeftColor: "#30d158" }}>
              <span className="stat-title">Active Keys</span>
              {loading ? (
                <div className="skeleton-shimmer" style={{ width: "45px", height: "30px", marginTop: "4px" }} />
              ) : (
                <div className="stat-value text-success">{stats.active}</div>
              )}
            </div>
          </div>
          <div className="col">
            <div className="glass-panel stat-card" style={{ borderLeftColor: "#ff453a" }}>
              <span className="stat-title">Suspended</span>
              {loading ? (
                <div className="skeleton-shimmer" style={{ width: "45px", height: "30px", marginTop: "4px" }} />
              ) : (
                <div className="stat-value text-danger">{stats.suspended}</div>
              )}
            </div>
          </div>
          <div className="col">
            <div className="glass-panel stat-card" style={{ borderLeftColor: "#ff9f0a" }}>
              <span className="stat-title">Expired</span>
              {loading ? (
                <div className="skeleton-shimmer" style={{ width: "45px", height: "30px", marginTop: "4px" }} />
              ) : (
                <div className="stat-value" style={{ color: "#ff9f0a" }}>{stats.expired || 0}</div>
              )}
            </div>
          </div>
          <div className="col">
            <Link href="/products" className="text-decoration-none">
              <div className="glass-panel stat-card" style={{ borderLeftColor: "#bf5af2" }}>
                <span className="stat-title">Products</span>
                {loading ? (
                  <div className="skeleton-shimmer" style={{ width: "45px", height: "30px", marginTop: "4px" }} />
                ) : (
                  <div className="stat-value" style={{ color: "#bf5af2" }}>{stats.products}</div>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* License Keys Table */}
        <div className="glass-panel p-4 mb-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
            <h4 className="h5 fw-bold text-white mb-0" style={{ letterSpacing: "0.5px" }}>
              <i className="fa-solid fa-key me-2 text-cyan" style={{ color: "#00eaff" }}></i>
              Registered Licenses
            </h4>
            <div className="d-flex flex-grow-1 flex-md-grow-0 gap-2 w-100 w-md-auto" style={{ maxWidth: "480px" }}>
              <div className="portal-search-bar">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Name, Phone, Email, Domain, Key..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="search-clear-btn"
                    type="button"
                    onClick={() => setSearch("")}
                    title="Clear Search"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle small mb-0">
              <thead>
                <tr>
                  <th className="text-nowrap">Product</th>
                  <th>Customer Info</th>
                  <th>License Key</th>
                  <th>License Type</th>
                  <th>Activated Domain</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th className="text-end text-nowrap" style={{ minWidth: "320px", paddingRight: "28px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={`skel-row-${i}`}>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{
                            width: "110px",
                            height: "16px",
                            marginBottom: "6px",
                          }}
                        />
                        <div
                          className="skeleton-shimmer"
                          style={{ width: "70px", height: "11px" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer skeleton-pill"
                          style={{ width: "60px", height: "24px" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{
                            width: "160px",
                            height: "22px",
                            borderRadius: "4px",
                          }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer skeleton-pill"
                          style={{ width: "55px", height: "22px" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{
                            width: "90px",
                            height: "20px",
                            borderRadius: "4px",
                          }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{ width: "70px", height: "15px" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer skeleton-pill"
                          style={{ width: "65px", height: "22px" }}
                        />
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <div
                            className="skeleton-shimmer skeleton-pill"
                            style={{ width: "42px", height: "22px" }}
                          />
                          <div
                            className="skeleton-shimmer skeleton-pill"
                            style={{ width: "46px", height: "22px" }}
                          />
                          <div
                            className="skeleton-shimmer skeleton-pill"
                            style={{ width: "50px", height: "22px" }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No license keys found.
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((k) => {
                    const statusClass =
                      k.status === "active"
                        ? "badge-active"
                        : k.status === "expired"
                        ? "badge-expired"
                        : "badge-suspended";
                    let typeBadge = "";
                    switch (k.license_type) {
                      case "single":
                        typeBadge = "bg-primary text-white";
                        break;
                      case "reseller":
                        typeBadge = "bg-light text-dark";
                        break;
                      case "yearly":
                        typeBadge = "bg-warning text-dark";
                        break;
                    }

                    const hasInfo = Boolean(
                      k.client_name || k.client_email || k.client_phone || k.client_address
                    );

                    return (
                      <tr key={k._id}>
                        <td>
                          <div className="fw-bold text-white" style={{ fontSize: "13px" }}>
                            {k.product_name || k.product_slug}
                          </div>
                          <div className="text-muted">
                            <code
                              className="p-0 bg-transparent"
                              style={{ color: "#8fa1b6", fontSize: "10px" }}
                            >
                              {k.product_slug}
                            </code>
                          </div>
                        </td>

                        <td className="text-nowrap">
                          {hasInfo ? (
                            <button
                              type="button"
                              className="btn btn-outline-theme btn-sm rounded-pill text-nowrap px-3 py-1 owner-info-btn"
                              style={{
                                fontSize: "11px",
                                color: "#00eaff !important",
                                borderColor: "rgba(0, 234, 255, 0.4) !important",
                                background: "rgba(0, 234, 255, 0.08) !important",
                              }}
                              onClick={() => openOwnerModal(k)}
                              title="View & Edit Owner Details"
                            >
                              <i className="fa-solid fa-user-check me-1"></i>Info
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm rounded-pill text-nowrap px-3 py-1 owner-info-btn"
                              style={{
                                fontSize: "11px",
                                color: "#94a3b8 !important",
                                borderColor: "rgba(255,255,255,0.15) !important",
                              }}
                              onClick={() => openOwnerModal(k)}
                              title="Add Owner Information"
                            >
                              <i className="fa-solid fa-user-plus me-1"></i>Info
                            </button>
                          )}
                        </td>

                        <td className="text-nowrap">
                          <div className="d-flex align-items-center gap-2">
                            <code className="license-code">{k.license_key}</code>
                            <button
                              className="copy-btn-glow"
                              onClick={() => copyToClipboard(k.license_key)}
                              title="Copy Key"
                            >
                              <i className="fa-solid fa-copy" style={{ fontSize: "11px" }}></i>
                            </button>
                          </div>
                        </td>

                        <td className="text-nowrap">
                          <span className={`badge badge-type ${typeBadge}`}>
                            {k.license_type.charAt(0).toUpperCase() + k.license_type.slice(1)}
                          </span>
                        </td>

                        <td className="text-nowrap">
                          {k.license_type === "reseller" ? (
                            <button
                              type="button"
                              className="btn btn-outline-theme btn-sm rounded-pill px-3 py-1 manage-reseller-btn"
                              onClick={() => openResellerModal(k)}
                            >
                              <i className="fa-solid fa-globe me-1"></i> Manage (
                              {k.reseller_domains?.length || 0})
                            </button>
                          ) : k.activated_domain ? (
                            <code
                              className="px-2 py-1 rounded border-0 text-cyan bg-dark"
                              style={{ color: "#00eaff !important", fontSize: "12px" }}
                            >
                              <i className="fa-solid fa-globe me-1 opacity-75"></i>
                              {k.activated_domain}
                            </code>
                          ) : (
                            <span
                              className="badge rounded-pill border"
                              style={{
                                color: "#94a3b8 !important",
                                background: "rgba(255, 255, 255, 0.08) !important",
                                borderColor: "rgba(255, 255, 255, 0.18) !important",
                                fontSize: "11px",
                                padding: "4px 10px",
                              }}
                            >
                              <i className="fa-solid fa-link-slash me-1 opacity-75 text-warning"></i>
                              Not Activated Yet
                            </span>
                          )}
                        </td>

                        <td className="text-nowrap" style={{ color: "#c9c9c9" }}>
                          {k.expiry_date
                            ? new Date(k.expiry_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              })
                            : "Never"}
                        </td>

                        <td className="text-nowrap">
                          <span className={`badge badge-type ${statusClass}`}>
                            {k.status === "expired"
                              ? "Expired"
                              : k.status.charAt(0).toUpperCase() + k.status.slice(1)}
                          </span>
                        </td>

                        <td className="text-end text-nowrap" style={{ minWidth: "320px", paddingRight: "28px" }}>
                          <div className="d-inline-flex align-items-center justify-content-end gap-1 text-nowrap">
                            <button
                              type="button"
                              className="btn btn-action btn-action-edit edit-key-btn"
                              onClick={() => openEditModal(k)}
                              title="Edit Details"
                            >
                              <i className="fa-solid fa-pencil" style={{ fontSize: "10px" }}></i>{" "}
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetDomain(k)}
                              className="btn btn-action btn-action-reset"
                              title="Reset Activated Domain"
                            >
                              <i
                                className="fa-solid fa-rotate-left"
                                style={{ fontSize: "10px" }}
                              ></i>{" "}
                              Reset
                            </button>

                            {k.status !== "active" && (
                              <button
                                type="button"
                                onClick={() => handleSetStatus(k, "active")}
                                className="btn btn-action btn-action-activate"
                                title="Activate License"
                              >
                                <i
                                  className="fa-solid fa-circle-check"
                                  style={{ fontSize: "10px" }}
                                ></i>{" "}
                                Activate
                              </button>
                            )}

                            {k.status !== "expired" && (
                              <button
                                type="button"
                                onClick={() => handleSetStatus(k, "expired")}
                                className="btn btn-action btn-action-expire"
                                title="Set Domain Expired (Payment Pending)"
                              >
                                <i
                                  className="fa-solid fa-clock-rotate-left"
                                  style={{ fontSize: "10px" }}
                                ></i>{" "}
                                Expire
                              </button>
                            )}

                            {k.status !== "suspended" && (
                              <button
                                type="button"
                                onClick={() => handleSetStatus(k, "suspended")}
                                className="btn btn-action btn-action-suspend"
                                title="Suspend License"
                              >
                                <i
                                  className="fa-solid fa-ban"
                                  style={{ fontSize: "10px" }}
                                ></i>{" "}
                                Suspend
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteKey(k)}
                              className="btn btn-action btn-action-delete"
                              title="Delete Key"
                            >
                              <i
                                className="fa-solid fa-trash-can"
                                style={{ fontSize: "10px" }}
                              ></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GENERATE KEY MODAL */}
      {showGenerateModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "520px", width: "100%" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa-solid fa-key"></i>
                  <span>Generate License Key</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowGenerateModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleGenerateKey}>
                <div className="modal-body text-start">
                  <div className="mb-3">
                    <label className="form-label">Select Product</label>
                    <select
                      className="form-select"
                      required
                      value={genProductSlug}
                      onChange={(e) => setGenProductSlug(e.target.value)}
                    >
                      <option value="">Choose Product</option>
                      {products.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">License Type</label>
                    <select
                      className="form-select"
                      value={genLicenseType}
                      onChange={(e) => setGenLicenseType(e.target.value as any)}
                      required
                    >
                      <option value="single">Single Domain (Locks to 1 URL)</option>
                      <option value="reseller">Reseller License (Unlimited Domains)</option>
                      <option value="yearly">Yearly License (Domain Lock + Expiry Date)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={genClientName}
                      onChange={(e) => setGenClientName(e.target.value)}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. client@example.com"
                        value={genClientEmail}
                        onChange={(e) => setGenClientEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +1 555-0199"
                        value={genClientPhone}
                        onChange={(e) => setGenClientPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Physical / Business Address
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="e.g. 123 Main St, New York, NY"
                      value={genClientAddress}
                      onChange={(e) => setGenClientAddress(e.target.value)}
                    ></textarea>
                  </div>

                  {genLicenseType === "yearly" && (
                    <div className="mb-3">
                      <label className="form-label">Expiry Date</label>
                      <input
                        type="date"
                        required
                        className="form-control"
                        value={genExpiryDate}
                        onChange={(e) => setGenExpiryDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-danger-theme rounded-pill btn-sm px-4"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-theme rounded-pill btn-sm px-4">
                    <i className="fa-solid fa-plus-circle me-1"></i> Create Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT KEY MODAL */}
      {showEditModal && selectedLicense && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "520px", width: "100%" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa-solid fa-pencil"></i>
                  <span>Edit License Details</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body text-start">
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">License Status</label>
                      <select
                        className="form-select"
                        required
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                      >
                        <option value="active">Active (Normal Access)</option>
                        <option value="expired">Expired (Domain Expired / Payment Pending)</option>
                        <option value="suspended">Suspended (Blocked by Admin)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">License Type</label>
                      <select
                        className="form-select"
                        required
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as any)}
                      >
                        <option value="single">Single Domain (Locks to 1 URL)</option>
                        <option value="reseller">Reseller License (Unlimited Domains)</option>
                        <option value="yearly">Yearly License (Domain Lock + Expiry Date)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. client@example.com"
                        value={editClientEmail}
                        onChange={(e) => setEditClientEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +1 555-0199"
                        value={editClientPhone}
                        onChange={(e) => setEditClientPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Physical / Business Address
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="e.g. 123 Main St, New York, NY"
                      value={editClientAddress}
                      onChange={(e) => setEditClientAddress(e.target.value)}
                    ></textarea>
                  </div>

                  {editType !== "reseller" && (
                    <div className="mb-3">
                      <label className="form-label">Locked Domain</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. clientdomain.com or localhost"
                        value={editDomain}
                        onChange={(e) => setEditDomain(e.target.value)}
                      />
                    </div>
                  )}

                  {editType === "yearly" && (
                    <div className="mb-3">
                      <label className="form-label">
                        Expiry Date (Only for Yearly Type)
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={editExpiry}
                        onChange={(e) => setEditExpiry(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-danger-theme rounded-pill btn-sm px-4"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-theme rounded-pill btn-sm px-4">
                    <i className="fa-solid fa-floppy-disk me-1"></i> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OWNER INFO MODAL */}
      {showOwnerModal && selectedLicense && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "520px", width: "100%" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa-solid fa-user-check"></i>
                  <span>Owner / Customer Details</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowOwnerModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleSaveOwnerInfo}>
                <div className="modal-body text-start">
                  <div className="mb-3">
                    <label className="form-label">Owner / Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={ownerClientName}
                      onChange={(e) => setOwnerClientName(e.target.value)}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. john@example.com"
                        value={ownerClientEmail}
                        onChange={(e) => setOwnerClientEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +1 555-0199"
                        value={ownerClientPhone}
                        onChange={(e) => setOwnerClientPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Physical / Business Address
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="e.g. 123 Main Street, Suite 400, New York, NY"
                      value={ownerClientAddress}
                      onChange={(e) => setOwnerClientAddress(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-danger-theme rounded-pill btn-sm px-4"
                    onClick={() => setShowOwnerModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-theme rounded-pill btn-sm px-4">
                    <i className="fa-solid fa-floppy-disk me-1"></i> Save Owner Info
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESELLER DOMAINS MODAL */}
      {showResellerModal && selectedLicense && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: "800px", width: "100%" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-white">
                  <i className="fa-solid fa-globe text-cyan me-2" style={{ color: "#00eaff" }}></i>
                  Reseller Domains for <code className="license-code">{selectedLicense.license_key}</code>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResellerModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="portal-search-bar">
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search reseller domain..."
                      value={resellerSearch}
                      onChange={(e) => setResellerSearch(e.target.value)}
                    />
                    {resellerSearch && (
                      <button
                        className="search-clear-btn"
                        type="button"
                        onClick={() => setResellerSearch("")}
                        title="Clear Search"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle small mb-0">
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Last Verified</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResellerDomains.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-3 text-muted">
                            No domains activated yet.
                          </td>
                        </tr>
                      ) : (
                        filteredResellerDomains.map((d) => (
                          <tr key={d.domain}>
                            <td>
                              <strong className="text-white">{d.domain}</strong>
                            </td>
                            <td style={{ color: "#b2c0d2" }}>
                              {new Date(d.last_verified).toLocaleString()}
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-outline-danger-theme btn-sm rounded-pill px-3"
                                onClick={() => handleDeleteResellerDomain(d.domain)}
                              >
                                Reset Domain
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-theme rounded-pill btn-sm px-4"
                  onClick={() => setShowResellerModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE CREDENTIALS / ADMIN SETTINGS MODAL */}
      {showCredsModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "460px", width: "100%" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa-solid fa-user-gear"></i>
                  <span>Admin Credentials</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCredsModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleChangeCreds}>
                <div className="modal-body text-start">
                  {/* Username Field */}
                  <div className="mb-4">
                    <label className="form-label">
                      Admin Username
                    </label>
                    <div className="input-icon-group">
                      <div className="icon-left">
                        <i className="fa-solid fa-user-shield"></i>
                      </div>
                      <input
                        type="text"
                        className="form-control with-left-icon"
                        required
                        value={credsUsername}
                        onChange={(e) => setCredsUsername(e.target.value)}
                        placeholder="Enter admin username"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label mb-0">
                        New Password
                      </label>
                      <span style={{ fontSize: "10px", color: "#8fa1b6" }}>
                        (Optional - leave empty to keep current)
                      </span>
                    </div>
                    <div className="input-icon-group">
                      <div className="icon-left">
                        <i className="fa-solid fa-lock"></i>
                      </div>
                      <input
                        type={showCredsPassword ? "text" : "password"}
                        className="form-control with-both-icons"
                        placeholder="Enter new password"
                        value={credsPassword}
                        onChange={(e) => setCredsPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-password-toggle"
                        onClick={() => setShowCredsPassword(!showCredsPassword)}
                        title={showCredsPassword ? "Hide password" : "Show password"}
                      >
                        <i className={`fa-solid ${showCredsPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-danger-theme rounded-pill btn-sm px-4"
                    onClick={() => setShowCredsModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-theme rounded-pill btn-sm px-4">
                    <i className="fa-solid fa-floppy-disk me-1"></i> Update Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
