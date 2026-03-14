"use client";

import { useState } from "react";
import Landing from "@/components/Landing";
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const handleSignInClick = () => {
    setAuthMode("signin");
    setIsAuthModalOpen(true);
  };

  const handleSignUpClick = () => {
    setAuthMode("signup");
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <main>
      <Landing onSignIn={handleSignInClick} onSignUp={handleSignUpClick} />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authMode} 
      />
    </main>
  );
}