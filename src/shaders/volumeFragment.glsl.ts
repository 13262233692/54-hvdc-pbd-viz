export const volumeFragmentShader = `
precision highp float;
precision highp sampler3D;

varying vec3 vOrigin;
varying vec3 vDirection;

uniform sampler3D uVolume;
uniform float uThreshold;
uniform float uOpacity;
uniform float uTime;
uniform vec3 uArcColor;
uniform float uIntensity;

vec2 hitBox(vec3 orig, vec3 dir) {
  vec3 box_min = vec3(-0.5);
  vec3 box_max = vec3(0.5);
  vec3 inv_dir = 1.0 / dir;
  vec3 tmin_tmp = (box_min - orig) * inv_dir;
  vec3 tmax_tmp = (box_max - orig) * inv_dir;
  vec3 tmin = min(tmin_tmp, tmax_tmp);
  vec3 tmax = max(tmin_tmp, tmax_tmp);
  float t0 = max(tmin.x, max(tmin.y, tmin.z));
  float t1 = min(tmax.x, min(tmax.y, tmax.z));
  return vec2(t0, t1);
}

float samp(vec3 p) {
  return texture(uVolume, p).r;
}

void main() {
  vec3 rayDir = normalize(vDirection);
  vec2 bounds = hitBox(vOrigin, rayDir);

  if (bounds.x > bounds.y) discard;

  bounds.x = max(bounds.x, 0.0);

  vec3 p = vOrigin + bounds.x * rayDir;
  vec3 inc = 1.0 / abs(rayDir);
  float delta = min(inc.x, min(inc.y, inc.z));
  delta /= 64.0;

  vec4 color = vec4(0.0);
  float remaining = 1.0;

  for (float t = bounds.x; t < bounds.y; t += delta) {
    vec3 samplePos = p + 0.5;

    float val = samp(samplePos);

    if (val > uThreshold) {
      float alpha = val * uOpacity * uIntensity;
      alpha = clamp(alpha, 0.0, 1.0);

      vec3 glowColor = uArcColor * (1.0 + 0.5 * sin(uTime * 3.0 + val * 10.0));

      float coreIntensity = smoothstep(uThreshold, 1.0, val);
      vec3 coreColor = mix(glowColor, vec3(1.0, 0.95, 0.9), coreIntensity * 0.6);

      color.rgb += coreColor * alpha * remaining;
      color.a += alpha * remaining;
      remaining *= (1.0 - alpha);

      if (remaining < 0.01) break;
    }

    p += rayDir * delta;
  }

  color.a = clamp(color.a, 0.0, 1.0);

  gl_FragColor = color;
}
`;
