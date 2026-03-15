"use client";

import { BioMonitor } from "./BioMonitor";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";
import { dsaFetch } from "@/lib/api";

const DEFAULT_TOPICS = ['Array','String','Linked List','Tree','Graph','DP','Backtracking','Binary Search','Heap','Stack','Sliding Window','Two Pointers','Greedy','Math','Trie','Other'];
const RANKS = [
  { name:'NOVICE', min:1200 }, { name:'APPRENTICE', min:1250 }, { name:'CODER', min:1300 },
  { name:'SOLVER', min:1400 }, { name:'ANALYST', min:1550 }, { name:'ENGINEER', min:1700 },
  { name:'ARCHITECT', min:1900 }, { name:'WIZARD', min:2100 }, { name:'GRANDMASTER', min:2400 },
];
const ELO_BASE = 0;
const ELO_GAIN: Record<string, number> = { easy:5, medium:15, hard:25 };
const DECAY = 2;

// Updated to support multiple links while keeping backwards compatibility with old local storage data
type Question = { 
  id: string; 
  name: string; 
  diff: string; 
  topic: string; 
  source: string; 
  link?: string; 
  links?: string[]; 
  notes: string; 
  date: string; 
};

const getLocalISODate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Change the very top of your Dashboard function to this:
export default function Dashboard({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  // 1. Check local storage first! If it's not there, default to 1200.
  const [realElo, setRealElo] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const cachedElo = localStorage.getItem("dsa_real_elo");
      if (cachedElo) return parseInt(cachedElo, 10);
    }
    return 1200;
  }); // 👈 The true database ELO
  const [customTopics, setCustomTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [activeTopic, setActiveTopic] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAcctMenuOpen, setIsAcctMenuOpen] = useState(false);
  
  // Form State
  const [qName, setQName] = useState("");
  const [qDiff, setQDiff] = useState("medium");
  const [qTopic, setQTopic] = useState("Array");
  const [qSource, setQSource] = useState("LC");
  const [qLinks, setQLinks] = useState<string[]>([""]); // Now an array of strings
  const [qNotes, setQNotes] = useState("");
  
  // Topic Form State
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. The Reusable Sync Function
  const fetchDashboardData = async () => {
    if (!user || !user.id) return;
    try {
      // Fetch Questions
      const qRes = await dsaFetch(`/questions/user/${user.id}`);
      if (qRes.ok) setQuestions(await qRes.json());

      // Fetch Fresh User ELO
      const uRes = await dsaFetch(`/users/${user.id}`);
      if (uRes.ok) {
        const uData = await uRes.json();
        setRealElo(uData.currentElo);

        // 2. Cache the real ELO so it doesn't flicker on the next refresh!
        localStorage.setItem("dsa_real_elo", uData.currentElo.toString());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  // 2. Run it exactly once when the component loads
  useEffect(() => {
    setMounted(true);
    
    // Load local storage fallbacks just in case
    const cachedQuestions = localStorage.getItem('dsa_elo_v2');
    if (cachedQuestions) setQuestions(JSON.parse(cachedQuestions));
    
    fetchDashboardData();
  }, [user?.id]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dsa_elo_v2', JSON.stringify(questions));
      localStorage.setItem('dsa_topics', JSON.stringify(customTopics));
    }
  }, [questions, customTopics, mounted]);

  const stats = useMemo(() => {
    let streak = 0;
    const solvedDays = new Set(questions.map(q => q.date));
    const todayStr = getLocalISODate(); // Get today's local date

    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // If we haven't solved today, start checking from yesterday
    if (!solvedDays.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Iterate backwards and count the consecutive days
    while (true) {
      // Get the YYYY-MM-DD for the date we are currently checking
      const offset = checkDate.getTimezoneOffset();
      const localCheck = new Date(checkDate.getTime() - (offset * 60 * 1000));
      const key = localCheck.toISOString().split('T')[0];

      if (solvedDays.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (!questions.length) return { elo: realElo, gained: 0, lost: 0, decayActive: false, gapDays: 0, pendingDecay: 0, streak: 0 };
    
    // 2. The new Single Source of Truth Math!
    const gained = questions.reduce((s,q) => s + ELO_GAIN[q.diff], 0);
    const elo = realElo; // 👈 Directly from Postgres
    const lost = Math.max(0, 1200 + gained - realElo); // 👈 Pure algebra, perfectly synced!
    
    // 3. Keep the UI gap calculations for the warning banner
    const sorted = [...questions].sort((a,b)=>a.date.localeCompare(b.date));
    const todayD = new Date(); todayD.setHours(0,0,0,0);
    const lastDate = new Date(sorted[sorted.length-1].date); lastDate.setHours(0,0,0,0);
    const gapDays = Math.round((todayD.getTime() - lastDate.getTime()) / 86400000);
    const decayActive = gapDays > 1;
    const pendingDecay = decayActive ? (gapDays - 1) * 2 : 0;
    
    return { elo, gained, lost, decayActive, gapDays, pendingDecay, streak };
  }, [questions, realElo]); // 👈 Added realElo to dependency array

  const monitorStatus = useMemo(() => {
    if (stats.elo <= 0 && questions.length === 0) return 'dead';
    if (stats.decayActive) return 'decay';
    if (stats.streak > 0) return 'alive';
    return 'idle';
  }, [stats.elo, stats.decayActive, stats.streak, questions.length]);

  const rankInfo = useMemo(() => {
    let idx = 0;
    for (let i = RANKS.length-1; i >= 0; i--) { if (stats.elo >= RANKS[i].min) { idx=i; break; } }
    const cur = RANKS[idx], nxt = RANKS[idx+1];
    const pct = nxt ? Math.min(100, Math.round((stats.elo-cur.min)/(nxt.min-cur.min)*100)) : 100;
    return { name:cur.name, pct, prevLabel:cur.name, nextLabel: nxt ? nxt.name : '★ MAX' };
  }, [stats.elo]);

  const handleAddQuestion = async () => { // 👈 1. Make it async
    if (!qName.trim()) return;
    
    const filteredLinks = qLinks.map(l => l.trim()).filter(Boolean);

    // 2. Build the payload for Spring Boot (Notice we removed the fake 'id')
    const payload = {
      name: qName.trim(),
      diff: qDiff,
      topic: qTopic,
      source: qSource,
      links: filteredLinks,
      notes: qNotes.trim(),
      date: getLocalISODate(),
      user: { id: user.id } // Use the real ID of the person logged in!
    };

    try {
      // 3. Send it to the backend
      const response = await dsaFetch("/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // 4. Get the saved question back from Spring Boot (it now has a real DB ID!)
        const savedQuestion = await response.json();
        
        // 5. Update UI with the real data
        setQuestions([savedQuestion, ...questions]);
        
        // 👈 ASK THE DB FOR THE NEW ELO!
        fetchDashboardData();

        // 6. Reset Form
        setQName(""); 
        setQLinks([""]); 
        setQNotes("");
      } else {
        console.error("Backend rejected the save:", response.status);
      }
    } catch (error) {
      console.error("Failed to connect to API:", error);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteId) return;

    try {
      // 1. Tell Spring Boot to destroy the row
      const response = await dsaFetch(`/questions/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 2. If the database deleted it successfully, remove it from the UI!
        setQuestions(questions.filter(q => q.id !== deleteId));
        setDeleteId(null); // Close the modal
        // 👈 ASK THE DB FOR THE NEW ELO!
        fetchDashboardData();
      } else {
        console.error("Backend refused to delete:", response.status);
      }
    } catch (error) {
      console.error("Failed to connect to API:", error);
    }
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...qLinks];
    newLinks[index] = value;
    setQLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setQLinks(qLinks.filter((_, i) => i !== index));
  };

  const handleAddTopic = () => {
    if (!newTopic.trim() || customTopics.includes(newTopic.trim())) return;
    setCustomTopics([...customTopics, newTopic.trim()]);
    setShowTopicForm(false);
    setNewTopic("");
  };

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;
    let raf: number;
    let offset = 0;
    const W = 60, H = 22;
    const beat = [ [0, .5],[.15,.5],[.22,.44],[.28,.56],[.33,.5], [.36,.5],[.40,.05],[.44,.95],[.48,.5], [.52,.38],[.58,.62],[.63,.5],[1,.5] ];
    
    const state = (stats.elo <= 0 && questions.length === 0) ? 'dead' : stats.decayActive ? 'decay' : stats.streak > 0 ? 'alive' : 'idle';
    
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;
      const st = getComputedStyle(document.documentElement);
      const color = state==='alive' ? st.getPropertyValue('--easy').trim() : state==='decay' ? st.getPropertyValue('--medium').trim() : st.getPropertyValue('--muted2').trim();
      const spd = state==='alive' ? 1.0 : state==='decay' ? 0.35 : state==='idle' ? 0.18 : 0;
      
      ctx.clearRect(0,0,W,H);
      if (state==='dead') {
        ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2);
        ctx.strokeStyle=color; ctx.lineWidth=1; ctx.globalAlpha=0.3; ctx.stroke(); ctx.globalAlpha=1;
        raf=requestAnimationFrame(draw); return;
      }
      
      const cw = W * 0.85;
      ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=1.2;
      let first=true;
      for (let c=-1; c<3; c++) {
        const sx = c*cw - (offset%cw);
        beat.forEach(([bx,by]) => {
          const px=sx+bx*cw, py=by*H;
          if (first){ctx.moveTo(px,py);first=false;} else ctx.lineTo(px,py);
        });
      }
      ctx.stroke();
      const bg = st.getPropertyValue('--surface').trim() || '#e8e3d9';
      const g = ctx.createLinearGradient(0,0,W*0.3,0);
      g.addColorStop(0,bg); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.fillRect(0,0,W*0.3,H);
      offset+=spd;
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [mounted, stats.elo, stats.decayActive, stats.streak, questions.length]);

  if (!mounted) return <div className="min-h-screen flex items-center justify-center font-mono text-[var(--muted)]">Initializing Systems...</div>;

  return (
    <div id="dashboardPage" className="w-full max-w-[1020px] mx-auto px-6 py-12 pb-24">
      {/* HEADER */}
      <div className="header">
        <div>
          <div className="logo">DSA<span>.</span>LOG</div>
          <div className="tagline">elo engine · time decay · grind or bleed</div>
        </div>
        <div className="header-right">
          <button className="theme-toggle" onClick={() => document.documentElement.classList.toggle('dark')}>○ Theme</button>
          <div className="relative">
            <button className="acct-btn signed-in" onClick={() => setIsAcctMenuOpen(!isAcctMenuOpen)}>⊙ {user.name}</button>
            {isAcctMenuOpen && (
              <div className="acct-dropdown open">
                <div className="acct-user">{user.email}</div>
                {/* Hook the button up! */}
                <button className="acct-dropdown-item danger" onClick={onSignOut}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOP PANEL */}
      <div className="top-panel">
        <div className="elo-side">
          
        <div className="elo-top-row">
            <div className={`elo-rating ${stats.decayActive ? 'bleeding' : ''}`}>{stats.elo}</div>
            
            {/* The Restored Tooltip */}
            <div className="elo-tip">?
              <div className="elo-tooltip">
                <strong>ELO System</strong>
                <div className="trow"><span>Starting rating</span><span>1200</span></div> {/* Note: I updated this to 1200 to match our new DB logic! */}
                <div className="trow"><span>Easy solve</span><span>+5</span></div>
                <div className="trow"><span>Medium solve</span><span>+15</span></div>
                <div className="trow"><span>Hard solve</span><span>+25</span></div>
                <div className="trow"><span>Missed day (after first solve)</span><span style={{ color: 'var(--accent)' }}>-2</span></div>
                
                <strong style={{ marginTop: '10px' }}>Rank Thresholds</strong>
                <div className="trow"><span>Novice</span><span>1200</span></div>
                <div className="trow"><span>Apprentice</span><span>1250</span></div>
                <div className="trow"><span>Coder</span><span>1300</span></div>
                <div className="trow"><span>Solver</span><span>1400</span></div>
                <div className="trow"><span>Analyst</span><span>1550</span></div>
                <div className="trow"><span>Engineer</span><span>1700</span></div>
                <div className="trow"><span>Architect</span><span>1900</span></div>
                <div className="trow"><span>Wizard</span><span>2100</span></div>
                <div className="trow"><span>Grandmaster</span><span>2400</span></div>
              </div>
            </div>
          </div>

          <div className="elo-rank">{rankInfo.name}</div>
          <div className="elo-delta">
            Earned: <span className="gain">+{stats.gained}</span> &nbsp;·&nbsp; Decay: <span className="loss">-{stats.lost}</span>
          </div>
          <div className="elo-bar-wrap">
            <div className="elo-bar-labels"><span>{rankInfo.prevLabel}</span><span>{rankInfo.nextLabel}</span></div>
            <div className="elo-track"><div className="elo-fill" style={{width: `${rankInfo.pct}%`}}></div></div>
          </div>
        </div>
        <div className="counts-side">
          <div className="counts-grid">
            <div className="count-cell"><div className="count-label">Solved</div><div className="count-val">{questions.length}</div></div>
            <div className="count-cell"><div className="count-label">Easy</div><div className="count-val c-easy">{questions.filter(q=>q.diff==='easy').length}</div></div>
            <div className="count-cell"><div className="count-label">Medium</div><div className="count-val c-medium">{questions.filter(q=>q.diff==='medium').length}</div></div>
            <div className="count-cell"><div className="count-label">Hard</div><div className="count-val c-hard">{questions.filter(q=>q.diff==='hard').length}</div></div>
          </div>
        </div>
      </div>

      {/* DECAY BANNER */}
      {stats.decayActive && questions.length > 0 && (
        <div className="decay-banner">
          <div className="decay-dot"></div>
          <p>Streak broken — <strong>{stats.gapDays} days</strong> since last solve. Bleeding <strong>-{stats.pendingDecay} ELO</strong>. Solve something now.</p>
        </div>
      )}

     {/* ACTIVITY */}
    <div className="activity-block">
      <div className="activity-header">
        <div className="section-title !border-none !p-0 !m-0">Activity — last 120 days</div>
        
        {/* The Unified Bio-Sensor Unit */}
        <motion.div 
          className="streak-inline cursor-help"
          animate={stats.decayActive ? { 
            x: [0, -1, 1, -1, 1, 0],
            filter: [
              "drop-shadow(0 0 0px rgba(248,113,113,0))", 
              "drop-shadow(0 0 12px rgba(248,113,113,0.3))", 
              "drop-shadow(0 0 0px rgba(248,113,113,0))"
            ]
          } : { x: 0, filter: "drop-shadow(0 0 0px rgba(0,0,0,0))" }}
          transition={stats.decayActive ? { 
            x: { repeat: Infinity, duration: 0.5, ease: "linear" },
            filter: { repeat: Infinity, duration: 2 }
          } : {}}
          title={stats.decayActive ? "System Critical: ELO Bleeding" : "Heartbeat Stable"}
        >
          <div className="streak-nums-row">
            <span className="streak-inline-num">{stats.streak}</span>
            <span className="streak-inline-label">day streak</span>
          </div>
          
          <div className="ecg-wrap">
            <BioMonitor status={monitorStatus} />
          </div>
        </motion.div>
      </div>

      <div className="h-[1px] bg-[var(--border)] mb-2.5"></div>
      
      <div className="cal-grid">
        {Array.from({length: 120}, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (119 - i));
          const key = d.toISOString().slice(0,10);
          const count = questions.filter(q => q.date === key).length;
          
          // Determine if this specific day on the calendar was a decay day
          const firstD = [...questions].sort((a,b)=>a.date.localeCompare(b.date))[0]?.date;
          const isDecay = firstD && d > new Date(firstD) && count === 0 && d < new Date();
          
          let lvl = count === 1 ? 'l1' : count <= 3 ? 'l2' : count <= 5 ? 'l3' : count >= 6 ? 'l4' : '';
          
          return (
            <div 
              key={i} 
              className={`cal-day ${count > 0 ? lvl : isDecay ? 'decay' : ''} ${i === 119 ? 'today' : ''}`} 
              title={`${key}: ${count > 0 ? count + ' solved' : isDecay ? '-2 ELO' : 'No activity'}`} 
            />
          );
        })}
      </div>

      <div className="cal-legend">
        <div className="cal-legend-swatch" style={{ background: 'var(--cal-0)' }}></div> none
        <div className="cal-legend-swatch" style={{ background: 'var(--cal-1)' }}></div> 1
        <div className="cal-legend-swatch" style={{ background: 'var(--cal-2)' }}></div> 2–3
        <div className="cal-legend-swatch" style={{ background: 'var(--cal-3)' }}></div> 4–5
        <div className="cal-legend-swatch" style={{ background: 'var(--cal-4)' }}></div> 6+
        &nbsp;&nbsp;
        <div className="cal-legend-swatch" style={{ background: 'var(--cal-decay)' }}></div> decay day
      </div>
    </div>

      {/* TOPICS */}
      <div className="topics-block">
        <div className="section-title">Topics</div>
        <div className="topics-row">
          <div className="topics">
            <div className={`topic ${activeTopic==='All'?'active':''}`} onClick={()=>setActiveTopic('All')}>All<span className="count">{questions.length}</span></div>
            {customTopics.map(t => (
              <div key={t} className={`topic ${activeTopic===t?'active':''}`} onClick={()=>setActiveTopic(t)}>
                {t}<span className="count">{questions.filter(q=>q.topic===t).length}</span>
                <span className="remove-topic" onClick={(e)=>{e.stopPropagation(); setCustomTopics(customTopics.filter(x=>x!==t)); if(activeTopic===t) setActiveTopic('All');}}>×</span>
              </div>
            ))}
          </div>
          <button className="add-topic-btn" onClick={()=>setShowTopicForm(true)}>+ topic</button>
        </div>
        {showTopicForm && (
          <div className="add-topic-form mt-2 flex gap-1.5">
            <input type="text" value={newTopic} onChange={e=>setNewTopic(e.target.value)} placeholder="Topic name…" onKeyDown={e=>{if(e.key==='Enter')handleAddTopic(); if(e.key==='Escape')setShowTopicForm(false)}}/>
            <button onClick={handleAddTopic}>Add</button>
            <button className="cancel-btn" onClick={()=>setShowTopicForm(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* ADD FORM */}
      <div className="add-section">
        <div className="add-section-header" onClick={()=>setFormOpen(!formOpen)}>
          <span>+ Log a Question</span><span className="toggle">{formOpen ? '▾' : '▸'}</span>
        </div>
        {formOpen && (
          <div className="add-form-inner">
            <div className="add-row">
              <input type="text" placeholder="Question title..." value={qName} onChange={e=>setQName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleAddQuestion()}} />
              <select value={qDiff} onChange={e=>setQDiff(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
              <select value={qTopic} onChange={e=>setQTopic(e.target.value)}>{customTopics.map(t=><option key={t} value={t}>{t}</option>)}</select>
              <select value={qSource} onChange={e=>setQSource(e.target.value)}><option value="LC">LeetCode</option><option value="AE">AlgoExpert</option><option value="CTCI">CTCI</option><option value="EPI">EPI</option><option value="Other">Other</option></select>
            </div>
            <div className="add-row2">
              <div className="link-list">
                {qLinks.map((link, idx) => (
                  <div key={idx} className="link-row">
                    <input 
                      type="text" 
                      value={link} 
                      onChange={e => updateLink(idx, e.target.value)}
                      placeholder={idx === 0 ? "Code link — GitHub, Gist, Notion…" : "Another link…"}
                    />
                    {idx === 0 ? (
                      <button type="button" className="link-add-inline" onClick={() => setQLinks([...qLinks, ""])} title="Add another link">+</button>
                    ) : (
                      <button type="button" className="link-remove" onClick={() => removeLink(idx)} title="Remove">×</button>
                    )}
                  </div>
                ))}
              </div>
              <textarea placeholder="Notes..." value={qNotes} onChange={e=>setQNotes(e.target.value)} />
            </div>
            <div className="add-bottom">
              <div className="elo-preview">This solve: <span className="preview-val">+{ELO_GAIN[qDiff]}</span> &nbsp;·&nbsp; New rating: <span className="preview-val">{stats.elo + ELO_GAIN[qDiff]}</span></div>
              <button className="add-btn" onClick={handleAddQuestion}>LOG IT</button>
            </div>
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="list-header"><span>Question</span><span>ELO</span><span>Source</span><span>Topic</span><span></span></div>
      <div className="q-list">
        {(activeTopic==='All'?questions:questions.filter(q=>q.topic===activeTopic)).slice().reverse().map(q => {
          const combinedLinks = q.links && q.links.length > 0 ? q.links : (q.link ? [q.link] : []);
          
          return (
            <div key={q.id} className={`q-item diff-${q.diff}`}>
              <div className="q-main" onClick={()=>setExpandedId(expandedId===q.id?null:q.id)}>
                <div className="q-name">{q.name}{q.notes && <span className="note-dot"></span>}</div>
                <div className="q-elo-gain">+{ELO_GAIN[q.diff]}</div>
                <div className="q-source">{q.source}</div>
                <div className="q-topic">{q.topic}</div>
                <button className="del-btn" onClick={(e)=>{e.stopPropagation(); setDeleteId(q.id);}}>×</button>
              </div>
              {expandedId === q.id && (
                <div className="q-expand open">
                  <div className="expand-grid">
                    <div><div className="expand-label">Notes</div><div className="expand-notes">{q.notes || 'No notes.'}</div></div>
                    <div>
                      <div className="expand-label">Links</div>
                      {combinedLinks.length > 0 ? (
                        <div className="expand-links">
                          {combinedLinks.map((l, i) => (
                            <a key={i} className="expand-link" href={l} target="_blank" rel="noopener noreferrer">↗ {l}</a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--muted2)] font-mono text-xs">No links.</span>
                      )}
                      <div className="mt-3.5"><div className="expand-label">Logged</div><div className="expand-date">{q.date}</div></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {questions.length === 0 && <div className="empty"><span className="empty-big">#_</span>No questions yet. Log your first one above.</div>}
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Delete Question?</div>
            <div className="modal-body">Remove <strong>{questions.find(q=>q.id===deleteId)?.name}</strong>? This will also reverse the ELO gained from it.</div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={()=>setDeleteId(null)}>Cancel</button>
              <button className="modal-confirm" onClick={handleDeleteQuestion}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}