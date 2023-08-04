/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import * as box from "./helper/box";
import { getModelMatrix, getViewProjectionMatrix } from "./helper/math";
import { CreateGPUBuffer, CreateGPUBufferUint16 } from "./helper/gpuBuffer";
import { mat4, vec3 } from "wgpu-matrix";
import { createBindGroup } from "./helper/bindGroup";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;
const size = { width: canvas.width, height: canvas.height };
const NUM = 2;

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

const depthStencil: GPUDepthStencilState = {
  depthWriteEnabled: true,
  depthCompare: "less",
  format: "depth32float",
};

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
  depthStencil: depthStencil,
});

// 阴影渲染管线
const shadowPipeline = device.createRenderPipeline({
  layout: "auto",
  // 只需要得到顶点深度结果，不需要片元着色器
  vertex: {
    module: device.createShaderModule({
      code: vertWGSL,
    }),
    entryPoint: "shadow",
    buffers: standardVertexAttributes,
  },
  primitive: {
    topology: "triangle-list",
    cullMode: "back",
  },
  depthStencil: depthStencil,
});

// 深度贴图
const depthTexture = device.createTexture({
  size,
  format: "depth32float",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});
const shadowDepthTexture = device.createTexture({
  size: [2048, 2048], // 阴影贴图大小
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING, // TEXTURE_BINDING 纹理可以绑定在group用作着色器中的采样纹理
  format: "depth32float",
});
const depthView = depthTexture.createView();
const shadowDepthView = shadowDepthTexture.createView();

// 当你在创建buffer的时候设置mappedAtCreation: true，这就意味着你将在创建buffer的同时把它映射到内存中。
// 在这种情况下，你可以立即使用 buffer.getMappedRange() 得到这块内存的引用，并直接把数据写入这块内存。
// 在数据写入完成之后，你需要调用 buffer.unmap() 来告诉WebGPU你已经完成了对这块内存的操作，这样WebGPU就可以安全地使用这块内存了
// 在这个过程中，你其实已经把数据写入到了buffer中，所以不需要再使用 device.queue.writeBuffer。
const boxBuffer = {
  vertex: CreateGPUBuffer(device, box.vertex),
  index: CreateGPUBufferUint16(device, box.index),
};

