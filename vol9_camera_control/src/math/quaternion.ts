export class Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  static fromAxisAngle(
    axis: { x: number; y: number; z: number },
    angle: number
  ): Quaternion {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    return new Quaternion(
      axis.x * s,
      axis.y * s,
      axis.z * s,
      Math.cos(halfAngle)
    );
  }

  static fromEuler(pitch: number, yaw: number, roll: number): Quaternion {
    const pitchRad = (pitch / 2) * (Math.PI / 180);
    const yawRad = (yaw / 2) * (Math.PI / 180);
    const rollRad = (roll / 2) * (Math.PI / 180);

    // 为每个轴上的旋转计算四元数
    const cp = Math.cos(pitchRad);
    const sp = Math.sin(pitchRad);
    const cy = Math.cos(yawRad);
    const sy = Math.sin(yawRad);
    const cr = Math.cos(rollRad);
    const sr = Math.sin(rollRad);

    const w = cp * cy * cr + sp * sy * sr;
    const x = sp * cy * cr - cp * sy * sr;
    const yVal = cp * sy * cr + sp * cy * sr;
    const z = cp * cy * sr - sp * sy * cr;

    return new Quaternion(x, yVal, z, w);
  }

  multiply(q: Quaternion): Quaternion {
    return new Quaternion(
      this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
      this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
      this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w,
      this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
    );
  }

  normalize(): Quaternion {
    const len = Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
    if (len === 0) return this;
    return new Quaternion(
      this.x / len,
      this.y / len,
      this.z / len,
      this.w / len
    );
  }

  conjugate(): Quaternion {
    return new Quaternion(-this.x, -this.y, -this.z, this.w);
  }

  rotateVector(v: { x: number; y: number; z: number }): {
    x: number;
    y: number;
    z: number;
  } {
    const qVector = new Quaternion(v.x, v.y, v.z, 0);
    const qResult = this.multiply(qVector).multiply(this.conjugate());
    return {
      x: qResult.x,
      y: qResult.y,
      z: qResult.z,
    };
  }
}
