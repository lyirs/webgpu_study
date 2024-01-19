/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;

// RGB TO YUV
// prettier-ignore
const rgb2yuv = new Float32Array([ // 注意缓冲区
  0.299, -0.1473, 0.615, 1.0,
  0.587, -.2886, -.51499, 1.0,
  0.114,  0.436, -.1001, 1.0
]);
const rgb2yuvBuffer = device.createBuffer({
  size: rgb2yuv.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(rgb2yuvBuffer, 0, rgb2yuv);

// Gaussian
// prettier-ignore
const gaussianBufferValues = new Float32Array([ // 注意缓冲区
  0.0675,  0.125,  0.0675, 0.0,
  0.125,  0.250,  0.1250, 0.0,
  0.0675,  0.125,  0.0675 , 0.0
]);
const gaussianBuffer = device.createBuffer({
  size: gaussianBufferValues.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(gaussianBuffer, 0, gaussianBufferValues);
// prettier-ignore
const kernelOffsetsValue = new Float32Array([
  -1/256, -1/256, 0, 0,
  0     , -1/256, 0, 0,
  1/256 , -1/256, 0, 0,
  -1/256,      0, 0, 0,
  0     ,      0, 0, 0,
  1/256 ,      0, 0, 0,
  -1/256,  1/256, 0, 0,
  0     ,  1/256, 0, 0,
  1/256 ,  1/256, 0, 0,
]);
const kernelOffsetsBuffer = device.createBuffer({
  size: kernelOffsetsValue.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(kernelOffsetsBuffer, 0, kernelOffsetsValue);

//
// prettier-ignore
const vertices = new Float32Array([
  -1.0, -1.0,
  1.0, -1.0,
  1.0,  1.0,

  -1.0, -1.0,
  1.0,  1.0,
  -1.0,  1.0,
]);
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);

//
const sampler = device.createSampler({
  magFilter: "linear",
  minFilter: "linear",
});

const image = new Image();
image.src = "/zs.png";
await image.decode();
const imageBitmap = await createImageBitmap(image);
const [srcWidth, srcHeight] = [imageBitmap.width, imageBitmap.height];

// 用于存储图像数据的纹理
const cubeTexture = device.createTexture({
  size: [srcWidth, srcHeight, 1],
  format: "rgba8unorm",
  usage:
    GPUTextureUsage.TEXTURE_BINDING |
    GPUTextureUsage.COPY_DST |
    GPUTextureUsage.RENDER_ATTACHMENT,
});

device.queue.copyExternalImageToTexture(
  { source: imageBitmap },
  { texture: cubeTexture },
  [imageBitmap.width, imageBitmap.height]
);

// 渲染管线
const pipeline = device.createRenderPipeline({
  // 布局
  layout: "auto",
  // 顶点着色器
  vertex: {
    module: device.createShaderModule({
      code: vertWGSL,
    }),
    entryPoint: "main",
    buffers: [
      {
        arrayStride: 8,
        attributes: [
          {
            format: "float32x2",
            offset: 0,
            shaderLocation: 0,
          },
        ],
      },
    ],
  },
  // 片元着色器
  fragment: {
    module: device.createShaderModule({
      code: fragWGSL,
    }),
    entryPoint: "main",
    // 输出颜色
    targets: [
      {
        format: format,
      },
    ],
  },
  // 图元类型
  primitive: {
    topology: "triangle-list",
  },
});

const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: { buffer: rgb2yuvBuffer } },
    { binding: 1, resource: { buffer: gaussianBuffer } },
    { binding: 2, resource: { buffer: kernelOffsetsBuffer } },
    { binding: 3, resource: sampler },
    { binding: 4, resource: cubeTexture.createView() },
  ],
});

// 渲染
const render = () => {
  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1.0 }, //background color
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });
  // 设置渲染管线
  renderPass.setPipeline(pipeline);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setBindGroup(0, bindGroup);
  renderPass.draw(6);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();
