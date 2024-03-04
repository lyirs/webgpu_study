import { mat4, Mat4, vec3 } from "wgpu-matrix";

export class RenderableObject {
  public uniformBuffer: any;
  public uniformBindGroup: any;
  public position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  public scale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 };
  public rotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  protected _modelMatrix: Mat4 = mat4.identity();

  constructor() {}

  public set(
    position: { x: number; y: number; z: number },
    scale: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number }
  ) {
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
    this._modelMatrix = mat4.translate(
      this._modelMatrix,
      vec3.fromValues(position.x, position.y, position.z)
    );
    this._modelMatrix = mat4.rotateX(this._modelMatrix, rotation.x);
    this._modelMatrix = mat4.rotateY(this._modelMatrix, rotation.y);
    this._modelMatrix = mat4.rotateZ(this._modelMatrix, rotation.z);
    this._modelMatrix = mat4.scale(
      this._modelMatrix,
      vec3.fromValues(scale.x, scale.y, scale.z)
    );
  }

  public setPosition(position: { x: number; y: number; z: number }) {
    this.position = position;
    this._modelMatrix = mat4.translate(
      this._modelMatrix,
      vec3.fromValues(position.x, position.y, position.z)
    );
  }

  public setScale(scale: { x: number; y: number; z: number }) {
    this.scale = scale;
    this._modelMatrix = mat4.scale(
      this._modelMatrix,
      vec3.fromValues(scale.x, scale.y, scale.z)
    );
  }

  public setRotation(rotation: { x: number; y: number; z: number }) {
    this.rotation = rotation;
    this._modelMatrix = mat4.rotateX(this._modelMatrix, rotation.x);
    this._modelMatrix = mat4.rotateY(this._modelMatrix, rotation.y);
    this._modelMatrix = mat4.rotateZ(this._modelMatrix, rotation.z);
  }

  public get modelMatrix(): Mat4 {
    return this._modelMatrix;
  }
}
