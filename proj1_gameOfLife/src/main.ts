/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import computeWGSL from "./shader/compute.wgsl?raw";
import { CreateGPUBufferUint } from "./helper/gpuBuffer";
import { createBindGroupWithLayout } from "./helper/bindGroup";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;

const GameOptions = {
  width: 128,
  height: 128,
  timestep: 4,
  workgroupSize: 8,
};

let loopTimes = 0; // 切换当前时刻和下一个时刻使用的缓冲区
let wholeTime = 0; // 控制模拟步骤的执行次数
let render: () => void = () => {};
let buffer0: GPUBuffer, buffer1: GPUBuffer;

//
//
const computeBindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0, // size  用于存储模拟世界的大小（宽度和高度）
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      binding: 1, // current 存储当前时刻模拟世界中每个细胞的状态
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      binding: 2, // next 存储下一个时刻模拟世界中每个细胞的状态
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
  ],
});

// 表示一个包含四个顶点的正方形的位置信息，每个顶点都由一个二维坐标（x，y）组成
const squareVertices = new Uint32Array([0, 0, 0, 1, 1, 0, 1, 1]);

const renderBindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: "uniform",
      },
    },
  ],
});

const resetGameData = () => {
  // 管线
  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [computeBindGroupLayout],
    }),
    compute: {
      module: device.createShaderModule({
        code: computeWGSL,
      }),
      entryPoint: "main",
      constants: {
        blockSize: GameOptions.workgroupSize,
      },
    },
  });

  const pipeline = device.createRenderPipeline({
    // 布局
    layout: device.createPipelineLayout({
      bindGroupLayouts: [renderBindGroupLayout],
    }),
    // 顶点着色器
    vertex: {
      module: device.createShaderModule({
        code: vertWGSL,
      }),
      entryPoint: "main",
      buffers: [
        // 缓冲区集合，其中一个元素对应一个缓冲对象
        // cell
        {
          arrayStride: Uint32Array.BYTES_PER_ELEMENT, // 每个元素的字节大小
          stepMode: "instance", // 表示这个缓冲区集合在实例化时会被使用，每个实例使用一次
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "uint32",
            },
          ],
        },
        // pos
        {
          arrayStride: 2 * squareVertices.BYTES_PER_ELEMENT,
          stepMode: "vertex", // 表示这个缓冲区集合在每个顶点绘制时会被使用
          attributes: [
            {
              shaderLocation: 1,
              offset: 0,
              format: "uint32x2",
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
      topology: "triangle-strip",
    },
  });

  const squareBuffer = CreateGPUBufferUint(
    device,
    squareVertices,
    GPUBufferUsage.VERTEX
  );

  const sizeBuffer = CreateGPUBufferUint(
    device,
    new Uint32Array([GameOptions.width, GameOptions.height]),
    GPUBufferUsage.STORAGE |
      GPUBufferUsage.UNIFORM |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.VERTEX
  );

  // 初始化生命游戏的初始状态
  const length = GameOptions.width * GameOptions.height;
  const cells = new Uint32Array(length);
  for (let i = 0; i < length; i++) {
    cells[i] = Math.random() < 0.25 ? 1 : 0;
  }

  // 这两个缓冲区在生命游戏的模拟过程中被交替使用，以便在每个模拟步骤中计算当前时刻细胞的状态并保存下一个时刻的状态。
  // 当前时刻细胞的状态
  buffer0 = CreateGPUBufferUint(
    device,
    cells,
    GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX
  );
  // 下一个时刻细胞的状态
  buffer1 = device.createBuffer({
    size: cells.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
  });

  const computeBindGroup0 = createBindGroupWithLayout(
    device,
    computeBindGroupLayout,
    [
      { binding: 0, resource: sizeBuffer }, // 模拟世界的大小（宽度和高度）
      { binding: 1, resource: buffer0 }, // 当前时刻模拟世界中每个细胞的状态
      { binding: 2, resource: buffer1 }, // 下一个时刻模拟世界中每个细胞的状态
    ]
  );
  const computeBindGroup1 = createBindGroupWithLayout(
    device,
    computeBindGroupLayout,
    [
      { binding: 0, resource: sizeBuffer }, // 模拟世界的大小（宽度和高度）
      { binding: 1, resource: buffer1 }, // 当前时刻模拟世界中每个细胞的状态
      { binding: 2, resource: buffer0 }, // 下一个时刻模拟世界中每个细胞的状态
    ]
  );

  // @binding(0) @group(0) var<uniform> size: vec2<u32>;
  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: sizeBuffer,
          offset: 0,
          size: 2 * Uint32Array.BYTES_PER_ELEMENT,
        },
      },
    ],
  });

  loopTimes = 0;
  // 渲染
  render = () => {
    if (GameOptions.timestep) {
      wholeTime++;
      if (wholeTime > GameOptions.timestep) {
        // 开始命令编码
        const commandEncoder = device.createCommandEncoder();

        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(
          0,
          loopTimes ? computeBindGroup1 : computeBindGroup0
        );

        computePass.dispatchWorkgroups(
          GameOptions.width / GameOptions.workgroupSize,
          GameOptions.height / GameOptions.workgroupSize
        );
        computePass.end();

        const renderPass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });
        // 设置渲染管线
        renderPass.setPipeline(pipeline);
        //
        renderPass.setVertexBuffer(0, loopTimes ? buffer1 : buffer0); //
        renderPass.setVertexBuffer(1, squareBuffer);
        renderPass.setBindGroup(0, uniformBindGroup);
        renderPass.draw(4, length);
        // 结束渲染通道
        renderPass.end();
        // 提交命令
        device.queue.submit([commandEncoder.finish()]);
        //
        wholeTime -= GameOptions.timestep;
        loopTimes = 1 - loopTimes;
      }
    }

    requestAnimationFrame(render);
  };
};

resetGameData();

(function loop() {
  if (GameOptions.timestep) {
    wholeTime++;
    if (wholeTime >= GameOptions.timestep) {
      render();
      wholeTime -= GameOptions.timestep;
      loopTimes = 1 - loopTimes;
    }
  }

  requestAnimationFrame(loop);
})();

import { GUI } from "dat.gui";
let gui = new GUI();
gui.add(GameOptions, "timestep", 1, 60, 1);
gui.add(GameOptions, "width", 16, 1024, 16).onFinishChange(resetGameData);
gui.add(GameOptions, "height", 16, 1024, 16).onFinishChange(resetGameData);
gui.add(GameOptions, "workgroupSize", [4, 8, 16]).onFinishChange(resetGameData);
