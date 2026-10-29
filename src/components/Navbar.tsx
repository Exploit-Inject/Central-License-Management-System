"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar({
  username,
  onOpenSettings,
}: {
  username?: string;
  onOpenSettings?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navLinks = [
    { href: "/", label: "Licenses", icon: "fa-solid fa-key" },
    { href: "/products", label: "Scripts", icon: "fa-solid fa-cube" },
    { href: "/logs", label: "Audit Logs", icon: "fa-solid fa-clock-rotate-left" },
    { href: "/sdks", label: "SDKs & Code", icon: "fa-solid fa-code" },
  ];

  return (
    <nav className="navbar navbar-expand-lg py-3 mb-4">
      <div className="container">
        <Link className="logo-link me-4" href="/">
          <img
            className="logo-img"
            src="https://i.ibb.co/5g8CCRhM/Logo-Transparent.png"
            alt="ExploitInject Logo"
          />
          <span className="logo-text">ExploitInject</span>
        </Link>

        {/* Center / Left Nav Links */}
        <div className="d-none d-md-flex align-items-center gap-1 me-auto">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`btn btn-sm rounded-pill px-3 py-1 ${
                  isActive
                    ? "btn-theme shadow-sm"
                    : "btn-outline-theme border-0 text-secondary"
                }`}
                style={
                  !isActive
                    ? {
                        color: "#94a3b8 !important",
                        background: "transparent !important",
                      }
                    : {}
                }
              >
                <i className={`${item.icon} me-1`}></i> {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="ms-auto d-flex align-items-center gap-2">
          {onOpenSettings ? (
            <button
              type="button"
              className="btn btn-outline-theme btn-sm rounded-pill px-3"
              onClick={onOpenSettings}
              title="System & Security Settings"
            >
              <i className="fa-solid fa-sliders me-1"></i> Settings
            </button>
          ) : (
            <Link
              href="/settings"
              className="btn btn-outline-theme btn-sm rounded-pill px-3"
              title="System & Security Settings"
            >
              <i className="fa-solid fa-sliders me-1"></i> Settings
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline-danger-theme btn-sm rounded-pill px-3"
          >
            <i className="fa-solid fa-arrow-right-from-bracket me-1"></i> Log Out
          </button>
        </div>

        {/* Mobile Navigation Pill Bar */}
        <div className="d-flex d-md-none w-100 overflow-x-auto gap-2 mt-2 pt-2 border-top border-secondary border-opacity-10 pb-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`btn btn-sm rounded-pill text-nowrap px-3 py-1 ${
                  isActive
                    ? "btn-theme shadow-sm"
                    : "btn-outline-theme border-0 text-secondary"
                }`}
                style={
                  !isActive
                    ? {
                        color: "#94a3b8 !important",
                        background: "rgba(255, 255, 255, 0.03)",
                      }
                    : {}
                }
              >
                <i className={`${item.icon} me-1`}></i> {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
