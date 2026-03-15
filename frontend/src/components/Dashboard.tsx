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
const ELO_GAIN: Record<string, number> = { easy:5, medium:15, hard:25 };

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

interface DashboardProps {
  user: any;
  onSignOut: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (msg: string | null) => void;
}

export default function Dashboard({ user, onSignOut, setIsLoading, setError }: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [realElo, setRealElo] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const cachedElo = localStorage.getItem("dsa_real_elo");
      return cachedElo ? parseInt(cachedElo, 10) : 1200;
    }
    return 1200;
  });

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
  const [qLinks, setQLinks] = useState<string[]>([""]);
  const [qNotes, setQNotes] = useState("");
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchDashboardData = async () => {
    if (!user || !user.id) return;
    setIsLoading(true);
    try {
      const qRes = await dsaFetch(`/questions/user/${user.id}`);
      if (qRes.ok) setQuestions(await qRes.json());

      const uRes = await dsaFetch(`/users/${user.id}`);
      if (uRes.ok) {
        const uData = await uRes.json();
        setRealElo(uData.currentElo);
        localStorage.setItem("dsa_real_elo", uData.currentElo.toString());
      }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Theme logic: Default to dark if no preference exists
    const savedTheme = localStorage.getItem('dsa_theme');
    if (!savedTheme || savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const cachedQuestions = localStorage.getItem('dsa_elo_v2');
    if (cachedQuestions) setQuestions(JSON.parse(cachedQuestions));
    
    fetchDashboardData();
  }, [user?.id]);

  const handleToggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('dsa_theme', isDark ? 'dark' : 'light');
  };

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dsa_elo_v2', JSON.stringify(questions));
      localStorage.setItem('dsa_topics', JSON.stringify(customTopics));
    }
  }, [questions, customTopics, mounted]);

  const stats = useMemo(() => {
    let streak = 0;
    const solvedDays = new Set(questions.map(q => q.date));
    const todayStr = getLocalISODate();

    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    if (!solvedDays.has(todayStr)) checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const offset = checkDate.getTimezoneOffset();
      const localCheck = new Date(checkDate.getTime() - (offset * 60 * 1000));
      const key = localCheck.toISOString().split('T')[0];
      if (solvedDays.has(key)) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
    }

    if (!questions.length) return { elo: realElo, gained: 0, lost: 0, decayActive: false, gapDays: 0, pendingDecay: 0, streak: 0 };
    
    const gained = questions.reduce((s,q) => s + ELO_GAIN[q.diff], 0);
    const elo = realElo;
    const lost = Math.max(0, 1200 + gained - realElo);
    
    const sorted = [...questions].sort((a,b)=>a.date.localeCompare(b.date));
    const todayD = new Date(); todayD.setHours(0,0,0,0);
    const lastDate = new Date(sorted[sorted.length-1].date); lastDate.setHours(0,0,0,0);
    const gapDays = Math.round((todayD.getTime() - lastDate.getTime()) / 86400000);
    const decayActive = gapDays > 1;
    const pendingDecay = decayActive ? (gapDays - 1) * 2 : 0;
    
    return { elo, gained, lost, decayActive, gapDays, pendingDecay, streak };
  }, [questions, realElo]);

  const handleAddQuestion = async () => {
    if (!qName.trim()) return;
    setIsLoading(true);
    
    const filteredLinks = qLinks.map(l => l.trim()).filter(Boolean);
    const payload = {
      name: qName.trim(),
      diff: qDiff,
      topic: qTopic,
      source: qSource,
      links: filteredLinks,
      notes: qNotes.trim(),
      date: getLocalISODate(),
      user: { id: user.id }
    };

    try {
      const response = await dsaFetch("/questions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedQuestion = await response.json();
        setQuestions([savedQuestion, ...questions]);
        fetchDashboardData();
        setQName(""); setQLinks([""]); setQNotes("");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteId) return;
    setIsLoading(true);

    try {
      const response = await dsaFetch(`/questions/${deleteId}`, { method: "DELETE" });
      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== deleteId));
        setDeleteId(null);
        fetchDashboardData();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!mounted) return null;

  return (
    <div id="dashboardPage" className="w-full max-w-[1020px] mx-auto px-6 py-12 pb-24">
      {/* HEADER */}
      <div className="header">
        <div>
          <div className="logo">DSA<span>.</span>LOG</div>
          <div className="tagline">elo engine · time decay · grind or bleed</div>
        </div>
        <div className="header-right">
          <button className="theme-toggle" onClick={handleToggleTheme}>○ Theme</button>
          <div className="relative">
            <button className="acct-btn signed-in" onClick={() => setIsAcctMenuOpen(!isAcctMenuOpen)}>⊙ {user.name}</button>
            {isAcctMenuOpen && (
              <div className="acct-dropdown open">
                <div className="acct-user">{user.email}</div>
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
            <div className="elo-tip">?
              <div className="elo-tooltip">
                <strong>ELO System</strong>
                <div className="trow"><span>Starting rating</span><span>1200</span></div>
                <div className="trow"><span>Easy solve</span><span>+5</span></div>
                <div className="trow"><span>Medium solve</span><span>+15</span></div>
                <div className="trow"><span>Hard solve</span><span>+25</span></div>
                <div className="trow"><span>Missed day</span><span style={{ color: 'var(--accent)' }}>-2</span></div>
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
          <p>Streak broken — <strong>{stats.gapDays} days</strong> since last solve. Bleeding <strong>-{stats.pendingDecay} ELO</strong>.</p>
        </div>
      )}

      {/* ACTIVITY */}
      <div className="activity-block">
        <div className="activity-header">
          <div className="section-title !border-none !p-0 !m-0">Activity — last 120 days</div>
          <motion.div 
            className="streak-inline cursor-help"
            animate={stats.decayActive ? { x: [0, -1, 1, -1, 1, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <div className="streak-nums-row">
              <span className="streak-inline-num">{stats.streak}</span>
              <span className="streak-inline-label">day streak</span>
            </div>
            <div className="ecg-wrap"><BioMonitor status={monitorStatus} /></div>
          </motion.div>
        </div>
        <div className="h-[1px] bg-[var(--border)] mb-2.5"></div>
        <div className="cal-grid">
          {Array.from({length: 120}, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (119 - i));
            const key = d.toISOString().slice(0,10);
            const count = questions.filter(q => q.date === key).length;
            const firstD = [...questions].sort((a,b)=>a.date.localeCompare(b.date))[0]?.date;
            const isDecay = firstD && d > new Date(firstD) && count === 0 && d < new Date();
            let lvl = count === 1 ? 'l1' : count <= 3 ? 'l2' : count <= 5 ? 'l3' : count >= 6 ? 'l4' : '';
            return <div key={i} className={`cal-day ${count > 0 ? lvl : isDecay ? 'decay' : ''} ${i === 119 ? 'today' : ''}`} />;
          })}
        </div>
      </div>

      {/* ADD FORM */}
      <div className="add-section">
        <div className="add-section-header" onClick={()=>setFormOpen(!formOpen)}>
          <span>+ Log a Question</span><span className="toggle">{formOpen ? '▾' : '▸'}</span>
        </div>
        {formOpen && (
          <div className="add-form-inner">
            <div className="add-row">
              <input type="text" placeholder="Question title..." value={qName} onChange={e=>setQName(e.target.value)} />
              <select value={qDiff} onChange={e=>setQDiff(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
              <select value={qTopic} onChange={e=>setQTopic(e.target.value)}>{customTopics.map(t=><option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div className="add-row2">
              <div className="link-list">
                {qLinks.map((link, idx) => (
                  <div key={idx} className="link-row">
                    <input type="text" value={link} onChange={e => {const nl=[...qLinks]; nl[idx]=e.target.value; setQLinks(nl);}} placeholder="Link..." />
                    {idx === 0 ? <button onClick={()=>setQLinks([...qLinks, ""])}>+</button> : <button onClick={()=>setQLinks(qLinks.filter((_,i)=>i!==idx))}>×</button>}
                  </div>
                ))}
              </div>
              <textarea placeholder="Notes..." value={qNotes} onChange={e=>setQNotes(e.target.value)} />
            </div>
            <div className="add-bottom">
              <button className="add-btn" onClick={handleAddQuestion}>LOG IT</button>
            </div>
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="q-list">
        {questions.slice().reverse().map(q => (
          <div key={q.id} className={`q-item diff-${q.diff}`}>
            <div className="q-main" onClick={()=>setExpandedId(expandedId===q.id?null:q.id)}>
              <div className="q-name">{q.name}</div>
              <div className="q-elo-gain">+{ELO_GAIN[q.diff]}</div>
              <div className="q-source">{q.source}</div>
              <button className="del-btn" onClick={(e)=>{e.stopPropagation(); setDeleteId(q.id);}}>×</button>
            </div>
          </div>
        ))}
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Delete?</div>
            <button className="modal-confirm" onClick={handleDeleteQuestion}>Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
}