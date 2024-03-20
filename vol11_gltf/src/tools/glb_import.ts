import { Mat4, mat4 } from "wgpu-matrix";
import { GLBShaderCache } from "./glb_shader_cache";

const GLTFRenderMode = {
  POINTS: 0,
  LINE: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6,
};

const GLTFComponentType = {
  BYTE: 5120,
  UNSIGNED_BYTE: 5121,
  SHORT: 5122,
  UNSIGNED_SHORT: 5123,
  INT: 5124,
  UNSIGNED_INT: 5125,
  FLOAT: 5126,
  DOUBLE: 5130,
};

const GLTFTextureFilter = {
  NEAREST: 9728,
  LINEAR: 9729,
  NEAREST_MIPMAP_NEAREST: 9984,
  LINEAR_MIPMAP_NEAREST: 9985,
  NEAREST_MIPMAP_LINEAR: 9986,
  LINEAR_MIPMAP_LINEAR: 9987,
  REPEAT: 10497,
  CLAMP_TO_EDGE: 33071,
  MIRRORED_REPEAT: 33648,
};

// 确保了结果是align的倍数，并且是大于或等于原始val值的最小值
const alignTo = (val: number, align: number) => {
  return Math.floor((val + align - 1) / align) * align;
};

const gltfTypeNumComponents = (type: string): number | null => {
  switch (type) {
    case "SCALAR":
      return 1;
    case "VEC2":
      return 2;
    case "VEC3":
      return 3;
    case "VEC4":
      return 4;
    default:
      alert("Unhandled glTF Type " + type);
      return null;
  }
};

const gltfTypeSize = (componentType: number, type: string) => {
  let typeSize = 0;
  switch (componentType) {
    case GLTFComponentType.BYTE:
      typeSize = 1;
      break;
    case GLTFComponentType.UNSIGNED_BYTE:
      typeSize = 1;
      break;
    case GLTFComponentType.SHORT:
      typeSize = 2;
      break;
    case GLTFComponentType.UNSIGNED_SHORT:
      typeSize = 2;
      break;
    case GLTFComponentType.INT:
      typeSize = 4;
      break;
    case GLTFComponentType.UNSIGNED_INT:
      typeSize = 4;
      break;
    case GLTFComponentType.FLOAT:
      typeSize = 4;
      break;
    case GLTFComponentType.DOUBLE:
      typeSize = 4;
      break;
    default:
      alert("Unrecognized GLTF Component Type?");
  }
  return gltfTypeNumComponents(type)! * typeSize;
};

export class GLTFBuffer {
  arrayBuffer: ArrayBuffer;
  size: number;
  byteOffset: number;
  constructor(buffer: ArrayBuffer, size: number, offset: number) {
    this.arrayBuffer = buffer;
    this.size = size;
    this.byteOffset = offset;
  }
}

export class GLTFBufferView {
  length: number;
  byteOffset: number;
  byteStride: number;
  buffer: Uint8Array;
  needsUpload: boolean;
  gpuBuffer: GPUBuffer | null; // 存储在GPU中的缓冲区的引用。初始时为null，表示尚未创建或上传。
  usage: number;
  constructor(buffer: GLTFBuffer, view: IGLTFBufferView) {
    this.length = view.byteLength;
    this.byteOffset = buffer.byteOffset;
    if (view.byteOffset !== undefined) {
      this.byteOffset += view.byteOffset;
    }
    this.byteStride = 0;
    if (view.byteStride !== undefined) {
      this.byteStride = view.byteStride;
    }
    this.buffer = new Uint8Array(
      buffer.arrayBuffer,
      this.byteOffset,
      this.length
    );
    this.needsUpload = false;
    this.gpuBuffer = null;
    this.usage = 0;
  }

  // 允许设置bufferView的用途（如顶点数据、索引数据等），通过按位或操作累加不同的usage标志
  addUsage(usage: number) {
    this.usage = this.usage | usage;
  }

