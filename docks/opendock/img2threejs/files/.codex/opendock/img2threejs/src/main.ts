import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./styles.css";

type ModelModule = Record<string, unknown>;
type ModelFactory = () => THREE.Group;

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) {
  throw new Error("preview root was not found");
}
const app = appElement;

const status = document.createElement("div");
status.className = "status";
status.textContent = "Loading generated model...";
app.append(status);

const canvas = document.createElement("canvas");
canvas.setAttribute("aria-label", "Generated Three.js model preview");
app.append(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101216);

const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
camera.position.set(4, 3, 6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x22252c, 1.8));
const key = new THREE.DirectionalLight(0xffffff, 3.2);
key.position.set(5, 8, 6);
key.castShadow = true;
scene.add(key);

const rim = new THREE.DirectionalLight(0x7ab8ff, 1.6);
rim.position.set(-5, 3, -4);
scene.add(rim);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(8, 96),
  new THREE.MeshStandardMaterial({ color: 0x1b1f27, roughness: 0.92 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.5;
floor.receiveShadow = true;
scene.add(floor);

function isFactory(value: unknown): value is ModelFactory {
  return typeof value === "function";
}

function selectFactory(module: ModelModule): ModelFactory | undefined {
  const preferred = Object.entries(module).find(
    ([name, value]) => /^create.+Model$/u.test(name) && isFactory(value),
  );
  if (preferred && isFactory(preferred[1])) {
    return preferred[1];
  }
  return Object.values(module).find(isFactory);
}

function frameObject(object: THREE.Object3D): void {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) {
    return;
  }
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.1);
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.near = Math.max(distance / 1000, 0.001);
  camera.far = distance * 20;
  camera.position.copy(sphere.center).add(new THREE.Vector3(0.8, 0.55, 1).normalize().multiplyScalar(distance * 1.15));
  camera.updateProjectionMatrix();
  controls.target.copy(sphere.center);
  controls.update();
  floor.position.y = box.min.y - Math.max(radius * 0.04, 0.02);
}

async function loadModel(): Promise<void> {
  try {
    const modulePath = `./generated-model.ts?time=${Date.now()}`;
    const module = (await import(/* @vite-ignore */ modulePath)) as ModelModule;
    const factory = selectFactory(module);
    if (!factory) {
      throw new Error("generated-model.ts does not export a create*Model function");
    }
    const model = factory();
    if (!(model instanceof THREE.Object3D)) {
      throw new Error("the generated factory did not return a Three.js Object3D");
    }
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(model);
    frameObject(model);
    status.textContent = "Drag to orbit, scroll to zoom";
    status.dataset.state = "ready";
  } catch (error) {
    status.textContent =
      error instanceof Error && error.message.includes("generated-model")
        ? "Generate src/generated-model.ts to start the preview"
        : `Preview failed: ${error instanceof Error ? error.message : String(error)}`;
    status.dataset.state = "error";
  }
}

function resize(): void {
  const width = Math.max(app.clientWidth, 1);
  const height = Math.max(app.clientHeight, 1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

const observer = new ResizeObserver(resize);
observer.observe(app);
resize();
void loadModel();

function render(): void {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
