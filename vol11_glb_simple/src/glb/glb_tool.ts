export const GLTFRenderMode = {
  POINTS: 0,
  LINE: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6,
};

export const GLTFComponentType = {
  BYTE: 5120,
  UNSIGNED_BYTE: 5121,
  SHORT: 5122,
  UNSIGNED_SHORT: 5123,
  INT: 5124,
  UNSIGNED_INT: 5125,
  FLOAT: 5126,
  DOUBLE: 5130,
};

export const GLTFTextureFilter = {
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

// 确保了结果是align的倍数，并且是大于或等于原始val值的最小值（对齐缓冲区大小）
export const alignTo = (val: number, align: number) => {
  return Math.floor((val + align - 1) / align) * align;
};

export const gltfTypeNumComponents = (type: string): number => {
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
      return 0;
  }
};

export const gltfTypeSize = (componentType: number, type: string) => {
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
