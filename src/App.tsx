import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Hash, Power, History, Info, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DFAState, DFAInput, BankSession } from './types';
import { DFAVisualizer } from './components/DFAVisualizer';

export default function App() {
  const [session, setSession] = useState<BankSession | null>(null);
  const [visualState, setVisualState] = useState<DFAState>(DFAState.Q0);
  const [pinInput, setPinInput] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      setSession(data);
      setVisualState(data.currentState);
    } catch (e) {
      console.error("Failed to fetch session", e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleTransition = async (input: DFAInput, data?: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, data }),
      });
      const updated = await res.json();
      const prevState = session?.currentState;
      setSession(updated);

      // Smooth sequence animation for auth: Verifying -> Q3 (Authenticating) -> Q4 (Menu)
      if (input === DFAInput.ENTER_PIN && data?.pin?.length === 4 && updated.currentState === DFAState.Q4) {
          setPinInput('');
          setVisualState(DFAState.Q3);
          setTimeout(() => {
              setVisualState(DFAState.Q4);
          }, 1500);
      } else {
          setVisualState(updated.currentState);
      }

      // Reset local inputs
      if (input === DFAInput.ENTER_PIN) setPinInput('');
      if (input === DFAInput.WITHDRAW) setWithdrawAmount('');
    } catch (e) {
      console.error("Transition failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const res = await fetch('/api/reset', { method: 'POST' });
    const data = await res.json();
    setSession(data);
    setVisualState(data.currentState);
    setPinInput('');
  };

  const current = session?.currentState || DFAState.Q0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            ATM_DFA::SIMULATOR v1.0
          </h1>
          <p className="text-slate-500 text-sm font-medium">Theory of Computation CCA 2</p>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-bold active:scale-95"
        >
          <Power size={16} />
          RESET ENGINE
        </button>
      </header>

      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: DFA Graph & Interaction Log */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <DFAVisualizer currentState={visualState} />
          </section>

          {/* History / Interaction Log */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <History size={20} className="text-indigo-500" />
              Transition History
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {session?.history.length === 0 && (
                <p className="text-slate-400 italic text-center py-8">Waiting for card insertion...</p>
              )}
              {session?.history.slice().reverse().map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono"
                >
                  <span className="text-slate-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">δ({log.from}, '{log.input}') → {log.to}</span>
                  <span className="text-slate-600 flex-grow">{log.msg}</span>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: ATM Interface */}
        <div className="lg:col-span-4 sticky top-8">
          <div className="bg-slate-800 p-6 rounded-[2.5rem] shadow-2xl border-b-8 border-slate-900 ring-4 ring-slate-700">
            
            {/* ATM Screen */}
            <div className="bg-blue-900 aspect-[4/3] rounded-xl overflow-hidden shadow-inner border-2 border-slate-600 mb-6 flex flex-col relative">
              <div className="p-4 flex-grow flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={visualState}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full"
                  >
                    {/* Screen Content based on state */}
                    {visualState === DFAState.Q0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center animate-pulse">
                          <CreditCard className="text-blue-300" size={32} />
                        </div>
                        <h2 className="text-blue-100 font-bold text-lg">WELCOME TO<br/>BMSIT Bank</h2>
                        <p className="text-blue-400 text-xs">PLEASE INSERT YOUR CARD</p>
                      </div>
                    )}

                    {visualState === DFAState.Q1 && (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-800 flex items-center justify-center">
                          <Hash className="text-blue-300" size={24} />
                        </div>
                        <h2 className="text-blue-100 font-bold text-sm">CARD INSERTED</h2>
                        <button 
                          onClick={() => handleTransition(DFAInput.ENTER_PIN)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg border-b-4 border-blue-800"
                        >
                          ENTER PIN
                        </button>
                        <p className="text-blue-400 text-[10px]">SECURE LOGIN REQUIRED</p>
                      </div>
                    )}

                    {visualState === DFAState.Q2 && (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                        {loading ? (
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-10 h-10 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
                              <p className="text-blue-300 text-[10px] uppercase font-bold tracking-widest">Verifying...</p>
                           </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-blue-800 flex items-center justify-center">
                              <Hash className="text-blue-300" size={24} />
                            </div>
                            <h2 className="text-blue-100 font-bold text-sm">ENTER PIN</h2>
                            <div className="flex gap-2 justify-center mb-1">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${pinInput.length > i ? 'bg-blue-300' : 'border border-blue-500'}`} />
                              ))}
                            </div>
                            {session?.lastMessage.includes('Invalid') && (
                               <div className="px-2 py-1 bg-red-900/50 text-red-200 text-[10px] rounded border border-red-700/50 flex items-center gap-1">
                                  <AlertCircle size={10} /> {session.lastMessage}
                               </div>
                            )}
                            <p className="text-blue-400 text-[9px] uppercase tracking-tighter">AUTH ATTEMPT: {session?.pinAttempts + 1}/3</p>
                          </>
                        )}
                      </div>
                    )}

                    {visualState === DFAState.Q3 && (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                        <div className="relative">
                           <div className="w-12 h-12 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
                           <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400/50" size={16} />
                        </div>
                        <h2 className="text-blue-100 font-bold text-lg">AUTHENTICATING</h2>
                        <p className="text-blue-400 text-[10px] uppercase tracking-widest animate-pulse">Establishing Secure Session</p>
                      </div>
                    )}

                    {visualState === DFAState.Q4 && (
                      <div className="flex flex-col h-full gap-4">
                        <h2 className="text-blue-100 font-bold text-sm text-center">SELECT TRANSACTION</h2>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                           <button 
                            onClick={() => handleTransition(DFAInput.WITHDRAW)}
                            className="bg-blue-800 hover:bg-blue-700 text-blue-100 p-3 rounded-lg text-xs font-bold text-left border-l-4 border-blue-500 flex justify-between items-center"
                           >
                             CASH WITHDRAWAL <ChevronRight size={14} />
                           </button>
                           <button 
                            disabled
                            className="bg-slate-700 text-slate-400 p-3 rounded-lg text-xs font-bold text-left border-l-4 border-slate-600 opacity-50 flex justify-between items-center"
                           >
                             BALANCE INQUIRY <ChevronRight size={14} />
                           </button>
                           <button 
                            disabled
                            className="bg-slate-700 text-slate-400 p-3 rounded-lg text-xs font-bold text-left border-l-4 border-slate-600 opacity-50 flex justify-between items-center"
                           >
                             MINI STATEMENT <ChevronRight size={14} />
                           </button>
                        </div>
                      </div>
                    )}

                    {visualState === DFAState.Q5 && (
                       <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                        <div className="flex flex-col gap-4 w-full">
                           <h2 className="text-blue-100 font-bold text-sm">WITHDRAW AMOUNT</h2>
                           <div className="flex items-center gap-2 bg-blue-800 p-3 rounded-lg">
                              <span className="text-blue-300 font-bold">₹</span>
                              <input 
                                type="number" 
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="bg-transparent text-white outline-none w-full font-mono text-sm"
                                autoFocus
                              />
                           </div>
                           <button 
                             onClick={() => handleTransition(DFAInput.WITHDRAW, { amount: Number(withdrawAmount) })}
                             disabled={!withdrawAmount || loading}
                             className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-lg border-b-4 border-green-700"
                           >
                             CONFIRM
                           </button>
                        </div>
                      </div>
                    )}

                    {visualState === DFAState.Q6 && (
                       <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="text-green-400" size={24} />
                        </div>
                        <div>
                          <h2 className="text-blue-100 font-bold text-sm">TRANSACTION SUCCESS</h2>
                          <p className="text-blue-400 text-[10px]">Remaining: ₹{session?.balance.toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => handleTransition(DFAInput.EXIT)}
                          className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded border-b-2 border-slate-900"
                        >
                          FINISHED
                        </button>
                      </div>
                    )}

                    {visualState === DFAState.Q7 && (
                       <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <AlertCircle className="text-red-400" size={24} />
                        </div>
                        <div>
                          <h2 className="text-blue-100 font-bold text-sm">TRANSACTION FAILED</h2>
                          <p className="text-red-400 text-[10px] uppercase font-bold">Insufficient Balance</p>
                          <p className="text-blue-400 text-[9px]">Available: ₹{session?.balance.toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => handleTransition(DFAInput.SELECT_TX)}
                          className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded shadow-lg border-b-2 border-blue-900"
                        >
                          BACK TO MENU
                        </button>
                      </div>
                    )}

                    {visualState === DFAState.Q8 && (
                       <div className="flex flex-col items-center justify-center h-full text-center gap-4 bg-red-900/40 -m-4 p-4">
                        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center animate-bounce">
                          <Power className="text-white" size={32} />
                        </div>
                        <h2 className="text-white font-bold text-lg">CARD BLOCKED</h2>
                        <p className="text-red-200 text-xs">TOO MANY ATTEMPTS.<br/>PLEASE CONTACT BANK.</p>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Screen Bar */}
              <div className="h-10 bg-slate-700/50 border-t border-slate-600 flex items-center justify-between px-4">
                 <div className="text-[8px] text-blue-300 font-mono">STATUS: {current.toUpperCase()}</div>
                 <button 
                  onClick={() => handleTransition(DFAInput.EXIT)}
                  className="px-2 py-1 bg-red-900 text-red-200 text-[8px] font-bold rounded uppercase hover:bg-red-800 transition-colors"
                 >
                   TERMINATE [X]
                 </button>
              </div>
            </div>

            {/* Hardware Controls */}
            <div className="grid grid-cols-3 gap-3">
              {/* Keypad */}
              <div className="col-span-2 grid grid-cols-3 gap-2 bg-slate-700 p-4 rounded-3xl shadow-inner border-t-4 border-slate-900">
                {[1,2,3,4,5,6,7,8,9, '*', 0, '#'].map((n) => (
                  <button 
                    key={n}
                    disabled={current !== DFAState.Q2 && current !== DFAState.Q5}
                    onClick={() => {
                        if (current === DFAState.Q2) {
                            setPinInput(p => (p.length < 4 ? p + n : p));
                        } else if (current === DFAState.Q5 && typeof n === 'number') {
                            setWithdrawAmount(w => w + n.toString());
                        }
                    }}
                    className="aspect-square bg-slate-600 hover:bg-slate-500 rounded-lg shadow-md border-b-4 border-slate-800 flex items-center justify-center text-slate-100 font-bold active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Functional Buttons */}
              <div className="flex flex-col gap-2">
                 <button 
                  onClick={() => {
                    if (current === DFAState.Q5) handleTransition(DFAInput.WITHDRAW, { amount: Number(withdrawAmount) });
                    else handleTransition(DFAInput.ENTER_PIN, { pin: pinInput });
                  }}
                  disabled={
                    loading || 
                    (current === DFAState.Q5 ? !withdrawAmount : pinInput.length < 4) ||
                    (current !== DFAState.Q2 && current !== DFAState.Q5)
                  }
                  className="flex-grow bg-green-600 hover:bg-green-500 disabled:opacity-30 rounded-xl border-b-4 border-green-800 text-white font-bold text-[10px] uppercase shadow-lg shadow-green-900/20 flex flex-col items-center justify-center p-2"
                 >
                   ENTER
                 </button>
                 <button 
                  onClick={() => {
                    if (current === DFAState.Q5) setWithdrawAmount('');
                    else setPinInput('');
                  }}
                  disabled={current !== DFAState.Q2 && current !== DFAState.Q5}
                  className="flex-grow bg-yellow-500 hover:bg-yellow-400 disabled:opacity-30 rounded-xl border-b-4 border-yellow-700 text-yellow-900 font-bold text-[10px] uppercase flex flex-col items-center justify-center p-2"
                 >
                   CLEAR
                 </button>
                 <button 
                  onClick={() => handleTransition(DFAInput.EXIT)}
                  className="flex-grow bg-red-600 hover:bg-red-500 rounded-xl border-b-4 border-red-800 text-white font-bold text-[10px] uppercase flex flex-col items-center justify-center p-2"
                 >
                   CANCEL
                 </button>
              </div>
            </div>

            {/* Card Slot */}
            <div className="mt-8 relative h-12 bg-slate-900 rounded-full border-t-2 border-slate-700 overflow-hidden shadow-inner group">
                <button 
                  disabled={current !== DFAState.Q0 || loading}
                  onClick={() => handleTransition(DFAInput.INSERT_CARD)}
                  className={`absolute inset-0 flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest transition-all ${current === DFAState.Q0 ? 'text-blue-400 animate-pulse' : 'text-slate-700'}`}
                >
                   {current === DFAState.Q0 ? '→ INSERT CARD HERE ←' : 'CARD PRESENT'}
                </button>
                <div className={`absolute top-0 bottom-0 left-0 bg-blue-500/10 transition-all ${current !== DFAState.Q0 ? 'w-full' : 'w-0'}`} />
            </div>
            
          </div>

          <div className="mt-4 text-[10px] font-mono text-slate-400 text-center uppercase tracking-widest bg-slate-50 p-2 rounded-lg border border-slate-200">
             Device ID: ATML-8821-X99 // Encrypted Session Active
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-6xl mx-auto w-full mt-auto py-8 border-t border-slate-200 text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest">
            <span>States: 9</span>
            <span>Alpha: {JSON.stringify(['c','p','v','i','t','w','s','n','x'])}</span>
            <span>Accept: {`{q6}`}</span>
         </div>
         <div className="text-[10px] font-bold text-slate-500">
            © 2026 UNIVERSITY TOC PROJECT // SIMULATED ENVIRONMENT
         </div>
      </footer>
    </div>
  );
}
