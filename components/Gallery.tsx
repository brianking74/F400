
import React, { useState } from 'react';
import SectionTitle from './SectionTitle';
import { X, Maximize2 } from 'lucide-react';

interface GalleryProps {
  images?: any[];
}

const Gallery: React.FC<GalleryProps> = ({ images = [] }) => {
  const [filter, setFilter] = useState<'All' | 'Exterior' | 'Interior' | 'Details'>('All');
  const categories: ('All' | 'Exterior' | 'Interior' | 'Details')[] = ['All', 'Exterior', 'Interior', 'Details'];

  const filteredImages = filter === 'All' 
    ? images 
    : images.filter(img => img.category === filter);

  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const activeImage = images.find(img => img.id === selectedImageId);

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
          {filteredImages.length > 0 ? filteredImages.map((img) => (
            <div 
              key={img.id} 
              className="relative group aspect-[4/3] overflow-hidden bg-neutral-900 cursor-pointer border border-gray-100 shadow-sm animate-in zoom-in duration-500"
              onClick={() => setSelectedImageId(img.id)}
            >
              <img 
                src={img.url} 
                alt={img.caption}
                className="w-full h-full object-cover transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-rosso/0 group-hover:bg-rosso/10 transition-all duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="bg-white/90 p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <Maximize2 className="text-rosso" size={24} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                 <p className="text-white text-xs font-serif italic truncate">{img.caption}</p>
              </div>
            </div>
          )) : (
            [1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-[4/3] bg-neutral-900 flex items-center justify-center border border-white/5 opacity-20">
                <p className="text-[7px] text-white font-bold uppercase tracking-[0.5em] italic">Locked Negative 00{i}</p>
              </div>
            ))
          )}
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
              className="w-full h-auto max-h-[80vh] object-contain shadow-2xl border-2 border-rosso/20 animate-in zoom-in-95 duration-700"
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
