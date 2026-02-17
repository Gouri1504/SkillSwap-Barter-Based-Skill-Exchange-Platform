'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Trail } from '@react-three/drei';
import * as THREE from 'three';

function Person({ position, color, delay = 0 }: { position: [number, number, number]; color: string; delay?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + delay) * 0.15;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + delay) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.22, 0.7, 16, 32]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.4, 1.0, 0]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Right Arm - extended for exchange */}
      <mesh position={[0.4, 1.1, 0]} rotation={[0, 0, -0.8]}>
        <capsuleGeometry args={[0.08, 0.55, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.15, 0.0, 0]}>
        <capsuleGeometry args={[0.1, 0.55, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.15, 0.0, 0]}>
        <capsuleGeometry args={[0.1, 0.55, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

function SkillOrb({ startPos, endPos, color, speed, offset }: {
  startPos: [number, number, number];
  endPos: [number, number, number];
  color: string;
  speed: number;
  offset: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = ((Math.sin(state.clock.elapsedTime * speed + offset) + 1) / 2);
      meshRef.current.position.x = THREE.MathUtils.lerp(startPos[0], endPos[0], t);
      meshRef.current.position.y = THREE.MathUtils.lerp(startPos[1], endPos[1], t) + Math.sin(t * Math.PI) * 0.8;
      meshRef.current.position.z = THREE.MathUtils.lerp(startPos[2], endPos[2], t);

      const scale = 0.12 + Math.sin(state.clock.elapsedTime * 3 + offset) * 0.03;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Trail width={1.5} length={6} color={color} attenuation={(t) => t * t}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </Trail>
  );
}

function FloatingParticles() {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6 - 2,
        ],
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
        scale: 0.02 + Math.random() * 0.04,
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const matrix = new THREE.Matrix4();
      particles.forEach((particle, i) => {
        const y = particle.position[1] + Math.sin(state.clock.elapsedTime * particle.speed + particle.offset) * 0.5;
        matrix.setPosition(particle.position[0], y, particle.position[2]);
        matrix.scale(new THREE.Vector3(particle.scale, particle.scale, particle.scale));
        meshRef.current!.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#5c7cfa" emissive="#5c7cfa" emissiveIntensity={1} transparent opacity={0.5} />
    </instancedMesh>
  );
}

function CentralGlow() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[0.5, 32, 32]} position={[0, 1.2, 0]}>
        <MeshDistortMaterial
          color="#5c7cfa"
          emissive="#5c7cfa"
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
          distort={0.4}
          speed={3}
          roughness={0}
        />
      </Sphere>
    </Float>
  );
}

function Platform() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
      <circleGeometry args={[3, 64]} />
      <meshStandardMaterial
        color="#1a1b1e"
        transparent
        opacity={0.6}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#5c7cfa" />
      <pointLight position={[-5, 5, 5]} intensity={0.8} color="#f06595" />
      <pointLight position={[0, 3, -3]} intensity={0.6} color="#ffffff" />
      <spotLight position={[0, 8, 0]} angle={0.5} penumbra={1} intensity={0.5} color="#5c7cfa" />

      <Person position={[-1.5, 0, 0]} color="#5c7cfa" delay={0} />
      <Person position={[1.5, 0, 0]} color="#f06595" delay={Math.PI} />

      <SkillOrb startPos={[-1, 1.3, 0]} endPos={[1, 1.3, 0]} color="#5c7cfa" speed={0.6} offset={0} />
      <SkillOrb startPos={[1, 1.3, 0]} endPos={[-1, 1.3, 0]} color="#f06595" speed={0.6} offset={Math.PI} />
      <SkillOrb startPos={[-1.2, 1.5, 0.3]} endPos={[1.2, 1.5, 0.3]} color="#7c3aed" speed={0.5} offset={1.5} />

      <CentralGlow />
      <FloatingParticles />
      <Platform />

      <fog attach="fog" args={['#0a0a0f', 5, 15]} />
    </>
  );
}

export default function SkillExchangeScene() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
