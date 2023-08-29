/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import { createSphereMesh } from "./helper/sphere";
import { mat4, vec3 } from "wgpu-matrix";
import { CreateTextureFromImage } from "./helper/texture";
import {
  CreateGPUBuffer,
  CreateGPUBufferUint16,
  CreateUniformGPUBuffer,
} from "./helper/gpuBuffer";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;

const size = { width: canvas.width, height: canvas.height };

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
        arrayStride: 8 * 4,
        attributes: [
          // position
          {
            shaderLocation: 0,
            offset: 0,
            format: "float32x3",
          },
          // normal
          {
            shaderLocation: 1,
            offset: 3 * 4,
            format: "float32x3",
          },
          // uv
          {
            shaderLocation: 2,
            offset: 6 * 4,
            format: "float32x2",
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
    cullMode: "back",
  },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: "less",
    format: "depth24plus",
  },
});

const depthTexture = device.createTexture({
  size: size,
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

const uniformBuffer = device.createBuffer({
  size: 4 * 4 * 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

let planetTexture: GPUTexture = await CreateTextureFromImage(
  device,
  "saturn.jpg"
);
let moonTexture: GPUTexture = await CreateTextureFromImage(device, "moon.jpg");

const sampler = device.createSampler({
  magFilter: "linear",
  minFilter: "linear",
});

const createSphereRenderable = (
  radius: number,
  widthSegments = 32,
  heightSegments = 16,
  randomness = 0
) => {
  const sphereMesh = createSphereMesh(
    radius,
    widthSegments,
    heightSegments,
    randomness
  );
  const verticesBuffer = CreateGPUBuffer(device, sphereMesh.vertices);
  const indicesBuffer = CreateGPUBufferUint16(device, sphereMesh.indices);
  return {
    verticesBuffer,
    indicesBuffer,
    indexCount: sphereMesh.indices.length,
    bindGroup: createSphereBindGroup(planetTexture, new Float32Array()),
  };
};

const createSphereBindGroup = (
  texture: GPUTexture,
  transform: Float32Array
): GPUBindGroup => {
  const uniformBuffer = CreateUniformGPUBuffer(device, 4 * 4 * 4, transform);
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: texture.createView(),
      },
    ],
  });

  return bindGroup;
};

const transform = mat4.identity();

const planet = createSphereRenderable(1.0);
planet.bindGroup = createSphereBindGroup(
  planetTexture,
  transform as Float32Array
);

const asteroids = [
  createSphereRenderable(0.01, 8, 6, 0.15),
  createSphereRenderable(0.013, 8, 6, 0.15),
  createSphereRenderable(0.017, 8, 6, 0.15),
  createSphereRenderable(0.02, 8, 6, 0.15),
  createSphereRenderable(0.03, 16, 8, 0.15),
];

const renderables = [planet];
const ensureEnoughAsteroids = () => {
  for (let i = renderables.length; i <= 5000; ++i) {
    const radius = Math.random() * 1.7 + 1.25;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * 0.015;
    const z = Math.cos(angle) * radius;

    mat4.identity(transform);
    mat4.translate(transform, [x, y, z], transform);
    mat4.rotateX(transform, Math.random() * Math.PI, transform);
    mat4.rotateY(transform, Math.random() * Math.PI, transform);
    renderables.push({
      ...asteroids[i % asteroids.length],
      bindGroup: createSphereBindGroup(moonTexture, transform as Float32Array),
    });
  }
};
ensureEnoughAsteroids();

const frameBindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: {
        buffer: uniformBuffer,
      },
    },
  ],
});

const aspect = canvas.width / canvas.height;
const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
const modelViewProjectionMatrix = mat4.identity();

const getTransformationMatrix = () => {
  const viewMatrix = mat4.identity();
  mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
  const now = Date.now() / 1000;
  mat4.rotateZ(viewMatrix, Math.PI * 0.1, viewMatrix);
  mat4.rotateX(viewMatrix, Math.PI * 0.1, viewMatrix);
  mat4.rotateY(viewMatrix, now * 0.05, viewMatrix);
  mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);
  return modelViewProjectionMatrix as Float32Array;
};

const renderScene = (
  passEncoder: GPURenderPassEncoder | GPURenderBundleEncoder
) => {
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, frameBindGroup);
  let count = 0;
  for (const renderable of renderables) {
    passEncoder.setBindGroup(1, renderable.bindGroup);
    passEncoder.setVertexBuffer(0, renderable.verticesBuffer);
    passEncoder.setIndexBuffer(renderable.indicesBuffer, "uint16");
    passEncoder.drawIndexed(renderable.indexCount);

    if (++count > 5000) {
      break;
    }
  }
};

let renderBundle: GPURenderBundle;
const updateRenderBundle = () => {
  const renderBundleEncoder = device.createRenderBundleEncoder({
    colorFormats: [format],
    depthStencilFormat: "depth24plus",
  });
  renderScene(renderBundleEncoder);
  renderBundle = renderBundleEncoder.finish();
};
updateRenderBundle();

// 渲染
const render = () => {
  const transformationMatrix = getTransformationMatrix();
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    transformationMatrix.buffer,
    transformationMatrix.byteOffset,
    transformationMatrix.byteLength
  );

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
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });
  renderPass.executeBundles([renderBundle]);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();
