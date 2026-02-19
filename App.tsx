
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
import { ShieldCheck, Database, RefreshCw, AlertTriangle, Key, Link as LinkIcon, Info } from 'lucide-react';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | string>('home');
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline' | 'no_creds' | 'permission_denied'>('checking');
  const [syncing, setSyncing] = useState(false);

  // Manual Credential Overrides for Admin UI
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');

  const supabase = useMemo(() => {
    // Use process.env directly as Vite define handles replacement. Removed import.meta.env to fix TS error.
    const url = manualUrl || process.env.SUPABASE_URL;
    const key = manualKey || process.env.SUPABASE_ANON_KEY;
    
    if (!url || !key) return null;
    try {
      return createClient(url, key);
    } catch (e) {
      console.error("Supabase Init Error:", e);
      return null;
    }
  }, [manualUrl, manualKey]);

  const persistAsset = useCallback(async (key: string, data: any) => {
    await saveLocalAsset(key, data);
    if (supabase) {
      const { error } = await supabase.from('assets').upsert({ id: key, data: data });
      if (error) console.error(`Sync error for ${key}:`, error.message);
    }
  }, [supabase]);

  const generateAIImage = useCallback(async (prompt: string): Promise<string> => {
    // Obtained exclusively from process.env.API_KEY as per guidelines. Removed import.meta.env fallback.
    const apiKey = process.env.API_KEY;
    if (!apiKey) return '';
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });
      const parts = response.candidates?.[0]?.content?.parts || [];
      // Iterating through parts to find image data as per guidelines
      for (const part of parts) if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      return '';
    } catch (err) { return ''; }
  }, []);

  const forceSyncToCloud = async () => {
    if (!supabase) {
      alert("Please provide valid Supabase credentials in the panel below.");
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
      alert(`Archive Synced: ${uploadedCount} assets pushed to global repository.`);
    } catch (err: any) {
      alert("Sync Failure: " + (err.message || "Connection refused"));
    } finally {
      setSyncing(false);
    }
  };

  const autoFillMissingAssets = useCallback(async (h: string, hist: string) => {
    // Obtained exclusively from process.env.API_KEY as per guidelines. Removed import.meta.env fallback.
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;
    if (!h) { const img = await generateAIImage(HERO_PROMPT); if (img) { h = img; setHeroImage(img); await persistAsset('heroImage', img); } }
    if (!hist) { const img = await generateAIImage(HISTORY_PROMPT); if (img) { hist = img; setHistoryImage(img); await persistAsset('historyImage', img); } }
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
          } else if (error) {
            console.warn("Supabase Fetch Error:", error.message);
            // If we get an error but we have a client, it's often a policy issue
            setDbStatus(error.code === '42501' ? 'permission_denied' : 'offline');
          } else {
            setDbStatus('offline');
          }
        } catch (e) {
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
        const [h, hist, vers, own, gal] = await Promise.all([
          loadAsset('heroImage'), loadAsset('historyImage'), loadAsset('versionImages'), loadAsset('ownerImages'), loadAsset('galleryImages')
        ]);

        if (h) setHeroImage(h);
        if (hist) setHistoryImage(hist);
        setVersionImages(vers || {});
        setOwnerImages(own || {});
        setGalleryImages(gal || []);

        setIsInitializing(false);
        if (!h || !hist) autoFillMissingAssets(h, hist);
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
        <div className="fixed bottom-10 left-10 z-[100] bg-black border border-white/20 p-6 flex flex-col space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-left duration-500 max-w-sm w-full">
          <div className="flex items-center space-x-3 text-rosso">
            <ShieldCheck size={18} />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Override Protocol: Active</span>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-[9px] uppercase tracking-widest">
              <Database size={12} className={supabase ? (dbStatus === 'online' ? 'text-green-500' : 'text-orange-400') : 'text-rosso'} />
              <span className="text-white/40">Archive Status:</span>
              <span className={supabase ? (dbStatus === 'online' ? 'text-green-500' : 'text-orange-400') : 'text-rosso'}>
                {supabase ? (dbStatus === 'online' ? 'READY / CONNECTED' : 'CONNECTED / NO DATA') : 'NO CREDENTIALS'}
              </span>
            </div>

            {dbStatus === 'permission_denied' && (
              <div className="bg-rosso/10 border border-rosso/30 p-3 text-[9px] text-rosso/90 uppercase tracking-widest leading-relaxed">
                <AlertTriangle size={14} className="mb-2" />
                <strong>Permission Denied:</strong> Supabase RLS Policy is likely blocking "SELECT" for "anon" users. 
                <p className="mt-1 opacity-70">Enable "SELECT" for "anon" role in Supabase dashboard to allow public view.</p>
              </div>
            )}

            {!supabase && (
              <div className="space-y-3 bg-white/5 p-4 border border-white/10">
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2 flex items-center">
                  <AlertTriangle size={10} className="mr-2 text-rosso" />
                  Manual Key Entry Required
                </p>
                
                <div className="relative">
                  <LinkIcon size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text" 
                    placeholder="SUPABASE URL"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="w-full bg-black border border-white/20 px-8 py-2 text-[10px] text-white focus:border-rosso transition-colors outline-none font-mono"
                  />
                </div>

                <div className="relative">
                  <Key size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="password" 
                    placeholder="SUPABASE ANON KEY"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    className="w-full bg-black border border-white/20 px-8 py-2 text-[10px] text-white focus:border-rosso transition-colors outline-none font-mono"
                  />
                </div>
              </div>
            )}
            
            {supabase && dbStatus === 'online' && (
              <div className="bg-green-500/5 border border-green-500/20 p-3 text-[9px] text-green-500/80 uppercase tracking-widest flex items-start space-x-2">
                <Info size={14} className="shrink-0" />
                <span>Archive is globally reachable. Other browsers will see these images automatically.</span>
              </div>
            )}
          </div>

          <button 
            onClick={forceSyncToCloud}
            disabled={syncing || !supabase}
            className="flex items-center justify-center space-x-3 bg-white/5 hover:bg-rosso disabled:opacity-10 disabled:grayscale text-white px-6 py-4 text-[10px] uppercase tracking-[0.3em] transition-all border border-white/10 group"
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
