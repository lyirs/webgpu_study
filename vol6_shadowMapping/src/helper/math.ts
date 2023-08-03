import { mat4, vec3 } from "gl-matrix";

function getMvpMatrix(
  aspect: number,
  position: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number },
  scale: { x: number; y: number; z: number }
) {
  const modelViewMatrix = getModelViewMatrix(position, rotation, scale);
  const projectionMatrix = getProjectionMatrix(aspect);
  const mvpMatrix = mat4.create();
  mat4.multiply(mvpMatrix, projectionMatrix, modelViewMatrix);

  return mvpMatrix as Float32Array;
}

function getModelViewMatrix(
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
  scale = { x: 1, y: 1, z: 1 }
) {
  const modelViewMatrix = mat4.create();
  mat4.translate(
    modelViewMatrix,
    modelViewMatrix,
    vec3.fromValues(position.x, position.y, position.z)
  );
  mat4.rotateX(modelViewMatrix, modelViewMatrix, rotation.x);
  mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation.y);
  mat4.rotateZ(modelViewMatrix, modelViewMatrix, rotation.z);
  mat4.scale(
    modelViewMatrix,
    modelViewMatrix,
    vec3.fromValues(scale.x, scale.y, scale.z)
  );

  return modelViewMatrix as Float32Array;
}

const center = vec3.fromValues(0, 0, 0);
const up = vec3.fromValues(0, 1, 0);

// aspect：摄像机的视口宽度和高度之比
// fov：摄像机的视场角，单位为弧度。默认值是 60 度
// near 和 far：这是摄像机视锥体的近裁剪面和远裁剪面。所有距摄像机更近或更远的对象都不会被渲染。默认值分别为 0.1 和 100.0。
// position：这是摄像机在世界空间中的位置
function getProjectionMatrix(
  aspect: number,
  fov: number = (60 / 180) * Math.PI,
  near: number = 0.1,
  far: number = 100.0,
  position = { x: 0, y: 0, z: 0 }
) {
  const cameraView = mat4.create();
  const eye = vec3.fromValues(position.x, position.y, position.z); // 将摄像机的位置从 {x, y, z} 对象转换为一个 3 组件向量。
  mat4.translate(cameraView, cameraView, eye); // 将摄像机视图矩阵平移到摄像机的位置。
  mat4.lookAt(cameraView, eye, center, up); // 计算从摄像机位置看向场景中心的矩阵。表示了从摄像机的位置看向目标位置的视角
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fov, aspect, near, far); // 创建一个透视投影矩阵
  mat4.multiply(projectionMatrix, projectionMatrix, cameraView); //将投影矩阵和视图矩阵相乘，得到一个可以同时应用摄像机位置和投影的矩阵。
  return projectionMatrix as Float32Array;
}

export { getMvpMatrix, getModelViewMatrix, getProjectionMatrix };
