
import React, { useState, useEffect, useCallback } from 'react';
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
import { ShieldCheck, Loader2 } from 'lucide-react';

// Supabase Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Gemini Initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DB_NAME = 'FERRARI_400_PERMANENT_VAULT';
const STORE_NAME = 'archival_assets';
const ADMIN_KEY = 'f400_admin_active_session';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
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

const generateAIImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (err) {
    console.error("AI Generation Failed:", err);
    return '';
  }
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

  const persistAsset = useCallback(async (key: string, data: any) => {
    await saveLocalAsset(key, data);
    if (supabase) {
      try {
        await supabase.from('assets').upsert({ id: key, data: data });
      } catch (err) { console.warn(`Supabase sync failed for ${key}`, err); }
    }
  }, []);

  const autoFillMissingAssets = useCallback(async (
    h: string, 
    hist: string, 
    vers: Record<string, string>, 
    own: Record<string, string>, 
    gal: any[]
  ) => {
    setIsRestoring(true);
    
    // Fill Hero
    if (!h) {
      const img = await generateAIImage(HERO_PROMPT);
      if (img) { h = img; setHeroImage(img); await persistAsset('heroImage', img); }
    }

    // Fill History
    if (!hist) {
      const img = await generateAIImage(HISTORY_PROMPT);
      if (img) { hist = img; setHistoryImage(img); await persistAsset('historyImage', img); }
    }

    // Fill Versions
    const newVers = { ...vers };
    for (const v of VERSIONS) {
      if (!newVers[v.id]) {
        const img = await generateAIImage(v.prompt);
        if (img) { newVers[v.id] = img; setVersionImages({ ...newVers }); await persistAsset('versionImages', newVers); }
      }
    }

    // Fill Owners
    const newOwners = { ...own };
    for (const o of OWNERS) {
      if (!newOwners[o.id]) {
        const img = await generateAIImage(o.prompt);
        if (img) { newOwners[o.id] = img; setOwnerImages({ ...newOwners }); await persistAsset('ownerImages', newOwners); }
      }
    }

    // Fill Gallery
    const newGal = [...gal];
    for (const p of GALLERY_PROMPTS) {
      if (!newGal.find(g => g.id === p.id)) {
        const img = await generateAIImage(p.prompt);
        if (img) {
          const item = { ...p, url: img };
          newGal.push(item);
          setGalleryImages([...newGal]);
          await persistAsset('galleryImages', newGal);
        }
      }
    }
    
    setIsRestoring(false);
  }, [persistAsset]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      sessionStorage.setItem(ADMIN_KEY, 'true');
      setIsAdmin(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setIsAdmin(sessionStorage.getItem(ADMIN_KEY) === 'true');
    }

    const bootstrapArchive = async () => {
      try {
        let assetsMap: Record<string, any> = {};
        if (supabase) {
          try {
            const { data: remoteAssets } = await supabase.from('assets').select('*');
            if (remoteAssets) remoteAssets.forEach((row: any) => { assetsMap[row.id] = row.data; });
          } catch (e) { console.warn("Supabase unreachable", e); }
        }

        const getMergedAsset = async (key: string) => {
          if (assetsMap[key]) { await saveLocalAsset(key, assetsMap[key]); return assetsMap[key]; }
          return await getLocalAsset(key);
        };

        const [h, hist, vers, own, gal] = await Promise.all([
          getMergedAsset('heroImage'),
          getMergedAsset('historyImage'),
          getMergedAsset('versionImages'),
          getMergedAsset('ownerImages'),
          getMergedAsset('galleryImages')
        ]);

        if (h) setHeroImage(h);
        if (hist) setHistoryImage(hist);
        const finalVers = vers || {};
        const finalOwn = own || {};
        const finalGal = gal || [];
        setVersionImages(finalVers);
        setOwnerImages(finalOwn);
        setGalleryImages(finalGal);

        setIsInitializing(false);
        
        // If not initialized yet, start auto-fill for a better visitor experience
        if (!h || !hist || Object.keys(finalVers).length < VERSIONS.length || finalGal.length < GALLERY_PROMPTS.length) {
          autoFillMissingAssets(h, hist, finalVers, finalOwn, finalGal);
        }
      } catch (err) {
        console.error("Bootstrap error:", err);
        setIsInitializing(false);
      }
    };
    bootstrapArchive();
  }, [autoFillMissingAssets]);

  const handleHeroUpdate = (img: string) => { setHeroImage(img); persistAsset('heroImage', img); };
  const handleHistoryUpdate = (img: string) => { setHistoryImage(img); persistAsset('historyImage', img); };
  const handleVersionUpdate = (id: string, img: string) => { 
    const n = { ...versionImages, [id]: img }; 
    setVersionImages(n); 
    persistAsset('versionImages', n); 
  };
  const handleOwnerUpdate = (id: string, img: string) => {
    const n = { ...ownerImages, [id]: img };
    setOwnerImages(n);
    persistAsset('ownerImages', n);
  };
  const handleGalleryUpdate = (id: number, img: string) => {
    const exists = galleryImages.some(img => img.id === id);
    let newGal = exists 
      ? galleryImages.map(img => img.id === id ? { ...img, url: img } : img)
      : [...galleryImages, { ...GALLERY_PROMPTS.find(p => p.id === id)!, url: img }];
    setGalleryImages(newGal);
    persistAsset('galleryImages', newGal);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
           <div className="w-12 h-[1px] bg-rosso animate-pulse mb-4"></div>
           <span className="text-[10px] text-white/20 uppercase tracking-[0.4em]">Archival Handshake</span>
        </div>
      </div>
    );
  }

  const selectedVersion = VERSIONS.find(v => v.id === currentView);

  return (
    <div className="min-h-screen selection:bg-rosso/30 selection:text-rosso outline-none relative bg-white" id="top" tabIndex={0}>
      
      {isAdmin && (
        <div className="fixed bottom-10 left-10 z-[100] bg-black border border-white px-5 py-3 flex items-center space-x-4 text-rosso shadow-[0_0_30px_rgba(255,40,0,0.1)]">
          <ShieldCheck size={16} className="text-rosso" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold">LOCAL OVERRIDES ENABLED</span>
        </div>
      )}

      {isRestoring && !isAdmin && (
        <div className="fixed bottom-10 right-10 z-[100] bg-black/80 backdrop-blur-md border border-white/10 px-6 py-4 flex items-center space-x-4 text-white">
          <Loader2 size={16} className="text-rosso animate-spin" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Restoring Visual Archive</span>
            <span className="text-[8px] text-white/40 uppercase tracking-widest mt-1">Downloading Colombo V12 Schematics...</span>
          </div>
        </div>
      )}

      {currentView === 'home' ? (
        <>
          <Header />
          <main className="animate-in fade-in duration-700">
            <Hero customImage={heroImage} onUpdateImage={handleHeroUpdate} isAdmin={isAdmin} onLogout={() => { sessionStorage.removeItem(ADMIN_KEY); setIsAdmin(false); }} />
            <History customImage={historyImage} onUpdateImage={handleHistoryUpdate} isAdmin={isAdmin} />
            <Versions images={versionImages} onNavigate={setCurrentView} onUpdateImage={handleVersionUpdate} isAdmin={isAdmin} />
            <Owners images={ownerImages} onUpdateImage={handleOwnerUpdate} isAdmin={isAdmin} />
            <Gallery images={galleryImages} onUpdateImage={handleGalleryUpdate} isAdmin={isAdmin} />
          </main>
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