  // 将bufferView的数据上传到GPU
  upload(device: GPUDevice) {
    const buf = device.createBuffer({
      size: alignTo(this.buffer.byteLength, 4), // 确保分配的缓冲区大小是4的倍数，满足WebGPU的要求。
      usage: this.usage,
      mappedAtCreation: true,
    });
    new Uint8Array(buf.getMappedRange()).set(this.buffer);
    buf.unmap();
    this.gpuBuffer = buf;
    this.needsUpload = false;
  }
}

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
    });
  }
}

// 实现GLTF 2.0的PBR（Physically-Based Rendering）材质
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

export class GLTFAccessor {
  count: number;
  componentType: number;
  gltfType: string;
  numComponents: number;
  numScalars: number;
  view: GLTFBufferView;
  byteOffset: number;
  length: number | undefined;
  constructor(view: GLTFBufferView, accessor: IAccessor) {
    this.count = accessor.count;
    this.componentType = accessor.componentType;
    this.gltfType = accessor.type;
    this.numComponents = gltfTypeNumComponents(accessor["type"])!;
    this.numScalars = this.count * this.numComponents;
    this.view = view;
    this.byteOffset = 0;
    if (accessor.byteOffset !== undefined) {
      this.byteOffset = accessor.byteOffset;
    }
  }

  get byteStride() {
    let elementSize = gltfTypeSize(this.componentType, this.gltfType);
    return Math.max(elementSize, this.view.byteStride);
  }
}

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
      this.positions.length
    );
    if (this.normals) {
      bundleEncoder.setVertexBuffer(
        1,
        this.normals.view.gpuBuffer,
        this.normals.byteOffset,
        this.normals.length
      );
    }
    if (this.texcoords.length > 0) {
      bundleEncoder.setVertexBuffer(
        2,
        this.texcoords[0].view.gpuBuffer,
        this.texcoords[0].byteOffset,
        this.texcoords[0].length
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
        this.indices.length
      );
      bundleEncoder.drawIndexed(this.indices.count);
    } else {
      bundleEncoder.draw(this.positions.count);
    }
  }
}
export class GLTFMesh {
  name: string;
  primitives: GLTFPrimitive[];
  constructor(name: string, primitives: GLTFPrimitive[]) {
    this.name = name;
    this.primitives = primitives;
  }
}

const readNodeTransform = (node: IGLTFNode) => {
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

const makeGLTFSingleLevel = (nodes: IGLTFNode[]) => {
  let rootTfm = mat4.identity();
  for (let i = 0; i < nodes.length; ++i) {
    flattenGLTFChildren(nodes, nodes[i], rootTfm);
  }
  return nodes;
};

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
    swapChainFormat: GPUTextureFormat
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
        "depth24plus-stencil8"
      );
      renderBundles.push(bundle);
    }
    return renderBundles;
  }
}

