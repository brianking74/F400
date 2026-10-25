import React, { useRef } from 'react';
import SectionTitle from './SectionTitle';
import { Camera } from 'lucide-react';

interface HistoryProps {
  customImage?: string;
  onUpdateImage?: (base64: string) => void;
  isAdmin?: boolean;
}

const History: React.FC<HistoryProps> = ({ customImage, onUpdateImage, isAdmin }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <section id="history" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle 
          title="A Legacy of Elegance" 
          subtitle="Heritage 1976 – 1979" 
        />

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 text-gray-800 leading-relaxed text-lg">
            <p className="text-gray-800">
              Introduced at the <span className="font-semibold">1976 Paris Motor Show</span>, the Ferrari 400 was the sophisticated successor to the 365 GT4 2+2. It wasn't just another supercar; it was a refined statement of purpose, designed for the trans-continental grand tour.
            </p>
            <p className="text-gray-800">
              Its Pininfarina-styled steel body was a masterclass in clean, understated lines. Underneath the long, elegant hood sat the heart of a champion: the <span className="text-rosso font-bold">4.8-liter Colombo V12 engine</span>, producing 340 hp and propelling the luxurious cabin to speeds of 240 km/h.
            </p>
            <div className="border-l-4 border-rosso pl-6 py-2 italic font-serif text-xl my-8 text-black">
              "The 400 marked a turning point in Maranello: the first Ferrari ever to offer a factory automatic transmission."
            </div>
            <p className="text-gray-800">
              This bold move catered to the growing luxury market, particularly in the United States, providing effortless power without sacrificing the soul of a Ferrari.
            </p>
          </div>

          <div className="relative group">
            <div className="relative p-4 md:p-8 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100">
              <div className="aspect-video w-full overflow-hidden bg-neutral-900 flex items-center justify-center relative">
                {customImage ? (
                  <img 
                    src={customImage} 
                    alt="Ferrari 400 Heritage" 
                    className="w-full h-full object-cover animate-in fade-in duration-1000"
                  />
                ) : (
                  <div className="text-center opacity-20">
                    <div className="w-12 h-[1px] bg-white mx-auto mb-4"></div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-white font-bold italic">Archival Plate 400.01</p>
                  </div>
                )}

                {isAdmin && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-rosso text-white px-4 py-2 text-[10px] uppercase font-bold tracking-widest flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform"
                    >
                      <Camera size={14} />
                      <span>Replace Plate</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                )}
              </div>
              
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-100 pt-8">
                <div className="text-center">
                  <p className="text-rosso font-serif text-3xl font-bold">4823</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">cc Capacity</p>
                </div>
                <div className="text-center">
                  <p className="text-rosso font-serif text-3xl font-bold">340</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Horsepower</p>
                </div>
                <div className="text-center">
                  <p className="text-rosso font-serif text-3xl font-bold">1976</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Launch Year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default History;