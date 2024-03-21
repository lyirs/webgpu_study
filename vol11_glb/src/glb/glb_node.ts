import { Mat4, mat4 } from "wgpu-matrix";
import { GLTFMesh } from "./glb_mesh";
import { GLBShaderCache } from "./glb_shader_cache";

export const readNodeTransform = (node: IGLTFNode) => {
  if (node.matrix) {
    let m = node.matrix;
    // Both glTF and gl matrix are column major
    return mat4.create(
      m[0],
      m[1],
      m[2],
      m[3],
      m[4],
      m[5],
      m[6],
      m[7],
      m[8],
      m[9],
      m[10],
      m[11],
      m[12],
      m[13],
      m[14],
      m[15]
    );
  } else {
    let scale = [1, 1, 1];
    let rotation = [0, 0, 0, 1];
    let translation = [0, 0, 0];
    if (node.scale) {
      scale = node.scale;
    }
    if (node.rotation) {
      rotation = node.rotation;
    }
    if (node.translation) {
      translation = node.translation;
    }
    let m = mat4.identity(); // Create a new Mat4 object
    m = mat4.fromQuat(rotation, m); // Set rotation from a quaternion
    m = mat4.translate(m, translation); // Apply translation
    m = mat4.scale(m, scale); // Apply scale

    return m;
  }
};

// 遍历GLTF模型中所有的节点，并递归地将每个节点的变换应用到其子节点上，从而“扁平化”场景图。
// 这意味着每个节点的变换都是相对于全局坐标系的，而不仅仅是相对于其父节点。
// 这个过程使得最终每个节点的变换包含了从根节点到该节点的所有变换，简化了后续的渲染计算。
// 在此过程中，节点的局部scale、rotation和translation被清除，统一替换为一个综合的变换矩阵。
const flattenGLTFChildren = (
  nodes: IGLTFNode[],
  node: IGLTFNode,
  parent_transform: Mat4
) => {
  let tfm = readNodeTransform(node);
  tfm = mat4.mul(parent_transform, tfm, tfm);
  node.matrix = tfm;
  node.scale = undefined;
  node.rotation = undefined;
  node.translation = undefined;
  if (node.children) {
    for (let i = 0; i < node.children.length; ++i) {
      flattenGLTFChildren(nodes, nodes[node.children[i]], tfm);
    }
    node.children = [];
  }
};

export const makeGLTFSingleLevel = (nodes: IGLTFNode[]) => {
  let rootTfm = mat4.identity();
  for (let i = 0; i < nodes.length; ++i) {
    flattenGLTFChildren(nodes, nodes[i], rootTfm);
  }
  return nodes;
};

// GLTFNode和GLBModel类 表示场景中的节点和整个模型，负责上传变换矩阵和组织渲染流程。
export class GLTFNode {
  name: string;
  mesh: GLTFMesh;
  transform: Mat4;
  gpuUniforms: GPUBuffer | null;
  bindGroup: GPUBindGroup | null;
  renderBundle: GPURenderBundle | undefined;
  constructor(name: string, mesh: GLTFMesh, transform: Mat4) {
    this.name = name;
    this.mesh = mesh;
    this.transform = transform;

    this.gpuUniforms = null;
    this.bindGroup = null;
  }

  upload(device: GPUDevice) {
    let buf = device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true,
    });
    new Float32Array(buf.getMappedRange()).set(this.transform);
    buf.unmap();
    this.gpuUniforms = buf;
  }

  buildRenderBundle(
    device: GPUDevice,
    shaderCache: GLBShaderCache,
    viewParamsLayout: GPUBindGroupLayout,
    viewParamsBindGroup: GPUBindGroup | null,
    swapChainFormat: GPUTextureFormat,
    depthFormat: GPUTextureFormat
  ) {
    let nodeParamsLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });

    this.bindGroup = device.createBindGroup({
      layout: nodeParamsLayout,
      entries: [
        { binding: 0, resource: { buffer: this.gpuUniforms } },
      ] as GPUBindGroupEntry[],
    });

    let bindGroupLayouts = [viewParamsLayout, nodeParamsLayout];

    let bundleEncoder = device.createRenderBundleEncoder({
      colorFormats: [swapChainFormat],
      depthStencilFormat: depthFormat,
    });

    bundleEncoder.setBindGroup(0, viewParamsBindGroup);
    bundleEncoder.setBindGroup(1, this.bindGroup);

    for (let i = 0; i < this.mesh.primitives.length; ++i) {
      this.mesh.primitives[i].buildRenderBundle(
        device,
        shaderCache,
        bindGroupLayouts,
        bundleEncoder,
        swapChainFormat,
        depthFormat
      );
    }

    this.renderBundle = bundleEncoder.finish();
    return this.renderBundle;
  }
}
