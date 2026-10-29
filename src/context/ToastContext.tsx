"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* TOP RIGHT CYBER TOAST CONTAINER */}
      <div className="toast-container-top-right">
        {toasts.map((t) => (
          <div key={t.id} className={`cyber-toast toast-${t.type}`}>
            <div className="d-flex align-items-center gap-3 flex-grow-1">
              <div className="toast-icon-wrap">
                {t.type === "success" && (
                  <i className="fa-solid fa-circle-check" style={{ color: "#30d158" }}></i>
                )}
                {t.type === "error" && (
                  <i className="fa-solid fa-circle-xmark" style={{ color: "#ff453a" }}></i>
                )}
                {t.type === "warning" && (
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: "#ff9f0a" }}></i>
                )}
                {t.type === "info" && (
                  <i className="fa-solid fa-circle-info" style={{ color: "#00eaff" }}></i>
                )}
              </div>
              <div className="toast-message-text">{t.message}</div>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(t.id)}
              aria-label="Close"
              title="Dismiss"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="toast-progress-bar" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

