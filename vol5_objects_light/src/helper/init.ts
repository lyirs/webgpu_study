/// <reference types="@webgpu/types" />

export const InitGPU = async () => {
  if (navigator.gpu === undefined) {
    alert("当前浏览器不支持WebGPU，确保chrome版本在113及以上。");
    throw new Error("当前浏览器不支持WebGPU");
  }
  // 创建canvas
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
  return { device, canvas, format, context };
};
