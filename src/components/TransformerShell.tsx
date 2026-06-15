import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

export default function TransformerShell() {
  const size = 5;
  const half = size / 2;

  const edges = useMemo(() => {
    const geo = new THREE.BoxGeometry(size, size, size);
    return new THREE.EdgesGeometry(geo);
  }, [size]);

  const gridLines = useMemo(() => {
    const lines: [number, number, number][][] = [];
    const divisions = 5;
    const step = size / divisions;

    for (let i = 0; i <= divisions; i++) {
      const offset = -half + i * step;

      lines.push(
        [[offset, -half, -half], [offset, half, -half]],
        [[offset, -half, half], [offset, half, half]],
        [[-half, offset, -half], [half, offset, -half]],
        [[-half, offset, half], [half, offset, half]],
        [[-half, -half, offset], [half, -half, offset]],
        [[-half, half, offset], [half, half, offset]],
      );
    }

    return lines;
  }, [size, half]);

  return (
    <group>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#1a2550" linewidth={1} transparent opacity={0.8} />
      </lineSegments>

      {gridLines.map((points, idx) => (
        <Line
          key={idx}
          points={points}
          color="#1a2550"
          lineWidth={0.5}
          transparent
          opacity={0.15}
        />
      ))}

      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial color="#0a1030" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
