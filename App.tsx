
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Versions from './components/Versions';
import Owners from './components/Owners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import { VERSIONS, GALLERY_PROMPTS, OWNERS, HISTORY_PROMPT } from './constants';

const DB_NAME = 'F400_STABLE_VAULT_V2';
const STORE_NAME = 'assets';
const MANIFEST_KEY = 'f400_archive_locked_final_v2';

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
        // Load whatever we have in the vault
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

        // Instant UI hydration
        setIsInitializing(false);

        // Silent, one-time generation if the manifest lock isn't set
        const isFullyLocked = localStorage.getItem(MANIFEST_KEY) === 'true';
        if (!isFullyLocked && !synthesisStarted.current) {
          synthesisStarted.current = true;
          runSilentArchiveSynthesis();
        }
      } catch (err) {
        setIsInitializing(false);
      }
    };
    bootstrapArchive();
  }, []);

  const runSilentArchiveSynthesis = async () => {
    const hasKey = !!process.env.API_KEY || (await (window as any).aistudio?.hasSelectedApiKey?.());
    if (!hasKey) return;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const generateImage = async (prompt: string): Promise<string | null> => {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
        });
        const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
      } catch (e) { return null; }
    };

    try {
      // Background synthesis - updates UI progressively as assets lock in
      const hImgTask = generateImage("Masterpiece cinematic automotive photography of a 1977 Ferrari 400 in Rosso Corsa red. Sharp Pininfarina wedge body, distinct three-box grand tourer silhouette, low front nose, five-spoke wheels, evening sunset light, dramatic atmosphere, high resolution.")
        .then(async (img) => { if (img) { setHeroImage(img); await saveAsset('heroImage', img); } });

      const histImgTask = generateImage(HISTORY_PROMPT)
        .then(async (img) => { if (img) { setHistoryImage(img); await saveAsset('historyImage', img); } });

      const versTask = Promise.all(VERSIONS.map(async v => ({ id: v.id, data: await generateImage(v.prompt) })))
        .then(async (results) => {
          const vMap: Record<string, string> = {};
          results.forEach(r => { if (r.data) vMap[r.id] = r.data; });
          setVersionImages(vMap);
          await saveAsset('versionImages', vMap);
        });

      const ownersTask = Promise.all(OWNERS.map(async o => ({ id: o.id, data: await generateImage(o.prompt) })))
        .then(async (results) => {
          const oMap: Record<string, string> = {};
          results.forEach(r => { if (r.data) oMap[r.id] = r.data; });
          setOwnerImages(oMap);
          await saveAsset('ownerImages', oMap);
        });

      const galleryTask = Promise.all(GALLERY_PROMPTS.map(async g => ({ ...g, url: await generateImage(g.prompt) })))
        .then(async (results) => {
          const validGallery = results.filter(r => !!r.url);
          setGalleryImages(validGallery);
          await saveAsset('galleryImages', validGallery);
        });

      await Promise.all([hImgTask, histImgTask, versTask, ownersTask, galleryTask]);
      
      // Permanently lock the archive for this user
      localStorage.setItem(MANIFEST_KEY, 'true');
    } catch (err) {
      // Silent error handling
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Hidden debug: Ctrl + Shift + R to force purge archive
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      if(window.confirm("Purge Locked Archive?")) {
        localStorage.removeItem(MANIFEST_KEY);
        indexedDB.deleteDatabase(DB_NAME);
        window.location.reload();
      }
    }
  };

  if (isInitializing) {
    return <div className="h-screen w-full bg-black"></div>;
  }

  return (
    <div className="min-h-screen selection:bg-rosso selection:text-white outline-none" id="top" onKeyDown={handleKeyDown} tabIndex={0}>
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
