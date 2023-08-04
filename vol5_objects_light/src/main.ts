/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import * as sphere from "./helper/sphere";
import * as box from "./helper/box";
import { getModelMatrix, getViewProjectionMatrix } from "./helper/math";
import { CreateGPUBuffer, CreateGPUBufferUint16 } from "./helper/gpuBuffer";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;
const size = { width: canvas.width, height: canvas.height };
const NUM = 500; // 对象数量

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

const depthTexture = device.createTexture({
  size,
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});
const depthView = depthTexture.createView();

// 当你在创建buffer的时候设置mappedAtCreation: true，这就意味着你将在创建buffer的同时把它映射到内存中。
// 在这种情况下，你可以立即使用 buffer.getMappedRange() 得到这块内存的引用，并直接把数据写入这块内存。
// 在数据写入完成之后，你需要调用 buffer.unmap() 来告诉WebGPU你已经完成了对这块内存的操作，这样WebGPU就可以安全地使用这块内存了
// 在这个过程中，你其实已经把数据写入到了buffer中，所以不需要再使用 device.queue.writeBuffer。
const boxBuffer = {
  vertex: CreateGPUBuffer(device, box.vertex),
  index: CreateGPUBufferUint16(device, box.index),
};
const sphereBuffer = {
  vertex: CreateGPUBuffer(device, sphere.vertex),
  index: CreateGPUBufferUint16(device, sphere.index),
};

/*
const boxBuffer = {
  vertex: device.createBuffer({
      size: box.vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  }),
  index: device.createBuffer({
      size: box.index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  })
}
const sphereBuffer = {
  vertex: device.createBuffer({
      size: sphere.vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  }),
  index: device.createBuffer({
      size: sphere.index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  })
}
device.queue.writeBuffer(boxBuffer.vertex, 0, box.vertex);
device.queue.writeBuffer(boxBuffer.index, 0, box.index);
device.queue.writeBuffer(sphereBuffer.vertex, 0, sphere.vertex);
device.queue.writeBuffer(sphereBuffer.index, 0, sphere.index);
*/

const modelBuffer = device.createBuffer({
  size: 4 * 4 * 4 * NUM, // 4 x 4 x float32 x NUM
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
const viewProjectionBuffer = device.createBuffer({
  size: 4 * 4 * 4, // 4 x 4 x float32
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const colorBuffer = device.createBuffer({
  size: 4 * 4 * NUM, // 4 x float32 x NUM
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const aspect = size.width / size.height;
const viewProjectionMatrix = getViewProjectionMatrix(aspect);
device.queue.writeBuffer(viewProjectionBuffer, 0, viewProjectionMatrix);

const vsGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0), // @group(0)
  entries: [
    {
      binding: 0,
      resource: {
        buffer: modelBuffer,
      },
    },
    {
      binding: 1,
      resource: {
        buffer: viewProjectionBuffer,
      },
    },
    {
      binding: 2,
      resource: {
        buffer: colorBuffer,
      },
    },
  ],
});

const ambientBuffer = device.createBuffer({
  size: 1 * 4, // 1 x float32: intensity f32
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const pointBuffer = device.createBuffer({
  size: 8 * 4, // 8 x float32: position vec4 + 4 configs
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const directionalBuffer = device.createBuffer({
  size: 8 * 4, // 8 x float32: position vec4 + 4 configs
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const lightGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(1), // @group(1)
  entries: [
    {
      binding: 0,
      resource: {
        buffer: ambientBuffer,
      },
    },
    {
      binding: 1,
      resource: {
        buffer: pointBuffer,
      },
    },
    {
      binding: 2,
      resource: {
        buffer: directionalBuffer,
      },
    },
  ],
});

// 创建物体
const modelBufferArray = new Float32Array(NUM * 4 * 4);
const colorBufferArray = new Float32Array(NUM * 4);
for (let i = 0; i < NUM; i++) {
  const position = {
    x: Math.random() * 40 - 20,
    y: Math.random() * 40 - 20,
    z: -50 - Math.random() * 50,
  };
  const rotation = { x: Math.random(), y: Math.random(), z: Math.random() };
  const scale = { x: 1, y: 1, z: 1 };
  const modelMatrix = getModelMatrix(position, rotation, scale);
  modelBufferArray.set(modelMatrix, i * 4 * 4);
  colorBufferArray.set([Math.random(), Math.random(), Math.random(), 1], i * 4);
}
device.queue.writeBuffer(colorBuffer, 0, colorBufferArray);
device.queue.writeBuffer(modelBuffer, 0, modelBufferArray);

const ambient = new Float32Array([0.1]);
const pointLight = new Float32Array(8);
pointLight[2] = -50; // z
pointLight[4] = 1; // intensity
pointLight[5] = 20; // radius

const directionalLight = new Float32Array(8); // 2 x vec4: 4 position + 4 configs
directionalLight[4] = 0.5; // intensity

// 渲染
const render = () => {
  const now = performance.now();
  pointLight[0] = 10 * Math.sin(now / 1000);
  pointLight[1] = 10 * Math.cos(now / 1000);
  pointLight[2] = -60 + 10 * Math.cos(now / 1000);
  directionalLight[0] = Math.sin(now / 1500);
  directionalLight[2] = Math.cos(now / 1500);

  device.queue.writeBuffer(ambientBuffer, 0, ambient);
  device.queue.writeBuffer(pointBuffer, 0, pointLight);
  device.queue.writeBuffer(directionalBuffer, 0, directionalLight);

  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  // 开启渲染通道
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
  renderPass.setBindGroup(1, lightGroup);

  renderPass.setVertexBuffer(0, boxBuffer.vertex);
  renderPass.setIndexBuffer(boxBuffer.index, "uint16");
  renderPass.drawIndexed(box.indexCount, NUM / 2, 0, 0, 0);

  renderPass.setVertexBuffer(0, sphereBuffer.vertex);
  renderPass.setIndexBuffer(sphereBuffer.index, "uint16");
  renderPass.drawIndexed(sphere.indexCount, NUM / 2, 0, 0, NUM / 2);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};
render();

document.querySelector("#ambient")?.addEventListener("input", (e: Event) => {
  ambient[0] = +(e.target as HTMLInputElement).value;
});
document.querySelector("#point")?.addEventListener("input", (e: Event) => {
  pointLight[4] = +(e.target as HTMLInputElement).value;
});
document.querySelector("#radius")?.addEventListener("input", (e: Event) => {
  pointLight[5] = +(e.target as HTMLInputElement).value;
});
document.querySelector("#dir")?.addEventListener("input", (e: Event) => {
  directionalLight[4] = +(e.target as HTMLInputElement).value;
});
