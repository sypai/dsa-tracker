"use client"; // This tells Next.js this component uses interactive client-side code

export default function Landing({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) {
  
  // Theme toggle logic ported directly from your JS
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('dsa_theme', isDark ? 'light' : 'dark');
    
    // Update the button text
    const btn = document.getElementById('themeToggleLanding');
    if (btn) btn.textContent = isDark ? '○ Light' : '● Dark';
  };

  return (
    <div id="landingPage" className="flex flex-col min-h-screen max-w-[1020px] mx-auto px-6">
      
      {/* Navigation */}
      <nav className="landing-nav">
        <div>
          <div className="logo">DSA<span>.</span>LOG</div>
          <div className="tagline">elo engine · time decay · grind or bleed</div>
        </div>
        <div className="landing-nav-right">
          <button 
            className="theme-toggle" 
            id="themeToggleLanding" 
            onClick={toggleTheme}
          >
            ○ Light
          </button>
          <button className="ln-signin" onClick={onSignIn}>Sign in</button>
        </div>
      </nav>

      {/* Main Body */}
      <div className="landing-body">
        <div className="landing-eyebrow">DSA Tracker — ELO Engine</div>
        <div className="landing-headline">Grind daily.<br/>Or watch your <em>rating bleed.</em></div>
        <div className="landing-sub">
          Every problem solved moves you up the ranks.<br/>
          Every day you skip? −2 ELO. No warnings.
        </div>
        <div className="landing-cta-row">
          <button className="landing-cta" onClick={onSignUp}>Start Grinding</button>
          <button className="landing-cta-secondary" onClick={onSignIn}>Sign in</button>
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <span>© DSA.LOG — built for grinders</span>
        {/* <div className="landing-footer-links">
          <span className="cursor-pointer text-muted hover:text-accent transition-colors" onClick={onSignUp}>Create account</span>
          <span className="cursor-pointer text-muted hover:text-accent transition-colors" onClick={onSignIn}>Sign in</span>
        </div> */}
      </div>

    </div>
  );
}