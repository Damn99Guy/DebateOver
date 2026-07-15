import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, Float } from '@react-three/drei';

// Questa è la geometria 3D del nostro Sigillo Imperiale che galleggia nello spazio
function FloatingSeal() {
  const sealRef = useRef();

  // Animazione di rotazione leggera basata sul tempo ed interazione col mouse
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    sealRef.current.rotation.x = Math.sin(t / 4) / 4;
    sealRef.current.rotation.y = t / 3;
    sealRef.current.rotation.z = Math.sin(t / 2) / 8;
    sealRef.current.position.y = Math.sin(t / 1.5) / 10;
  });

  return (
    <group ref={sealRef}>
      {/* Corpo del Sigillo di Ceralacca (Effetto distorto e liquido) */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 1.8, 0.25, 32]} />
        <MeshDistortMaterial
          color="#9e1a1a" // Rosso ceralacca reale
          roughness={0.1}
          metalness={0.8}
          distort={0.15} // Rende i bordi "liquidi" e imperfetti come vera ceralacca
          speed={2}
        />
      </mesh>

      {/* Lo stemma dorato incassato nel sigillo */}
      <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.1, 16, 100]} />
        <meshStandardMaterial 
          color="#ffd700" 
          metalness={1} 
          roughness={0.2} 
        />
      </mesh>

      {/* Corona / Icona centrale in oro 3D */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 0.8, 4]} />
        <meshStandardMaterial 
          color="#ffb700" 
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
    </group>
  );
}

export default function Certificate3D() {
  return (
    <div className="w-full h-[450px] bg-gradient-to-b from-black/40 to-amber-950/20 rounded-3xl border border-amber-500/20 shadow-[0_20px_50px_rgba(255,191,0,0.05)] overflow-hidden relative group">
      {/* Sfondo particellare o glow */}
      <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />

      {/* Canvas 3D */}
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }} className="w-full h-full cursor-grab active:cursor-grabbing">
        {/* Luci d'atmosfera dinamiche per far brillare il metallo */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffd700" castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={1} color="#ffffff" />
        <spotLight position={[0, 5, 0]} intensity={2} angle={0.3} penumbra={1} color="#ff0000" />

        <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
          <FloatingSeal />
        </Float>

        {/* Permette all'utente di ruotare l'oggetto con il mouse, ma con dei limiti per non perdersi nello spazio */}
        <OrbitControls 
          enableZoom={false} 
          maxPolarAngle={Math.PI / 1.8} 
          minPolarAngle={Math.PI / 2.5} 
        />
      </Canvas>

      <div className="absolute bottom-6 left-6 right-6 text-center pointer-events-none">
        <span className="text-[10px] tracking-[0.2em] font-bold text-amber-400 uppercase bg-black/60 backdrop-blur-md border border-amber-500/20 px-3 py-1.5 rounded-full shadow-lg">
          Trascina per ispezionare il sigillo imperiale
        </span>
      </div>
    </div>
  );
}