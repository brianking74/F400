
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
            className="w-full h-full object-cover scale-105 animate-[subtle-zoom_30s_infinite_alternate] opacity-100 transition-opacity duration-1000"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="w-16 h-[1px] bg-rosso/30 animate-pulse"></div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-white font-serif text-5xl md:text-9xl mb-8 leading-tight drop-shadow-2xl font-bold tracking-tighter">
          <span className="text-rosso block mb-2 opacity-0 animate-[fade-in-up_1s_ease-out_forwards]">Ferrari 400</span>
          <span className="block opacity-0 animate-[fade-in-up_1s_ease-out_0.3s_forwards] text-white/90">The Grand Tourer</span>
        </h1>
        
        <p className="text-white/80 text-xl md:text-2xl font-light tracking-[0.2em] uppercase mb-12 opacity-0 animate-[fade-in-up_1s_ease-out_0.6s_forwards] max-w-2xl mx-auto">
          Maranello’s V12 Masterpiece.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center opacity-0 animate-[fade-in-up_1s_ease-out_0.9s_forwards]">
          <a 
            href="#history" 
            onClick={(e) => scrollToSection(e, '#history')}
            className="px-12 py-5 bg-rosso text-white font-bold uppercase tracking-[0.3em] hover:bg-red-700 transition-all transform hover:scale-105 shadow-2xl"
          >
            Enter Archive
          </a>
          <a 
            href="#gallery" 
            onClick={(e) => scrollToSection(e, '#gallery')}
            className="px-12 py-5 border border-white/30 text-white font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all transform hover:border-white"
          >
            Visual Legacy
          </a>
        </div>
      </div>

      <div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-10 p-2" 
        onClick={(e) => scrollToSection(e, '#history')}
      >
        <ChevronDown size={36} className="text-white/30 hover:text-rosso transition-colors" />
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(60px); }
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
