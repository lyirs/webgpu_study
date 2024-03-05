import vertWGSL from "./shader/axes.vert.wgsl?raw";
import fragWGSL from "./shader/axes.frag.wgsl?raw";
import { CreateGPUBuffer } from "../helper/gpuBuffer";
import { Camera } from "./Camera";
import { Mat4, mat4, vec3 } from "wgpu-matrix";
import { RenderableObject } from "./RenderableObject";
import { GPUManager } from "./GPUManager";
import InputManager from "./InputManager";

// prettier-ignore
const axesVertexArray = new Float32Array([
  0, 0, 0, 1, 
  1, 0, 0, 1, 
  0, 0, 0, 1, 
  0, 1, 0, 1, 
  0, 0, 0, 1, 
  0, 0, 1, 1,
]);

class Axes extends RenderableObject {
  public pipeline: GPURenderPipeline;
  public uniformBuffer: any;
  public uniformBindGroup: any;
  public vertexBuffer: GPUBuffer;
  public vertexCount: number;
  public device: GPUDevice;
  constructor(length: number = 1) {
    super();
    const gpuManager = GPUManager.getInstance();
    const device = gpuManager.device as GPUDevice;
    const format = gpuManager.format as GPUTextureFormat;

    this.device = device;

    this.setScale({ x: length, y: length, z: length });

    this.vertexBuffer = CreateGPUBuffer(device, axesVertexArray);

    this.pipeline = device.createRenderPipeline({
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
            arrayStride: 4 * 4, // 顶点长度 以字节为单位
            attributes: [
              // position
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x4",
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
        topology: "line-list",
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

    this.uniformBuffer = device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.uniformBindGroup = device.createBindGroup({
      label: "uniform",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
      ],
    });

    this.vertexCount = 6;
  }

  public render(
    renderPass: GPURenderPassEncoder,
    camera: Camera,
    deltaTime: number,
    inputManager: InputManager
  ) {
    const vpMatrix = mat4.multiply(
      camera.projectionMatrix,
      camera.update(deltaTime, inputManager.getInput())
    );

    const mvpMatrix = mat4.multiply(vpMatrix, this.modelMatrix) as Float32Array;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, mvpMatrix);
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.uniformBindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(this.vertexCount, 1);
  }
}

export default Axes;
