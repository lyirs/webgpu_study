import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import { getMvpMatrix } from "./helper/math";
import { CreateGPUBuffer } from "./helper/gpuBuffer";
import {
  cubeVertexArray,
  cubeVertexSize,
  cubeUVOffset,
  cubePositionOffset,
  cubeVertexCount,
} from "./helper/cube";

// 监听来自主线程的 'init' 消息，该消息将包含从页面传输的 OffscreenCanvas
// 将其用作开始 WebGPU 初始化的信号。
self.addEventListener("message", (ev: any) => {
  switch (ev.data.type) {
    case "init": {
      try {
        init(ev.data.offscreenCanvas);
      } catch (err: any) {
        self.postMessage({
          type: "log",
          message: `Error while initializing WebGPU in worker process: ${err.message}`,
        });
      }
      break;
    }
  }
});

const init = async (canvas: HTMLCanvasElement) => {
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
  const size = { width: canvas.width, height: canvas.height };

  const vertexBuffer = CreateGPUBuffer(device, cubeVertexArray);
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
          arrayStride: cubeVertexSize, // 顶点长度 以字节为单位
          attributes: [
            // position
            {
              shaderLocation: 0,
              offset: cubePositionOffset,
              format: "float32x4",
            },
            // uv
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
      cullMode: "back",
    },
    // 深度
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
    // 多重采样
    multisample: {
      count: 4,
    },
  });

  // 深度贴图
  const depthTexture = device.createTexture({
    size,
    sampleCount: 4,
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const texture = device.createTexture({
    size: [canvas.width, canvas.height],
    sampleCount: 4, // 4倍抗锯齿
    format: format,
    usage: GPUTextureUsage.RENDER_ATTACHMENT, // 纹理用途
  });
  const view = texture.createView();

  const uniformBuffer = device.createBuffer({
    size: 4 * 4 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
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
  const scale = { x: 1, y: 1, z: 1 };
  // 渲染
  const render = () => {
    const now = Date.now() / 1000;
    const rotation = { x: Math.sin(now), y: Math.cos(now), z: 0 };
    const mvpMatrix = getMvpMatrix(aspect, position, rotation, scale);
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix);

    // 开始命令编码
    const commandEncoder = device.createCommandEncoder();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: view,
          resolveTarget: context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1.0 }, //background color
          loadOp: "clear",
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
    renderPass.setPipeline(pipeline);

    renderPass.setBindGroup(0, uniformBindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.draw(cubeVertexCount, 1);
    // 结束渲染通道
    renderPass.end();
    // 提交命令
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  };
  // 为了使 Worker 能够处理事件，定期将控制权交还给浏览器是很重要的。
  // 在 Worker 中使用传统的 requestAnimationFrame() 循环是确保事件被正确处理的一种方式。
  // 不应该简单地使用类似 while(true) 的无限循环
  requestAnimationFrame(render);
};

export {};
