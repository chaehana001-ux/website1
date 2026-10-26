import * as THREE from 'three';

// The scan's roughness atlas separates print (rough) from bare bottle (smooth).
// Reuse that boundary instead of applying transparency across the printed label.
export function createGlassMaps(source, anisotropy, tint = 0x58c6bd) {
  if (!source.map?.image || !source.roughnessMap?.image) return null;
  const canvas = document.createElement('canvas');
  canvas.width = source.map.image.width;
  canvas.height = source.map.image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(source.map.image, 0, 0);
  const color = context.getImageData(0, 0, canvas.width, canvas.height);
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
  maskContext.drawImage(source.roughnessMap.image, 0, 0, canvas.width, canvas.height);
  const mask = maskContext.getImageData(0, 0, canvas.width, canvas.height);
  const targetHue = new THREE.Color(tint).getHSL({}).h;
  for (let i = 0; i < color.data.length; i += 4) {
    let glass = 1 - THREE.MathUtils.smoothstep(mask.data[i + 1] / 255, 0.36, 0.7);
    // The amber and lemon scans have smoother ink than the emerald scan.
    // Protect artwork whose hue differs from the liquid, even on smooth paper.
    const r = color.data[i] / 255, g = color.data[i + 1] / 255, b = color.data[i + 2] / 255;
    const maximum = Math.max(r, g, b), minimum = Math.min(r, g, b);
    const delta = maximum - minimum;
    if (delta > 0.12 && maximum > 0) {
      let hue = maximum === r ? (g - b) / delta + (g < b ? 6 : 0)
        : maximum === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
      hue /= 6;
      const difference = Math.min(Math.abs(hue - targetHue), 1 - Math.abs(hue - targetHue));
      glass *= 1 - THREE.MathUtils.smoothstep(difference, 0.055, 0.105);
    }
    if (maximum < 0.2) glass = 0;
    const strength = Math.round(glass * 255);
    mask.data[i] = mask.data[i + 1] = mask.data[i + 2] = strength;
    mask.data[i + 3] = 255;
  }
  maskContext.putImageData(mask, 0, 0);
  const transmissionMap = new THREE.CanvasTexture(maskCanvas);
  for (const texture of [transmissionMap]) {
    texture.flipY = source.map.flipY;
    texture.wrapS = source.map.wrapS;
    texture.wrapT = source.map.wrapT;
    texture.offset.copy(source.map.offset);
    texture.repeat.copy(source.map.repeat);
    texture.rotation = source.map.rotation;
    texture.center.copy(source.map.center);
    texture.channel = source.map.channel;
    texture.anisotropy = anisotropy;
  }
  transmissionMap.colorSpace = THREE.NoColorSpace;
  return { colorMap: source.map, transmissionMap };
}

export function separateCap(geometry, matrixWorld, bounds) {
  const positions = geometry.getAttribute('position');
  const index = geometry.index;
  const count = index ? index.count : positions.count;
  const height = bounds.max.y - bounds.min.y;
  const cutoff = bounds.min.y + height * 0.825;
  const point = new THREE.Vector3();
  const heights = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    heights[i] = point.fromBufferAttribute(positions, i).applyMatrix4(matrixWorld).y;
  }
  const body = [];
  const cap = [];
  for (let i = 0; i < count; i += 3) {
    const a = index ? index.getX(i) : i;
    const b = index ? index.getX(i + 1) : i + 1;
    const c = index ? index.getX(i + 2) : i + 2;
    const part = (heights[a] + heights[b] + heights[c]) / 3 >= cutoff ? cap : body;
    part.push(a, b, c);
  }
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array([...body, ...cap]), 1));
  geometry.clearGroups();
  geometry.addGroup(0, body.length, 0);
  geometry.addGroup(body.length, cap.length, 1);
  return { bodyTriangles: body.length / 3, capTriangles: cap.length / 3 };
}

export function prepareBottleMesh(mesh, bounds, anisotropy, tint) {
  if (Array.isArray(mesh.material) || !mesh.material?.isMeshPhysicalMaterial) return;
  const source = mesh.material;
  const maps = createGlassMaps(source, anisotropy, tint);
  const glass = source.clone();
  glass.name = 'Bottle glass and opaque printed label';
  glass.metalness = 0;
  glass.roughness = 0.48;
  glass.normalScale.set(0.16, 0.16);
  glass.envMapIntensity = 0.45;
  glass.clearcoat = 0;
  glass.specularColor.set(0xffffff);
  glass.specularIntensity = 1;
  glass.ior = 1.5;
  glass.side = THREE.FrontSide;
  glass.transmission = maps ? 0.28 : 0;
  glass.thickness = (bounds.max.y - bounds.min.y) * 0.012;
  glass.attenuationDistance = 1.2;
  glass.attenuationColor.set(0xf3fffa);
  if (maps) {
    glass.map = maps.colorMap;
    glass.transmissionMap = maps.transmissionMap;
  }
  const cap = source.clone();
  cap.name = 'Satin coated cap';
  cap.metalness = 0.12;
  cap.roughness = 0.36;
  cap.roughnessMap = null;
  cap.normalScale.set(0.22, 0.22);
  cap.envMapIntensity = 0.7;
  cap.clearcoat = 0.18;
  cap.clearcoatRoughness = 0.25;
  cap.specularColor.set(0xffffff);
  cap.specularIntensity = 0.8;
  cap.transmission = 0;
  cap.thickness = 0;
  mesh.userData.bottleParts = separateCap(mesh.geometry, mesh.matrixWorld, bounds);
  mesh.material = [glass, cap];
  source.dispose();
}

export function createLiquidVolume(size, color) {
  const radius = Math.min(size.x, size.z) * 0.455;
  const y = fraction => size.y * (fraction - 0.5);
  const points = [
    [0, 0.025], [0.88, 0.025], [0.98, 0.045], [1, 0.08],
    [1, 0.63], [0.98, 0.665], [0.89, 0.69], [0.72, 0.718],
    [0.62, 0.73], [0.57, 0.732], [0, 0.732],
  ].map(([r, h]) => new THREE.Vector2(radius * r, y(h)));
  const liquid = new THREE.Mesh(
    new THREE.LatheGeometry(points, 64),
    new THREE.MeshPhysicalMaterial({
      name: 'Colored liquid volume', color, metalness: 0, roughness: 0.16,
      ior: 1.33, specularIntensity: 0.65, envMapIntensity: 0.45,
    }),
  );
  liquid.name = 'Inner liquid with fill surface';
  return liquid;
}
