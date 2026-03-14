"use client";

import { useState, useEffect } from "react";
import Landing from "@/components/Landing";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<{email: string, name: string} | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    // Check if the user was already logged in on refresh
    const savedUser = localStorage.getItem("dsa_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setMounted(true);
  }, []);

  const handleAuthSuccess = (user: { email: string, name: string }) => {
    setCurrentUser(user);
    localStorage.setItem("dsa_user", JSON.stringify(user));
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("dsa_user");
  };

  // Prevent layout shift during Next.js hydration
  if (!mounted) return <div className="min-h-screen bg-[var(--bg)]" />; // 👈 CHANGE THIS LINE

  // If user is logged in, show the full Dashboard
  if (currentUser) {
    return <Dashboard user={currentUser} onSignOut={handleSignOut} />;
  }

  // Otherwise, show the Landing Page and Auth Modal
  return (
    <main>
      <Landing 
        onSignIn={() => { setAuthMode("signin"); setIsAuthModalOpen(true); }} 
        onSignUp={() => { setAuthMode("signup"); setIsAuthModalOpen(true); }} 
      />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}