import { GLTFTextureFilter } from "./glb_tool";

export class GLTFSampler {
  sampler: GPUSampler;
  constructor(sampler: IGLTFSampler, device: GPUDevice) {
    let magFilter: GPUFilterMode =
      sampler.magFilter === undefined ||
      sampler.magFilter == GLTFTextureFilter.LINEAR
        ? "linear"
        : "nearest";
    let minFilter: GPUFilterMode =
      sampler.minFilter === undefined ||
      sampler.minFilter == GLTFTextureFilter.LINEAR
        ? "linear"
        : "nearest";
    let wrapS: GPUAddressMode = "repeat";
    if (sampler.wrapS !== undefined) {
      if (sampler.wrapS == GLTFTextureFilter.REPEAT) {
        wrapS = "repeat";
      } else if (sampler.wrapS == GLTFTextureFilter.CLAMP_TO_EDGE) {
        wrapS = "clamp-to-edge";
      } else {
        wrapS = "mirror-repeat";
      }
    }
    let wrapT: GPUAddressMode = "repeat";
    if (sampler.wrapT !== undefined) {
      if (sampler.wrapT == GLTFTextureFilter.REPEAT) {
        wrapT = "repeat";
      } else if (sampler.wrapT == GLTFTextureFilter.CLAMP_TO_EDGE) {
        wrapT = "clamp-to-edge";
      } else {
        wrapT = "mirror-repeat";
      }
    }
    this.sampler = device.createSampler({
      magFilter: magFilter,
      minFilter: minFilter,
      addressModeU: wrapS,
      addressModeV: wrapT,
      mipmapFilter: "linear",
    });
  }
}
