"use client";

import { useState, useEffect } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  onSuccess: (user: { email: string; name: string }) => void; // ADDED THIS
}

export default function AuthModal({ isOpen, onClose, initialMode = "signin", onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(initialMode);
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const isSignup = mode === "signup";

  const handleToggleMode = () => {
    setMode(isSignup ? "signin" : "signup");
    setError("");
  };

  const handleSubmit = () => {
    if (!email || !password) {
      setError("Email and password required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    // Pass the user data back to the main page
    onSuccess({ 
      email, 
      name: isSignup ? (name || email.split('@')[0]) : email.split('@')[0] 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal relative w-full max-w-[360px] p-8 bg-[var(--surface)] border border-[var(--border2)] shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)]"></div>
        <button className="absolute top-4 right-4 text-2xl text-[var(--muted)] hover:text-[var(--text)] leading-none" onClick={onClose}>×</button>
        <div className="auth-title">{isSignup ? 'Create Account' : 'Sign In'}</div>
        <div className="auth-sub">{isSignup ? 'Start tracking your grind.' : 'Welcome back. Pick up where you left off.'}</div>
        <div className="auth-field mt-4">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {isSignup && (
          <div className="auth-field">
            <label>Name</label>
            <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="auth-field">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="auth-error min-h-[16px] text-[var(--accent)] mt-2">{error}</div>
        <button className="auth-submit mt-4" onClick={handleSubmit}>{isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}</button>
        <div className="auth-switch mt-4">
          {isSignup ? 'Already have one? ' : 'No account? '}
          <a className="cursor-pointer text-[var(--accent)] hover:underline" onClick={handleToggleMode}>{isSignup ? 'Sign in' : 'Create one'}</a>
        </div>
      </div>
    </div>
  );
}