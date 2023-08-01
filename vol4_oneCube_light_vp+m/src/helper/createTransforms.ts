import { mat4, vec3 } from "gl-matrix";

export const CreateTransforms = (
  modelMat: mat4,
  translation: vec3 = [0, 0, 0],
  rotation: vec3 = [0, 0, 0],
  scaling: vec3 = [1, 1, 1]
) => {
  const rotateXMat = mat4.create();
  const rotateYMat = mat4.create();
  const rotateZMat = mat4.create();
  const translateMat = mat4.create();
  const scaleMat = mat4.create();

  //perform indivisual transformations
  mat4.fromTranslation(translateMat, translation);
  mat4.fromXRotation(rotateXMat, rotation[0]);
  mat4.fromYRotation(rotateYMat, rotation[1]);
  mat4.fromZRotation(rotateZMat, rotation[2]);
  mat4.fromScaling(scaleMat, scaling);

  //combine all transformation matrices together to form a final transform matrix: modelMat
  mat4.multiply(modelMat, rotateXMat, scaleMat);
  mat4.multiply(modelMat, rotateYMat, modelMat);
  mat4.multiply(modelMat, rotateZMat, modelMat);
  mat4.multiply(modelMat, translateMat, modelMat);
};
