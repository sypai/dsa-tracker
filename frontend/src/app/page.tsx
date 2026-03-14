"use client";

import Landing from "@/components/Landing";

export default function Home() {
  
  // We will build the Auth Modal next, but for now, let's just log to the console
  const handleSignIn = () => {
    console.log("Trigger Sign In Modal");
  };

  const handleSignUp = () => {
    console.log("Trigger Sign Up Modal");
  };

  return (
    <main>
      <Landing onSignIn={handleSignIn} onSignUp={handleSignUp} />
    </main>
  );
}