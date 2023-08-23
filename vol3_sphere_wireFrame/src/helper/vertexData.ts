import { vec3 } from "wgpu-matrix";

const SpherePosition = (
  radius: number,
  theta: number,
  phi: number,
  center = [0, 0, 0]
) => {
  const snt = Math.sin((theta * Math.PI) / 180);
  const cnt = Math.cos((theta * Math.PI) / 180);
  const snp = Math.sin((phi * Math.PI) / 180);
  const cnp = Math.cos((phi * Math.PI) / 180);
  return vec3.fromValues(
    radius * snt * cnp + center[0],
    radius * cnt + center[1],
    -radius * snt * snp + center[2]
  );
};

export const SphereWireframeData = (
  radius: number,
  u: number, // 经度分段数
  v: number, // 纬度分段数
  center: any = [0, 0, 0]
) => {
  if (u < 2 || v < 2) return;
  let pts = [];
  let pt;
  for (let i = 0; i < u; i++) {
    let pt1 = [];
    for (let j = 0; j < v; j++) {
      pt = SpherePosition(
        radius,
        (i * 180) / (u - 1),
        (j * 360) / (v - 1),
        center
      );
      pt1.push(pt);
    }
    pts.push(pt1);
  }

  let p = [] as any;
  let p0, p1, p2, p3;
  for (let i = 0; i < u - 1; i++) {
    for (let j = 0; j < v - 1; j++) {
      p0 = pts[i][j];
      p1 = pts[i + 1][j];
      //p2 = pts[i+1][j+1];
      p3 = pts[i][j + 1];
      p.push([
        p0[0],
        p0[1],
        p0[2],
        p1[0],
        p1[1],
        p1[2],
        p0[0],
        p0[1],
        p0[2],
        p3[0],
        p3[1],
        p3[2],
      ]);
    }
  }
  return new Float32Array(p.flat());
};
