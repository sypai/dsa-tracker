"use client";

import { useState, useEffect } from "react";
import Landing from "@/components/Landing";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";
import { BioMonitor } from "@/components/BioMonitor";

const SyncOverlay = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  const loadingMessages = [
    "ESTABLISHING SECURE UPLINK...",
    "CALIBRATING BIO-METRICS...",
    "PULLING ELO HISTORY...",
    "SYNCING GRIND DATA...",
    "WAKING THE REAPER...",
    "VERIFYING ENGINE INTEGRITY..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      
      {/* Bulletproof Box: 
        We use inline styles for padding (48px top/bottom, 32px sides) 
        and a minHeight so it physically cannot collapse around the text.
      */}
      <div 
        className="relative w-full max-w-[340px] bg-[var(--surface)] border border-[var(--border2)] shadow-2xl flex flex-col items-center justify-center gap-6 text-center"
        style={{ padding: '48px 32px', minHeight: '220px' }}
      >
        
        {/* Text Block */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="font-mono text-[var(--text)] text-sm uppercase tracking-[0.2em] font-bold">
            Engine Sync
          </div>
          <div className="h-4 font-mono text-[var(--muted)] text-[10px] uppercase tracking-widest text-center w-full animate-pulse">
            {loadingMessages[msgIndex]}
          </div>
        </div>

        {/* The BioMonitor */}
        <div className="w-full flex justify-center scale-[1.5] mt-4 opacity-90 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
          <BioMonitor status="alive" />
        </div>

      </div>
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