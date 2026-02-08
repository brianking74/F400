
import React from 'react';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  customImage?: string;
}

const Hero: React.FC<HeroProps> = ({ customImage }) => {
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

  return (
    <header className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-neutral-950">
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

        <div className="flex flex-col sm:flex-row gap-6 justify-center opacity-0 animate-[fade-in-up_1.2s_ease-out_0.6s_forwards]">
          <a 
            href="#history" 
            onClick={(e) => scrollToSection(e, '#history')}
            className="px-14 py-5 bg-rosso text-white font-bold text-xs uppercase tracking-[0.3em] hover:bg-red-700 transition-all transform hover:scale-105 shadow-2xl"
          >
            Enter Archive
          </a>
          <a 
            href="#gallery" 
            onClick={(e) => scrollToSection(e, '#gallery')}
            className="px-14 py-5 border border-white/40 text-white font-bold text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all transform hover:border-white"
          >
            Visual Legacy
          </a>
        </div>
      </div>

      <div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-10 p-2 opacity-40 hover:opacity-100 transition-opacity" 
        onClick={(e) => scrollToSection(e, '#history')}
      >
        <ChevronDown size={44} className="text-white" />
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
