import { Camera } from "./Camera"; // 假设你的相机类在这个路径下

export class CameraController {
  private camera: Camera;
  private dragging: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(camera: Camera, canvas: HTMLCanvasElement) {
    this.camera = camera;

    canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    canvas.addEventListener("wheel", this.handleMouseWheel.bind(this));
  }

  private handleMouseDown(e: MouseEvent) {
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.dragging) return;

    const deltaX = e.clientX - this.lastX;
    const deltaY = e.clientY - this.lastY;

    this.lastX = e.clientX;
    this.lastY = e.clientY;

    this.camera.rotateAroundCenter(deltaX, deltaY);
  }

  private handleMouseUp() {
    this.dragging = false;
  }

  private handleMouseWheel(e: WheelEvent) {
    this.camera.zoom(e.deltaY);
  }
}
