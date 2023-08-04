/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import computeWGSL from "./shader/compute.wgsl?raw";
import { getModelMatrix, getViewProjectionMatrix } from "./helper/math";
import { CreateGPUBuffer, CreateGPUBufferUint16 } from "./helper/gpuBuffer";
import * as box from "./helper/box";
import { createBindGroup } from "./helper/bindGroup";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;
const size = { width: canvas.width, height: canvas.height };
let NUM = 150000;
const MAX = 300000;

const standardVertexAttributes: Iterable<GPUVertexBufferLayout | null> = [
  // 缓冲区集合，其中一个元素对应一个缓冲对象
  {
    arrayStride: 8 * 4, // 顶点长度 以字节为单位  position*3 normal*3 uv*2
    attributes: [
      // position
      {
        shaderLocation: 0, // 遍历索引，这里的索引值就对应的是着色器语言中 @location(0) 的数字
        offset: 0,
        format: "float32x3",
      },
      // normal
      {
        shaderLocation: 1, // 遍历索引，这里的索引值就对应的是着色器语言中 @location(1) 的数字
        offset: 3 * 4,
        format: "float32x3",
      },
      // uv
      {
        shaderLocation: 2, // 遍历索引，这里的索引值就对应的是着色器语言中 @location(2) 的数字
        offset: 6 * 4,
        format: "float32x2",
      },
    ],
  },
];

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
    buffers: standardVertexAttributes,
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

// 深度贴图
const depthTexture = device.createTexture({
  size,
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});
const depthView = depthTexture.createView();

const vertexBuffer = CreateGPUBuffer(device, box.vertex);
const indexBuffer = CreateGPUBufferUint16(device, box.index);

