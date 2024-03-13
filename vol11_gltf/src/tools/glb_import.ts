// 确保了结果是align的倍数，并且是大于或等于原始val值的最小值
const alignTo = (val: number, align: number) => {
  return Math.floor((val + align - 1) / align) * align;
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
  bindGroup: GPUBindGroupLayout | null;
  constructor(material: IMaterial, textures: GLTFTexture[]) {
    this.baseColorFactor = [1, 1, 1, 1];
    this.baseColorTexture = null;
    // padded to float4
    this.emissiveFactor = [0, 0, 0, 1];
    this.metallicFactor = 1.0;
    this.roughnessFactor = 1.0;

    if (material.pbrMetallicRoughness !== undefined) {
      var pbr = material.pbrMetallicRoughness;
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
}

export const uploadGLBModel = async (
  buffer: ArrayBuffer,
  device: GPUDevice
) => {
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
  const samplers = [];
  if (glbJsonData.samplers !== undefined) {
    for (let i = 0; i < glbJsonData.samplers.length; ++i) {
      samplers.push(new GLTFSampler(glbJsonData.samplers[i], device));
    }
  }
  // 创建纹理
  const textures = [];
  if (glbJsonData.textures !== undefined) {
    for (let i = 0; i < glbJsonData.textures.length; ++i) {
      var tex = glbJsonData.textures[i];
      var sampler =
        tex["sampler"] !== undefined
          ? samplers[tex["sampler"]]
          : defaultSampler;
      textures.push(new GLTFTexture(sampler, images[tex["source"]]));
    }
  }
  // 创建材质
  const defaultMaterial = new GLTFMaterial({}, textures);
  const materials = [];
  // 创建网格和单元
  // 上传BufferView到GPU
  // 上传材质到GPU
  // 创建和上传场景节点
  // 返回GLB模型
};
