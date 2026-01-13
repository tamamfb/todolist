import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import animation from "../assets/DataScanning.json";

export type Mode = "signin" | "signup";

interface Props {
  mode: Mode;
}

// Toast notification types
type ToastType = "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// Toast Component
const ToastNotification = ({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const isSuccess = toast.type === "success";
  
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 20px",
        backgroundColor: isSuccess ? "#ecfdf5" : "#fef2f2",
        border: `1px solid ${isSuccess ? "#a7f3d0" : "#fecaca"}`,
        borderRadius: "12px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        minWidth: "320px",
        maxWidth: "420px",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: isSuccess ? "#10b981" : "#ef4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isSuccess ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      
      {/* Message */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "500",
            color: isSuccess ? "#065f46" : "#991b1b",
          }}
        >
          {isSuccess ? "Success!" : "Error"}
        </p>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "13px",
            color: isSuccess ? "#047857" : "#b91c1c",
          }}
        >
          {toast.message}
        </p>
      </div>
      
      {/* Close button */}
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isSuccess ? "#6ee7b7" : "#fca5a5",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = isSuccess ? "#10b981" : "#ef4444"}
        onMouseLeave={(e) => e.currentTarget.style.color = isSuccess ? "#6ee7b7" : "#fca5a5"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default function AuthLayout({ mode }: Props) {
  const navigate = useNavigate();
  const isSignin = mode === "signin";

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  
  const closeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const switchMode = () => {
    if (isSignin) navigate("/signup");
    else navigate("/signin");
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInData.email || !signInData.password) {
      showToast("Please fill in email and password", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signInData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      showToast("Login successful! Redirecting...", "success");
      // redirect ke Today page setelah delay singkat
      setTimeout(() => navigate("/today"), 1000);
    } catch (err: any) {
      showToast(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpData.name || !signUpData.email || !signUpData.password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signUpData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Register failed");
      }

      await res.json();
      showToast("Registration successful! Please verify your email.", "success");
      // redirect ke OTP page setelah delay singkat
      setTimeout(() => navigate("/otp", { state: { email: signUpData.email } }), 1000);
    } catch (err: any) {
      showToast(err.message || "Register failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
      
      <div className={`auth-card ${mode}`}>
        {/* LEFT PANEL - SIGN IN */}
        <div className="panel panel-left">
          <div className="panel-card">
            <h1 className="title">Sign In</h1>

            <form className="form" onSubmit={handleSignInSubmit}>
              <input
                type="email"
                placeholder="Your email"
                value={signInData.email}
                onChange={(e) =>
                  setSignInData({ ...signInData, email: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Your password"
                value={signInData.password}
                onChange={(e) =>
                  setSignInData({ ...signInData, password: e.target.value })
                }
              />

              <button type="button" className="text-link">
                Forgot Your Password?
              </button>

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading && isSignin ? "Signing in..." : "SIGN IN"}
              </button>
            </form>

            {/* helper kecil hanya di mobile, tapi biar gampang kita render aja, di CSS bisa di-hide di desktop */}
            <div className="switch-helper">
              <span>First time here?</span>
              <button
                type="button"
                className="inline-link"
                onClick={switchMode}
              >
                Sign up
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - SIGN UP */}
        <div className="panel panel-right">
          <div className="panel-card">
            <h1 className="title">Create Account</h1>

            <form className="form" onSubmit={handleSignUpSubmit}>
              <input
                type="text"
                placeholder="Your name"
                value={signUpData.name}
                onChange={(e) =>
                  setSignUpData({ ...signUpData, name: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Your email"
                value={signUpData.email}
                onChange={(e) =>
                  setSignUpData({ ...signUpData, email: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Your password"
                value={signUpData.password}
                onChange={(e) =>
                  setSignUpData({ ...signUpData, password: e.target.value })
                }
              />

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading && !isSignin ? "Signing up..." : "SIGN UP"}
              </button>
            </form>

            <div className="switch-helper">
              <span>Already have an account?</span>
              <button
                type="button"
                className="inline-link"
                onClick={switchMode}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>

        {/* BLUE SLIDING PANEL (DESKTOP) */}
        <div className="blue-panel">
          <div className="blue-inner">
            <h2 className="blue-title">
              {isSignin ? "Hello, My Friend!" : "Welcome Back!"}
            </h2>
            <p className="blue-text">
              {isSignin
                ? "Register with your personal details to use the best todolist app in the world"
                : "Enter your personal details to use the best todolist app in the world"}
            </p>

            <button type="button" className="outline-btn" onClick={switchMode}>
              {isSignin ? "SIGN UP" : "SIGN IN"}
            </button>

            <div className="blue-lottie">
              <Lottie animationData={animation} loop />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
