import vertWGSL from "./shader/vert.wgsl?raw";
import fragWGSL from "./shader/frag.wgsl?raw";
import { CreateGPUBuffer } from "../helper/gpuBuffer";
import { Camera } from "./Camera";
import { Mat4, mat4, vec3 } from "wgpu-matrix";

const cubeVertexSize = 4 * 10;
const cubePositionOffset = 0;
const cubeColorOffset = 4 * 4;
const cubeUVOffset = 4 * 8;
const cubeVertexCount = 36;

// prettier-ignore
const cubeVertexArray = new Float32Array([
  // float4 position, float4 color, float2 uv,
  1, -1, 1, 1,   1, 0, 1, 1,  0, 1,
  -1, -1, 1, 1,  0, 0, 1, 1,  1, 1,
  -1, -1, -1, 1, 0, 0, 0, 1,  1, 0,
  1, -1, -1, 1,  1, 0, 0, 1,  0, 0,
  1, -1, 1, 1,   1, 0, 1, 1,  0, 1,
  -1, -1, -1, 1, 0, 0, 0, 1,  1, 0,

  1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
  1, -1, 1, 1,   1, 0, 1, 1,  1, 1,
  1, -1, -1, 1,  1, 0, 0, 1,  1, 0,
  1, 1, -1, 1,   1, 1, 0, 1,  0, 0,
  1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
  1, -1, -1, 1,  1, 0, 0, 1,  1, 0,

  -1, 1, 1, 1,   0, 1, 1, 1,  0, 1,
  1, 1, 1, 1,    1, 1, 1, 1,  1, 1,
  1, 1, -1, 1,   1, 1, 0, 1,  1, 0,
  -1, 1, -1, 1,  0, 1, 0, 1,  0, 0,
  -1, 1, 1, 1,   0, 1, 1, 1,  0, 1,
  1, 1, -1, 1,   1, 1, 0, 1,  1, 0,

  -1, -1, 1, 1,  0, 0, 1, 1,  0, 1,
  -1, 1, 1, 1,   0, 1, 1, 1,  1, 1,
  -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
  -1, -1, -1, 1, 0, 0, 0, 1,  0, 0,
  -1, -1, 1, 1,  0, 0, 1, 1,  0, 1,
  -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,

  1, 1, 1, 1,    1, 1, 1, 1,  0, 1,
  -1, 1, 1, 1,   0, 1, 1, 1,  1, 1,
  -1, -1, 1, 1,  0, 0, 1, 1,  1, 0,
  -1, -1, 1, 1,  0, 0, 1, 1,  1, 0,
  1, -1, 1, 1,   1, 0, 1, 1,  0, 0,
  1, 1, 1, 1,    1, 1, 1, 1,  0, 1,

  1, -1, -1, 1,  1, 0, 0, 1,  0, 1,
  -1, -1, -1, 1, 0, 0, 0, 1,  1, 1,
  -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
  1, 1, -1, 1,   1, 1, 0, 1,  0, 0,
  1, -1, -1, 1,  1, 0, 0, 1,  0, 1,
  -1, 1, -1, 1,  0, 1, 0, 1,  1, 0,
])

class Cube {
  public device: GPUDevice;
  public pipeline: GPURenderPipeline;
  public uniformBuffer: any;
  public uniformBindGroup: any;
  public vertexBuffer: GPUBuffer;
  public vertexCount: number;
  public position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  public scale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 };
  public rotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private _camera: Camera;
  private _modelMatrix: Mat4 = mat4.identity();
  constructor(device: GPUDevice, format: GPUTextureFormat, camera: Camera) {
    this.device = device;
    this._camera = camera;

    this.vertexBuffer = CreateGPUBuffer(device, cubeVertexArray);

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

    this.vertexCount = cubeVertexCount;
  }

  public set(
    position: { x: number; y: number; z: number },
    scale: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number }
  ) {
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
  }

  public setPosition(position: { x: number; y: number; z: number }) {
    this.position = position;
  }

  public setScale(scale: { x: number; y: number; z: number }) {
    this.scale = scale;
  }

  public setRotation(rotation: { x: number; y: number; z: number }) {
    this.rotation = rotation;
  }

  public render(renderPass: GPURenderPassEncoder) {
    const vpMatrix = mat4.multiply(
      this._camera.projectionMatrix,
      this._camera.viewMatrix
    );

    const mvpMatrix = mat4.multiply(vpMatrix, this.modelMatrix) as Float32Array;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, mvpMatrix);
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.uniformBindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(this.vertexCount, 1);
  }

  public get modelMatrix(): Mat4 {
    this._modelMatrix = mat4.identity();
    this._modelMatrix = mat4.translate(
      this._modelMatrix,
      vec3.fromValues(this.position.x, this.position.y, this.position.z)
    );
    this._modelMatrix = mat4.rotateX(this._modelMatrix, this.rotation.x);
    this._modelMatrix = mat4.rotateY(this._modelMatrix, this.rotation.y);
    this._modelMatrix = mat4.rotateZ(this._modelMatrix, this.rotation.z);
    this._modelMatrix = mat4.scale(
      this._modelMatrix,
      vec3.fromValues(this.scale.x, this.scale.y, this.scale.z)
    );
    return this._modelMatrix;
  }
}

export default Cube;
