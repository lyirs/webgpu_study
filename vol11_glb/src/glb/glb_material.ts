import { GLTFTexture } from "./glb_texture";

// 解析和上传材质数据到GPU
// 在没有任何扩展的情况下，glTf仅支持一种材质，即pbrMetallicRoughness
export class GLTFMaterial {
  baseColorFactor: number[]; // 基色
  emissiveFactor: number[]; // 自发光颜色
  metallicFactor: number; // 金属度
  roughnessFactor: number; // 粗糙度
  baseColorTexture: GLTFTexture | null;
  gpuBuffer: GPUBuffer | null;
  bindGroupLayout: GPUBindGroupLayout | null;
  bindGroup: GPUBindGroup | null;
  constructor(material: IMaterial, textures: GLTFTexture[]) {
    this.baseColorFactor = [1, 1, 1, 1];
    this.baseColorTexture = null;
    // padded to float4
    this.emissiveFactor = [0, 0, 0, 1];
    this.metallicFactor = 1.0;
    this.roughnessFactor = 1.0;

    if (material.pbrMetallicRoughness !== undefined) {
      let pbr = material.pbrMetallicRoughness;
      if (pbr.baseColorFactor !== undefined) {
        this.baseColorFactor = pbr.baseColorFactor;
      }
      if (pbr.baseColorTexture !== undefined) {
        // TODO 处理多个纹理坐标集（texcoords）的支持
        this.baseColorTexture = textures[pbr.baseColorTexture.index];
      }
      if (pbr.metallicFactor !== undefined) {
        this.metallicFactor = pbr.metallicFactor;
      }
      if (pbr.roughnessFactor !== undefined) {
        this.roughnessFactor = pbr.roughnessFactor;
      }
    }
    if (material.emissiveFactor !== undefined) {
      this.emissiveFactor[0] = material.emissiveFactor[0];
      this.emissiveFactor[1] = material.emissiveFactor[1];
      this.emissiveFactor[2] = material.emissiveFactor[2];
    }

    this.gpuBuffer = null;
    this.bindGroupLayout = null;
    this.bindGroup = null;
  }

  upload(device: GPUDevice) {
    const buf = device.createBuffer({
      size: 3 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true,
    });
    const mappingView = new Float32Array(buf.getMappedRange());
    mappingView.set(this.baseColorFactor);
    mappingView.set(this.emissiveFactor, 4);
    mappingView.set([this.metallicFactor, this.roughnessFactor], 8);
    buf.unmap();
    this.gpuBuffer = buf;

    const layoutEntries: GPUBindGroupLayoutEntry[] = [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
    ];
    const bindGroupEntries: GPUBindGroupEntry[] = [
      {
        binding: 0,
        resource: {
          buffer: this.gpuBuffer,
        },
      },
    ];

    if (this.baseColorTexture) {
      layoutEntries.push({
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {},
      });
      layoutEntries.push({
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      });
      bindGroupEntries.push({
        binding: 1,
        resource: this.baseColorTexture!.sampler,
      });
      bindGroupEntries.push({
        binding: 2,
        resource: this.baseColorTexture!.imageView,
      });
    }

    this.bindGroupLayout = device.createBindGroupLayout({
      entries: layoutEntries,
    });

    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: bindGroupEntries,
    });
  }
}
