"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

interface Product {
  _id: string;
  name: string;
  slug: string;
  created_at: string;
  keys_count: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);

  // Add Product Form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  // Change Creds Form
  const [credsUsername, setCredsUsername] = useState("");
  const [credsPassword, setCredsPassword] = useState("");
  const [showCredsPassword, setShowCredsPassword] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      setCredsUsername(authData.user.username);

      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Product added successfully.", "success");
        setShowAddModal(false);
        setName("");
        setSlug("");
        loadProducts();
      } else {
        showToast(data.error || "Failed to add product.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    const ok = await confirm({
      title: "Delete Product & All Licenses?",
      message: `Are you sure you want to delete product "${prod.name}"? All associated licenses (${prod.keys_count} keys) will be permanently deleted.`,
      confirmText: "Yes, Delete Product",
      cancelText: "No, Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/products/${prod._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Product permanently deleted.", "error");
        loadProducts();
      } else {
        showToast(data.error || "Failed to delete product.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

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
      } else {
        showToast(data.error || "Failed to update credentials.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  return (
    <>
      <div className="background-animation">
        <div className="grid"></div>
      </div>

      {/* NAVBAR */}
      <Navbar onOpenSettings={() => router.push("/settings")} />

      <div className="container" style={{ position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <Link href="/" className="btn btn-outline-theme rounded-pill btn-sm px-3 mb-2">
              <i className="fa-solid fa-arrow-left me-1"></i> Keys Dashboard
            </Link>
            <h1 className="h3 fw-bold text-white mb-0" style={{ letterSpacing: "0.5px" }}>
              Registered Scripts & Products
            </h1>
            <p className="small text-muted mb-0">
              Register systems and map them to their corresponding API slugs.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-theme rounded-pill btn-sm px-4 shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <i className="fa-solid fa-plus-circle me-1"></i> Register Product
          </button>
        </div>

        {/* Products Table */}
        <div className="glass-panel p-4 mb-5">
          <h4 className="h5 fw-bold text-white mb-3" style={{ letterSpacing: "0.5px" }}>
            <i className="fa-solid fa-cubes me-2 text-cyan" style={{ color: "#00eaff" }}></i>
            Registered Software Products
          </h4>
          <div className="table-responsive">
            <table className="table table-hover align-middle small mb-0">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>API Product Slug</th>
                  <th>Issued Keys</th>
                  <th>Registered Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={`prod-skel-${i}`}>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{ width: "70px", height: "16px" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{ width: "140px", height: "16px" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{
                            width: "120px",
                            height: "22px",
                            borderRadius: "4px",
                          }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{ width: "50px", height: "16px" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton-shimmer"
                          style={{ width: "80px", height: "16px" }}
                        />
                      </td>
                      <td className="text-end">
                        <div
                          className="skeleton-shimmer skeleton-pill"
                          style={{ width: "65px", height: "24px" }}
                        />
                      </td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No products registered yet.
                    </td>
                  </tr>
                ) : (
                  products.map((p, idx) => (
                    <tr key={p._id}>
                      <td style={{ color: "#c9c9c9" }}>#PROD-{idx + 1}</td>
                      <td>
                        <strong className="text-white">{p.name}</strong>
                      </td>
                      <td>
                        <code className="license-code">{p.slug}</code>
                      </td>
                      <td className="fw-bold text-cyan" style={{ color: "#00eaff" }}>
                        {p.keys_count} keys
                      </td>
                      <td style={{ color: "#c9c9c9" }}>
                        {new Date(p.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger-theme btn-sm rounded-pill px-3"
                          onClick={() => handleDeleteProduct(p)}
                        >
                          <i className="fa-solid fa-trash-can me-1"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa-solid fa-cube"></i>
                  <span>Register New Product</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleAddProduct}>
                <div className="modal-body text-start">
                  <div className="mb-4">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Healthcare CMS System"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">
                      API Product Slug (Must match slug in clients)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. healthcare"
                      required
                      value={slug}
                      onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-danger-theme rounded-pill btn-sm px-4"
                    onClick={() => setShowAddModal(false)}
                  >
                    Close
                  </button>
                  <button type="submit" className="btn btn-theme rounded-pill btn-sm px-4">
                    <i className="fa-solid fa-plus-circle me-1"></i> Add Product
                  </button>
                </div>
              </form>
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
