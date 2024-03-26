import { GLTFAccessor } from "./glb_accessor";
import { GLTFMaterial } from "./glb_material";
import { GLBShaderCache } from "./glb_shader_cache";
import { GLTFRenderMode, GLTFComponentType } from "./glb_tool";

// GLTFPrimitive和GLTFMesh类 代表模型的几何数据和网格，以及构建渲染包。
export class GLTFPrimitive {
  indices: GLTFAccessor;
  positions: GLTFAccessor;
  normals: GLTFAccessor;
  texcoords: GLTFAccessor[];
  material: GLTFMaterial;
  topology: GLTFRenderMode;
  constructor(
    indices: GLTFAccessor,
    positions: GLTFAccessor,
    normals: GLTFAccessor,
    texcoords: GLTFAccessor[],
    material: GLTFMaterial,
    topology: GLTFRenderMode
  ) {
    this.indices = indices;
    this.positions = positions;
    this.normals = normals;
    this.texcoords = texcoords;
    this.material = material;
    this.topology = topology;
  }

  // 将这些几何数据与着色器和材质绑定，创建渲染管线，并设置顶点和索引缓冲区，以准备在WebGPU中渲染。
  // 这个方法动态地根据是否存在法线和纹理坐标来选择合适的着色器，并基于拓扑类型（如三角形列表或三角形带）来配置渲染管线。
  // 此外，如果模型有索引数据，则使用drawIndexed 方法渲染；否则，使用draw。
  buildRenderBundle(
    device: GPUDevice,
    shaderCache: GLBShaderCache,
    bindGroupLayouts: GPUBindGroupLayout[],
    bundleEncoder: GPURenderBundleEncoder,
    swapChainFormat: GPUTextureFormat,
    depthFormat: GPUTextureFormat
  ) {
    let shaderModule = shaderCache.getShader(
      this.normals!,
      this.texcoords.length > 0,
      this.material.baseColorTexture!
    );
    let vertexBuffers: GPUVertexBufferLayout[] = [
      {
        arrayStride: this.positions!.byteStride,
        attributes: [{ format: "float32x3", offset: 0, shaderLocation: 0 }],
      },
    ];
    if (this.normals) {
      vertexBuffers.push({
        arrayStride: this.normals.byteStride,
        attributes: [{ format: "float32x3", offset: 0, shaderLocation: 1 }],
      });
    }
    // TODO: Multi-texturing
    if (this.texcoords.length > 0) {
      vertexBuffers.push({
        arrayStride: this.texcoords[0].byteStride,
        attributes: [{ format: "float32x2", offset: 0, shaderLocation: 2 }],
      });
    }

    let layout = device.createPipelineLayout({
      bindGroupLayouts: [
        bindGroupLayouts[0],
        bindGroupLayouts[1],
        this.material.bindGroupLayout!,
      ],
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

    let renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    bundleEncoder.setBindGroup(2, this.material.bindGroup);
    bundleEncoder.setPipeline(renderPipeline);
    bundleEncoder.setVertexBuffer(
      0,
      this.positions.view.gpuBuffer,
      this.positions.byteOffset,
      this.positions.byteLength
    );
    if (this.normals) {
      bundleEncoder.setVertexBuffer(
        1,
        this.normals.view.gpuBuffer,
        this.normals.byteOffset,
        this.normals.byteLength
      );
    }
    if (this.texcoords.length > 0) {
      bundleEncoder.setVertexBuffer(
        2,
        this.texcoords[0].view.gpuBuffer,
        this.texcoords[0].byteOffset,
        this.texcoords[0].byteLength
      );
    }
    if (this.indices) {
      let indexFormat: GPUIndexFormat =
        this.indices.componentType == GLTFComponentType.UNSIGNED_SHORT
          ? "uint16"
          : "uint32";
      bundleEncoder.setIndexBuffer(
        this.indices.view.gpuBuffer!,
        indexFormat,
        this.indices.byteOffset,
        this.indices.byteLength
      );
      bundleEncoder.drawIndexed(this.indices.count);
    } else {
      bundleEncoder.draw(this.positions.count);
    }
  }
}
