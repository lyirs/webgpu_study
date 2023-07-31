import { vec3 } from "gl-matrix";

export const CreateAnimation = (
  render: any,
  rotation: vec3 = vec3.fromValues(0, 0, 0),
  isAnimation = true
) => {
  function step() {
    if (isAnimation) {
      rotation[0] += 0.01;
      rotation[1] += 0.01;
      rotation[2] += 0.01;
    } else {
      rotation = [0, 0, 0];
    }
    render();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
};
