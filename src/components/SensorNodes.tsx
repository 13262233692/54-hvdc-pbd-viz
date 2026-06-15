import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { SensorConfig } from '../../shared/types';

interface SensorNodesProps {
  sensors: SensorConfig[];
  signalStrengths: number[];
}

export default function SensorNodes({ sensors, signalStrengths }: SensorNodesProps) {
  return (
    <group>
      {sensors.map((sensor, idx) => (
        <SensorMarker
          key={sensor.channelId}
          position={[sensor.position.x, sensor.position.y, sensor.position.z]}
          label={sensor.name}
          strength={signalStrengths[idx] ?? 0}
        />
      ))}
    </group>
  );
}

interface SensorMarkerProps {
  position: [number, number, number];
  label: string;
  strength: number;
}

function SensorMarker({ position, label, strength }: SensorMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + 0.15 * strength * Math.sin(t * 4 + position[0]);

    if (meshRef.current) {
      meshRef.current.scale.setScalar(0.08 * pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(0.18 * pulse);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.8 + strength * 0.5}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.12 + strength * 0.08}
          toneMapped={false}
        />
      </mesh>

      <Html
        position={[0, 0.25, 0]}
        center
        style={{
          color: '#00d4ff',
          fontSize: '10px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          textShadow: '0 0 4px #00d4ff',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {label}
      </Html>
    </group>
  );
}
