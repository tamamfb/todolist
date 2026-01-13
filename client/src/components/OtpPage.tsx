import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface OtpLocationState {
  email?: string;
}

interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// Toast Notification Component
function Toast({ toast, onClose }: { toast: ToastNotification; onClose: (id: number) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <div
      style={{
        position: 'relative',
        minWidth: 320,
        padding: '16px 20px',
        borderRadius: 12,
        background: toast.type === 'success' 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#fff',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transform: isExiting ? 'translateX(120%)' : 'translateX(0)',
        opacity: isExiting ? 0 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {toast.type === 'success' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
      </div>
      
      {/* Message */}
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
        {toast.message}
      </span>
      
      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 3,
          background: 'rgba(255,255,255,0.4)',
          animation: 'toastProgress 4s linear forwards',
        }}
      />
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state || {}) as OtpLocationState;
  const initialEmail = state.email ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ id: Date.now(), message, type });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp) {
      showToast("Please fill in email and OTP code", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "OTP verification failed");
      }

      showToast("Email verified successfully! Redirecting...", "success");
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err: any) {
      showToast(err.message || "OTP verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast("Please fill in your email first", "error");
      return;
    }

    try {
      setResendLoading(true);
      const res = await fetch("http://localhost:3000/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to resend OTP");
      }

      await res.json();
      showToast("OTP has been resent. Please check your email.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to resend OTP", "error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        background: "#0f172a",
      }}
    >
      {/* Toast Container */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
          }}
        >
          <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
      )}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 24,
          padding: "32px 28px 36px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 25px 70px rgba(15,23,42,0.6)",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          Verify your email
        </h1>

        <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 20 }}>
          We&apos;ve sent a 6-digit verification code to your email.
        </p>

        <form
          onSubmit={handleVerify}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "none",
                background: "#e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "none",
                background: "#e5e7eb",
                fontSize: 14,
                outline: "none",
                letterSpacing: "0.3em",
                textAlign: "center",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: "#3f51b5",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>Didn&apos;t receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            style={{
              background: "transparent",
              border: "none",
              color: "#1d4ed8",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {resendLoading ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/signin")}
          style={{
            marginTop: 24,
            display: "block",
            width: "100%",
            textAlign: "center",
            background: "transparent",
            border: "none",
            color: "#6b7280",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
