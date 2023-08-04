import { mat4, vec3 } from "wgpu-matrix";

function getMvpMatrix(
  aspect: number,
  position: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number },
  scale: { x: number; y: number; z: number }
) {
  const modelMatrix = getModelMatrix(position, rotation, scale);
  const viewProjectionMatrix = getViewProjectionMatrix(aspect);
  const mvpMatrix = mat4.identity();
  mat4.multiply(viewProjectionMatrix, modelMatrix, mvpMatrix);

  return mvpMatrix as Float32Array;
}

function getModelMatrix(
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
  scale = { x: 1, y: 1, z: 1 }
) {
  const modelMatrix = mat4.identity();
  mat4.translate(
    modelMatrix,
    vec3.fromValues(position.x, position.y, position.z),
    modelMatrix
  );
  mat4.rotateX(modelMatrix, rotation.x, modelMatrix);
  mat4.rotateY(modelMatrix, rotation.y, modelMatrix);
  mat4.rotateZ(modelMatrix, rotation.z, modelMatrix);
  mat4.scale(
    modelMatrix,
    vec3.fromValues(scale.x, scale.y, scale.z),
    modelMatrix
  );

  return modelMatrix as Float32Array;
}

const center = vec3.fromValues(0, 0, 0);
const up = vec3.fromValues(0, 1, 0);

// aspect：摄像机的视口宽度和高度之比
// fov：摄像机的视场角，单位为弧度。默认值是 60 度
// near 和 far：这是摄像机视锥体的近裁剪面和远裁剪面。所有距摄像机更近或更远的对象都不会被渲染。默认值分别为 0.1 和 100.0。
// position：这是摄像机在世界空间中的位置
function getViewProjectionMatrix(
  aspect: number,
  fov: number = (60 / 180) * Math.PI,
  near: number = 0.1,
  far: number = 100.0,
  position = { x: 0, y: 0, z: 0 }
) {
  const eye = vec3.fromValues(position.x, position.y, position.z); // 将摄像机的位置从 {x, y, z} 对象转换为一个 3 组件向量。
  const projectionMatrix = mat4.perspective(fov, aspect, near, far); // 创建一个透视投影矩阵
  const viewMatrix = mat4.lookAt(eye, center, up);
  const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix); //将投影矩阵和视图矩阵相乘，得到一个可以同时应用摄像机位置和投影的矩阵。
  return viewProjectionMatrix as Float32Array;
}

function getProjectionMatrix(
  aspect: number,
  fov: number = (60 / 180) * Math.PI,
  near: number = 0.1,
  far: number = 100.0
) {
  const projectionMatrix = mat4.perspective(fov, aspect, near, far); // 创建一个透视投影矩阵
  return projectionMatrix as Float32Array;
}

function getViewMatrix(position = { x: 0, y: 0, z: 0 }) {
  const eye = vec3.fromValues(position.x, position.y, position.z); // 将摄像机的位置从 {x, y, z} 对象转换为一个 3 组件向量。
  const viewMatrix = mat4.lookAt(eye, center, up);
  return viewMatrix as Float32Array;
}

export {
  getMvpMatrix,
  getModelMatrix,
  getViewProjectionMatrix,
  getProjectionMatrix,
  getViewMatrix,
};
