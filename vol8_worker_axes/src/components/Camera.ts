import { mat4, Mat4, vec3 } from "wgpu-matrix";

export class Camera {
  public fov: number = (60 / 180) * Math.PI;
  public near: number = 0.1;
  public far: number = 100.0;
  public _eyePosition = { x: 0, y: 0, z: 0 };
  private _center = { x: 0, y: 0, z: 0 };
  private _up = { x: 0, y: 0, z: 0 };
  private _aspect;
  private _projectionMatrix: Mat4 = mat4.identity();
  private _viewMatrix: Mat4 = mat4.identity();
  private _viewProjectionMatrix: Mat4 = mat4.identity();
  private _angularSpeed: number = 0.01;
  constructor(aspect: number = 1) {
    this._aspect = aspect;
  }

  public set aspect(aspect: number) {
    this._aspect = aspect;
  }

  public get projectionMatrix(): Mat4 {
    return this._projectionMatrix;
  }

  public set projectionMatrix(matrix: Mat4) {
    this._projectionMatrix = matrix;
  }

  public perspective() {
    const projectionMatrix = mat4.perspective(
      this.fov,
      this._aspect,
      this.near,
      this.far
    ); // 创建一个透视投影矩阵
    this._projectionMatrix = projectionMatrix;
  }

  public get viewMatrix(): Mat4 {
    return this._viewMatrix;
  }

  public set viewMatrix(matrix: Mat4) {
    this._viewMatrix = matrix;
  }

  public lookAt(
    eyePosition = { x: 0, y: 0, z: 0 },
    center = { x: 0, y: 0, z: 0 },
    up = { x: 0, y: 1, z: 0 }
  ) {
    const viewMatrix = mat4.lookAt(
      vec3.fromValues(eyePosition.x, eyePosition.y, eyePosition.z),
      vec3.fromValues(center.x, center.y, center.z),
      vec3.fromValues(up.x, up.y, up.z)
    );
    this._eyePosition = eyePosition;
    this._center = center;
    this._up = up;
    this._viewMatrix = viewMatrix;
  }

  public get viewProjectionMatrix(): Mat4 {
    const viewMatrix = this._viewMatrix;
    const projectionMatrix = this._projectionMatrix;
    this._viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);
    return this._viewProjectionMatrix;
  }

  public set eye(eye: { x: 0; y: 0; z: 0 }) {
    this._eyePosition = eye;
  }

  public get option() {
    return {
      eye: this._eyePosition,
      center: this._center,
      zoomMax: 500,
    };
  }

  public rotateAroundObject_xz(
    objectPosition: { x: number; y: number; z: number },
    radius: number,
    deltaTime: number
  ) {
    const angularSpeed = 0.5;
    const angle = angularSpeed * deltaTime;
    const newX = objectPosition.x + radius * Math.cos(angle);
    const newZ = objectPosition.z + radius * Math.sin(angle);

    this.lookAt({ x: newX, y: this._eyePosition.y, z: newZ }, objectPosition);
  }
}
