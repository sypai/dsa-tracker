"use client";

import { useState, useEffect } from "react";
import { dsaFetch } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  onSuccess: (user: any) => void; // Using 'any' for now, or you can strictly type it to match your Spring Boot User model
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

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Email and password required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    // 1. Define the endpoint and payload based on the current mode
    const endpoint = isSignup ? '/users/register' : '/users/login';
    const payload = isSignup ? { name, email, password } : { email, password };

    try {
      // 2. Fire the request to your Spring Boot backend
      const response = await dsaFetch(`${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // 3. Success! Get the real user data back from Postgres
        const userData = await response.json();
        onSuccess(userData);
        onClose();
      } else {
        // 4. Handle backend validation errors (e.g., "Email is already taken.")
        const errorMsg = await response.text();
        setError(errorMsg);
      }
    } catch (err) {
      setError("Failed to connect to the server. Is the backend running?");
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal relative w-full max-w-[360px] p-8 bg-[var(--surface)] border border-[var(--border2)] shadow-2xl">
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
        
        {/* Swapped onClick to the new async function */}
        <button className="auth-submit mt-4" onClick={handleSubmit}>
          {isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
        </button>
        
        <div className="auth-switch mt-4">
          {isSignup ? 'Already have one? ' : 'No account? '}
          <a className="cursor-pointer text-[var(--accent)] hover:underline" onClick={handleToggleMode}>
            {isSignup ? 'Sign in' : 'Create one'}
          </a>
        </div>
      </div>
    </div>
  );
}