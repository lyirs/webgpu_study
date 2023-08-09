/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
// 着色器
import vertWGSL from "./shader/cubeVert.wgsl?raw";
import fragWGSL from "./shader/cubeFrag.wgsl?raw";
import { InitGPU } from "./helper/init";
import { CubeData } from "./helper/vertexData";
import { getMvpMatrix } from "./helper/math";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const drawCanvas = gpu.drawCanvas;
const format = gpu.format;
const context = gpu.context;
const cubeData = CubeData();

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
        arrayStride: 5 * 4, // 顶点长度 以字节为单位  position float3 ，uv float2
        attributes: [
          // position
          {
            shaderLocation: 0, // 遍历索引，这里的索引值就对应的是着色器语言中 @location(0) 的数字
            offset: 0,
            format: "float32x3",
          },
          // uv
          {
            shaderLocation: 1, // @location(1)
            offset: 3 * 4,
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
    cullMode: "back",
    frontFace: "ccw",
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
// 创建顶点缓冲区 VBO
// 获取一块状态为映射了的显存，以及一个对应的 arrayBuffer 对象来写数据
const vertexBuffer = device.createBuffer({
  size: cubeData.vertexData.byteLength, // 指定了需要申请多大的显存，单位是 byte
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, cubeData.vertexData);

// 统一缓冲区 UBO
// mvp buffer
const mvpBuffer = device.createBuffer({
  size: 4 * 4 * 4, // mat4*4 * float32
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const uniformBindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: {
        buffer: mvpBuffer,
      },
    },
  ],
});

// 采样 sampler 创建一个 GPUSampler。
const sampler = device.createSampler({
  magFilter: "linear",
  minFilter: "linear",
});

// 纹理 texture
const texture = device.createTexture({
  size: [drawCanvas.width, drawCanvas.height],
  // 指定纹理的像素格式，这里使用 8 位无符号整数格式表示 RGBA 颜色
  format: "rgba8unorm",
  // 指定纹理的使用方式，包括绑定为纹理、拷贝目标和渲染目标
  usage:
    GPUTextureUsage.TEXTURE_BINDING |
    GPUTextureUsage.COPY_DST |
    GPUTextureUsage.RENDER_ATTACHMENT,
});

const textureBindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(1),
  entries: [
    {
      binding: 0,
      resource: sampler,
    },
    {
      binding: 1,
      resource: texture.createView(),
    },
  ],
});

// 初始数据
let aspect = canvas.width / canvas.height;
const position = { x: 0, y: 0, z: -5 };
const scale = { x: 1, y: 1, z: 1 };
const rotation = { x: 0, y: 0, z: 0 };

// 渲染
const render = () => {
  const now = Date.now() / 1000;
  rotation.x = Math.sin(now);
  rotation.y = Math.cos(now);
  const mvpMatrix = getMvpMatrix(aspect, position, rotation, scale);
  device.queue.writeBuffer(mvpBuffer, 0, mvpMatrix);
  // 将平台图像/画布的内容复制到目标纹理中。
  device.queue.copyExternalImageToTexture(
    { source: drawCanvas },
    { texture: texture },
    [drawCanvas.width, drawCanvas.height]
  );

  // 开始命令编码
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
  // renderPass.setViewport(
  //   0,
  //   0,
  //   canvas.width * window.devicePixelRatio,
  //   canvas.height * window.devicePixelRatio,
  //   0,
  //   1
  // );
  // 设置渲染管线
  renderPass.setPipeline(pipeline);
  // 设置绑定组
  renderPass.setBindGroup(0, uniformBindGroup);
  renderPass.setBindGroup(1, textureBindGroup);
  // 设置顶点缓冲区
  renderPass.setVertexBuffer(0, vertexBuffer);
  // 绘制
  renderPass.draw(36);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  // 结束命令编码
  requestAnimationFrame(render);
};
requestAnimationFrame(render);

{
  const ctx = drawCanvas.getContext("2d");
  if (!ctx) throw new Error("No support 2d");
  ctx.fillStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

  let drawing = false;
  let lastX = 0,
    lastY = 0;
  let hue = 0;
  drawCanvas.addEventListener("pointerdown", (e: PointerEvent) => {
    drawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
  });
  drawCanvas.addEventListener("pointermove", (e: PointerEvent) => {
    if (!drawing) return;
    const x = e.offsetX;
    const y = e.offsetY;
    hue = hue > 360 ? 0 : hue + 1;
    ctx.strokeStyle = `hsl(${hue}, 90%, 50%)`;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  });
  drawCanvas.addEventListener("pointerup", () => (drawing = false));
  drawCanvas.addEventListener("pointerout", () => (drawing = false));
}
