
import React, { useRef } from 'react';
import { ChevronDown, Camera, ShieldCheck, LogOut } from 'lucide-react';

interface HeroProps {
  customImage?: string;
  onUpdateImage?: (base64: string) => void;
  isAdmin?: boolean;
  onLogout?: () => void;
}

const Hero: React.FC<HeroProps> = ({ customImage, onUpdateImage, isAdmin = false, onLogout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLDivElement>, href: string) => {
    if (e) e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-neutral-950">
      {/* Admin Management Tools - Only visible if isAdmin is true */}
      {isAdmin && (
        <div className="absolute top-24 right-8 z-30 flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2 mb-1">
             <div className="flex items-center space-x-1 text-[8px] text-rosso uppercase font-bold tracking-widest bg-black/80 px-2 py-1.5 border border-rosso/30">
              <ShieldCheck size={10} />
              <span>Admin Control Active</span>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="bg-white/10 hover:bg-rosso text-white p-1.5 transition-colors border border-white/10"
                title="Exit Admin Mode"
              >
                <LogOut size={12} />
              </button>
            )}
          </div>
          
          <button 
            onClick={triggerUpload}
            className="flex items-center space-x-3 bg-black/60 backdrop-blur-xl border border-white/20 px-6 py-3 text-[10px] text-white uppercase tracking-widest hover:bg-rosso hover:border-rosso transition-all group shadow-2xl"
            title="Upload Permanent Hero Image"
          >
            <Camera size={14} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold">Replace Banner</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>
      )}

      <div className="absolute inset-0 z-0">
        {customImage ? (
          <img 
            src={customImage} 
            alt="Ferrari 400 Grand Tourer" 
            className="w-full h-full object-cover scale-105 animate-[subtle-zoom_60s_infinite_alternate] opacity-100 transition-opacity duration-1000"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="w-16 h-[1px] bg-rosso/30 animate-pulse"></div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-7xl mx-auto pt-20">
        <div className="mb-4 overflow-hidden">
           <h1 className="text-rosso font-serif text-7xl md:text-[10rem] font-bold leading-[0.85] tracking-tight opacity-0 animate-[fade-in-up_1s_ease-out_forwards]">
             Ferrari 400
           </h1>
        </div>
        
        <div className="mb-10 overflow-hidden">
          <h2 className="text-white font-serif text-6xl md:text-[9rem] font-bold leading-[0.85] tracking-tight opacity-0 animate-[fade-in-up_1.2s_ease-out_0.2s_forwards]">
            The Grand Tourer
          </h2>
        </div>
        
        <p className="text-white/90 text-sm md:text-base font-light tracking-[0.5em] uppercase mb-14 opacity-0 animate-[fade-in-up_1.2s_ease-out_0.4s_forwards]">
          Maranello’s V12 Masterpiece.
        </p>

        <div className="flex flex-col items-center opacity-0 animate-[fade-in-up_1.2s_ease-out_0.6s_forwards]">
          <a 
            href="#history" 
            onClick={(e) => scrollToSection(e, '#history')}
            className="px-14 py-5 bg-rosso text-white font-bold text-xs uppercase tracking-[0.3em] hover:bg-red-700 transition-all transform hover:scale-105 shadow-2xl mb-4"
          >
            Live The Legacy
          </a>
          
          <div 
            className="animate-bounce cursor-pointer p-2 opacity-40 hover:opacity-100 transition-opacity flex justify-center w-full" 
            onClick={(e) => scrollToSection(e, '#history')}
          >
            <ChevronDown size={44} className="text-white" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(80px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-zoom {
          from { transform: scale(1.0); }
          to { transform: scale(1.1); }
        }
      `}</style>
    </header>
  );
};

export default Hero;