export const uploadGLBModel = async (
  buffer: ArrayBuffer,
  device: GPUDevice
): Promise<GLBModel | undefined> => {
  // 读取头部信息
  const header = new Uint32Array(buffer, 0, 5);
  if (header[0] != 0x46546c67) {
    alert("这并不是一个有效的GLB文件");
    return;
  }
  // 解析json块
  const glbJsonData = JSON.parse(
    new TextDecoder("utf-8").decode(new Uint8Array(buffer, 20, header[3]))
  ) as IGLTFJsonData;
  // 解析二进制数据
  const binaryHeader = new Uint32Array(buffer, 20 + header[3], 2);
  const glbBuffer = new GLTFBuffer(buffer, binaryHeader[0], 28 + header[3]);

  // 创建BufferViews
  const bufferViews: GLTFBufferView[] = [];
  for (let i = 0; i < glbJsonData.bufferViews.length; ++i) {
    bufferViews.push(new GLTFBufferView(glbBuffer, glbJsonData.bufferViews[i]));
  }
  // 处理和创建纹理对象
  const images = [];
  if (glbJsonData.images !== undefined) {
    for (let i = 0; i < glbJsonData.images.length; ++i) {
      let imgJson = glbJsonData.images[i];
      let imgView = new GLTFBufferView(
        glbBuffer,
        glbJsonData.bufferViews[imgJson.bufferView!]
      );
      let imgBlob = new Blob([imgView.buffer], { type: imgJson.mimeType });
      let img = await createImageBitmap(imgBlob);

      let gpuImg = device.createTexture({
        size: [img.width, img.height, 1],
        format: "rgba8unorm-srgb",
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });

      let src = { source: img };
      let dst = { texture: gpuImg };
      device.queue.copyExternalImageToTexture(src, dst, [
        img.width,
        img.height,
        1,
      ]);
      images.push(gpuImg);
    }
  }
  // 创建采样器
  const defaultSampler = new GLTFSampler({}, device);
  const samplers: GLTFSampler[] = [];
  if (glbJsonData.samplers !== undefined) {
    for (let i = 0; i < glbJsonData.samplers.length; ++i) {
      samplers.push(new GLTFSampler(glbJsonData.samplers[i], device));
    }
  }
  // 创建纹理
  const textures: GLTFTexture[] = [];
  if (glbJsonData.textures !== undefined) {
    for (let i = 0; i < glbJsonData.textures.length; ++i) {
      let tex = glbJsonData.textures[i];
      let sampler =
        tex.sampler !== undefined ? samplers[tex.sampler] : defaultSampler;
      textures.push(new GLTFTexture(sampler, images[tex.source]));
    }
  }
  // 创建材质
  const defaultMaterial = new GLTFMaterial({}, textures);
  const materials: GLTFMaterial[] = [];
  for (let i = 0; i < glbJsonData.materials.length; ++i) {
    materials.push(new GLTFMaterial(glbJsonData.materials[i], textures));
  }
  // 创建网格和单元
  const meshes = [];
  for (let i = 0; i < glbJsonData.meshes.length; ++i) {
    let mesh = glbJsonData.meshes[i];
    let primitives: GLTFPrimitive[] = [];
    for (let j = 0; j < mesh.primitives.length; ++j) {
      let prim = mesh.primitives[j];
      let topology = prim.mode;
      if (topology == undefined) {
        topology = GLTFRenderMode.TRIANGLES;
      }
      if (
        topology != GLTFRenderMode.TRIANGLES &&
        topology != GLTFRenderMode.TRIANGLE_STRIP
      ) {
        alert("不支持的渲染模式：" + prim.mode);
        continue;
      }

      let indices: GLTFAccessor | null = null;
      if (glbJsonData.accessors[prim["indices"]] !== undefined) {
        let accessor = glbJsonData.accessors[prim["indices"]];
        let viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.INDEX);
        indices = new GLTFAccessor(bufferViews[viewID], accessor);
      }

      let positions: GLTFAccessor | null = null;
      let normals: GLTFAccessor | null = null;
      let texcoords: GLTFAccessor[] = [];
      for (let attr in prim.attributes) {
        let accessor = glbJsonData.accessors[prim.attributes[attr]];
        let viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.VERTEX);
        if (attr == "POSITION") {
          positions = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr == "NORMAL") {
          normals = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr.startsWith("TEXCOORD")) {
          texcoords.push(new GLTFAccessor(bufferViews[viewID], accessor));
        }
      }

      let material: GLTFMaterial | null = null;
      if (prim.material !== undefined) {
        material = materials[prim.material];
      } else {
        material = defaultMaterial;
      }
      let gltfPrim = new GLTFPrimitive(
        indices!,
        positions!,
        normals!,
        texcoords,
        material,
        topology
      );
      primitives.push(gltfPrim);
    }
    meshes.push(new GLTFMesh(mesh.name, primitives));
  }
  // 上传BufferView到GPU
  for (let i = 0; i < bufferViews.length; ++i) {
    if (bufferViews[i].needsUpload) {
      bufferViews[i].upload(device);
    }
  }
  // 上传材质到GPU
  defaultMaterial.upload(device);
  for (let i = 0; i < materials.length; ++i) {
    materials[i].upload(device);
  }
  // 创建和上传场景节点
  const nodes = [];
  const gltfNodes = makeGLTFSingleLevel(glbJsonData.nodes);
  for (let i = 0; i < gltfNodes.length; ++i) {
    let n = gltfNodes[i];
    if (n.mesh !== undefined) {
      let node = new GLTFNode(n.name!, meshes[n.mesh], readNodeTransform(n));
      node.upload(device);
      nodes.push(node);
    }
  }
  // 返回GLB模型
  return new GLBModel(nodes);
};
