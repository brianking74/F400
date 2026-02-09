
import React, { useState, useRef } from 'react';
import SectionTitle from './SectionTitle';
import { X, Maximize2, Camera, Loader2 } from 'lucide-react';
import { GALLERY_PROMPTS } from '../constants';

interface GalleryProps {
  images?: any[];
  onUpdateImage?: (id: number, base64: string) => void;
  isAdmin?: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ images = [], onUpdateImage, isAdmin }) => {
  const [filter, setFilter] = useState<'All' | 'Exterior' | 'Interior' | 'Details'>('All');
  const categories: ('All' | 'Exterior' | 'Interior' | 'Details')[] = ['All', 'Exterior', 'Interior', 'Details'];
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const filteredPrompts = filter === 'All' 
    ? GALLERY_PROMPTS 
    : GALLERY_PROMPTS.filter(p => p.category === filter);

  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  
  const getImageData = (id: number) => images.find(img => img.id === id);
  const activeImage = getImageData(selectedImageId || -1);

  const handleFileChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateImage(id, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <section id="gallery" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle 
          title="Curated Gallery" 
          subtitle="Visual Archives of the 400" 
        />

        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 text-xs uppercase tracking-[0.2em] transition-all border-b-2 ${filter === cat ? 'border-rosso text-rosso font-bold' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
          {filteredPrompts.map((prompt) => {
            const imageData = getImageData(prompt.id);
            const hasImage = !!imageData?.url;

            return (
              <div 
                key={prompt.id} 
                className={`relative group aspect-video overflow-hidden ${hasImage ? 'bg-neutral-900' : 'bg-neutral-100'} border border-gray-100 shadow-sm animate-in zoom-in duration-500`}
              >
                {hasImage ? (
                  <>
                    <img 
                      src={imageData.url} 
                      alt={prompt.caption}
                      className="w-full h-full object-contain transition-all duration-1000 cursor-pointer"
                      onClick={() => setSelectedImageId(prompt.id)}
                    />
                    <div className="absolute inset-0 bg-rosso/0 group-hover:bg-rosso/5 transition-all duration-300 pointer-events-none"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950/95 relative">
                    <Loader2 size={24} className="text-rosso/20 animate-spin mb-4" />
                    <p className="text-[7px] text-white/40 font-bold uppercase tracking-[0.5em] italic">Developing Negative 00{prompt.id}</p>
                    <p className="text-[6px] text-white/20 uppercase tracking-widest mt-2">{prompt.category}</p>
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 space-x-4 pointer-events-none group-hover:pointer-events-auto">
                  {hasImage && (
                    <button 
                      onClick={() => setSelectedImageId(prompt.id)}
                      className="bg-white/90 p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform hover:bg-white"
                    >
                      <Maximize2 className="text-rosso" size={24} />
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); fileInputRefs.current[prompt.id]?.click(); }}
                        className="bg-rosso text-white p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform hover:bg-red-700"
                        title="Upload/Replace Gallery Asset (Local Only)"
                      >
                        <Camera size={24} />
                      </button>
                      <input 
                        type="file" 
                        ref={el => fileInputRefs.current[prompt.id] = el} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(prompt.id, e)} 
                      />
                    </>
                  )}
                </div>

                {hasImage && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <p className="text-white text-[10px] font-serif italic truncate">{prompt.caption}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedImageId !== null && activeImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button 
            className="absolute top-8 right-8 text-white hover:text-rosso transition-colors"
            onClick={() => setSelectedImageId(null)}
          >
            <X size={40} />
          </button>
          
          <div className="max-w-5xl w-full">
            <img 
              src={activeImage.url} 
              alt={activeImage.caption} 
              className="w-full h-auto max-h-[85vh] object-contain shadow-2xl border-2 border-rosso/20 animate-in zoom-in-95 duration-700"
            />
            <div className="mt-6 text-center">
              <span className="text-rosso uppercase tracking-widest text-xs font-bold block mb-2">{activeImage.category}</span>
              <p className="text-white text-xl font-serif italic">{activeImage.caption}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
