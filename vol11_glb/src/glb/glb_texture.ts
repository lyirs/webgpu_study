import { GLTFSampler } from "./glb_sampler";

// GLTFTexture和GLTFSampler类 处理GLB文件中的纹理和采样器，包括纹理的创建和配置
export class GLTFTexture {
  gltfsampler: GLTFSampler;
  sampler: GPUSampler;
  image: GPUTexture;
  imageView: GPUTextureView;
  constructor(sampler: GLTFSampler, image: GPUTexture) {
    this.gltfsampler = sampler;
    this.sampler = sampler.sampler;
    this.image = image;
    this.imageView = image.createView();
  }
}