const modelBuffer = device.createBuffer({
  size: 4 * 4 * 4 * NUM, // 4 x 4 x float32 x NUM
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const viewProjectionBuffer = device.createBuffer({
  size: 4 * 4 * 4, // 4 x 4 x float32
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const lightProjectionBuffer = device.createBuffer({
  size: 4 * 4 * 4, // 4 x 4 x float32
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const colorBuffer = device.createBuffer({
  size: 4 * 4 * NUM, // 4 x float32 x NUM
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const lightBuffer = device.createBuffer({
  size: 4 * 4, // 4 x float32: position vec4
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const aspect = size.width / size.height;

const viewProjectionMatrix = getViewProjectionMatrix(
  aspect,
  (60 / 180) * Math.PI,
  0.1,
  1000,
  { x: 0, y: 10, z: 20 }
);
device.queue.writeBuffer(viewProjectionBuffer, 0, viewProjectionMatrix);

let vsGroup = createBindGroup(device, pipeline, 0, [
  { binding: 0, resource: modelBuffer },
  { binding: 1, resource: viewProjectionBuffer },
  { binding: 2, resource: lightProjectionBuffer },
  { binding: 3, resource: colorBuffer },
]);

// 深度贴图 也需要一个sampler进行采样
// compare直接返回两个深度的大小关系
const lessSampler = device.createSampler({ compare: "less" });
const fsGroup = createBindGroup(device, pipeline, 1, [
  { binding: 0, resource: lightBuffer },
  { binding: 1, resource: shadowDepthView },
  { binding: 2, resource: lessSampler },
]);

const shadowGroup = createBindGroup(device, shadowPipeline, 0, [
  { binding: 0, resource: modelBuffer },
  { binding: 2, resource: lightProjectionBuffer },
]);

// 创建物体
const modelBufferArray = new Float32Array(NUM * 4 * 4);
const colorBufferArray = new Float32Array(NUM * 4);

// add a center box
{
  const position = { x: 0, y: 0, z: -20 };
  const rotation = { x: 0, y: Math.PI / 4, z: 0 };
  const scale = { x: 2, y: 20, z: 2 };
  const model = getModelMatrix(position, rotation, scale);
  // 相机不移动，不绑定view matrix
  modelBufferArray.set(model, 0 * 4 * 4);
  colorBufferArray.set([0.5, 0.5, 0.5, 1], 0 * 4);
}
// add a floor
{
  const position = { x: 0, y: -10, z: -20 };
  const rotation = { x: 0, y: 0, z: 0 };
  const scale = { x: 50, y: 0.5, z: 40 };
  const model = getModelMatrix(position, rotation, scale);
  modelBufferArray.set(model, 1 * 4 * 4);
  colorBufferArray.set([1, 1, 1, 1], 1 * 4);
}

device.queue.writeBuffer(colorBuffer, 0, colorBufferArray);

const lightViewMatrix = mat4.identity();
const lightProjectionMatrix = mat4.identity();
const lightPosition = vec3.fromValues(0, 100, 0);
const up = vec3.fromValues(0, 1, 0);
const origin = vec3.fromValues(0, 0, 0);

// 渲染
const render = () => {
  const now = performance.now();
  lightPosition[0] = Math.sin(now / 1500) * 50;
  lightPosition[2] = Math.cos(now / 1500) * 50;
  // 正交投影 （定向光投影）（点光源投影要做透视变换，比较复杂）
  // 该函数创建一个矩阵，该矩阵将场景从世界空间转换到光源视角的视图空间
  // lightViewMatrix 是接收生成的矩阵的变量
  // lightPosition 是光源的位置
  // origin 是视点的位置，通常是场景的中心点
  // up 是表示“上”方向的向量，通常为 [0, 1, 0]
  mat4.lookAt(lightPosition, origin, up, lightViewMatrix);
  // 创建一个正交投影矩阵
  // lightProjectionMatrix 是接收生成的矩阵的变量
  // -40, 40, -40, 40, -50, 200 分别是投影的左，右，下，上，近，远平面的值
  mat4.ortho(-40, 40, -40, 40, -50, 200, lightProjectionMatrix);
  // 将场景从世界空间直接转换到光源的裁剪空间
  mat4.multiply(lightProjectionMatrix, lightViewMatrix, lightProjectionMatrix);
  device.queue.writeBuffer(
    lightProjectionBuffer,
    0,
    lightProjectionMatrix as Float32Array
  );
  device.queue.writeBuffer(lightBuffer, 0, lightPosition as Float32Array);
  device.queue.writeBuffer(modelBuffer, 0, modelBufferArray);

  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  // 开启渲染通道
  const shadowPass = commandEncoder.beginRenderPass({
    colorAttachments: [],
    depthStencilAttachment: {
      view: shadowDepthView,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });
  shadowPass.setPipeline(shadowPipeline);
  shadowPass.setBindGroup(0, shadowGroup);

  shadowPass.setVertexBuffer(0, boxBuffer.vertex);
  shadowPass.setIndexBuffer(boxBuffer.index, "uint16");
  shadowPass.drawIndexed(box.indexCount, 2, 0, 0, 0);

  shadowPass.end();

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

  renderPass.setBindGroup(0, vsGroup);
  renderPass.setBindGroup(1, fsGroup);

  renderPass.setVertexBuffer(0, boxBuffer.vertex);
  renderPass.setIndexBuffer(boxBuffer.index, "uint16");
  renderPass.drawIndexed(box.indexCount, 2, 0, 0, 0); // WebGPU 会自动为每个实例和每个顶点生成 instance_index 和 vertex_index。
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();
