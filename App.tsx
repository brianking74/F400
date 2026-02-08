
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Versions from './components/Versions';
import Owners from './components/Owners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import { VERSIONS, GALLERY_PROMPTS, OWNERS, HISTORY_PROMPT, HERO_PROMPT } from './constants';

const DB_NAME = 'F400_STABLE_VAULT_V2';
const STORE_NAME = 'assets';
const MANIFEST_KEY = 'f400_archive_locked_permanent_v100';

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

const getAsset = async (key: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

const saveAsset = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
    });
  } catch (e) {
    console.error("Archive Lock Failure:", e);
  }
};

const App: React.FC = () => {
  const [heroImage, setHeroImage] = useState<string>('');
  const [historyImage, setHistoryImage] = useState<string>('');
  const [versionImages, setVersionImages] = useState<Record<string, string>>({});
  const [ownerImages, setOwnerImages] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const synthesisStarted = useRef(false);

  useEffect(() => {
    const bootstrapArchive = async () => {
      try {
        const [h, hist, vers, own, gal] = await Promise.all([
          getAsset('heroImage'),
          getAsset('historyImage'),
          getAsset('versionImages'),
          getAsset('ownerImages'),
          getAsset('galleryImages')
        ]);

        if (h) setHeroImage(h);
        if (hist) setHistoryImage(hist);
        if (vers) setVersionImages(vers || {});
        if (own) setOwnerImages(own || {});
        if (gal) setGalleryImages(gal || []);

      } catch (err) {
        console.warn("Archive access restricted.");
      } finally {
        setIsInitializing(false);
        const isLocked = localStorage.getItem(MANIFEST_KEY) === 'true';
        if (!isLocked && !synthesisStarted.current) {
          synthesisStarted.current = true;
          runSilentArchiveSynthesis();
        }
      }
    };
    bootstrapArchive();
  }, []);

  const runSilentArchiveSynthesis = async () => {
    if (localStorage.getItem(MANIFEST_KEY) === 'true') return;

    // Direct use of API key as provided by environment
    const aiKey = process.env.API_KEY;
    if (!aiKey) {
      console.warn("API Key not found in environment.");
      return;
    }

    const ai = new GoogleGenAI({ apiKey: aiKey });

    const generateImage = async (prompt: string): Promise<string | null> => {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: { 
            imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
            seed: 1976 // Ensuring deterministic output for consistent visuals
          }
        });
        const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
      } catch (e) { 
        console.error("Generation failed:", e);
        return null; 
      }
    };

    try {
      // 1. HERO BANNER - STABLE LOCK
      const currentHero = heroImage || await getAsset('heroImage');
      if (!currentHero) {
        const hImg = await generateImage(HERO_PROMPT);
        if (hImg) { 
          setHeroImage(hImg); 
          await saveAsset('heroImage', hImg); 
        }
      }

      // 2. HISTORY
      const currentHistory = historyImage || await getAsset('historyImage');
      if (!currentHistory) {
        const histImg = await generateImage(HISTORY_PROMPT);
        if (histImg) { 
          setHistoryImage(histImg); 
          await saveAsset('historyImage', histImg); 
        }
      }

      // 3. VERSIONS
      const existingVers = await getAsset('versionImages') || {};
      const newVMap: Record<string, string> = { ...existingVers, ...versionImages };
      let vChanged = false;
      for (const v of VERSIONS) {
        if (!newVMap[v.id]) {
          const data = await generateImage(v.prompt);
          if (data) { newVMap[v.id] = data; vChanged = true; }
        }
      }
      if (vChanged) {
        setVersionImages(newVMap);
        await saveAsset('versionImages', newVMap);
      }

      // 4. OWNERS
      const existingOwn = await getAsset('ownerImages') || {};
      const newOMap: Record<string, string> = { ...existingOwn, ...ownerImages };
      let oChanged = false;
      for (const o of OWNERS) {
        if (!newOMap[o.id]) {
          const data = await generateImage(o.prompt);
          if (data) { newOMap[o.id] = data; oChanged = true; }
        }
      }
      if (oChanged) {
        setOwnerImages(newOMap);
        await saveAsset('ownerImages', newOMap);
      }

      // 5. GALLERY
      const existingGal = await getAsset('galleryImages') || [];
      if (existingGal.length < GALLERY_PROMPTS.length) {
        const resultsG = await Promise.all(GALLERY_PROMPTS.map(async g => {
          const existing = existingGal.find((ex: any) => ex.id === g.id);
          if (existing) return existing;
          const url = await generateImage(g.prompt);
          return url ? { ...g, url } : null;
        }));
        const validGallery = resultsG.filter(r => r !== null);
        setGalleryImages(validGallery);
        await saveAsset('galleryImages', validGallery);
      }
      
      localStorage.setItem(MANIFEST_KEY, 'true');
    } catch (err) {
      console.warn("Synthesis interrupted.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      if(window.confirm("Purge Locked Archive?")) {
        localStorage.removeItem(MANIFEST_KEY);
        indexedDB.deleteDatabase(DB_NAME);
        window.location.reload();
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-12 h-[1px] bg-rosso animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-rosso selection:text-white outline-none relative" id="top" onKeyDown={handleKeyDown} tabIndex={0}>
      <Header />
      <main className="animate-in fade-in duration-700">
        <Hero customImage={heroImage} />
        <History customImage={historyImage} />
        <Versions images={versionImages} />
        <Owners images={ownerImages} />
        <Gallery images={galleryImages} />
      </main>
      <Footer />
    </div>
  );
};

export default App;
