import "./style.css";
import Cube from "./components/Cube";
import Axes from "./components/Axes";
import { Camera } from "./components/Camera";
import { CameraController } from "./components/CameraController";
import { InitGPU } from "./helper/init";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;
const size = { width: canvas.width, height: canvas.height };

const aspect = canvas.width / canvas.height;

const camera = new Camera();
camera.aspect = aspect;
camera.perspective();
camera.lookAt({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: 0 });

new CameraController(camera, canvas);

const cube = new Cube(device, format);
const axes = new Axes(device, format, 5);

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
// 为了使 Worker 能够处理事件，定期将控制权交还给浏览器是很重要的。
// 在 Worker 中使用传统的 requestAnimationFrame() 循环是确保事件被正确处理的一种方式。
// 不应该简单地使用类似 while(true) 的无限循环
requestAnimationFrame(render);
