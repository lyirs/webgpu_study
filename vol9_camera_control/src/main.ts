import "./style.css";
import Cube from "./components/Cube";
import Axes from "./components/Axes";
import { Camera } from "./components/Camera";
import { CameraController } from "./components/CameraController";
import { GPUManager } from "./components/GPUManager";

const gpuManager = GPUManager.getInstance();
await gpuManager.init();
const canvas = gpuManager.canvas as HTMLCanvasElement;
const device = gpuManager.device as GPUDevice;
const format = gpuManager.format as GPUTextureFormat;
const context = gpuManager.context as GPUCanvasContext;

const size = { width: canvas.width, height: canvas.height };

const aspect = canvas.width / canvas.height;

const camera = new Camera();
camera.perspective(aspect);
camera.lookAt({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: 0 });

new CameraController(camera, canvas);

const cube = new Cube();
const axes = new Axes(5);

// 深度贴图
const depthTexture = device.createTexture({
  size,
  sampleCount: 4,
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

const texture = device.createTexture({
  size: [canvas.width, canvas.height],
  sampleCount: 4, // 4倍抗锯齿
  format: format,
  usage: GPUTextureUsage.RENDER_ATTACHMENT, // 纹理用途
});
const view = texture.createView();

// cube.setRotation({ x: 1, y: 1, z: 0 });
// axes.setRotation({ x: 1, y: 1, z: 0 });

// 渲染
const render = () => {
  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: view,
        resolveTarget: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1.0 }, //background color
        loadOp: "clear",
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });
  // 设置渲染管线
  cube.render(renderPass, camera);
  axes.render(renderPass, camera);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
requestAnimationFrame(render);
