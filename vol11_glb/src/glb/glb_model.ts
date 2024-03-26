import { GLTFNode } from "./glb_node";
import { GLBShaderCache } from "./glb_shader_cache";

export class GLBModel {
  nodes: GLTFNode[];
  constructor(nodes: GLTFNode[]) {
    this.nodes = nodes;
  }

  buildRenderBundles(
    device: GPUDevice,
    shaderCache: GLBShaderCache,
    viewParamsLayout: GPUBindGroupLayout,
    viewParamsBindGroup: GPUBindGroup | null,
    swapChainFormat: GPUTextureFormat,
    depthFormat: GPUTextureFormat
  ) {
    let renderBundles = [];
    for (let i = 0; i < this.nodes.length; ++i) {
      let n = this.nodes[i];
      let bundle = n.buildRenderBundle(
        device,
        shaderCache,
        viewParamsLayout,
        viewParamsBindGroup,
        swapChainFormat,
        depthFormat
      );
      renderBundles.push(bundle);
    }
    return renderBundles;
  }
}
