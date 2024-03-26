import { GLTFNode } from "./glb_node";

export class GLBModel {
  nodes: GLTFNode[];
  constructor(nodes: GLTFNode[]) {
    this.nodes = nodes;
  }

  buildRenderPipeline(
    device: GPUDevice,
    shaderModule: GPUShaderModule,
    uniformsBindGroupLayout: GPUBindGroupLayout,
    swapChainFormat: GPUTextureFormat,
    depthFormat: GPUTextureFormat
  ) {
    for (let i = 0; i < this.nodes.length; ++i) {
      let n = this.nodes[i];
      n.buildRenderPipeline(
        device,
        shaderModule,
        uniformsBindGroupLayout,
        swapChainFormat,
        depthFormat
      );
    }
  }

  render(renderPassEncoder: GPURenderPassEncoder, uniformsBindGroup: GPUBindGroup) {
    renderPassEncoder.setBindGroup(0, uniformsBindGroup);
    for (let n of this.nodes) {
      n.render(renderPassEncoder);
    }
  }
}
