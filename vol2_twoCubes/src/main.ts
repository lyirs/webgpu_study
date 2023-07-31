/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/cubeVert.wgsl?raw";
import fragWGSL from "./shader/cubeFrag.wgsl?raw";
import { mat4, vec3 } from "gl-matrix";
import { CubeData } from "./helper/vertexData";
import { CreateGPUBuffer, CreateGPUBufferUint } from "./helper/gpuBuffer";
import { CreateViewProjection } from "./helper/createViewProjection";
import { CreateTransforms } from "./helper/createTransforms";
import { CreateAnimation } from "./helper/animation";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;
const cubeData = CubeData();

const cubeVertexSize = 6 * 4;
const cubePositionOffset = 0;
const cubeVertexCount = cubeData.indexData.length; // 36
const cubeColorOffset = 3 * 4;

const vertexBuffer = CreateGPUBuffer(device, cubeData.vertexData);
const indexBuffer = CreateGPUBufferUint(device, cubeData.indexData);
// 创建渲染管线
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
      // 缓冲区集合，其中一个元素对应一个缓冲对象
      {
        arrayStride: cubeVertexSize, // 顶点长度 以字节为单位
        attributes: [
          {
            shaderLocation: 0, // 遍历索引，这里的索引值就对应的是着色器语言中 @location(0) 的数字
            offset: cubePositionOffset,
            format: "float32x3",
          },
          {
            shaderLocation: 1, // @location(1)
            offset: cubeColorOffset,
            format: "float32x3",
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
  // 深度
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: "less",
    format: "depth24plus",
  },
});

// UBO
const matrixSize = 4 * 16;
const uniformOffset = 256;
const uniformBufferSize = uniformOffset + matrixSize;
let rotation = vec3.fromValues(0, 0, 0);

const aspect = canvas.width / canvas.height; // 相机宽高比例
const vp = CreateViewProjection(aspect);

const modelMatrix1 = mat4.create();
const translateMatrix1 = mat4.create();
CreateTransforms(translateMatrix1, [-2, -1, 0.5], [0, 0, 0], [1, 1, 1]);
const modelViewProjectionMatrix1 = mat4.create() as Float32Array;

const modelMatrix2 = mat4.create();
const translateMatrix2 = mat4.create();
CreateTransforms(translateMatrix2, [1, 1, -2], [0, 0, 0], [1, 1, 1]);
const modelViewProjectionMatrix2 = mat4.create() as Float32Array;

const uniformBuffer = device.createBuffer({
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const uniformBindGroup1 = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: {
        buffer: uniformBuffer,
        offset: 0,
        size: matrixSize,
      },
    },
  ],
});

const uniformBindGroup2 = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: {
        buffer: uniformBuffer,
        offset: uniformOffset,
        size: matrixSize,
      },
    },
  ],
});

let view = gpu.context.getCurrentTexture().createView();
const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});
const renderPassDescription = {
  colorAttachments: [
    {
      view: view,
      clearValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 }, //background color
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
};

// 渲染
const render = () => {
  // cube1
  mat4.rotate(
    modelMatrix1,
    translateMatrix1,
    1,
    vec3.fromValues(Math.sin(2 * rotation[0]), Math.cos(2 * rotation[0]), 0)
  );
  mat4.multiply(modelViewProjectionMatrix1, vp.viewMatrix, modelMatrix1);
  mat4.multiply(
    modelViewProjectionMatrix1,
    vp.projectionMatrix,
    modelViewProjectionMatrix1
  );
  // cube2
  mat4.rotate(
    modelMatrix2,
    translateMatrix2,
    1,
    vec3.fromValues(Math.cos(2 * rotation[1]), 0, Math.sin(2 * rotation[1]))
  );
  mat4.multiply(modelViewProjectionMatrix2, vp.viewMatrix, modelMatrix2);
  mat4.multiply(
    modelViewProjectionMatrix2,
    vp.projectionMatrix,
    modelViewProjectionMatrix2
  );
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    modelViewProjectionMatrix1.buffer,
    modelViewProjectionMatrix1.byteOffset,
    modelViewProjectionMatrix1.byteLength
  );
  device.queue.writeBuffer(
    uniformBuffer,
    uniformOffset,
    modelViewProjectionMatrix2.buffer,
    modelViewProjectionMatrix2.byteOffset,
    modelViewProjectionMatrix2.byteLength
  );

  view = gpu.context.getCurrentTexture().createView();
  renderPassDescription.colorAttachments[0].view = view;
  // 开始命令编码
  // 我们不能直接操作command buffer，需要创建command encoder，使用它将多个commands（如render pass的draw）设置到一个command buffer中，然后执行submit，把command buffer提交到gpu driver的队列中。
  const commandEncoder = device.createCommandEncoder();

  // 开启渲染通道
  const renderPass = commandEncoder.beginRenderPass(
    renderPassDescription as GPURenderPassDescriptor
  );
  // 设置渲染管线
  renderPass.setPipeline(pipeline);
  // 设置顶点缓冲区
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setIndexBuffer(indexBuffer, "uint32");
  // 绘制
  renderPass.setBindGroup(0, uniformBindGroup1);
  renderPass.drawIndexed(cubeVertexCount);
  renderPass.setBindGroup(0, uniformBindGroup2);
  renderPass.drawIndexed(cubeVertexCount);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
};
CreateAnimation(render, rotation, true);
