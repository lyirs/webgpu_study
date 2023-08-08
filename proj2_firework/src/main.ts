/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import computeWGSL from "./shader/compute.wgsl?raw";
import { createBindGroup } from "./helper/bindGroup";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;

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
        blend: {
          color: {
            srcFactor: "src-alpha",
            dstFactor: "one",
            operation: "add",
          },
          alpha: {
            srcFactor: "src-alpha",
            dstFactor: "one",
            operation: "add",
          },
        },
      },
    ],
  },
  // 图元类型
  primitive: {
    topology: "point-list",
  },
});

const numParticles = 6400;

const particleBuffer = device.createBuffer({
  size: numParticles * 8 * 4,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

//
const computeGroup = createBindGroup(device, computePipeline, 0, [
  {
    binding: 0,
    resource: particleBuffer,
  },
]);

const renderGroup = createBindGroup(device, pipeline, 0, [
  {
    binding: 0,
    resource: particleBuffer,
  },
]);

// 创建物体
const particles = new Float32Array(numParticles * 8);

// 为每个实例生成随机的初始位置和速度
for (let i = 0; i < numParticles; i++) {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 0.2;
  const lifetime = Math.random();
  const r = Math.random();
  const g = Math.random();
  const b = Math.random();

  particles[i * 8] = 0; // 初始 x 坐标
  particles[i * 8 + 1] = 0; // 初始 y 坐标
  particles[i * 8 + 2] = Math.cos(angle) * speed; // x 速度
  particles[i * 8 + 3] = Math.sin(angle) * speed; // y 速度
  particles[i * 8 + 4] = lifetime; // 持续时间
  particles[i * 8 + 5] = r; // r
  particles[i * 8 + 6] = g; // r
  particles[i * 8 + 7] = b; // r
}
device.queue.writeBuffer(particleBuffer, 0, particles);

// 渲染
const render = () => {
  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  const computePass = commandEncoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, computeGroup);

  computePass.dispatchWorkgroups(Math.ceil(numParticles / 64));
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
  renderPass.setBindGroup(0, renderGroup);
  renderPass.setVertexBuffer(0, particleBuffer);
  renderPass.draw(numParticles, 1, 0, 0);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();
