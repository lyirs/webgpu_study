import { gltfTypeNumComponents, gltfTypeSize } from "./glb_tool";
import { GLTFBufferView } from "./glb_viewbuffer";

// 访问GLB文件中的顶点、索引等数据。
export class GLTFAccessor {
  count: number;
  componentType: GLTFComponentType;
  gltfType: string;
  numComponents: number;
  numScalars: number;
  view: GLTFBufferView;
  byteOffset: number;
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

  get byteLength() {
    return this.count * this.byteStride;
  }
}
