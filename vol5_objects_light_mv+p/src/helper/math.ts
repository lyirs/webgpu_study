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

function getProjectionMatrix(
  aspect: number,
  fov: number = (60 / 180) * Math.PI,
  near: number = 0.1,
  far: number = 100.0,
  position = { x: 0, y: 0, z: 0 }
) {
  const cameraView = mat4.create();
  const eye = vec3.fromValues(position.x, position.y, position.z);
  mat4.translate(cameraView, cameraView, eye);
  mat4.lookAt(cameraView, eye, center, up);
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fov, aspect, near, far);
  mat4.multiply(projectionMatrix, projectionMatrix, cameraView);
  return projectionMatrix as Float32Array;
}

export { getMvpMatrix, getModelViewMatrix, getProjectionMatrix };
