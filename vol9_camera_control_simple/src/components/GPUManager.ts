/// <reference types="@webgpu/types" />

export class GPUManager {
  private static _instance: GPUManager;
  public device: GPUDevice | null = null;
  public format: GPUTextureFormat | null = null;
  public adapter: GPUAdapter | null = null;
  public context: GPUCanvasContext | null = null;
  public canvas: HTMLCanvasElement | null = null;

  private constructor() {}

  public static getInstance(): GPUManager {
    if (!this._instance) {
      this._instance = new GPUManager();
    }
    return this._instance;
  }

  public async init() {
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
    this.format = format;
    this.device = device;
    this.adapter = adapter;
    this.context = context;
    this.canvas = canvas;
  }
}
