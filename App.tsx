import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Versions from './components/Versions';
import Owners from './components/Owners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import VersionDetail from './components/VersionDetail';
import { VERSIONS, GALLERY_PROMPTS, OWNERS, HERO_PROMPT, HISTORY_PROMPT } from './constants';
import { ShieldCheck, Loader2, Database, RefreshCw, AlertTriangle, CloudOff } from 'lucide-react';

// Fixed: Access process.env directly as shimmed by Vite to avoid TypeScript errors and comply with security rules.
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  try { return createClient(url, key); } catch (e) { 
    console.error("Supabase client failed to initialize:", e);
    return null; 
  }
};

const DB_NAME = 'FERRARI_400_PERMANENT_VAULT';
const STORE_NAME = 'archival_assets';
const ADMIN_KEY = 'f400_admin_active_session';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
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
  const [versionImages, setVersionImages] = useState<Record<string, string>>({});
  const [ownerImages, setOwnerImages] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | string>('home');
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [syncing, setSyncing] = useState(false);

  const supabase = useMemo(() => getSupabase(), []);

  const persistAsset = useCallback(async (key: string, data: any) => {
    await saveLocalAsset(key, data);
    if (supabase) {
      const { error } = await supabase.from('assets').upsert({ id: key, data: data });
      if (error) console.error(`Sync error for ${key}:`, error.message);
    }
  }, [supabase]);

  // Fixed: Use process.env.API_KEY exclusively and correctly initialize GoogleGenAI.
  const generateAIImage = useCallback(async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) return '';
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      return '';
    } catch (err) { return ''; }
  }, []);

  const forceSyncToCloud = async () => {
    if (!supabase) {
      alert("System Error: Supabase connection could not be established. Ensure your Project URL and API Key are set in the environment variables.");
      return;
    }
    setSyncing(true);
    try {
      const keys = ['heroImage', 'historyImage', 'versionImages', 'ownerImages', 'galleryImages'];
      let uploadedCount = 0;
      for (const key of keys) {
        const localData = await getLocalAsset(key);
        if (localData) {
          const { error } = await supabase.from('assets').upsert({ id: key, data: localData });
          if (error) throw error;
          uploadedCount++;
        }
      }
      setDbStatus('online');
      alert(`Success: ${uploadedCount} assets synchronized with the cloud archive.`);
    } catch (err: any) {
      console.error("Sync Protocol Failure:", err);
      alert("Synchronization Failed: " + (err.message || "Unknown error"));
    } finally {
      setSyncing(false);
    }
  };

  // Fixed: Removed reference to import.meta.env.
  const autoFillMissingAssets = useCallback(async (h: string, hist: string, vers: any, own: any, gal: any) => {
    if (!process.env.API_KEY) return;
    setIsRestoring(true);
    if (!h) { const img = await generateAIImage(HERO_PROMPT); if (img) { h = img; setHeroImage(img); await persistAsset('heroImage', img); } }
    if (!hist) { const img = await generateAIImage(HISTORY_PROMPT); if (img) { hist = img; setHistoryImage(img); await persistAsset('historyImage', img); } }
    setIsRestoring(false);
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
          const { data, error } = await supabase.from('assets').select('*');
          if (!error && data) {
            setDbStatus('online');
            data.forEach(row => remoteMap[row.id] = row.data);
          } else {
            setDbStatus('offline');
          }
        } catch (e) {
          setDbStatus('offline');
        }
      } else {
        setDbStatus('offline');
      }

      const loadAsset = async (key: string) => {
        if (remoteMap[key]) { 
          await saveLocalAsset(key, remoteMap[key]); 
          return remoteMap[key]; 
        }
        return await getLocalAsset(key);
      };

      try {
        const [h, hist, vers, own, gal] = await Promise.all([
          loadAsset('heroImage'), loadAsset('historyImage'), loadAsset('versionImages'), loadAsset('ownerImages'), loadAsset('galleryImages')
        ]);

        if (h) setHeroImage(h);
        if (hist) setHistoryImage(hist);
        setVersionImages(vers || {});
        setOwnerImages(own || {});
        setGalleryImages(gal || []);

        setIsInitializing(false);
        if (!h || !hist) autoFillMissingAssets(h, hist, vers, own, gal);
      } catch (e) {
        setIsInitializing(false);
      }
    };
    bootstrap();
  }, [supabase, autoFillMissingAssets]);

  const handleHeroUpdate = (img: string) => { setHeroImage(img); persistAsset('heroImage', img); };
  const handleHistoryUpdate = (img: string) => { setHistoryImage(img); persistAsset('historyImage', img); };
  const handleVersionUpdate = (id: string, img: string) => { 
    const n = { ...versionImages, [id]: img }; setVersionImages(n); persistAsset('versionImages', n); 
  };
  const handleOwnerUpdate = (id: string, img: string) => {
    const n = { ...ownerImages, [id]: img }; setOwnerImages(n); persistAsset('ownerImages', n);
  };
  const handleGalleryUpdate = (id: number, img: string) => {
    const n = galleryImages.some(g => g.id === id) 
      ? galleryImages.map(g => g.id === id ? { ...g, url: img } : g)
      : [...galleryImages, { ...GALLERY_PROMPTS.find(p => p.id === id)!, url: img }];
    setGalleryImages(n); persistAsset('galleryImages', n);
  };

  if (isInitializing) return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-[1px] bg-rosso animate-pulse"></div>
      <span className="text-[10px] text-white/20 uppercase tracking-[0.5em] animate-pulse">Syncing Archive</span>
    </div>
  );

  const selectedVersion = VERSIONS.find(v => v.id === currentView);

  return (
    <div className="min-h-screen bg-white">
      {isAdmin && (
        <div className="fixed bottom-10 left-10 z-[100] bg-black border border-white/20 p-5 flex flex-col space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-left duration-500">
          <div className="flex items-center space-x-3 text-rosso">
            <ShieldCheck size={18} />
            <span className="text-[11px] uppercase tracking-widest font-bold">Override Protocol: Active</span>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 text-[9px] uppercase tracking-widest">
              <Database size={12} className={supabase ? (dbStatus === 'online' ? 'text-green-500' : 'text-orange-400') : 'text-rosso'} />
              <span className="text-white/40">Archive Status:</span>
              <span className={supabase ? (dbStatus === 'online' ? 'text-green-500' : 'text-orange-400') : 'text-rosso'}>
                {supabase ? (dbStatus === 'online' ? 'CONNECTED' : 'LOCAL-ONLY') : 'NO CREDENTIALS'}
              </span>
            </div>
            
            {!supabase && (
              <div className="flex items-start space-x-2 text-[8px] text-rosso/70 bg-rosso/5 p-3 border border-rosso/20">
                <AlertTriangle size={12} className="shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold uppercase tracking-widest">Action Required</span>
                  <span className="mt-1 leading-tight">Add SUPABASE_URL and SUPABASE_ANON_KEY to your Netlify Environment Variables.</span>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={forceSyncToCloud}
            disabled={syncing || !supabase}
            className="flex items-center justify-center space-x-3 bg-white/5 hover:bg-rosso disabled:opacity-20 disabled:hover:bg-white/5 text-white px-6 py-4 text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10 group"
          >
            <RefreshCw size={12} className={`${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
            <span className="font-bold">{syncing ? 'SYNCHRONIZING...' : 'PUSH TO CLOUD VAULT'}</span>
          </button>
        </div>
      )}

      {currentView === 'home' ? (
        <>
          <Header />
          <Hero customImage={heroImage} onUpdateImage={handleHeroUpdate} isAdmin={isAdmin} />
          <History customImage={historyImage} onUpdateImage={handleHistoryUpdate} isAdmin={isAdmin} />
          <Versions images={versionImages} onNavigate={setCurrentView} onUpdateImage={handleVersionUpdate} isAdmin={isAdmin} />
          <Owners images={ownerImages} onUpdateImage={handleOwnerUpdate} isAdmin={isAdmin} />
          <Gallery images={galleryImages} onUpdateImage={handleGalleryUpdate} isAdmin={isAdmin} />
          <Footer />
        </>
      ) : selectedVersion ? (
        <VersionDetail 
          version={selectedVersion} 
          imageUrl={versionImages[selectedVersion.id]} 
          onBack={() => setCurrentView('home')}
          isAdmin={isAdmin}
          onUpdateImage={(img) => handleVersionUpdate(selectedVersion.id, img)}
        />
      ) : null}
    </div>
  );
};

export default App;