const modelBuffer = device.createBuffer({
  size: 4 * 4 * 4 * MAX, // mat4x4 x float32 x MAX
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
const viewProjectionBuffer = device.createBuffer({
  size: 4 * 4 * 4, // mat4x4 x float32
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const mvpBuffer = device.createBuffer({
  size: 4 * 4 * 4 * MAX, // mat4x4 x float32 x MAX
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
const velocityBuffer = device.createBuffer({
  size: 4 * 4 * MAX, // 4 position x float32 x MAX
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
const inputBuffer = device.createBuffer({
  size: 7 * 4, // float32 * 7
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

// 顶点着色器可以可以直接return输出给片元着色器，但计算着色器需要自己管理数据
// compute pipeline只能通过bindGroup传递数据
const computeGroup = createBindGroup(device, computePipeline, 0, [
  { binding: 0, resource: inputBuffer },
  { binding: 1, resource: velocityBuffer },
  { binding: 2, resource: modelBuffer },
  { binding: 3, resource: viewProjectionBuffer },
  { binding: 4, resource: mvpBuffer },
]);
// 在计算阶段，GPU更新了一些数据（如这里的MVP矩阵），然后在渲染阶段，这些更新的数据被用来渲染图像。
// 这种模式利用了GPU同时具备高效的并行计算能力和图形渲染能力的优点。
const renderGroup = createBindGroup(device, pipeline, 0, [
  { binding: 0, resource: mvpBuffer },
]);

// 创建物体
let inputArray = new Float32Array([NUM, -500, 500, -250, 250, -500, 500]); // 元素数量（NUM） x的最小值和最大值（-500和500） y的最小值和最大值（-250和250）z的最小值和最大值（-500和500）
const modelArray = new Float32Array(MAX * 4 * 4);
const velocityArray = new Float32Array(MAX * 4); // 对于每个实例，生成一个随机速度向量（x，y，z，w）

// 为每个实例生成随机的初始位置和速度
for (let i = 0; i < MAX; i++) {
  const x = Math.random() * 1000 - 500;
  const y = Math.random() * 500 - 250;
  const z = Math.random() * 1000 - 500;
  const modelMatrix = getModelMatrix(
    { x, y, z },
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 2, z: 2 }
  );
  modelArray.set(modelMatrix, i * 4 * 4);

  velocityArray[i * 4 + 0] = Math.random() - 0.5; // x
  velocityArray[i * 4 + 1] = Math.random() - 0.5; // y
  velocityArray[i * 4 + 2] = Math.random() - 0.5; // z
  velocityArray[i * 4 + 3] = 1; // w
}

device.queue.writeBuffer(velocityBuffer, 0, velocityArray);
device.queue.writeBuffer(modelBuffer, 0, modelArray);
device.queue.writeBuffer(inputBuffer, 0, inputArray);

const camera = { x: 0, y: 50, z: 1000 };
let aspect = size.width / size.height;

// 渲染
const render = () => {
  const time = performance.now() / 5000;
  camera.x = 1000 * Math.sin(time);
  camera.z = 1000 * Math.cos(time);
  const viewProjectionMatrix = getViewProjectionMatrix(
    aspect,
    (60 / 180) * Math.PI,
    0.1,
    10000,
    camera
  );
  device.queue.writeBuffer(viewProjectionBuffer, 0, viewProjectionMatrix);

  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  const computePass = commandEncoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, computeGroup);
  // dispatchWorkgroups 对应计算着色器中的@workgroup_size(size)
  // 与 renderPass.draw()相比
  //           draw(vertex_count, instance_count)
  //                     ↓               ↓
  //    @workgroup_size(Sx, Sy Sz)  dispatchWorkgroups(Nx, Ny, Nz)
  //       (Sx * Sy * Sz)个线程         (Nx * Ny * Nz)个线程
  //           共(Sx * Sy * Sz * Nx * Ny * Nz)次计算
  // 比如一个二维数据 8*8，@workgroup_size(4,4)时， dispatchWorkgroups就是(2,2)(x轴遍历2次，y轴遍历2次)
  //                     @workgroup_size(16)时， dispatchWorkgroups就是(4)(y轴遍历4次)
  // 对于三维 8*8*8
  // @workgroup_size(4, 4, 1) 意味着每个工作组有 4 * 4 * 1 = 16 个线程。每个线程都会执行着色器中的代码
  // dispatchWorkgroups(2, 2, 8) 将在每个维度上启动 2 * 2 * 8 = 32 个工作组，每个工作组有 16 个线程。因此，着色器中的代码将在 32 * 16 个线程上并行执行。
  // 可以自由选择使用1D，2D，还是3D的方式来划分线程，选择哪种方式通常取决于正在处理的数据的性质和结构。

  // 这里处理的数据input、velocity、model、mvp等都是1维数组。故采用一维工作组划分
  // 工作组大小 @workgroup_size(128) 说明每个工作组包含 128 个线程，
  // dispatchWorkgroups(Math.ceil(NUM / 128)) 则表示在每个维度上启动 NUM / 128 的工作组，这样总的线程数就是 128 * NUM / 128 = NUM
  computePass.dispatchWorkgroups(Math.ceil(NUM / 128));
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
    depthStencilAttachment: {
      view: depthView,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });
  // 设置渲染管线
  renderPass.setPipeline(pipeline);

  renderPass.setBindGroup(0, renderGroup);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setIndexBuffer(indexBuffer, "uint16");
  renderPass.drawIndexed(box.indexCount, NUM);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();

import { GUI } from "dat.gui";
let parameters = {
  NUM: 150000,
};
let gui = new GUI();
gui
  .add(parameters, "NUM", 1, MAX)
  .step(1)
  .onChange((newNUM: number) => {
    // 当NUM值改变时，更新相关的变量和缓冲区
    NUM = newNUM;
    // 重新创建 inputArray
    inputArray = new Float32Array([NUM, -500, 500, -250, 250, -500, 500]);
    // 更新输入缓冲区
    device.queue.writeBuffer(inputBuffer, 0, inputArray);
  });
