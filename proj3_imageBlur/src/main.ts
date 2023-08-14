/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import computeWGSL from "./shader/compute.wgsl?raw";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;

const tileDim = 128;
const batch = [4, 4];

// 渲染管线
// 计算着色器
const computePipeline = device.createComputePipeline({
  layout: "auto",
  compute: {
    module: device.createShaderModule({
      code: computeWGSL,
    }),
    entryPoint: "main",
  },
});

const pipeline = device.createRenderPipeline({
  // 布局
  layout: "auto",
  // 顶点着色器
  vertex: {
    module: device.createShaderModule({
      code: vertWGSL,
    }),
    entryPoint: "main",
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

// 用于在计算过程中交替存储模糊计算的结果。
const textures = [0, 1].map(() => {
  return device.createTexture({
    size: {
      width: srcWidth,
      height: srcHeight,
    },
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.STORAGE_BINDING |
      GPUTextureUsage.TEXTURE_BINDING,
  });
});

const buffer0 = (() => {
  const buffer = device.createBuffer({
    size: 4,
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM,
  });
  new Uint32Array(buffer.getMappedRange())[0] = 0;
  buffer.unmap();
  return buffer;
})();

const buffer1 = (() => {
  const buffer = device.createBuffer({
    size: 4,
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM,
  });
  new Uint32Array(buffer.getMappedRange())[0] = 1;
  buffer.unmap();
  return buffer;
})();

// 用于存储模糊半径的参数数据
const blurParamsBuffer = device.createBuffer({
  size: 8,
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
});

const computeConstants = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: sampler,
    },
    {
      binding: 1,
      resource: {
        buffer: blurParamsBuffer,
      },
    },
  ],
});

// 用于第一次迭代的均值模糊操作
// 输入纹理是 cubeTexture，输出纹理是 textures[0]
const computeBindGroup0 = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(1),
  entries: [
    {
      binding: 1,
      resource: cubeTexture.createView(),
    },
    {
      binding: 2,
      resource: textures[0].createView(),
    },
    {
      binding: 3,
      resource: {
        buffer: buffer0,
      },
    },
  ],
});

// 输入纹理是 textures[0]（即上一次迭代的输出），输出纹理是 textures[1]
const computeBindGroup1 = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(1),
  entries: [
    {
      binding: 1,
      resource: textures[0].createView(),
    },
    {
      binding: 2,
      resource: textures[1].createView(),
    },
    {
      binding: 3,
      resource: {
        buffer: buffer1,
      },
    },
  ],
});

const computeBindGroup2 = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(1),
  entries: [
    {
      binding: 1,
      resource: textures[1].createView(),
    },
    {
      binding: 2,
      resource: textures[0].createView(),
    },
    {
      binding: 3,
      resource: {
        buffer: buffer0,
      },
    },
  ],
});

// 用于显示模糊后的图像结果。
const showResultBindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: sampler,
    },
    {
      binding: 1,
      resource: textures[1].createView(),
    },
  ],
});

const settings = {
  filterSize: 15,
  iterations: 2,
};

let blockDim: number;
const updateSettings = () => {
  // 进行图像处理时，每个计算块的维度大小
  blockDim = tileDim - (settings.filterSize - 1);
  device.queue.writeBuffer(
    blurParamsBuffer,
    0,
    new Uint32Array([settings.filterSize, blockDim])
  );
};
updateSettings();

// 渲染
const render = () => {
  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  const computePass = commandEncoder.beginComputePass();

  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, computeConstants);
  computePass.setBindGroup(1, computeBindGroup0);
  computePass.dispatchWorkgroups(
    Math.ceil(srcWidth / blockDim),
    Math.ceil(srcHeight / batch[1])
  );

  computePass.setBindGroup(1, computeBindGroup1);
  computePass.dispatchWorkgroups(
    Math.ceil(srcHeight / blockDim),
    Math.ceil(srcWidth / batch[1])
  );

  for (let i = 0; i < settings.iterations - 1; ++i) {
    computePass.setBindGroup(1, computeBindGroup2);
    computePass.dispatchWorkgroups(
      Math.ceil(srcWidth / blockDim),
      Math.ceil(srcHeight / batch[1])
    );

    computePass.setBindGroup(1, computeBindGroup1);
    computePass.dispatchWorkgroups(
      Math.ceil(srcHeight / blockDim),
      Math.ceil(srcWidth / batch[1])
    );
  }

  computePass.end();

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
  renderPass.setBindGroup(0, showResultBindGroup);
  renderPass.draw(6, 1, 0, 0);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();

import { GUI } from "dat.gui";
let gui = new GUI();
gui.add(settings, "filterSize", 1, 33).step(2).onChange(updateSettings);
gui.add(settings, "iterations", 1, 10).step(1);
