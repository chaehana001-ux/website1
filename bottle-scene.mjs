import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const layer = document.querySelector('.bottle-layer');
const mount = layer.querySelector('.bottle-canvas');
const hero = document.querySelector('.hero');
const about = document.querySelector('.about');
const shop = document.querySelector('.shop');
const sticker = about.querySelector('.sticker');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const paths = [
  new URL('./assets/models/bottle-01.glb', import.meta.url).href,
  new URL('./assets/models/bottle-02.glb', import.meta.url).href,
  new URL('./assets/models/bottle-03.glb', import.meta.url).href,
];
const models = [];
const clamp = THREE.MathUtils.clamp;
let renderer;
let renderFrame = 0;
let currentTurns = null;
let lastIndex = -1;
let lastRenderTime = 0;
let renderWidth = 0;
let renderHeight = 0;
let disposed = false;
let scene;
let camera;
let environment;
let pmrem;

function disposeScene() {
  disposed = true;
  cancelAnimationFrame(renderFrame);
  for (const model of models) {
    model?.traverse(node => {
      node.geometry?.dispose();
      if (node.material) {
        for (const value of Object.values(node.material)) if (value?.isTexture) value.dispose();
        node.material.dispose();
      }
    });
  }
  environment?.dispose();
  pmrem?.dispose();
  renderer?.dispose();
}

function fitRenderer() {
  if (!renderer || disposed) return;
  const width = mount.clientWidth;
  const height = mount.clientHeight;
  if (!width || !height || (width === renderWidth && height === renderHeight)) return;
  renderWidth = width;
  renderHeight = height;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(width, height, false);
  const viewHeight = 3.65;
  const aspect = width / Math.max(1, height);
  camera.left = -viewHeight * aspect / 2;
  camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
}

function resize() {
  fitRenderer();
  scheduleRender();
}

function setOpacity(model, opacity) {
  model.visible = opacity > 0.001;
  if (!model.visible) return;
  model.traverse(node => {
    if (!node.isMesh) return;
    const transparent = opacity < 0.999;
    if (node.material.transparent !== transparent) {
      node.material.transparent = transparent;
      node.material.needsUpdate = true;
    }
    node.material.opacity = opacity;
    node.material.depthWrite = !transparent;
  });
}

function render(timestamp) {
  renderFrame = 0;
  if (disposed || !models[0] || document.hidden) return;
  const shopTop = shop.getBoundingClientRect().top;
  const viewportHeight = window.innerHeight;
  const isCovered = shopTop <= 0;
  layer.hidden = isCovered;
  if (isCovered) return;
  fitRenderer();

  const aboutStart = about.getBoundingClientRect().top + window.scrollY;
  const releaseScroll = Number(about.dataset.releaseScroll) || aboutStart + about.offsetHeight - viewportHeight;
  const end = Math.max(releaseScroll + 1, shopTop + window.scrollY - viewportHeight * 0.65);
  let scrollTurns;
  if (window.scrollY < aboutStart) {
    scrollTurns = clamp(window.scrollY / Math.max(1, aboutStart), 0, 1);
  } else if (window.scrollY < releaseScroll) {
    scrollTurns = 1 + clamp((window.scrollY - aboutStart) / Math.max(1, releaseScroll - aboutStart), 0, 1);
  } else {
    scrollTurns = 2 + clamp((window.scrollY - releaseScroll) / Math.max(1, end - releaseScroll), 0, 1);
  }
  const targetTurns = motionPreference.matches ? 0 : scrollTurns;
  if (currentTurns === null || motionPreference.matches) currentTurns = targetTurns;
  else {
    const elapsed = Math.max(0, timestamp - lastRenderTime);
    currentTurns = THREE.MathUtils.lerp(currentTurns, targetTurns, 1 - Math.exp(-elapsed / 120));
  }
  lastRenderTime = timestamp;
  if (Math.abs(targetTurns - currentTurns) < 0.0001) currentTurns = targetTurns;

  // Tie product changes to the exact words turning black in the pinned copy.
  const revealProgress = Number(about.dataset.revealProgress) || 0;
  const firstChange = Number(about.dataset.firstBottleChange) || 1;
  const secondChange = Number(about.dataset.secondBottleChange) || 1;
  const blendDuration = 0.035;
  const firstBlend = models[1]
    ? THREE.MathUtils.smootherstep(revealProgress, firstChange, firstChange + blendDuration)
    : 0;
  const secondBlend = models[2]
    ? THREE.MathUtils.smootherstep(revealProgress, secondChange, secondChange + blendDuration)
    : 0;
  const weights = [1 - firstBlend, firstBlend * (1 - secondBlend), firstBlend * secondBlend];
  const index = weights.indexOf(Math.max(...weights));
  for (let i = 0; i < models.length; i++) {
    if (!models[i]) continue;
    setOpacity(models[i], weights[i]);
    models[i].rotation.y = Math.PI / 2 + currentTurns * Math.PI * 2;
  }
  layer.dataset.blend = weights.map(weight => weight.toFixed(3)).join(',');

  const aboutTop = about.getBoundingClientRect().top;
  const arrival = THREE.MathUtils.smoothstep(1 - aboutTop / viewportHeight, 0, 1);
  const stickerRect = sticker.getBoundingClientRect();
  const pinnedCenter = stickerRect.top + stickerRect.height / 2;
  const heroCenter = Math.min(viewportHeight * 0.64, hero.offsetHeight * 0.64);
  // Use the text's middle gap while pinned, then stay put as Shop covers the bottle.
  const centerY = THREE.MathUtils.lerp(heroCenter, clamp(pinnedCenter, viewportHeight * 0.35, viewportHeight * 0.65), arrival);
  mount.style.top = `${centerY}px`;
  layer.dataset.productIndex = String(index);
  layer.dataset.turns = currentTurns.toFixed(4);
  if (index !== lastIndex) {
    lastIndex = index;
    layer.dataset.model = paths[index];
  }
  renderer.render(scene, camera);
  if (currentTurns !== targetTurns) scheduleRender();
}

