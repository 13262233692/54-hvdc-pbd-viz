import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { volumeVertexShader } from '@/shaders/volumeVertex.glsl';
import { volumeFragmentShader } from '@/shaders/volumeFragment.glsl';

interface VolumeRendererProps {
  spectrumData: Float32Array;
  resolution: number;
  intensity: number;
  spectrumVersion: number;
}

export default function VolumeRenderer({ spectrumData, resolution, intensity, spectrumVersion }: VolumeRendererProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const textureRef = useRef<THREE.Data3DTexture | null>(null);
  const glTextureRef = useRef<WebGLTexture | null>(null);
  const needsUploadRef = useRef(false);
  const uploadedOnceRef = useRef(false);
  const { gl } = useThree();

  const texture = useMemo(() => {
    const initialData = new Float32Array(resolution ** 3);
    const tex = new THREE.Data3DTexture(initialData, resolution, resolution, resolution);
    tex.format = THREE.RedFormat;
    tex.type = THREE.FloatType;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    textureRef.current = tex;
    return tex;
  }, [resolution]);

  useEffect(() => {
    needsUploadRef.current = true;
  }, [spectrumVersion]);

  useEffect(() => {
    return () => {
      if (glTextureRef.current) {
        gl.deleteTexture(glTextureRef.current);
        glTextureRef.current = null;
      }
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      if (materialRef.current) {
        materialRef.current.dispose();
        materialRef.current = null;
      }
    };
  }, [gl]);

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

    if (needsUploadRef.current && textureRef.current) {
      needsUploadRef.current = false;

      const glContext = gl.getContext() as WebGL2RenderingContext | null;
      if (!glContext) return;

      const currentTexture = gl.properties.get(textureRef.current);
      const webglTex = currentTexture?.__webglTexture as WebGLTexture | undefined;

      if (!webglTex && !glTextureRef.current) {
        textureRef.current.needsUpdate = true;
        uploadedOnceRef.current = false;
        return;
      }

      const texName = webglTex || glTextureRef.current;
      if (!texName) return;
      glTextureRef.current = texName;

      const prevTexture = glContext.getParameter(glContext.TEXTURE_BINDING_3D);
      glContext.bindTexture(glContext.TEXTURE_3D, texName);

      glContext.pixelStorei(glContext.UNPACK_ALIGNMENT, 1);

      if (!uploadedOnceRef.current) {
        glContext.texImage3D(
          glContext.TEXTURE_3D,
          0,
          glContext.R32F,
          resolution,
          resolution,
          resolution,
          0,
          glContext.RED,
          glContext.FLOAT,
          spectrumData,
        );
        uploadedOnceRef.current = true;
      } else {
        glContext.texSubImage3D(
          glContext.TEXTURE_3D,
          0,
          0, 0, 0,
          resolution,
          resolution,
          resolution,
          glContext.RED,
          glContext.FLOAT,
          spectrumData,
        );
      }

      if (prevTexture !== null) {
        glContext.bindTexture(glContext.TEXTURE_3D, prevTexture);
      }
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
