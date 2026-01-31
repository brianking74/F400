
import React from 'react';
import SectionTitle from './SectionTitle';

interface HistoryProps {
  customImage?: string;
}

const History: React.FC<HistoryProps> = ({ customImage }) => {
  return (
    <section id="history" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle 
          title="A Legacy of Elegance" 
          subtitle="Heritage 1976 – 1979" 
        />

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 text-gray-800 leading-relaxed text-lg">
            <p>
              Introduced at the <span className="font-semibold">1976 Paris Motor Show</span>, the Ferrari 400 was the sophisticated successor to the 365 GT4 2+2. It wasn't just another supercar; it was a refined statement of purpose, designed for the trans-continental grand tour.
            </p>
            <p>
              Its Pininfarina-styled steel body was a masterclass in clean, understated lines. Underneath the long, elegant hood sat the heart of a champion: the <span className="text-rosso font-bold">4.8-liter Colombo V12 engine</span>, producing 340 hp and propelling the luxurious cabin to speeds of 240 km/h.
            </p>
            <div className="border-l-4 border-rosso pl-6 py-2 italic font-serif text-xl my-8">
              "The 400 marked a turning point in Maranello: the first Ferrari ever to offer a factory automatic transmission."
            </div>
            <p>
              This bold move catered to the growing luxury market, particularly in the United States, providing effortless power without sacrificing the soul of a Ferrari. Only ~502 units were produced during its initial run, making it a rare gem in the Ferrari lineage.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 border-2 border-rosso/20 group-hover:border-rosso/40 transition-colors pointer-events-none"></div>
            <img 
              src={customImage || "https://images.unsplash.com/photo-1627454820516-dc767abc433a?auto=format&fit=crop&q=80&w=1000"} 
              alt="Ferrari 400 Front Profile" 
              className="w-full shadow-2xl relative z-10 bg-gray-100 min-h-[400px] object-cover"
            />
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-rosso font-serif text-3xl font-bold">4823</p>
                <p className="text-xs uppercase tracking-widest text-gray-500">cc Capacity</p>
              </div>
              <div className="text-center">
                <p className="text-rosso font-serif text-3xl font-bold">340</p>
                <p className="text-xs uppercase tracking-widest text-gray-500">Horsepower</p>
              </div>
              <div className="text-center">
                <p className="text-rosso font-serif text-3xl font-bold">1976</p>
                <p className="text-xs uppercase tracking-widest text-gray-500">Launch Year</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default History;
