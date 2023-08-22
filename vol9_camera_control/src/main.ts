import "./style.css";
import Cube from "./components/Cube";
import Axes from "./components/Axes";
import { Camera } from "./components/Camera";
import { CameraController } from "./components/CameraController";
import { GPUManager } from "./components/GPUManager";
import { Scene } from "./components/Scene";

const gpuManager = GPUManager.getInstance();
await gpuManager.init();
const canvas = gpuManager.canvas as HTMLCanvasElement;

const aspect = canvas.width / canvas.height;

const camera = new Camera();
camera.perspective(aspect);
camera.lookAt({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: 0 });

new CameraController(camera, canvas);

const cube = new Cube();
const axes = new Axes(5);

const scene = new Scene();
scene.addObject(cube);
scene.addObject(axes);

// cube.setRotation({ x: 1, y: 1, z: 0 });
// axes.setRotation({ x: 1, y: 1, z: 0 });

// 渲染
const render = () => {
  scene.render(camera);
  requestAnimationFrame(render);
};
requestAnimationFrame(render);
