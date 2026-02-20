import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Versions from './components/Versions';
import ColomboEngine from './components/ColomboEngine';
import Owners from './components/Owners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import VersionDetail from './components/VersionDetail';
import { VERSIONS, GALLERY_PROMPTS, OWNERS, HERO_PROMPT, HISTORY_PROMPT, ENGINE_PROMPT } from './constants';
import { ShieldCheck, Database, RefreshCw, AlertTriangle, Info, Terminal, Link, Globe } from 'lucide-react';

const DB_NAME = 'FERRARI_400_PERMANENT_VAULT';
const STORE_NAME = 'archival_assets';
const ADMIN_KEY = 'f400_admin_active_session';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

const getLocalAsset = async (key: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
};

const saveLocalAsset = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
    });
  } catch (e) { console.error("Archive Error:", e); }
};

const App: React.FC = () => {
  const [heroImage, setHeroImage] = useState<string>('');
  const [historyImage, setHistoryImage] = useState<string>('');
  const [engineImage, setEngineImage] = useState<string>('');
  const [versionImages, setVersionImages] = useState<Record<string, string>>({});
  const [ownerImages, setOwnerImages] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | string>('home');
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline' | 'no_creds' | 'permission_denied'>('checking');
  const [syncing, setSyncing] = useState(false);

  const supabase = useMemo(() => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    
    if (!url || url === 'undefined' || !key || key === 'undefined') {
      return null;
    }
    
    try {
      // Validate URL format to prevent runtime fetch errors
      new URL(url);
      return createClient(url, key);
    } catch (e) {
      console.error("Invalid Supabase URL:", url);
      return null;
    }
  }, []);

  const persistAsset = useCallback(async (key: string, data: any) => {
    await saveLocalAsset(key, data);
    if (supabase) {
      try {
        await supabase.from('assets').upsert({ id: key, data: data });
      } catch (e) {
        // Silent catch for background sync
      }
    }
  }, [supabase]);

  const handleHeroUpdate = useCallback(async (base64: string) => {
    setHeroImage(base64);
    await persistAsset('heroImage', base64);
  }, [persistAsset]);

  const handleHistoryUpdate = useCallback(async (base64: string) => {
    setHistoryImage(base64);
    await persistAsset('historyImage', base64);
  }, [persistAsset]);

  const handleEngineUpdate = useCallback(async (base64: string) => {
    setEngineImage(base64);
    await persistAsset('engineImage', base64);
  }, [persistAsset]);

  const handleVersionUpdate = useCallback(async (id: string, base64: string) => {
    setVersionImages(prev => {
      const next = { ...prev, [id]: base64 };
      persistAsset('versionImages', next);
      return next;
    });
  }, [persistAsset]);

  const handleOwnerUpdate = useCallback(async (id: string, base64: string) => {
    setOwnerImages(prev => {
      const next = { ...prev, [id]: base64 };
      persistAsset('ownerImages', next);
      return next;
    });
  }, [persistAsset]);

  const handleGalleryUpdate = useCallback(async (id: number, base64: string) => {
    setGalleryImages(prev => {
      const next = prev.some(img => img.id === id)
        ? prev.map(img => img.id === id ? { ...img, url: base64 } : img)
        : [...prev, { id, url: base64 }];
      persistAsset('galleryImages', next);
      return next;
    });
  }, [persistAsset]);

  const generateAIImage = useCallback(async (prompt: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return '';
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      return '';
    } catch (err) { return ''; }
  }, []);

  const autoFillMissingAssets = useCallback(async (h: string, hist: string, eng: string) => {
    if (!process.env.API_KEY) return;
    if (!h) { 
      const img = await generateAIImage(HERO_PROMPT); 
      if (img) { h = img; setHeroImage(img); await persistAsset('heroImage', img); } 
    }
    if (!hist) { 
      const img = await generateAIImage(HISTORY_PROMPT); 
      if (img) { hist = img; setHistoryImage(img); await persistAsset('historyImage', img); } 
    }
    if (!eng) {
      const img = await generateAIImage(ENGINE_PROMPT);
      if (img) { eng = img; setEngineImage(img); await persistAsset('engineImage', img); }
    }
  }, [generateAIImage, persistAsset]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      sessionStorage.setItem(ADMIN_KEY, 'true');
      setIsAdmin(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setIsAdmin(sessionStorage.getItem(ADMIN_KEY) === 'true');
    }

    const bootstrap = async () => {
      let remoteMap: Record<string, any> = {};
      
      if (supabase) {
        try {
          // Check if table exists and connection is live
          const { data, error } = await supabase.from('assets').select('id, data').limit(50);
          if (!error && data) {
            setDbStatus('online');
            data.forEach(row => {
              if (row && row.id) remoteMap[row.id] = row.data;
            });
          } else if (error && (error.code === '42501' || error.status === 401 || error.status === 403)) {
            setDbStatus('permission_denied');
          } else {
            console.error("Supabase error:", error);
            setDbStatus('offline');
          }
        } catch (e) {
          console.error("Supabase Connectivity Issue:", e);
          setDbStatus('offline');
        }
      } else {
        setDbStatus('no_creds');
      }

      const loadAsset = async (key: string) => {
        if (remoteMap[key]) { 
          await saveLocalAsset(key, remoteMap[key]); 
          return remoteMap[key]; 
        }
        return await getLocalAsset(key);
      };

      try {
        const [h, hist, eng, vers, own, gal] = await Promise.all([
          loadAsset('heroImage'), loadAsset('historyImage'), loadAsset('engineImage'), loadAsset('versionImages'), loadAsset('ownerImages'), loadAsset('galleryImages')
        ]);

        if (h) setHeroImage(h);
        if (hist) setHistoryImage(hist);
        if (eng) setEngineImage(eng);
        if (vers) setVersionImages(vers);
        if (own) setOwnerImages(own);
        if (gal) setGalleryImages(Array.isArray(gal) ? gal : []);

        autoFillMissingAssets(h, hist, eng);
      } catch (e) {
        console.error("Bootstrap failed:", e);
      }
    };
    bootstrap();
  }, [supabase, autoFillMissingAssets]);

  const forceSyncToCloud = async () => {
    if (!supabase) {
      alert("No Credentials: Set SUPABASE_URL and SUPABASE_ANON_KEY in your Netlify Environment Settings.");
      return;
    }
    
    setSyncing(true);
    try {
      const keys = ['heroImage', 'historyImage', 'engineImage', 'versionImages', 'ownerImages', 'galleryImages'];
      let uploadedCount = 0;
      for (const key of keys) {
        const localData = await getLocalAsset(key);
        if (localData) {
          const { error } = await supabase.from('assets').upsert({ id: key, data: localData }, { onConflict: 'id' });
          if (error) throw error;
          uploadedCount++;
        }
      }
      setDbStatus('online');
      alert(`Archive Committed: ${uploadedCount} components uploaded to cloud vault.`);
    } catch (err: any) {
      console.error("Sync Critical Failure:", err);
      alert(`Sync Failed: ${err.message || "Network transmission error"}`);
    } finally {
      setSyncing(false);
    }
  };

  const selectedVersion = VERSIONS.find(v => v.id === currentView);

  return (
    <div className="min-h-screen bg-black">
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-[100] bg-zinc-950 border border-white/10 p-6 flex flex-col space-y-4 shadow-[0_0_60px_rgba(0,0,0,1)] backdrop-blur-2xl animate-in fade-in slide-in-from-left duration-500 max-w-[340px] w-full">
          <div className="flex items-center justify-between text-rosso">
            <div className="flex items-center space-x-3">
              <ShieldCheck size={18} />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Maranello Archive Ops</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-rosso animate-pulse'}`}></div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 text-[9px] uppercase tracking-widest bg-white/5 p-3 rounded border border-white/5">
              <Database size={12} className={dbStatus === 'online' ? 'text-green-500' : 'text-rosso'} />
              <span className="text-white/40">Status:</span>
              <span className={dbStatus === 'online' ? 'text-green-500' : 'text-rosso font-bold'}>
                {dbStatus === 'online' ? 'CONNECTED' : dbStatus === 'permission_denied' ? 'RLS LOCKED' : dbStatus === 'no_creds' ? 'MISSING ENV' : 'UNREACHABLE'}
              </span>
            </div>

            {dbStatus === 'offline' && (
              <div className="bg-rosso/5 border border-rosso/20 p-4 space-y-3 rounded">
                <div className="flex items-center text-rosso space-x-2">
                  <Globe size={14} />
                  <strong className="text-[9px] uppercase tracking-widest">Connection Diagnostics</strong>
                </div>
                <ul className="text-[8px] text-white/50 uppercase tracking-widest space-y-1.5 list-disc pl-4">
                  <li>Ensure <strong>SUPABASE_URL</strong> is a valid https address.</li>
                  <li>Check if a <strong>VPN</strong> or firewall is blocking Supabase.</li>
                  <li>Verify the <strong>assets</strong> table exists in your DB.</li>
                </ul>
              </div>
            )}

            {dbStatus === 'permission_denied' && (
              <div className="bg-rosso/10 border border-rosso/30 p-3 space-y-3 rounded-sm">
                <div className="flex items-center text-rosso space-x-2">
                  <AlertTriangle size={14} />
                  <strong className="text-[9px] uppercase tracking-widest">Policy Error</strong>
                </div>
                <p className="text-[8px] text-white/70 uppercase tracking-widest leading-normal">
                  RLS is blocking writes. Run this SQL in your Supabase Editor:
                </p>
                <div className="bg-black/80 p-2 font-mono text-[7px] text-green-400 border border-white/10 flex items-start space-x-2 overflow-x-auto">
                  <Terminal size={10} className="shrink-0 mt-0.5" />
                  <code>CREATE POLICY "Archive_All" ON public.assets FOR ALL TO anon USING (true) WITH CHECK (true);</code>
                </div>
              </div>
            )}

            {dbStatus === 'no_creds' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-[8px] text-amber-500 uppercase tracking-widest leading-relaxed rounded-sm">
                <AlertTriangle size={14} className="mb-2" />
                <strong>Environment Missing</strong>
                <p className="mt-1 text-white/50">Add <strong>SUPABASE_URL</strong> and <strong>SUPABASE_ANON_KEY</strong> to your Netlify dashboard.</p>
              </div>
            )}
            
            {dbStatus === 'online' && (
              <div className="bg-green-500/5 border border-green-500/20 p-2 text-[8px] text-green-500/80 uppercase tracking-widest flex items-start space-x-2 rounded-sm">
                <Info size={14} className="shrink-0" />
                <span>Cloud sync active. All updates are being mirrored to the global repository.</span>
              </div>
            )}
          </div>

          <button 
            onClick={forceSyncToCloud}
            disabled={syncing || !supabase}
            className="flex items-center justify-center space-x-3 bg-white/5 hover:bg-rosso disabled:opacity-20 disabled:cursor-not-allowed text-white px-6 py-4 text-[10px] uppercase tracking-[0.3em] transition-all border border-white/10 group active:scale-95"
          >
            <RefreshCw size={12} className={`${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
            <span className="font-bold">{syncing ? 'TRANSMITTING...' : 'COMMIT TO ARCHIVE'}</span>
          </button>
        </div>
      )}

      {currentView === 'home' ? (
        <>
          <Header />
          <Hero customImage={heroImage} onUpdateImage={handleHeroUpdate} isAdmin={isAdmin} />
          <History customImage={historyImage} onUpdateImage={handleHistoryUpdate} isAdmin={isAdmin} />
          <Versions images={versionImages} onNavigate={setCurrentView} onUpdateImage={handleVersionUpdate} isAdmin={isAdmin} />
          <ColomboEngine customImage={engineImage} onUpdateImage={handleEngineUpdate} isAdmin={isAdmin} />
          <Owners images={ownerImages} onUpdateImage={handleOwnerUpdate} isAdmin={isAdmin} />
          <Gallery images={galleryImages} onUpdateImage={handleGalleryUpdate} isAdmin={isAdmin} />
          <Footer />
        </>
      ) : selectedVersion ? (
        <VersionDetail 
          version={selectedVersion} 
          imageUrl={versionImages[selectedVersion.id] || ''} 
          onBack={() => setCurrentView('home')}
          isAdmin={isAdmin}
          onUpdateImage={(img) => handleVersionUpdate(selectedVersion.id, img)}
        />
      ) : null}
    </div>
  );
};

export default App;