/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
// 着色器
import vertWGSL from "./shader/cubeVert.wgsl?raw";
import fragWGSL from "./shader/cubeFrag.wgsl?raw";
import { InitGPU } from "./helper/init";
import { CubeData } from "./helper/vertexData";
import { getMvpMatrix } from "./helper/math";

import videoSrc from "/1.mp4";

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
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

const video = document.createElement("video");
video.loop = true;
video.autoplay = true;
video.muted = true;
video.src = videoSrc;
await video.play();

// 初始数据
let aspect = canvas.width / canvas.height;
const position = { x: 0, y: 0, z: -5 };
const scale = { x: 1, y: 1, z: 1 };
const rotation = { x: 0, y: 0, z: 0 };

// 渲染
const render = () => {
  // 视频帧率可能不会与页面渲染率相同
  // 我们可以使用VideoFrame来强制视频解码当前帧
  // @ts-ignore
  const videoFrame = new VideoFrame(video);
  videoFrame.close();

  // importExternalTexture只会返回当前视频帧的截图，并不会随着video的播放而自动更新
  // 所以要在循环中手动调用
  // 另外每一次GPU刷新，这个texture会被立即销毁回收，其生命周期只能保持在render的回调函数中，与其他texture并不一样
  // 其在wgsl中也有单独的类型 texture_external
  const texture = device.importExternalTexture({
    source: video,
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
        resource: texture, // 这里不需要createView
      },
    ],
  });

  const now = Date.now() / 1000;
  rotation.x = Math.sin(now);
  rotation.y = Math.cos(now);
  const mvpMatrix = getMvpMatrix(aspect, position, rotation, scale);
  device.queue.writeBuffer(mvpBuffer, 0, mvpMatrix);

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
