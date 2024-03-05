export default class InputManager {
  private static _instance: InputManager;
  private digital: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  };
  private analog: {
    x: number;
    y: number;
    zoom: number;
  };
  private mouseDown: boolean;

  private constructor(window: Window, canvas: HTMLCanvasElement) {
    this.digital = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
    };
    this.analog = {
      x: 0,
      y: 0,
      zoom: 0,
    };
    this.mouseDown = false;
    this.initializeListeners(window, canvas);
  }

  private initializeListeners(window: Window, canvas: HTMLCanvasElement) {
    const setDigital = (e: KeyboardEvent, value: boolean) => {
      switch (e.code) {
        case "KeyW":
          this.digital.forward = value;
          break;
        case "KeyS":
          this.digital.backward = value;
          break;
        case "KeyA":
          this.digital.left = value;
          break;
        case "KeyD":
          this.digital.right = value;
          break;
        case "Space":
          this.digital.up = value;
          break;
        case "ShiftLeft":
        case "ControlLeft":
        case "KeyC":
          this.digital.down = value;
          break;
      }
      if (value) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", (e) => setDigital(e, true));
    window.addEventListener("keyup", (e) => setDigital(e, false));

    canvas.style.touchAction = "pinch-zoom";
    canvas.addEventListener("pointerdown", () => {
      this.mouseDown = true;
    });
    canvas.addEventListener("pointerup", () => {
      this.mouseDown = false;
    });
    canvas.addEventListener("pointermove", (e) => {
      this.mouseDown = e.pointerType === "mouse" ? (e.buttons & 1) !== 0 : true;
      if (this.mouseDown) {
        this.analog.x += e.movementX;
        this.analog.y += e.movementY;
      }
    });
    canvas.addEventListener(
      "wheel",
      (e) => {
        this.mouseDown = (e.buttons & 1) !== 0;
        if (this.mouseDown) {
          this.analog.zoom += Math.sign(e.deltaY);
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { passive: false }
    );
  }

  public static getInstance(canvas: HTMLCanvasElement): InputManager {
    if (!this._instance) {
      this._instance = new InputManager(window, canvas);
    }
    return this._instance;
  }

  public getInput(): Input {
    const out: Input = {
      digital: { ...this.digital },
      analog: {
        x: this.analog.x,
        y: this.analog.y,
        zoom: this.analog.zoom,
        touching: this.mouseDown,
      },
    };
    // Reset analog values after reading
    this.analog.x = 0;
    this.analog.y = 0;
    this.analog.zoom = 0;
    return out;
  }
}

export interface Input {
  readonly digital: {
    readonly forward: boolean;
    readonly backward: boolean;
    readonly left: boolean;
    readonly right: boolean;
    readonly up: boolean;
    readonly down: boolean;
  };
  readonly analog: {
    readonly x: number;
    readonly y: number;
    readonly zoom: number;
    readonly touching: boolean;
  };
}
