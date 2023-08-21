import { mat4, Mat4, vec3 } from "wgpu-matrix";

export class Camera {
  public _eyePosition = { x: 0, y: 0, z: 0 };
  private _center = { x: 0, y: 0, z: 0 };
  private _up = { x: 0, y: 1, z: 0 };
  private _projectionMatrix: Mat4 = mat4.identity();
  private _viewMatrix: Mat4 = mat4.identity();
  private _viewProjectionMatrix: Mat4 = mat4.identity();
  private _angularSpeed: number = 0.01;
  private _phi: number = Math.PI / 2;
  private _theta: number = Math.PI / 2;

  private static ZOOM_IN_FACTOR = 1.05;
  private static ZOOM_OUT_FACTOR = 0.95;

  constructor() {}

  public get projectionMatrix(): Mat4 {
    return this._projectionMatrix;
  }

  public set projectionMatrix(matrix: Mat4) {
    this._projectionMatrix = matrix;
  }

  public perspective(
    aspect: number = 1,
    fov: number = (60 / 180) * Math.PI,
    near: number = 0.1,
    far: number = 100.0
  ) {
    const projectionMatrix = mat4.perspective(fov, aspect, near, far); // 创建一个透视投影矩阵
    this._projectionMatrix = projectionMatrix;
  }

  public ortho(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number = 1,
    far: number = 1000
  ) {
    const projectionMatrix = mat4.ortho(left, right, bottom, top, near, far); // 创建一个正交投影矩阵
    this._projectionMatrix = projectionMatrix;
  }

  public get viewMatrix(): Mat4 {
    return this._viewMatrix;
  }

  public set viewMatrix(matrix: Mat4) {
    this._viewMatrix = matrix;
  }

  public lookAt(
    eyePosition = { x: 0, y: 0, z: -10 },
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

  public rotateAroundCenter(deltaX: number, deltaY: number) {
    const horizontalAngle = deltaX * this._angularSpeed;
    const verticalAngle = deltaY * this._angularSpeed;

    this._theta += horizontalAngle;
    this._phi -= verticalAngle;

    this._phi = Math.max(0.01, Math.min(Math.PI - 0.01, this._phi));

    const radius = vec3.distance(
      vec3.fromValues(
        this._eyePosition.x,
        this._eyePosition.y,
        this._eyePosition.z
      ),
      vec3.fromValues(0, 0, 0)
    );

    const x = radius * Math.sin(this._phi) * Math.cos(this._theta);
    const y = radius * Math.cos(this._phi);
    const z = radius * Math.sin(this._phi) * Math.sin(this._theta);

    this.lookAt({ x: x, y: y, z: z }, this._center, { x: 0, y: 1, z: 0 });
  }

  public mouseZoom(delta: number) {
    let speed = delta > 0 ? Camera.ZOOM_IN_FACTOR : Camera.ZOOM_OUT_FACTOR;
    this._eyePosition.x = this._eyePosition.x * speed;
    this._eyePosition.y = this._eyePosition.y * speed;
    this._eyePosition.z = this._eyePosition.z * speed;
    this.lookAt(this._eyePosition, this._center, this._up);
  }

  public getEyePositionFromViewMatrix() {
    const invView = mat4.invert(this._viewMatrix);
    if (!invView) {
      throw new Error("Failed to invert the view matrix");
    }
    const eyePosition = {
      x: invView[12],
      y: invView[13],
      z: invView[14],
    };
    return eyePosition;
  }
}
