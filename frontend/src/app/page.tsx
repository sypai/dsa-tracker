"use client";

import { useState, useEffect } from "react";
import Landing from "@/components/Landing";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  
  // 1. Create a state to hold the logged-in user
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    setMounted(true);
    // 2. We use ONE consistent key: "dsa_user"
    const storedUser = localStorage.getItem("dsa_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Prevent layout shift during Next.js hydration
  if (!mounted) return <div className="min-h-screen bg-[var(--bg)]" />;

  // 3. Handle successful login/signup
  const handleAuthSuccess = (userData: any) => {
    setCurrentUser(userData);
    localStorage.setItem("dsa_user", JSON.stringify(userData)); // Consistent key
    setIsAuthModalOpen(false); 
  };

  // 4. Handle sign out
  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("dsa_user"); // Consistent key
  };

  // 5. Single, unified return statement!
  return (
    <main>
      {currentUser ? (
        <Dashboard user={currentUser} onSignOut={handleSignOut} /> 
      ) : (
        <Landing 
          onSignIn={() => { setAuthMode("signin"); setIsAuthModalOpen(true); }}
          onSignUp={() => { setAuthMode("signup"); setIsAuthModalOpen(true); }}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode}
        onSuccess={handleAuthSuccess} 
      />
    </main>
  );
}