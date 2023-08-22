import { GPUManager } from "./GPUManager";

export class Scene {
  private objects: any[] = []; // 保存场景中的所有对象
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;

  private depthTexture: GPUTexture; // 记录深度贴图
  private view: GPUTextureView; // 记录视图

  constructor() {
    const gpuManager = GPUManager.getInstance();
    this.device = gpuManager.device as GPUDevice;
    this.context = gpuManager.context as GPUCanvasContext;
    this.format = gpuManager.format as GPUTextureFormat;

    const canvas = gpuManager.canvas as HTMLCanvasElement;
    const size = { width: canvas.width, height: canvas.height };

    this.depthTexture = this.device.createTexture({
      size,
      sampleCount: 4,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const texture = this.device.createTexture({
      size: [canvas.width, canvas.height],
      sampleCount: 4,
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.view = texture.createView();
  }

  addObject(object: any) {
    this.objects.push(object);
  }

  render(camera: any) {
    const commandEncoder = this.device.createCommandEncoder();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.view,
          resolveTarget: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    this.objects.forEach((object) => {
      if (object.render) {
        object.render(renderPass, camera);
      }
    });

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
