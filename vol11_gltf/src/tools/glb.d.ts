interface IGLTFBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target?: number;
}

interface IGLTFImage {
  uri?: string; // 图像资源的外部URI（如果图像来自外部文件）
  bufferView?: number; // 指向bufferViews数组中某个元素的索引（如果图像嵌入在GLTF文件内）
  mimeType?: string; // 图像的MIME类型，例如"image/png"或"image/jpeg"
}

enum EGLTFTextureFilter {
  LINEAR,
  NEAREST,
  REPEAT,
  CLAMP_TO_EDGE,
  MIRRORED_REPEAT,
}

interface IGLTFSampler {
  magFilter?: EGLTFTextureFilter;
  minFilter?: EGLTFTextureFilter;
  wrapS?: EGLTFTextureFilter;
  wrapT?: EGLTFTextureFilter;
}

interface IGLTFTexture {
  sampler?: number; // 纹理采样器的索引
  source: number; // 图像的索引
}

interface IPBRMetallicRoughness {
  baseColorFactor?: [number, number, number, number]; // RGBA颜色
  baseColorTexture?: {
    index: number; // 指向textures数组的索引
    // 可能还包含其他属性，如texCoord等
  };
  metallicFactor?: number; // 金属度因子
  roughnessFactor?: number; // 粗糙度因子
}

interface IMaterial {
  pbrMetallicRoughness?: IPBRMetallicRoughness;
  emissiveFactor?: [number, number, number]; // RGB颜色，这里没有包含alpha，因为emissive通常不需要透明度
  // 材质可能包含更多属性，如alphaMode、doubleSided等，根据需要添加
}

interface IGLTFJsonData {
  textures?: IGLTFTexture[];
  samplers: IGLTFSampler[];
  bufferViews: IGLTFBufferView[];
  images: IGLTFImage[];
  materials: IGLTFMaterial[];
}
