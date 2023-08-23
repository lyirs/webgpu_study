/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import computeWGSL from "./shader/compute.wgsl?raw";
import { createBindGroup } from "./helper/bindGroup";
import { Color } from "./helper/color";
import { getMvpMatrix } from "./helper/math";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;

const size = { width: canvas.width, height: canvas.height };

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
    topology: "point-list",
  },
});

const params = {
  count: 50000,
  radius: 5,
  branch: 6,
  color: "#ff6230",
  rotateScale: 0.3,
  endColor: "#1b3984",
};

// 注意 这里结构体为vec3,f32,f32,f32 根据字节对齐规则，这里实际的size为32而不是24 （vec3 的align为16，结构体大小必须是16的倍数，所以需要补size8）
// struct Particle {
//   position : vec3<f32>,
//   r: f32,
//   g: f32,
//   b: f32,
//   pad : vec2<f32>  // 补size：8
// };
const particleBuffer = device.createBuffer({
  size: params.count * 8 * 4,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const uniformBuffer = device.createBuffer({
  size: 4 * 4 * 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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

const uniformBindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(1),
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
const position = { x: 0, y: 0, z: 0 };
const rotation = { x: 0, y: 0, z: 0 };
const scale = { x: 1, y: 1, z: 1 };
const mvpMatrix = getMvpMatrix(aspect, position, rotation, scale);
device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix);
// 创建物体
const particles = new Float32Array(params.count * 8);
const centerColor = new Color(params.color);
const endColor = new Color(params.endColor);

// 为每个实例生成随机的初始位置和速度
for (let i = 0; i < params.count; i++) {
  const branchAngle = (i % params.branch) * ((2 * Math.PI) / params.branch);
  const distance = Math.random() * params.radius * Math.pow(Math.random(), 3);

  const randomX =
    (Math.pow(Math.random() * 2 - 1, 3) * (params.radius - distance)) / 5;
  const randomY =
    (Math.pow(Math.random() * 2 - 1, 3) * (params.radius - distance)) / 5;
  const randomZ =
    (Math.pow(Math.random() * 2 - 1, 3) * (params.radius - distance)) / 5;

  particles[i * 8] =
    Math.cos(branchAngle + distance * params.rotateScale) * distance + randomX;
  particles[i * 8 + 1] = randomY;
  particles[i * 8 + 2] =
    Math.sin(branchAngle + distance * params.rotateScale) * distance + randomZ;

  particles[i * 8] /= 5;
  particles[i * 8 + 1] /= 5;
  particles[i * 8 + 2] /= 5;

  const mixColor = centerColor.clone();
  mixColor.lerp(endColor, distance / params.radius);

  particles[i * 8 + 3] = mixColor.r;
  particles[i * 8 + 4] = mixColor.g;
  particles[i * 8 + 5] = mixColor.b;
}
device.queue.writeBuffer(particleBuffer, 0, particles);

// 渲染
const render = () => {
  const now = Date.now() / 5000;
  const rotation = { x: 0, y: now, z: 0 };
  const mvpMatrix = getMvpMatrix(aspect, position, rotation, scale);
  device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix);
  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  const computePass = commandEncoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, computeGroup);

  computePass.dispatchWorkgroups(Math.ceil(params.count / 64));
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
  renderPass.setBindGroup(1, uniformBindGroup);
  renderPass.setVertexBuffer(0, particleBuffer);
  renderPass.draw(params.count, 1, 0, 0);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();
