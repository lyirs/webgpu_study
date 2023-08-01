import { mat4, vec3 } from "gl-matrix";

export const CreateViewProjection = (
  respectRatio = 1.0,
  cameraPosition: vec3 = [2, 2, 4],
  lookDirection: vec3 = [0, 0, 0],
  upDirection: vec3 = [0, 1, 0]
) => {
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();
  const viewProjectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (2 * Math.PI) / 5,
    respectRatio,
    0.1,
    100.0
  );

  mat4.lookAt(viewMatrix, cameraPosition, lookDirection, upDirection);
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

  const cameraOption = {
    eye: cameraPosition,
    center: lookDirection,
    zoomMax: 100,
    zoomSpeed: 2,
  };

  return {
    viewMatrix,
    projectionMatrix,
    viewProjectionMatrix,
    cameraOption,
  };
};
