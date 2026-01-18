
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { analyzeSmartCameraFrame } from '../services/geminiService';
import { AnalysisResult, DiagramPart } from '../types';

interface SmartCameraProps {
  isCompact?: boolean;
  onAnalysisDone?: (result: AnalysisResult) => void;
}

export interface SmartCameraHandle {
  capture: () => Promise<void>;
}

const SmartCamera = forwardRef<SmartCameraHandle, SmartCameraProps>(({ isCompact = false, onAnalysisDone }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPart, setSelectedPart] = useState<DiagramPart | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
      } catch (err) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
      }
      setStream(mediaStream);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Camera permission denied. Check browser settings.");
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error);
      };
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      setError("Camera not ready.");
      return;
    }
    
    if (videoRef.current.readyState < 2) {
      setError("Waiting for video stream...");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, width, height);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    setLoading(true);
    setError(null);
    setSelectedPart(null);
    try {
      const result = await analyzeSmartCameraFrame(base64);
      setAnalysis(result);
      if (onAnalysisDone) onAnalysisDone(result);
    } catch (err: any) {
      setError("Lens analysis failed. Try closer focus.");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    capture
  }));

  const renderOverlay = () => {
    if (!analysis || !analysis.parts) return null;

    return (
      <svg 
        className="absolute inset-0 z-30 pointer-events-none" 
        viewBox="0 0 1000 1000" 
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {analysis.parts.map((part) => {
          const pathD = part.points.length > 0 
            ? `M ${part.points.map(p => `${p[0]} ${p[1]}`).join(' L ')} ${part.type === 'highlight' ? 'Z' : ''}`
            : '';

          const isFlow = part.type === 'flow_red' || part.type === 'flow_blue';
          const color = part.type === 'flow_red' ? '#ef4444' : part.type === 'flow_blue' ? '#3b82f6' : (part.color || '#10b981');

          return (
            <g key={part.id} className="pointer-events-auto cursor-pointer" onClick={() => setSelectedPart(part)}>
              {isFlow ? (
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#neonGlow)"
                  className="animate-pulse"
                >
                  <animate 
                    attributeName="stroke-dasharray" 
                    from="0, 1000" 
                    to="1000, 0" 
                    dur="3s" 
                    repeatCount="indefinite" 
                  />
                </path>
              ) : (
                <path
                  d={pathD}
                  fill={part.type === 'highlight' ? `${color}33` : 'none'}
                  stroke={color}
                  strokeWidth="4"
                  filter="url(#neonGlow)"
                  className="hover:stroke-white transition-colors"
                />
              )}
              {/* Interaction points for labels */}
              {part.points[0] && (
                <circle 
                  cx={part.points[0][0]} 
                  cy={part.points[0][1]} 
                  r="15" 
                  fill={color} 
                  className="animate-ping opacity-40" 
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  if (isCompact) {
    return (
      <div className="circular-preview relative group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover grayscale opacity-60 ${!stream ? 'hidden' : 'block'}`} 
        />
        {!stream && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 p-2 text-center">
             <button onClick={startCamera} className="text-[10px] font-black text-emerald-500 uppercase mb-2">Enable Lens</button>
             <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 select-none">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xs font-bold text-white tracking-wide uppercase opacity-80">Nenua AR Lens</h2>
          {analysis && <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Active Overlay: {analysis.diagramType}</span>}
        </div>
        <button 
          onClick={() => { setAnalysis(null); setError(null); setSelectedPart(null); }}
          className="text-[10px] font-bold text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
        >
          Reset View
        </button>
      </div>
      
      <div className="flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col items-center gap-6">
          <div ref={containerRef} className="relative w-full aspect-video max-w-[800px] overflow-hidden rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] border-4 border-white/5 bg-black">
            <div className="absolute inset-0 z-20 border border-emerald-500/20 pointer-events-none"></div>
            
            {/* HUD Elements */}
            <div className="absolute top-6 left-6 z-40 space-y-2 pointer-events-none">
               <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${stream ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="text-[10px] font-black text-white/50 tracking-[0.2em]">{stream ? 'SIGNAL STRENGTH: 98%' : 'OFFLINE'}</span>
               </div>
               <div className="text-[8px] font-mono text-emerald-500/40 uppercase">LAT: 40.7128 N | LON: 74.0060 W</div>
            </div>

            <div className="absolute top-6 right-6 z-40 text-right pointer-events-none">
               <div className="text-[10px] font-black text-white/30 tracking-widest">FRAME_BUFFER_01</div>
               <div className="text-[8px] font-mono text-emerald-500/30">FPS: 60 | BW: 250MBPS</div>
            </div>

            {loading && <div className="scan-line z-50"></div>}
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transition-opacity duration-1000 ${!stream ? 'opacity-0' : 'opacity-80 grayscale-[0.3]'}`} 
            />

            {renderOverlay()}

            {selectedPart && (
              <div 
                className="absolute z-50 glass-card-neon p-6 max-w-[280px] animate-in slide-in-from-bottom-5 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                style={{
                   left: `${Math.min(Math.max(selectedPart.points[0][0]/10, 10), 70)}%`,
                   top: `${Math.min(Math.max(selectedPart.points[0][1]/10, 10), 60)}%`,
                }}
              >
                 <div className="flex justify-between items-start mb-3">
                   <h4 className="text-sm font-black text-white uppercase tracking-tighter">{selectedPart.name}</h4>
                   <button onClick={() => setSelectedPart(null)} className="text-slate-500 hover:text-white">✕</button>
                 </div>
                 <p className="text-xs text-slate-300 leading-relaxed italic">"{selectedPart.description}"</p>
                 <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">NEURAL_TAG: {selectedPart.id}</span>
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                 </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900/95 z-[60]">
                <p className="text-xs font-bold text-red-400 mb-4">{error}</p>
                <button onClick={startCamera} className="action-button">Reset Sensor</button>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm z-[70]">
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
                   <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-6 animate-pulse">Scanning Diagram</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={capture}
              disabled={loading || !stream}
              className="action-button !text-sm !py-4 !px-16 active:scale-95 disabled:opacity-50 !bg-emerald-500 !text-slate-950 !font-black !border-none shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              Analyze Diagram
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {analysis && !loading && (
          <div className="bg-white/5 border border-emerald-500/20 rounded-3xl p-8 space-y-6 animate-in slide-in-from-bottom-10">
             <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-2xl">
                     {analysis.diagramType === 'heart' ? '❤️' : analysis.diagramType === 'cell' ? '🧫' : '🧪'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{analysis.title}</h3>
                    <p className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">Classification: {analysis.diagramType}</p>
                  </div>
                </div>
             </div>
             
             <p className="text-slate-300 text-base leading-relaxed font-light">{analysis.explanation}</p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {analysis.keyPoints.map((pt, i) => (
                  <div key={i} className="bg-emerald-950/30 border border-emerald-500/10 p-5 rounded-2xl flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                    <span className="font-black text-emerald-500 text-sm opacity-50">0{i+1}</span>
                    <p className="text-sm text-slate-300 leading-tight">{pt}</p>
                  </div>
                ))}
             </div>
             
             <div className="p-6 bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/20">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">AR Instructions</p>
                <p className="text-xs text-slate-500 font-medium">Tap any glowing highlight on the video feed to access detailed morphological data.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SmartCamera;
