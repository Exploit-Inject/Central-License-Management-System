"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  };

  const handleCancel = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  };

  // Close on ESC key
  useEffect(() => {
    if (!modalState?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState]);

  const options = modalState?.options;
  const isDanger = options?.type === "danger";
  const isWarning = options?.type === "warning" || !options?.type;

  const accentColor = isDanger ? "#ff453a" : isWarning ? "#ff9f0a" : "#00eaff";
  const iconClass = isDanger
    ? "fa-solid fa-triangle-exclamation"
    : isWarning
    ? "fa-solid fa-circle-exclamation"
    : "fa-solid fa-circle-question";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {modalState?.isOpen && (
        <div
          className="cyber-confirm-overlay"
          onClick={handleCancel}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(3, 6, 14, 0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
        >
          <div
            className="cyber-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(145deg, rgba(13, 20, 36, 0.96), rgba(8, 12, 24, 0.98))",
              border: `1px solid ${accentColor}`,
              boxShadow: `0 0 30px ${accentColor}33, 0 20px 45px rgba(0, 0, 0, 0.8)`,
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              overflow: "hidden",
              position: "relative",
              animation: "confirmModalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Top Accent bar */}
            <div
              style={{
                height: "3px",
                width: "100%",
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              }}
            />

            <div style={{ padding: "28px 24px 24px 24px", textAlign: "center" }}>
              {/* Icon */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}55`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  color: accentColor,
                  marginBottom: "16px",
                  boxShadow: `0 0 20px ${accentColor}33`,
                }}
              >
                <i className={iconClass}></i>
              </div>

              {/* Title */}
              <h5
                style={{
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  letterSpacing: "0.5px",
                  marginBottom: "10px",
                }}
              >
                {options?.title || (isDanger ? "Confirm Deletion" : "Action Warning")}
              </h5>

              {/* Message */}
              <p
                style={{
                  color: "rgba(220, 230, 242, 0.85)",
                  fontSize: "0.92rem",
                  lineHeight: 1.55,
                  marginBottom: "26px",
                }}
              >
                {options?.message}
              </p>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    flex: "1",
                    padding: "10px 18px",
                    borderRadius: "30px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#cbd5e1",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "#cbd5e1";
                  }}
                >
                  <i className="fa-solid fa-xmark me-1"></i> {options?.cancelText || "No, Cancel"}
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  autoFocus
                  style={{
                    flex: "1",
                    padding: "10px 18px",
                    borderRadius: "30px",
                    border: `1px solid ${accentColor}`,
                    background: isDanger
                      ? "linear-gradient(135deg, #ff453a, #b31e17)"
                      : "linear-gradient(135deg, #ff9f0a, #d47b00)",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: `0 4px 15px ${accentColor}44`,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 6px 20px ${accentColor}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 15px ${accentColor}44`;
                  }}
                >
                  <i className="fa-solid fa-check me-1"></i> {options?.confirmText || "Yes, Proceed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

