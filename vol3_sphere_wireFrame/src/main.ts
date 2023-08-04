/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/sphereVert.wgsl?raw";
import fragWGSL from "./shader/sphereFrag.wgsl?raw";
import { mat4, vec3 } from "wgpu-matrix";
import { CreateGPUBuffer } from "./helper/gpuBuffer";
import { SphereWireframeData } from "./helper/vertexData";
import { getModelMatrix, getViewProjectionMatrix } from "./helper/math";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
let radius = 2;
let u = 20;
let v = 15;
let center = [0, 0, 0];

const wireframeData = SphereWireframeData(radius, u, v, center) as Float32Array;
const wireframeVertexCount = wireframeData.length / 3;

const vertexBuffer = CreateGPUBuffer(device, wireframeData);

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
        arrayStride: 12, // 顶点长度 以字节为单位 3*4
        attributes: [
          {
            shaderLocation: 0, // 遍历索引，这里的索引值就对应的是着色器语言中 @location(0) 的数字
            offset: 0,
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
    topology: "line-list",
  },
});

// UBO
const aspect = canvas.width / canvas.height; // 相机宽高比例
const fov = (60 / 180) * Math.PI;
const near = 0.1;
const far = 100.0;
const position = { x: 0, y: 0, z: 10 };
let vpMatrix = getViewProjectionMatrix(aspect, fov, near, far, position);
let rotation = vec3.fromValues(0, 0, 0);

const modelMatrix = mat4.identity();
const modelViewProjectionMatrix = mat4.identity();

const uniformBuffer = device.createBuffer({
  size: 64,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const uniformBindGroup = device.createBindGroup({
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

// 渲染
const render = () => {
  rotation[0] += 0.01;
  rotation[1] += 0.01;
  rotation[2] += 0.01;
  const modelMatrix = getModelMatrix(
    { x: 0, y: 0, z: 0 },
    { x: rotation[0], y: rotation[1], z: rotation[2] }
  );
  mat4.multiply(vpMatrix, modelMatrix, modelViewProjectionMatrix);

  device.queue.writeBuffer(
    uniformBuffer,
    0,
    modelViewProjectionMatrix as ArrayBuffer
  );

  // 开始命令编码
  // 我们不能直接操作command buffer，需要创建command encoder，使用它将多个commands（如render pass的draw）设置到一个command buffer中，然后执行submit，把command buffer提交到gpu driver的队列中。
  const commandEncoder = device.createCommandEncoder();

  // 开启渲染通道
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: gpu.context.getCurrentTexture().createView(),
        clearValue: {
          r: 0.0,
          g: 0.0,
          b: 0.0,
          a: 1.0,
        },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });
  // 设置渲染管线
  renderPass.setPipeline(pipeline);
  // 设置顶点缓冲区
  renderPass.setVertexBuffer(0, vertexBuffer);
  // 绘制
  renderPass.setBindGroup(0, uniformBindGroup);
  renderPass.draw(wireframeVertexCount);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();
