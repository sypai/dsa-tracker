"use client";

import { useState, useEffect } from "react";
import Landing from "@/components/Landing";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";

const SyncOverlay = () => {
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowLongWaitMessage(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
    <div className="flex flex-col items-center gap-6">
      {/* Bio-Pulse Spinner */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-green-500/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-sm tracking-[0.3em] text-green-500 animate-pulse uppercase">
          Syncing Engine
        </p>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Establishing Secure Handshake...
        </p>
      </div>
    </div>

    {showLongWaitMessage && (
         <p className="mt-8 text-[9px] font-mono text-slate-500 uppercase tracking-widest animate-fade-in text-center px-10">
           Render cold start detected. <br/> 
           The Reaper is waking up... hang tight.
         </p>
       )}
  </div>
  );
  
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // 1. New Global State for UI Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {/* 2. The Engine Pulse is now active! */}
      {isLoading && <SyncOverlay />}

      {/* 3. The Friendly Error Mask */}
      {error && (
        <div className="fixed bottom-6 right-6 z-[110] bg-red-900/90 border border-red-500 text-red-100 px-4 py-3 rounded shadow-2xl font-mono text-xs flex items-center gap-3">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="hover:text-white">✕</button>
        </div>
      )}

      {currentUser ? (
        <Dashboard 
          user={currentUser} 
          onSignOut={handleSignOut} 
          setIsLoading={setIsLoading}
          setError={setError}
        /> 
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
        setIsLoading={setIsLoading} // 👈 Pass down so Login shows the pulse
        setError={setError}
      />
    </main>
  );
}