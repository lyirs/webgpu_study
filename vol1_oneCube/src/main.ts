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

// 为获得数据队列中下一个属性值（比如位置向量的下个 4 维分量）我们必须向右移动 10 个 float ，其中 4 个是位置值，另外 4 个是颜色值，还有 2 个是 uv 值，那么步长就是 10 乘以 float 的字节数 4（= 40 字节）
const cubeVertexSize = 10 * 4; // 10 乘以 float 的字节数 4
const cubePositionOffset = 0;
const cubeColorOffset = 4 * 4; // 颜色属性紧随位置数据之后, 偏移量是 4 * 4
const cubeUVOffset = 8 * 4;
const cubeVertexCount = 36;

// 创建顶点缓冲区 VBO
// 获取一块状态为映射了的显存，以及一个对应的 arrayBuffer 对象来写数据
const vertexBuffer = device.createBuffer({
  size: cubeVertexArray.byteLength, // 指定了需要申请多大的显存，单位是 byte
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true, // 被设置为 true，则 size 必须是 4 的倍数，创建时立刻映射，让 CPU 端能读写数据
});
new Float32Array(vertexBuffer.getMappedRange()).set(cubeVertexArray); // 复制目标/复制源类型的 GPUBuffer ,通过 TypedArray 向 ArrayBuffer 写入数据
vertexBuffer.unmap(); // 解除显存对象的映射，稍后它就能在 GPU 中进行复制操作
/**
 * 应用程序可以请求映射一个 GPUBuffer，这样它们就可以通过代表 GPUBuffer 分配的部分的 arraybuffer 访问它的内容。
 * 映射一个 GPUBuffer 是通过 mapAsync() 异步请求的，这样用户代理可以确保 GPU 在应用程序访问它的内容之前完成了对 GPUBuffer 的使用。
 * 映射的 GPUBuffer 不能被 GPU 使用，必须使用 unmap() 解除映射，然后才能将使用它的工作提交到 Queue 时间轴。
 * 一旦映射了 GPUBuffer，应用程序就可以通过 getMappedRange 同步请求访问其内容的范围
 */

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
      // 缓冲区集合，其中一个元素对应一个缓冲对象
      {
        arrayStride: cubeVertexSize, // 顶点长度 以字节为单位
        attributes: [
          {
            shaderLocation: 0, // 遍历索引，这里的索引值就对应的是着色器语言中 @location(0) 的数字
            offset: cubePositionOffset,
            format: "float32x4",
          },
          {
            shaderLocation: 1, // @location(1)
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
  // 深度
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: "less",
    format: "depth24plus",
  },
});

const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

// UBO
const uniformBufferSize = 4 * 4 * 4;
const uniformBuffer = device.createBuffer({
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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
  // 我们不能直接操作command buffer，需要创建command encoder，使用它将多个commands（如render pass的draw）设置到一个command buffer中，然后执行submit，把command buffer提交到gpu driver的队列中。
  const commandEncoder = device.createCommandEncoder();

  // 开启渲染通道
  const renderPass = commandEncoder.beginRenderPass({
    // 渲染目标
    // 颜色附件
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: {
          r: 0.0,
          g: 0.0,
          b: 0.0,
          a: 1.0,
        },
        // load 的意思是渲染前保留attachment中的数据,clear 意思是渲染前清除
        loadOp: "clear",
        // 如果为“store”，意思是渲染后保存被渲染的内容到内存中，后面可以被读取；如果为“clear”，意思是渲染后清空内容。
        storeOp: "store",
      },
    ],
    // 在深度测试时，gpu会将fragment的z值（范围为[0.0-1.0]）与这里设置的depthClearValue值（这里为1.0）比较。
    // 其中使用depthCompare定义的函数（这里为less，意思是所有z值大于等于1.0的fragment会被剔除）进行比较。
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
  renderPass.setVertexBuffer(0, vertexBuffer);
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
