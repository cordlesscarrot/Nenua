
import React, { useState, useRef, useEffect } from 'react';
import WeatherDashboard from './components/WeatherDashboard';
import SmartCamera, { SmartCameraHandle } from './components/SmartCamera';
import NotesCreator from './components/NotesCreator';
import HealthHub from './components/HealthHub';
import StudentChat from './components/StudentChat';
import { CornellNote, FocusedView } from './types';

export default function App() {
  const [generatedNotes, setGeneratedNotes] = useState<CornellNote | null>(() => {
    const saved = localStorage.getItem('nenua_notes');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [currentView, setCurrentView] = useState<FocusedView>('DASHBOARD');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const cameraRef = useRef<SmartCameraHandle>(null);

  useEffect(() => {
    if (!process.env.API_KEY || process.env.API_KEY === 'undefined') {
      setApiKeyMissing(true);
    }
  }, []);

  useEffect(() => {
    if (generatedNotes) {
      localStorage.setItem('nenua_notes', JSON.stringify(generatedNotes));
    } else {
      localStorage.removeItem('nenua_notes');
    }
  }, [generatedNotes]);

  const navigateTo = (view: FocusedView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen flex flex-col p-4 md:p-8 xl:p-12 gap-8 max-w-[1920px] mx-auto overflow-x-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-center w-full px-2 md:px-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('DASHBOARD')}>
           <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-110">
             <span className="font-black text-slate-900 text-2xl">N</span>
           </div>
           <div>
             <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-100 uppercase neon-glow-text leading-none">Nenua AI</h1>
             <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-[0.2em] mt-1 hidden sm:block">Neural Student OS</p>
           </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto justify-center sm:justify-end">
          {apiKeyMissing && (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-400 uppercase flex animate-pulse">
               API Key Missing
            </div>
          )}
          <button 
            onClick={() => navigateTo('STUDENT_CHAT')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border ${
              currentView === 'STUDENT_CHAT' ? 'bg-emerald-500 text-slate-900 border-emerald-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
             Smart Chat
          </button>
          <button 
            onClick={() => navigateTo('HEALTH')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border ${
              currentView === 'HEALTH' ? 'bg-teal-500 text-slate-900 border-teal-500' : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
            }`}
          >
             Wellness
          </button>
        </div>
      </header>

      <main className="flex-1 w-full">
        {currentView === 'DASHBOARD' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-8 pb-10">
            <div className="md:col-span-1 xl:col-span-4 flex flex-col gap-8 order-2 md:order-1">
              <div onClick={() => navigateTo('STUDENT_CHAT')} className="glass-card-neon p-6 md:p-8 cursor-pointer hover:scale-[1.01] transition-transform min-h-[300px]">
                <div className="glow-edge"></div>
                <StudentChat isCompact={true} />
              </div>

              <div onClick={() => navigateTo('WEATHER')} className="glass-card-neon p-6 md:p-8 cursor-pointer hover:scale-[1.01] transition-transform">
                <div className="glow-edge"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Atmospheric Intel</h3>
                <WeatherDashboard isCompact={true} />
              </div>

              <div onClick={() => navigateTo('HEALTH')} className="glass-card-health p-6 md:p-8 cursor-pointer hover:scale-[1.01] transition-transform">
                <div className="glow-edge glow-edge-teal"></div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Wellness Sync</h3>
                <HealthHub isCompact={true} />
              </div>
            </div>

            <div className="md:col-span-1 xl:col-span-8 flex flex-col gap-8 order-1 md:order-2">
              <div onClick={() => navigateTo('STUDY_LAB')} className="glass-card-neon p-8 md:p-12 cursor-pointer hover:shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-all min-h-[450px]">
                <div className="glow-edge"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Synthesis Lab</h3>
                <NotesCreator notes={generatedNotes} onNotesGenerated={setGeneratedNotes} isCompact={true} />
              </div>

              <div onClick={() => navigateTo('VISION')} className="glass-card-neon p-6 md:p-8 flex flex-col sm:flex-row gap-8 cursor-pointer hover:scale-[1.01] transition-transform">
                <div className="glow-edge"></div>
                <div className="flex-1 flex flex-col justify-center">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vision Portal</h3>
                   <p className="text-sm text-slate-400 font-medium leading-relaxed">Decode whiteboards or complex diagrams with neural analysis.</p>
                </div>
                <div className="w-full sm:w-48 bg-slate-900/40 rounded-3xl p-4 border border-white/5">
                   <SmartCamera isCompact={true} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full animate-in zoom-in-95 duration-500 pb-20">
             <div className={`w-full min-h-[70vh] p-6 md:p-12 flex flex-col rounded-[2.5rem] relative ${currentView === 'HEALTH' ? 'glass-card-health' : 'glass-card-neon'}`}>
                <div className={`glow-edge ${currentView === 'HEALTH' ? 'glow-edge-teal' : ''}`}></div>
                <div className="flex justify-between items-center mb-10">
                  <h2 className={`text-sm md:text-base font-black uppercase tracking-[0.3em] ${currentView === 'HEALTH' ? 'text-teal-400' : 'text-emerald-500'}`}>
                    {currentView.replace('_', ' ')} Portal
                  </h2>
                  <button onClick={() => navigateTo('DASHBOARD')} className="action-button !py-2 !px-6 text-[10px]">Close Portal</button>
                </div>
                <div className="w-full">
                  {currentView === 'WEATHER' && <WeatherDashboard />}
                  {currentView === 'VISION' && <SmartCamera ref={cameraRef} />}
                  {currentView === 'STUDY_LAB' && <NotesCreator notes={generatedNotes} onNotesGenerated={setGeneratedNotes} />}
                  {currentView === 'HEALTH' && <HealthHub />}
                  {currentView === 'STUDENT_CHAT' && <StudentChat />}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
