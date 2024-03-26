import { mat4, vec3 } from "wgpu-matrix";
import { Camera } from "./components/Camera";
import InputManager from "./components/InputManager";

/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { uploadGLBModel } from "./glb/glb_main";
import { GLBShaderCache } from "./glb/glb_shader_cache";
// 创建canvas
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// 获取webgpu上下文
if (navigator.gpu === undefined) {
  alert("当前浏览器不支持WebGPU，确保chrome版本在113及以上。");
  throw new Error("当前浏览器不支持WebGPU");
}
const context = canvas.getContext("webgpu") as GPUCanvasContext;
// 请求WebGPU适配器与GPU设备
const adapter = (await navigator.gpu.requestAdapter()) as GPUAdapter;
const device = await adapter.requestDevice();
const swapChainFormat = "bgra8unorm";
// 配置上下文
context.configure({
  device: device,
  // 上下文格式
  format: swapChainFormat,
  // 不透明度
  alphaMode: "opaque",
});

// 读取glb文件
const glbURL = "/Buggy.glb";
const glbFile = await fetch(glbURL)
  .then((response) => response.arrayBuffer())
  .then((arrayBuffer) => uploadGLBModel(arrayBuffer, device));
if (glbFile == undefined) alert("File not found");

const depthFormat = "depth24plus-stencil8" as GPUTextureFormat;
const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height, 1],
  format: depthFormat,
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

const viewParamsLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: { type: "uniform" },
    },
  ],
});

const viewParamBuf = device.createBuffer({
  size: 4 * 4 * 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const viewParamsBindGroup = device.createBindGroup({
  layout: viewParamsLayout,
  entries: [{ binding: 0, resource: { buffer: viewParamBuf } }],
});

const shaderCache = new GLBShaderCache(device);

const renderBundles = glbFile!.buildRenderBundles(
  device,
  shaderCache,
  viewParamsLayout,
  viewParamsBindGroup,
  swapChainFormat,
  depthFormat
);

const inputManager = InputManager.getInstance(canvas);
const camera = new Camera(vec3.create(0, 0, 200));
camera.aspect = canvas.width / canvas.height;
// 渲染
let lastFrameMS = Date.now();
const render = () => {
  const now = Date.now();
  const deltaTime = (now - lastFrameMS) / 1000;
  lastFrameMS = now;
  let commandEncoder = device.createCommandEncoder();

  let projView = mat4.multiply(
    camera.projectionMatrix,
    camera.update(deltaTime, inputManager.getInput())
  );
  let upload = device.createBuffer({
    size: 4 * 4 * 4,
    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
    mappedAtCreation: true,
  });
  new Float32Array(upload.getMappedRange()).set(projView);
  upload.unmap();

  commandEncoder.copyBufferToBuffer(upload, 0, viewParamBuf, 0, 4 * 4 * 4);

  let renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: [0.3, 0.3, 0.3, 1],
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthLoadOp: "clear",
      depthClearValue: 1,
      depthStoreOp: "store",
      stencilLoadOp: "clear",
      stencilClearValue: 0,
      stencilStoreOp: "store",
    },
  });
  renderPass.executeBundles(renderBundles);
  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);

  requestAnimationFrame(render);
};
requestAnimationFrame(render);
