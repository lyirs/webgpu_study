import { GLTFPrimitive } from "./glb_primitive";

export class GLTFMesh {
  name: string;
  primitives: GLTFPrimitive[];
  constructor(name: string, primitives: GLTFPrimitive[]) {
    this.name = name;
    this.primitives = primitives;
  }

  render(renderPassEncoder: GPURenderPassEncoder) {
    for (let prim of this.primitives) {
      prim.render(renderPassEncoder);
    }
  }
}
