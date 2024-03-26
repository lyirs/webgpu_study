import { GLTFAccessor } from "./glb_accessor";
import { GLTFRenderMode, GLTFComponentType } from "./glb_tool";

// GLTFPrimitive和GLTFMesh类 代表模型的几何数据和网格，以及构建渲染包。
export class GLTFPrimitive {
  indices: GLTFAccessor;
  positions: GLTFAccessor;
  topology: GLTFRenderMode;
  renderPipeline: GPURenderPipeline | null;
  constructor(
    indices: GLTFAccessor,
    positions: GLTFAccessor,
    topology: GLTFRenderMode
  ) {
    this.indices = indices;
    this.positions = positions;
    this.topology = topology;
    this.renderPipeline = null;
  }

  // 将这些几何数据与着色器和材质绑定，创建渲染管线，并设置顶点和索引缓冲区，以准备在WebGPU中渲染。
  // 这个方法动态地根据是否存在法线和纹理坐标来选择合适的着色器，并基于拓扑类型（如三角形列表或三角形带）来配置渲染管线。
  // 此外，如果模型有索引数据，则使用drawIndexed 方法渲染；否则，使用draw。
  buildRenderPipeline(
    device: GPUDevice,
    shaderModule: GPUShaderModule,
    bindGroupLayouts: GPUBindGroupLayout[],
    swapChainFormat: GPUTextureFormat,
    depthFormat: GPUTextureFormat
  ) {
    let vertexBuffers: GPUVertexBufferLayout[] = [
      {
        arrayStride: this.positions!.byteStride,
        attributes: [{ format: "float32x3", offset: 0, shaderLocation: 0 }],
      },
    ];

    let layout = device.createPipelineLayout({
      bindGroupLayouts: bindGroupLayouts,
    });

    let vertexStage: GPUVertexState = {
      module: shaderModule,
      entryPoint: "vertex_main",
      buffers: vertexBuffers,
    };

    let fragmentStage = {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [{ format: swapChainFormat }],
    };

    // TODO: cullMode, alphaMode
    let primitive: GPUPrimitiveState = {
      topology: "triangle-list",
    };

    if (this.topology == GLTFRenderMode.TRIANGLE_STRIP) {
      primitive.topology = "triangle-strip";
      primitive.stripIndexFormat =
        this.indices!.componentType == GLTFComponentType.UNSIGNED_SHORT
          ? "uint16"
          : "uint32";
    }

    let pipelineDescriptor: GPURenderPipelineDescriptor = {
      layout: layout,
      vertex: vertexStage,
      fragment: fragmentStage,
      primitive: primitive,
      depthStencil: {
        format: depthFormat,
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    };

    this.renderPipeline = device.createRenderPipeline(pipelineDescriptor);
  }

  render(renderPassEncoder: GPURenderPassEncoder) {
    renderPassEncoder.setPipeline(this.renderPipeline!);
    renderPassEncoder.setVertexBuffer(
      0,
      this.positions.view.gpuBuffer,
      this.positions.byteOffset,
      this.positions.byteLength
    );
    if (this.indices) {
      let indexFormat: GPUIndexFormat =
        this.indices.componentType == GLTFComponentType.UNSIGNED_SHORT
          ? "uint16"
          : "uint32";
      renderPassEncoder.setIndexBuffer(
        this.indices.view.gpuBuffer!,
        indexFormat,
        this.indices.byteOffset,
        this.indices.byteLength
      );
      renderPassEncoder.drawIndexed(this.indices.count);
    } else {
      renderPassEncoder.draw(this.positions.count);
    }
  }
}
