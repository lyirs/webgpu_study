/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import { mat4, vec3 } from "wgpu-matrix";
import "./style.css";
import { uploadGLBModel } from "./tools/glb_import";
import { GLBShaderCache } from "./tools/glb_shader_cache";
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
const glbURL = "/DamagedHelmet.glb";
const glbFile = await fetch(glbURL)
  .then((response) => response.arrayBuffer())
  .then((arrayBuffer) => uploadGLBModel(arrayBuffer, device));
if (glbFile == undefined) alert("File not found");

const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height, 1],
  format: "depth24plus-stencil8",
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
  swapChainFormat
);

const defaultEye = vec3.set(0.0, 0.0, 1.0);
const center = vec3.set(0.0, 0.0, 0.0);
const up = vec3.set(0.0, 1.0, 0.0);
const aspect = canvas.width / canvas.height; // 相机宽高比例
const projectionMatrix = mat4.identity();
mat4.perspective((45 * Math.PI) / 180, aspect, 0.1, 100.0, projectionMatrix);

// 渲染
const render = () => {
  let commandEncoder = device.createCommandEncoder();

  const viewMatrix = mat4.identity();
  mat4.translate(viewMatrix, vec3.fromValues(10, 10, 10), viewMatrix);
  const modelViewProjectionMatrix = mat4.identity() as Float32Array;
  mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

  let upload = device.createBuffer({
    size: 4 * 4 * 4,
    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
    mappedAtCreation: true,
  });
  new Float32Array(upload.getMappedRange()).set(modelViewProjectionMatrix);
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
