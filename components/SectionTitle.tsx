
import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  light?: boolean;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, light = false }) => {
  return (
    <div className="mb-16 text-center">
      <h2 className={`text-4xl md:text-5xl font-serif mb-4 ${light ? 'text-white' : 'text-rosso'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-lg max-w-2xl mx-auto uppercase tracking-widest ${light ? 'text-gray-300' : 'text-gray-600'}`}>
          {subtitle}
        </p>
      )}
      <div className={`w-24 h-1 mx-auto mt-6 bg-rosso`}></div>
    </div>
  );
};

export default SectionTitle;
