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

interface IMesh {
  name: string; // 网格的名称
  primitives: IPrimitive[]; // 网格的原始数据数组
}

enum GLTFRenderMode {
  POINTS = 0,
  LINE = 1,
  LINE_LOOP = 2,
  LINE_STRIP = 3,
  TRIANGLES = 4,
  TRIANGLE_STRIP = 5,
  TRIANGLE_FAN = 6, // WEBGPU不支持该类型
}

enum GLTFComponentType {
  BYTE = 5120,
  UNSIGNED_BYTE = 5121,
  SHORT = 5122,
  UNSIGNED_SHORT = 5123,
  INT = 5124,
  UNSIGNED_INT = 5125,
  FLOAT = 5126,
  DOUBLE = 5130,
}

enum GLTFTextureFilter {
  NEAREST = 9728,
  LINEAR = 9729,
  NEAREST_MIPMAP_NEAREST = 9984,
  LINEAR_MIPMAP_NEAREST = 9985,
  NEAREST_MIPMAP_LINEAR = 9986,
  LINEAR_MIPMAP_LINEAR = 9987,
  REPEAT = 10497,
  CLAMP_TO_EDGE = 33071,
  MIRRORED_REPEAT = 33648,
}

interface IPrimitive {
  mode?: GLTFRenderMode; // 渲染模式，例如三角形还是三角带
  indices: number; // 索引缓冲区的索引，指向存储顶点索引的访问器
  attributes: { [name: string]: number }; // 存储顶点属性的字典，键是属性名称，值是对应的存储顶点属性的访问器索引
  material?: number; // 材质索引，指向用于此原语的材质的索引
}

interface IAccessor {
  bufferView: number; // 指向存储访问器数据的缓冲区视图的索引
  count: number; // 访问器中的元素数量
  componentType: number; // 访问器中的组件类型
  type: string; // 访问器中的数据类型
  byteOffset?: number; // 访问器的字节偏移量，可选
  byteStride?: number;
}

interface IGLTFNode {
  name?: string; // Optional name of the node
  mesh?: number; // Index of the mesh in the GLTF meshes array
  camera?: number; // Index of the camera if the node is associated with a camera
  children?: number[]; // Indices of child nodes
  matrix?: Mat4; // Transform matrix (if provided instead of TRS components)
  rotation?: [number, number, number, number]; // Quaternion rotation
  scale?: [number, number, number]; // Scale vector
  translation?: [number, number, number]; // Translation vector
}

interface IGLTFJsonData {
  textures?: IGLTFTexture[];
  samplers: IGLTFSampler[];
  bufferViews: IGLTFBufferView[];
  images: IGLTFImage[];
  materials: IGLTFMaterial[];
  meshes: IMesh[];
  accessors: IAccessor[];
  nodes: IGLTFNode[];
}
