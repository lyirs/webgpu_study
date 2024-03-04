import { mat4, Mat4, Vec3, vec3, Vec4 } from "wgpu-matrix";
import { GPUManager } from "./GPUManager";
import Input from "./Input";

interface CameraInterface {
  update(deltaTime: number, input: Input): Mat4;
  matrix: Mat4;
  right: Vec4;
  up: Vec4;
  back: Vec4;
  position: Vec4;
}

export class CameraBase {
  private _matrix = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ]);

  private readonly _view: Mat4 = mat4.create();
  private _right = new Float32Array(this._matrix.buffer, 4 * 0, 4);
  private _up = new Float32Array(this._matrix.buffer, 4 * 4, 4);
  private _back = new Float32Array(this._matrix.buffer, 4 * 8, 4);
  private _position = new Float32Array(this._matrix.buffer, 4 * 12, 4);
  public _aspect = 1;

  set aspect(aspect: number) {
    this._aspect = aspect;
  }

  get projectionMatrix(): Mat4 {
    return mat4.perspective((2 * Math.PI) / 5, this._aspect, 1, 100.0);
  }

  get matrix() {
    return this._matrix;
  }

  set matrix(mat: Mat4) {
    mat4.copy(mat, this._matrix);
  }

  get view() {
    return this._view;
  }

  set view(mat: Mat4) {
    mat4.copy(mat, this._view);
  }

  get right() {
    return this._right;
  }

  set right(vec: Vec3) {
    vec3.copy(vec, this._right);
  }

  get up() {
    return this._up;
  }

  set up(vec: Vec3) {
    vec3.copy(vec, this._up);
  }

  get back() {
    return this._back;
  }

  set back(vec: Vec3) {
    vec3.copy(vec, this._back);
  }

  get position() {
    return this._position;
  }

  set position(vec: Vec3) {
    vec3.copy(vec, this._position);
  }
}

export class Camera extends CameraBase implements CameraInterface {
  private distance = 0;
  private angularVelocity = 0;
  private _axis = vec3.create();
  public rotationSpeed = 1;
  public zoomSpeed = 0.1;
  public frictionCoefficient = 0.999;

  constructor(position?: Vec3) {
    super();
    if (position) {
      this.position = position;
      this.distance = vec3.len(this.position);
      this.back = vec3.normalize(this.position);
      this.recalcuateRight();
      this.recalcuateUp();
    }
  }

  get axis() {
    return this._axis;
  }

  set axis(vec: Vec3) {
    vec3.copy(vec, this._axis);
  }

  get matrix() {
    return super.matrix;
  }

  set matrix(mat: Mat4) {
    super.matrix = mat;
    this.distance = vec3.len(this.position);
  }

  update(deltaTime: number, input: Input): Mat4 {
    const epsilon = 0.00000001;

    if (input.analog.touching) {
      // Currently being dragged.
      this.angularVelocity = 0;
    } else {
      // Dampen any existing angular velocity
      this.angularVelocity *= Math.pow(1 - this.frictionCoefficient, deltaTime);
    }

    const movement = vec3.create();
    vec3.addScaled(movement, this.right, input.analog.x, movement);
    vec3.addScaled(movement, this.up, -input.analog.y, movement);

    const crossProduct = vec3.cross(movement, this.back);
    const magnitude = vec3.length(crossProduct);

    if (magnitude > epsilon) {
      this.axis = vec3.scale(crossProduct, 1 / magnitude);
      this.angularVelocity = magnitude * this.rotationSpeed;
    }

    const rotationAngle = this.angularVelocity * deltaTime;
    if (rotationAngle > epsilon) {
      this.back = vec3.normalize(rotate(this.back, this.axis, rotationAngle));
      this.recalcuateRight();
      this.recalcuateUp();
    }

    if (input.analog.zoom !== 0) {
      this.distance *= 1 + input.analog.zoom * this.zoomSpeed;
    }
    this.position = vec3.scale(this.back, this.distance);
    this.view = mat4.invert(this.matrix);
    return this.view;
  }

  recalcuateRight() {
    this.right = vec3.normalize(vec3.cross(this.up, this.back));
  }

  recalcuateUp() {
    this.up = vec3.normalize(vec3.cross(this.back, this.right));
  }
}

function rotate(vec: Vec3, axis: Vec3, angle: number): Vec3 {
  return vec3.transformMat4Upper3x3(vec, mat4.rotation(axis, angle));
}
