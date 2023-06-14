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
// 着色器
import vertWGSL from "./vert.wgsl?raw";
import fragWGSL from "./frag.wgsl?raw";
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
});

const texture = device.createTexture({
  size: [canvas.width, canvas.height],
  sampleCount: 4, // 4倍抗锯齿
  format: format,
  usage: GPUTextureUsage.RENDER_ATTACHMENT, // 纹理用途
});

const view = texture.createView();

// 渲染
const render = () => {
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
  });
  // 设置渲染管线
  renderPass.setPipeline(pipline);
  // 绘制三角形
  renderPass.draw(3, 1, 0, 0);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  // 结束命令编码
  requestAnimationFrame(render);
};
requestAnimationFrame(render);
