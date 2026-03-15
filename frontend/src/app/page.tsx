"use client";

import { useState, useEffect } from "react";
import Landing from "@/components/Landing";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";

const SyncOverlay = () => {
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  useEffect(() => {
    // Render's free tier can take a bit to wake up. This keeps the user informed.
    const timer = setTimeout(() => setShowLongWaitMessage(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <style>{`
        @keyframes engine-scan {
          0% { left: -50%; }
          100% { left: 100%; }
        }
        .animate-engine-scan {
          animation: engine-scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .data-block {
          animation: pulse-block 1s infinite alternate;
        }
        @keyframes pulse-block {
          0% { opacity: 0.2; transform: scaleY(0.8); }
          100% { opacity: 1; transform: scaleY(1.1); }
        }
      `}</style>
      
      <div className="relative w-full max-w-[320px] p-8 bg-[var(--surface)] border border-[var(--border2)] shadow-2xl flex flex-col items-center text-center">
        
        {/* The Scanning Accent Line (matches AuthModal) */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--border2)] overflow-hidden">
          <div className="absolute top-0 bottom-0 w-[50%] bg-[var(--text)] animate-engine-scan" />
        </div>

        {/* Text Details */}
        <div className="font-mono text-[var(--text)] text-sm uppercase tracking-widest mb-1 mt-2">
          Syncing Engine
        </div>
        <div className="font-mono text-[var(--muted)] text-[10px] uppercase tracking-widest mb-6">
          Establishing Handshake...
        </div>

        {/* Raw Data-Block Loader */}
        <div className="flex gap-2">
          <div className="w-2 h-4 bg-[var(--text)] data-block" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-4 bg-[var(--text)] data-block" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-4 bg-[var(--text)] data-block" style={{ animationDelay: '400ms' }} />
        </div>

        {/* Cold Start Warning */}
        {showLongWaitMessage && (
          <div className="mt-8 pt-4 border-t border-[var(--border2)] w-full">
            <p className="font-mono text-[10px] text-[var(--accent)] uppercase tracking-widest animate-pulse">
              Cold start detected.<br/>Waking the Reaper...
            </p>
          </div>
        )}
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