export const volumeVertexShader = `
varying vec3 vOrigin;
varying vec3 vDirection;

uniform mat4 modelMatrix;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPosition, 1.0));
  vDirection = position - vOrigin;
  gl_Position = projectionMatrix * mvPosition;
}
`;