function scheduleRender() {
  if (!renderFrame && !disposed) renderFrame = requestAnimationFrame(render);
}

function enhanceBottleMaterial(material) {
  if (!material?.isMeshStandardMaterial) return;
  // The supplied bottles use one baked material for both the glass and label,
  // so keep it softly translucent without a strong studio-light sheen.
  material.metalness = 0;
  material.roughness = 0.2;
  material.envMapIntensity = 0.72;
  if (material.isMeshPhysicalMaterial) {
    material.clearcoat = 0.5;
    material.clearcoatRoughness = 0.16;
    material.ior = 1.46;
    material.specularIntensity = 0.62;
    material.transmission = 0.14;
    material.thickness = 0.18;
    material.attenuationDistance = 2.4;
    material.attenuationColor = new THREE.Color(0xffffff);
  }
  material.needsUpdate = true;
}

async function loadModel(loader, path) {
  const gltf = await loader.loadAsync(path);
  const object = gltf.scene;
  object.traverse(node => {
    if (!node.isMesh) return;
    if (Array.isArray(node.material)) node.material.forEach(enhanceBottleMaterial);
    else enhanceBottleMaterial(node.material);
  });
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  object.position.sub(center);
  const normalized = new THREE.Group();
  normalized.add(object);
  // Preserve each source bottle's original proportions and only normalize its height.
  normalized.scale.setScalar(2.8 / Math.max(size.y, 0.001));
  const spin = new THREE.Group();
  spin.add(normalized);
  spin.visible = false;
  const tilt = new THREE.Group();
  tilt.rotation.set(0.06, 0, -0.12);
  tilt.add(spin);
  scene.add(tilt);
  return spin;
}

async function init() {
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    mount.append(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
    camera.position.set(0, 0.1, 6);
    camera.lookAt(0, 0, 0);
    pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    // Soft, low-contrast illumination reveals the translucent body without
    // returning to the strong glossy hotspots used in the first pass.
    scene.add(new THREE.AmbientLight(0xffffff, 1.12));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d1ca, 0.34));
    const bottleShapeLight = new THREE.DirectionalLight(0xfff8ef, 0.42);
    bottleShapeLight.position.set(-2.5, 3.5, 4);
    scene.add(bottleShapeLight);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    resize();
    // Decode sequentially to avoid three large texture/geometry allocations at once.
    for (let index = 0; index < paths.length; index++) {
      models[index] = await loadModel(loader, paths[index]);
      if (index === 0) {
        layer.dataset.state = 'ready';
        document.documentElement.classList.add('has-bottle');
      }
      layer.dataset.loadedModels = String(models.filter(Boolean).length);
      scheduleRender();
    }
    layer.dataset.state = 'complete';
  } catch (error) {
    console.error('Could not load the CULITA 3D scene:', error);
    layer.dataset.state = models[0] ? 'partial' : 'error';
    if (!models[0]) {
      layer.hidden = true;
      document.documentElement.classList.remove('has-bottle');
    }
  }
}
window.addEventListener('scroll', scheduleRender, { passive: true });
window.addEventListener('resize', resize);
window.addEventListener('pageshow', scheduleRender);
document.addEventListener('visibilitychange', scheduleRender);
motionPreference.addEventListener('change', scheduleRender);
document.fonts.ready.then(scheduleRender);
window.addEventListener('pagehide', event => { if (!event.persisted) disposeScene(); });
init();
