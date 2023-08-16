import "./style.css";

// 创建一个 Worker，并通过配置项 { type: "module" } 来设置其类型为模块。
const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

// 添加一个消息监听器，处理从 Worker 接收的消息。
worker.addEventListener("message", (ev) => {
  // 消息的格式可以是任意的，但是约定一致的消息类型可以在应用程序变得更加复杂时更容易区分消息内容。
  // 在这里，我们设定一种约定，即所有与 Worker 之间的消息都会包含一个 `type` 字段，我们可以使用它来确定消息的内容。
  switch (ev.data.type) {
    case "log": {
      // Worker 没有内置的机制来将日志输出到控制台，因此可以创建一个方法来输出控制台消息。
      console.log(ev.data.message);
      break;
    }
    default: {
      console.error(`Unknown Message Type: ${ev.data.type}`);
    }
  }
});

// 为了使 Worker 在页面上显示内容，必须使用 OffscreenCanvas。
// OffscreenCanvas 是在 Web Workers 中使用的一种特殊类型的画布，它可以在后台线程中进行渲染，而不会阻塞主线程。
// 在这里，我们可以通过调用 transferControlToOffscreen() 来从普通的 canvas 创建一个 OffscreenCanvas。
// 任何绘制在此 OffscreenCanvas 上的内容都会自动显示在页面上的源 canvas 上。
const canvas = document.querySelector("canvas") as HTMLCanvasElement;
// @ts-ignore
const offscreenCanvas = canvas.transferControlToOffscreen();
const devicePixelRatio = window.devicePixelRatio || 1;
offscreenCanvas.width = canvas.clientWidth * devicePixelRatio;
offscreenCanvas.height = canvas.clientHeight * devicePixelRatio;

// 向 Worker 发送一条消息，告知它使用 OffscreenCanvas 初始化 WebGPU。
// 第二个参数中的数组表示 OffscreenCanvas 将被传输给 Worker，这意味着主线程将失去对它的访问权限，它将完全归 Worker 所有。
worker.postMessage({ type: "init", offscreenCanvas }, [offscreenCanvas]);
