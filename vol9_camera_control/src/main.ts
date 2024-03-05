import "./style.css";
import Cube from "./components/Cube";
import Axes from "./components/Axes";
import { Camera } from "./components/Camera";
import { GPUManager } from "./components/GPUManager";
import { Scene } from "./components/Scene";
import { vec3 } from "wgpu-matrix";

const gpuManager = GPUManager.getInstance();
await gpuManager.init();
const canvas = gpuManager.canvas as HTMLCanvasElement;

const camera = new Camera(vec3.create(3, 2, 5));
camera.aspect = canvas.width / canvas.height;

const cube = new Cube();
const axes = new Axes(5);

const scene = new Scene();
scene.addObject(cube);
scene.addObject(axes);

// cube.setRotation({ x: 1, y: 1, z: 0 });
// axes.setRotation({ x: 1, y: 1, z: 0 });

let lastFrameMS = Date.now();
// 渲染
const render = () => {
  const now = Date.now();
  const deltaTime = (now - lastFrameMS) / 1000;
  lastFrameMS = now;

  scene.render(camera, deltaTime);
  requestAnimationFrame(render);
};
requestAnimationFrame(render);
