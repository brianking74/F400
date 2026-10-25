
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, MeshDistortMaterial, Text, Html } from '@react-three/drei';
import SectionTitle from './SectionTitle';
import { Info, Maximize2, Move } from 'lucide-react';

const CarPlaceholder = () => {
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      {/* Chassis - Wedge Shape */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[4.8, 0.5, 1.9]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} wireframe />
      </mesh>
      
      {/* Upper Body / Cabin */}
      <mesh position={[-0.2, 0.85, 0]}>
        <boxGeometry args={[2.2, 0.5, 1.6]} />
        <meshStandardMaterial color="#FF2800" metalness={0.8} roughness={0.2} wireframe />
      </mesh>

      {/* Wheels */}
      {[[-1.5, 0.2, 0.9], [-1.5, 0.2, -0.9], [1.5, 0.2, 0.9], [1.5, 0.2, -0.9]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
          <meshStandardMaterial color="#444" wireframe />
        </mesh>
      ))}

      {/* Hood Hotspot */}
      <Html position={[1.5, 0.6, 0]}>
        <div className="group relative">
          <div className="w-4 h-4 bg-rosso rounded-full animate-ping absolute inset-0"></div>
          <div className="w-4 h-4 bg-rosso rounded-full relative cursor-help"></div>
          <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/90 text-white text-[10px] uppercase tracking-widest p-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-rosso/50 pointer-events-none">
            Colombo V12 Engine Bay
          </div>
        </div>
      </Html>

      {/* Cabin Hotspot */}
      <Html position={[-0.2, 1.1, 0]}>
        <div className="group relative">
          <div className="w-4 h-4 bg-rosso rounded-full animate-ping absolute inset-0"></div>
          <div className="w-4 h-4 bg-rosso rounded-full relative cursor-help"></div>
          <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/90 text-white text-[10px] uppercase tracking-widest p-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-rosso/50 pointer-events-none">
            Connolly Leather Interior
          </div>
        </div>
      </Html>
    </group>
  );
};

const VirtualStudio: React.FC = () => {
  return (
    <section id="studio" className="py-24 bg-neutral-950 relative overflow-hidden h-[90vh] flex flex-col">
      <div className="max-w-7xl mx-auto px-6 z-10 w-full">
        <SectionTitle 
          title="Digital Twin" 
          subtitle="Interactive Structural Analysis" 
          light
        />
      </div>

      <div className="flex-grow relative cursor-grab active:cursor-grabbing">
        <div className="absolute top-4 left-6 z-10 pointer-events-none">
          <div className="flex flex-col space-y-4">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 space-y-2">
              <div className="flex items-center space-x-2 text-rosso">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">System Status: Active</span>
              </div>
              <p className="text-white/40 text-[9px] uppercase tracking-tighter max-w-[150px]">
                Wireframe reconstruction of Pininfarina wedge silhouette. 
              </p>
            </div>
            
            <div className="flex items-center space-x-3 text-white/20">
              <Move size={16} />
              <span className="text-[9px] uppercase tracking-widest">Left Click to Rotate</span>
            </div>
            <div className="flex items-center space-x-3 text-white/20">
              <Maximize2 size={16} />
              <span className="text-[9px] uppercase tracking-widest">Scroll to Zoom</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 z-0">
          <Canvas dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={50} />
            <OrbitControls 
              enablePan={false} 
              minDistance={4} 
              maxDistance={10} 
              autoRotate 
              autoRotateSpeed={0.5}
            />
            
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#FF2800" />
              <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
              
              <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <CarPlaceholder />
              </Float>
              
              {/* Floor Grid */}
              <gridHelper args={[20, 40, '#FF2800', '#111']} position={[0, -0.2, 0]} opacity={0.15} transparent />
              
              {/* Background Glow */}
              <mesh position={[0, -1, -5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshBasicMaterial color="#FF2800" opacity={0.02} transparent />
              </mesh>
            </Suspense>
          </Canvas>
        </div>
      </div>

      <div className="absolute bottom-12 right-6 z-10 text-right">
        <div className="text-rosso font-serif text-5xl font-bold opacity-10">4.8L V12</div>
        <div className="text-white/20 text-[10px] uppercase tracking-[0.5em] mt-2">Reference Geometry Alpha-1976</div>
      </div>
    </section>
  );
};

export default VirtualStudio;
