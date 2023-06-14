/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
// 创建canvas
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// 获取webgpu上下文
if (navigator.gpu === undefined) {
  alert("当前浏览器不支持WebGPU，确保chrome版本在113及以上。");
  throw new Error("当前浏览器不支持WebGPU");
}
const context = canvas.getContext("webgpu") as GPUCanvasContext;
// 请求WebGPU适配器与GPU设备
const adapter = (await navigator.gpu.requestAdapter()) as GPUAdapter;
const device = await adapter.requestDevice();
const format = navigator.gpu.getPreferredCanvasFormat();
// 配置上下文
context.configure({
  device: device,
  // 上下文格式
  format: format,
  // 不透明度
  alphaMode: "opaque",
});

// 立方体数据
const cubeVertexArray = new Float32Array([
  // float4 position, float4 color, float2 uv,
  1, -1, 1, 1, 1, 0, 1, 1, 1, 1, -1, -1, 1, 1, 0, 0, 1, 1, 0, 1, -1, -1, -1, 1,
  0, 0, 0, 1, 0, 0, 1, -1, -1, 1, 1, 0, 0, 1, 1, 0, 1, -1, 1, 1, 1, 0, 1, 1, 1,
  1, -1, -1, -1, 1, 0, 0, 0, 1, 0, 0,

  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 0, 1, 1, 0, 1, 1, -1, -1, 1, 1,
  0, 0, 1, 0, 0, 1, 1, -1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  -1, -1, 1, 1, 0, 0, 1, 0, 0,

  -1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, -1, 1, 1,
  1, 0, 1, 0, 0, -1, 1, -1, 1, 0, 1, 0, 1, 1, 0, -1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
  1, 1, -1, 1, 1, 1, 0, 1, 0, 0,

  -1, -1, 1, 1, 0, 0, 1, 1, 1, 1, -1, 1, 1, 1, 0, 1, 1, 1, 0, 1, -1, 1, -1, 1,
  0, 1, 0, 1, 0, 0, -1, -1, -1, 1, 0, 0, 0, 1, 1, 0, -1, -1, 1, 1, 0, 0, 1, 1,
  1, 1, -1, 1, -1, 1, 0, 1, 0, 1, 0, 0,

  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 0, 1, 1, 1, 0, 1, -1, -1, 1, 1, 0,
  0, 1, 1, 0, 0, -1, -1, 1, 1, 0, 0, 1, 1, 0, 0, 1, -1, 1, 1, 1, 0, 1, 1, 1, 0,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,

  1, -1, -1, 1, 1, 0, 0, 1, 1, 1, -1, -1, -1, 1, 0, 0, 0, 1, 0, 1, -1, 1, -1, 1,
  0, 1, 0, 1, 0, 0, 1, 1, -1, 1, 1, 1, 0, 1, 1, 0, 1, -1, -1, 1, 1, 0, 0, 1, 1,
  1, -1, 1, -1, 1, 0, 1, 0, 1, 0, 0,
]);

const cubeVertexSize = 10 * 4; // 10 乘以 float 的字节数 4
const cubePositionOffset = 0;
const cubeColorOffset = 4 * 4; // 颜色属性紧随位置数据之后, 偏移量是 4 * 4
const cubeUVOffset = 8 * 4;
const cubeVertexCount = 36;

// 创建顶点缓冲区 VBO
// 获取一块状态为映射了的显存，以及一个对应的 arrayBuffer 对象来写数据
const verticesBuffer = device.createBuffer({
  size: cubeVertexArray.byteLength, // 指定了需要申请多大的显存，单位是 byte
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true, // 被设置为 true，则 size 必须是 4 的倍数，创建时立刻映射，让 CPU 端能读写数据
});
new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray); // 复制目标/复制源类型的 GPUBuffer ,通过 TypedArray 向 ArrayBuffer 写入数据
verticesBuffer.unmap(); // 解除显存对象的映射，稍后它就能在 GPU 中进行复制操作

// 着色器
import vertWGSL from "./shader/cubeVert.wgsl?raw";
import fragWGSL from "./shader/cubeFrag.wgsl?raw";
import { mat4, vec3 } from "gl-matrix";
// 创建渲染管线
const pipline = device.createRenderPipeline({
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
        arrayStride: cubeVertexSize,
        attributes: [
          {
            shaderLocation: 0,
            offset: cubePositionOffset,
            format: "float32x4",
          },
          {
            shaderLocation: 1,
            offset: cubeUVOffset,
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
  // 多重采样
  multisample: {
    count: 4,
  },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: "less",
    format: "depth24plus",
  },
});

const depthTexture = device.createTexture({
  sampleCount: 4,
  size: [canvas.width, canvas.height],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

// UBO
const uniformBufferSize = 4 * 16;
const uniformBuffer = device.createBuffer({
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const uniformBindGroup = device.createBindGroup({
  layout: pipline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: {
        buffer: uniformBuffer,
      },
    },
  ],
});

const aspect = canvas.width / canvas.height; // 相机宽高比例
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, aspect, 0.1, 100.0);

function getTransformationMatrix() {
  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -8));

  const now = Date.now() / 1000;

  mat4.rotate(viewMatrix, viewMatrix, now, vec3.fromValues(1, 1, 1));
  const modelViewProjectionMatrix = mat4.create() as Float32Array;
  mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
  return modelViewProjectionMatrix;
}

const texture = device.createTexture({
  size: [canvas.width, canvas.height],
  sampleCount: 4, // 4倍抗锯齿
  format: format,
  usage: GPUTextureUsage.RENDER_ATTACHMENT, // 纹理用途
});

const view = texture.createView();

// 渲染
const render = () => {
  const modelViewProjectionMatrix = getTransformationMatrix();
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    modelViewProjectionMatrix.buffer,
    modelViewProjectionMatrix.byteOffset,
    modelViewProjectionMatrix.byteLength
  );
  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  // 开启渲染通道
  const renderPass = commandEncoder.beginRenderPass({
    // 渲染目标
    // 颜色附件
    colorAttachments: [
      {
        view: view,
        resolveTarget: context.getCurrentTexture().createView(),
        clearValue: {
          r: 0.0,
          g: 0.0,
          b: 0.0,
          a: 1.0,
        },
        // 清除操作
        loadOp: "clear",
        // 保存操作
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
  // 设置渲染管线
  renderPass.setPipeline(pipline);
  // 设置绑定组
  renderPass.setBindGroup(0, uniformBindGroup);
  // 设置顶点缓冲区
  renderPass.setVertexBuffer(0, verticesBuffer);
  // 绘制
  renderPass.draw(cubeVertexCount, 1, 0, 0);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  // 结束命令编码
  requestAnimationFrame(render);
};
requestAnimationFrame(render);
