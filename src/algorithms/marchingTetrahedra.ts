export interface IsosurfaceResult {
  vertices: Float32Array;
  normals: Float32Array;
  triangleCount: number;
}

const TETRA_EDGES = [
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 3],
  [1, 3],
  [2, 3],
];

const TETRA_TRIANGLES: number[][][] = [
  [],
  [[0, 2, 3]],
  [[0, 1, 4]],
  [[1, 2, 3], [1, 3, 4]],
  [[1, 2, 5]],
  [[0, 1, 5], [0, 3, 5]],
  [[0, 2, 5], [1, 4, 5]],
  [[3, 4, 5]],
  [[3, 4, 5]],
  [[0, 2, 4], [1, 4, 5]],
  [[0, 1, 5], [0, 3, 5]],
  [[1, 2, 5]],
  [[1, 2, 3], [0, 3, 4]],
  [[0, 1, 2]],
  [[0, 2, 3]],
  [],
];

function buildTetraCaseIndex(v0: number, v1: number, v2: number, v3: number, iso: number): number {
  let idx = 0;
  if (v0 > iso) idx |= 1;
  if (v1 > iso) idx |= 2;
  if (v2 > iso) idx |= 4;
  if (v3 > iso) idx |= 8;
  return idx;
}

function interpolateVertex(
  out: Float32Array, outOffset: number,
  p0x: number, p0y: number, p0z: number, v0: number,
  p1x: number, p1y: number, p1z: number, v1: number,
  iso: number,
): void {
  const t = (iso - v0) / (v1 - v0);
  out[outOffset] = p0x + t * (p1x - p0x);
  out[outOffset + 1] = p0y + t * (p1y - p0y);
  out[outOffset + 2] = p0z + t * (p1z - p0z);
}

const CUBE_TETRAHEDRA = [
  [0, 1, 2, 5],
  [0, 2, 3, 7],
  [0, 5, 6, 7],
  [0, 5, 2, 7],
  [2, 5, 6, 7],
  [1, 4, 5, 7],
];

const CUBE_VERTICES = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
];

