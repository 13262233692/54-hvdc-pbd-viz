import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { volumeVertexShader } from '@/shaders/volumeVertex.glsl';
import { volumeFragmentShader } from '@/shaders/volumeFragment.glsl';

interface VolumeRendererProps {
  spectrumData: Float32Array;
  resolution: number;
  intensity: number;
}

export default function VolumeRenderer({ spectrumData, resolution, intensity }: VolumeRendererProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const texture = useMemo(() => {
    const tex = new THREE.Data3DTexture(spectrumData, resolution, resolution, resolution);
    tex.format = THREE.RedFormat;
    tex.type = THREE.FloatType;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => {
    const texData = texture.image.data as unknown as Float32Array;
    if (texData !== spectrumData) {
      (texture.image as unknown as Record<string, unknown>).data = spectrumData;
      texture.needsUpdate = true;
    }
  }, [spectrumData, texture]);

  const uniforms = useMemo(() => ({
    uVolume: { value: texture },
    uThreshold: { value: 0.15 },
    uOpacity: { value: 0.8 },
    uTime: { value: 0 },
    uArcColor: { value: new THREE.Color(0x00d4ff) },
    uIntensity: { value: intensity },
  }), [texture, intensity]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uIntensity.value = intensity;
    }
  });

  const geometry = useMemo(() => new THREE.BoxGeometry(5, 5, 5), []);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={volumeVertexShader}
        fragmentShader={volumeFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
