import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import VolumeRenderer from './VolumeRenderer';
import TransformerShell from './TransformerShell';
import SensorNodes from './SensorNodes';
import IsosurfaceMesh from './IsosurfaceMesh';
import { useStore } from '@/store/useStore';
import { useIsosurface } from '@/hooks/useIsosurface';

export default function Scene3D() {
  const spectrumData = useStore((s) => s.spectrumData);
  const resolution = useStore((s) => s.spectrumResolution);
  const spectrumVersion = useStore((s) => s.spectrumVersion);
  const intensity = useStore((s) => s.intensity);
  const sensorConfig = useStore((s) => s.sensorConfig);
  const latestFrame = useStore((s) => s.latestFrame);

  const bounds = useMemo(() => ({
    minX: -2.5, maxX: 2.5,
    minY: -2.5, maxY: 2.5,
    minZ: -2.5, maxZ: 2.5,
  }), []);

  const isosurface = useIsosurface(
    spectrumData,
    resolution,
    0.72,
    bounds,
    spectrumVersion,
  );

  const signalStrengths = sensorConfig.map((_, idx) => {
    if (!latestFrame) return 0;
    const ch = latestFrame.channels.find((c) => c.channelId === idx);
    if (!ch || ch.pulses.length === 0) return 0;
    return Math.min(1, ch.pulses.reduce((s, p) => s + p.amplitude, 0) / ch.pulses.length / 500);
  });

  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 100 }}
      style={{ background: '#0a0e27' }}
      gl={{ antialias: true, alpha: false }}
    >
      <Suspense fallback={null}>
        <ambientLight color="#1a2550" intensity={0.4} />
        <directionalLight color="#c0d8ff" intensity={0.6} position={[5, 8, 3]} />

        {spectrumData && (
          <VolumeRenderer
            spectrumData={spectrumData}
            resolution={resolution}
            intensity={intensity}
            spectrumVersion={spectrumVersion}
          />
        )}

        {isosurface.hasResult && isosurface.triangleCount > 0 && (
          <IsosurfaceMesh
            vertices={isosurface.vertices}
            normals={isosurface.normals}
            triangleCount={isosurface.triangleCount}
          />
        )}

        <TransformerShell />
        <SensorNodes sensors={sensorConfig} signalStrengths={signalStrengths} />

        <Grid
          position={[0, -3.5, 0]}
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1a2550"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#0d1a40"
          fadeDistance={25}
          fadeStrength={1}
          infiniteGrid={false}
        />

        <OrbitControls
          makeDefault
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={4}
          maxDistance={20}
          enableDamping
          dampingFactor={0.08}
        />

        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
          <Vignette darkness={0.5} offset={0.3} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
