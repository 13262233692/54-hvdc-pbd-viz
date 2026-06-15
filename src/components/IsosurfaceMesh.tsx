import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IsosurfaceMeshProps {
  vertices: Float32Array | null;
  normals: Float32Array | null;
  triangleCount: number;
}

const coreVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vFresnel;

  uniform float uTime;
  uniform float uPulseIntensity;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    vec3 viewDir = normalize(-position);
    vFresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);

    float pulse = 1.0 + sin(uTime * 4.0) * 0.05 * uPulseIntensity;
    vec3 pos = position + normal * pulse * 0.02 * uPulseIntensity;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const coreFragmentShader = `
  precision highp float;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vFresnel;

  uniform float uTime;
  uniform float uPulseIntensity;
  uniform vec3 uCoreColor;
  uniform vec3 uGlowColor;

  void main() {
    vec3 normal = normalize(vNormal);

    float fresnel = pow(1.0 - max(dot(normalize(-vPosition), normal), 0.0), 2.0);

    float coreIntensity = 0.6 + 0.4 * sin(uTime * 3.0) * uPulseIntensity;

    vec3 coreColor = uCoreColor * coreIntensity;
    vec3 glowColor = uGlowColor * fresnel * (1.0 + uPulseIntensity * 0.5);

    float noise = sin(vPosition.x * 10.0 + uTime * 2.0) * sin(vPosition.y * 12.0 - uTime * 1.5) * sin(vPosition.z * 8.0 + uTime);
    float arc = smoothstep(0.3, 0.9, noise * 0.5 + 0.5);
    vec3 arcColor = vec3(1.0, 0.9, 0.6) * arc * 0.3;

    vec3 finalColor = coreColor + glowColor + arcColor;
    float alpha = 0.85 + 0.15 * fresnel;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export default function IsosurfaceMesh({ vertices, normals, triangleCount }: IsosurfaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPulseIntensity: { value: 0 },
    uCoreColor: { value: new THREE.Color(0xff2200) },
    uGlowColor: { value: new THREE.Color(0xff6b35) },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.elapsedTime;
      materialRef.current.uniforms.uTime.value = t;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.0) + 0.2 * Math.sin(t * 3.7);
      materialRef.current.uniforms.uPulseIntensity.value = pulse;
    }

    if (meshRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.0);
      meshRef.current.scale.setScalar(1 + pulse * 0.03);
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geometryRef.current = geo;
    return geo;
  }, []);

  useMemo(() => {
    if (!geometryRef.current || !vertices || !normals) return;

    const posAttr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute | undefined;
    const normAttr = geometryRef.current.getAttribute('normal') as THREE.BufferAttribute | undefined;

    if (!posAttr || posAttr.count !== vertices.length / 3) {
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(vertices.slice(), 3));
    } else {
      posAttr.array = vertices.slice();
      posAttr.needsUpdate = true;
    }

    if (!normAttr || normAttr.count !== normals.length / 3) {
      geometryRef.current.setAttribute('normal', new THREE.BufferAttribute(normals.slice(), 3));
    } else {
      normAttr.array = normals.slice();
      normAttr.needsUpdate = true;
    }

    geometryRef.current.computeBoundingSphere();
    geometryRef.current.computeBoundingBox();
  }, [vertices, normals, triangleCount]);

  if (!vertices || triangleCount === 0) return null;

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#ff3300"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