export function marchingTetrahedra(
  volume: Float32Array,
  resolution: number,
  isoValue: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number },
): IsosurfaceResult {
  const nx = resolution;
  const ny = resolution;
  const nz = resolution;

  const scaleX = (bounds.maxX - bounds.minX) / (nx - 1);
  const scaleY = (bounds.maxY - bounds.minY) / (ny - 1);
  const scaleZ = (bounds.maxZ - bounds.minZ) / (nz - 1);

  const maxTriangles = (nx - 1) * (ny - 1) * (nz - 1) * 2 * 3;
  const vertexBuffer = new Float32Array(maxTriangles * 3);
  const normalBuffer = new Float32Array(maxTriangles * 3);
  let vertexCount = 0;

  const cornerVals = new Float32Array(8);
  const edgeVerts = new Float32Array(6 * 3);

  for (let z = 0; z < nz - 1; z++) {
    for (let y = 0; y < ny - 1; y++) {
      for (let x = 0; x < nx - 1; x++) {
        for (let c = 0; c < 8; c++) {
          const cx = x + CUBE_VERTICES[c][0];
          const cy = y + CUBE_VERTICES[c][1];
          const cz = z + CUBE_VERTICES[c][2];
          cornerVals[c] = volume[cz * nx * ny + cy * nx + cx];
        }

        let allBelow = true;
        let allAbove = true;
        for (let c = 0; c < 8; c++) {
          if (cornerVals[c] >= isoValue) { allBelow = false; } else { allAbove = false; }
        }
        if (allBelow || allAbove) continue;

        const wx = bounds.minX + x * scaleX;
        const wy = bounds.minY + y * scaleY;
        const wz = bounds.minZ + z * scaleZ;

        for (let t = 0; t < 6; t++) {
          const tetra = CUBE_TETRAHEDRA[t];
          const i0 = tetra[0];
          const i1 = tetra[1];
          const i2 = tetra[2];
          const i3 = tetra[3];
          const v0 = cornerVals[i0];
          const v1 = cornerVals[i1];
          const v2 = cornerVals[i2];
          const v3 = cornerVals[i3];

          const caseIdx = buildTetraCaseIndex(v0, v1, v2, v3, isoValue);
          const tris = TETRA_TRIANGLES[caseIdx];

          if (tris.length === 0) continue;

          const p0x = wx + CUBE_VERTICES[i0][0] * scaleX;
          const p0y = wy + CUBE_VERTICES[i0][1] * scaleY;
          const p0z = wz + CUBE_VERTICES[i0][2] * scaleZ;
          const p1x = wx + CUBE_VERTICES[i1][0] * scaleX;
          const p1y = wy + CUBE_VERTICES[i1][1] * scaleY;
          const p1z = wz + CUBE_VERTICES[i1][2] * scaleZ;
          const p2x = wx + CUBE_VERTICES[i2][0] * scaleX;
          const p2y = wy + CUBE_VERTICES[i2][1] * scaleY;
          const p2z = wz + CUBE_VERTICES[i2][2] * scaleZ;
          const p3x = wx + CUBE_VERTICES[i3][0] * scaleX;
          const p3y = wy + CUBE_VERTICES[i3][1] * scaleY;
          const p3z = wz + CUBE_VERTICES[i3][2] * scaleZ;

          const val0 = v0;
          const val1 = v1;
          const val2 = v2;
          const val3 = v3;

          for (let tri = 0; tri < tris.length; tri++) {
            const edges = tris[tri];
            for (let e = 0; e < 3; e++) {
              const edgeIdx = edges[e];
              const edge = TETRA_EDGES[edgeIdx];
              const va = edge[0];
              const vb = edge[1];

              let pax: number, pay: number, paz: number, vala: number;
              let pbx: number, pby: number, pbz: number, valb: number;

              if (va === 0) { pax = p0x; pay = p0y; paz = p0z; vala = val0; }
              else if (va === 1) { pax = p1x; pay = p1y; paz = p1z; vala = val1; }
              else if (va === 2) { pax = p2x; pay = p2y; paz = p2z; vala = val2; }
              else { pax = p3x; pay = p3y; paz = p3z; vala = val3; }

              if (vb === 0) { pbx = p0x; pby = p0y; pbz = p0z; valb = val0; }
              else if (vb === 1) { pbx = p1x; pby = p1y; pbz = p1z; valb = val1; }
              else if (vb === 2) { pbx = p2x; pby = p2y; pbz = p2z; valb = val2; }
              else { pbx = p3x; pby = p3y; pbz = p3z; valb = val3; }

              interpolateVertex(vertexBuffer, vertexCount * 3,
                pax, pay, paz, vala,
                pbx, pby, pbz, valb,
                isoValue);
              vertexCount++;
            }
          }
        }
      }
    }
  }

  const finalVertices = vertexBuffer.slice(0, vertexCount * 3);
  const finalNormals = normalBuffer.slice(0, vertexCount * 3);

  for (let i = 0; i < vertexCount; i += 3) {
    const i0 = i * 3;
    const i1 = (i + 1) * 3;
    const i2 = (i + 2) * 3;

    const ax = finalVertices[i0], ay = finalVertices[i0 + 1], az = finalVertices[i0 + 2];
    const bx = finalVertices[i1], by = finalVertices[i1 + 1], bz = finalVertices[i1 + 2];
    const cx = finalVertices[i2], cy = finalVertices[i2 + 1], cz = finalVertices[i2 + 2];

    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;

    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    const nxn = nx / len, nyn = ny / len, nzn = nz / len;

    finalNormals[i0] = nxn; finalNormals[i0 + 1] = nyn; finalNormals[i0 + 2] = nzn;
    finalNormals[i1] = nxn; finalNormals[i1 + 1] = nyn; finalNormals[i1 + 2] = nzn;
    finalNormals[i2] = nxn; finalNormals[i2 + 1] = nyn; finalNormals[i2 + 2] = nzn;
  }

  return {
    vertices: finalVertices,
    normals: finalNormals,
    triangleCount: vertexCount / 3,
  };
}
