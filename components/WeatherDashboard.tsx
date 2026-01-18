
import React, { useState, useEffect, useMemo } from 'react';
import { fetchWeatherPrep } from '../services/geminiService';
import { WeatherInfo } from '../types';

interface WeatherDashboardProps {
  isCompact?: boolean;
}

const WeatherDashboard: React.FC<WeatherDashboardProps> = ({ isCompact = false }) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadWeather = async (location: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherPrep(location);
      setWeather(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to sync atmospheric data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeather(`${pos.coords.latitude}, ${pos.coords.longitude}`),
        () => loadWeather("London")
      );
    } else {
      loadWeather("London");
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) loadWeather(query);
  };

  const getWeatherIcon = (condition: string = "") => {
    const cond = condition.toLowerCase();
    if (cond.includes('sun') || cond.includes('clear')) return '☀️';
    if (cond.includes('hot') || cond.includes('warm')) return '🌡️☀️';
    if (cond.includes('rain') || cond.includes('shower')) return '🌧️⛈️';
    if (cond.includes('cloud') && (cond.includes('sun') || cond.includes('clear'))) return '🌤️';
    if (cond.includes('cloud') && cond.includes('overcast')) return '☁️☁️';
    if (cond.includes('cloud')) return '⛅';
    if (cond.includes('storm') || cond.includes('thunder')) return '⛈️⚡';
    if (cond.includes('snow') || cond.includes('ice')) return '❄️🌨️';
    if (cond.includes('fog') || cond.includes('mist')) return '🌫️';
    return '⛅';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (isCompact) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center py-2 border-b border-white/5">
          <div className="text-2xl font-black text-white tracking-tighter">{formatTime(time)}</div>
          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{formatDate(time)}</div>
        </div>
        {weather ? (
          <div className="flex items-center gap-6">
            <div className="text-5xl shrink-0 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
               {getWeatherIcon(weather.condition)}
            </div>
            <div className="flex-1 space-y-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">Nenua Roast</span>
                <span className="text-lg font-black text-white">{weather.temperature}</span>
              </div>
              <p className="text-sm text-slate-300 italic font-bold leading-tight neon-glow-text line-clamp-2">
                "{weather.advisory}"
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 py-4 opacity-20">
             <div className="w-12 h-12 bg-slate-800 rounded-2xl animate-pulse"></div>
             <div className="flex-1 space-y-2">
               <div className="h-3 w-20 bg-slate-800 rounded animate-pulse"></div>
               <div className="h-2 w-full bg-slate-800 rounded animate-pulse"></div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex flex-col items-center py-4 lg:py-6 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-5xl glass-card-neon rounded-[3rem] p-8 lg:p-12 relative z-10 animate-in zoom-in-95 duration-700 space-y-12">
        
        {/* BIG TIME DASHBOARD */}
        <div className="text-center relative py-12 border-b border-emerald-500/10">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] opacity-30">Universal Time Sync</div>
           <h2 className="text-8xl md:text-[10rem] font-black text-white leading-none tracking-tighter neon-glow-text animate-pulse duration-[3000ms]">
             {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
             <span className="text-4xl md:text-6xl text-emerald-500/50 opacity-80 ml-2">{time.toLocaleTimeString('en-US', { hour12: false, second: '2-digit' })}</span>
           </h2>
           <div className="text-xl md:text-2xl font-bold text-slate-400 mt-4 tracking-widest uppercase">{formatDate(time)}</div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-6 py-4 transition-all focus-within:border-emerald-500/40 shadow-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter city name for atmospheric sync..."
              className="flex-1 bg-transparent text-lg text-white outline-none placeholder-slate-600 font-medium"
            />
            <button type="submit" disabled={loading} className="text-emerald-500 hover:text-emerald-400 p-2 disabled:opacity-50 transition-transform active:scale-90">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </form>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-8">
            <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] uppercase tracking-[0.5em] font-black text-emerald-500 animate-pulse">Syncing Atmos Intel</p>
          </div>
        ) : error ? (
          <div className="py-24 text-center">
            <p className="text-red-400 font-bold mb-4">{error}</p>
            <button onClick={() => loadWeather("London")} className="action-button mx-auto">Retry Baseline</button>
          </div>
        ) : weather ? (
          <div className="space-y-12">
            {/* Current Weather Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
              <div className="text-[10rem] filter drop-shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-700 cursor-default">
                {getWeatherIcon(weather.condition)}
              </div>
              <div className="flex-1 text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end gap-3 mb-2">
                   <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest">Thermal Index 🌡️</span>
                </div>
                <h3 className="text-9xl md:text-[12rem] font-black text-white leading-none tracking-tighter neon-glow-text">{weather.temperature}</h3>
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-6 mt-4">
                  <span className="text-2xl md:text-4xl font-black text-slate-300 uppercase tracking-widest">{weather.condition}</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full opacity-30"></div>
                  <span className="text-xl md:text-3xl font-bold text-slate-500 uppercase tracking-tighter">{weather.location} 📍</span>
                </div>
              </div>
            </div>

            {/* Roast Section */}
            <div className="relative bg-emerald-500/10 rounded-[2.5rem] p-10 md:p-14 border border-emerald-500/30 text-center md:text-left overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="absolute -right-10 -top-10 text-9xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12">🔥</div>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <span className="text-2xl animate-bounce">🔥</span>
                <h4 className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.3em]">Nenua Advisory Roast</h4>
              </div>
              <p className="text-3xl md:text-5xl text-white font-black italic leading-[1.15] neon-glow-text relative z-10">
                "{weather.advisory}"
              </p>
            </div>

            {/* 3-Day Forecast Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {weather.forecast?.map((day, i) => (
                <div key={i} className="glass-card-neon !rounded-[2.5rem] p-8 border-white/5 bg-white/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="relative z-10 flex items-center justify-between mb-6">
                     <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest">{day.day}</span>
                     <span className="text-4xl filter group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all">
                       {getWeatherIcon(day.condition)}
                     </span>
                   </div>
                   <div className="relative z-10 text-4xl font-black text-white mb-2">{day.temp}</div>
                   <div className="relative z-10 text-[12px] font-bold text-slate-400 uppercase tracking-tighter">{day.condition} ☁️</div>
                </div>
              ))}
            </div>

            {/* Grounding Sources */}
            {weather.sources && weather.sources.length > 0 && (
              <div className="pt-8 border-t border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Data Sources 🛰️</p>
                <div className="flex flex-wrap gap-3">
                  {weather.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 rounded-xl text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-all flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WeatherDashboard;
