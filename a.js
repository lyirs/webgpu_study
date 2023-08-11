import "../../../modulepreload-polyfill.b7f2da20.js";
let v = 0;
const m = new URLSearchParams(location.search);
function l(e, a) {
  return m.has(e) ? parseFloat(m.get(e)) : a;
}
const _ = l("balls", 100),
  s = _ * 6 * Float32Array.BYTES_PER_ELEMENT,
  M = l("min_radius", 2),
  G = l("max_radius", 10),
  x = l("render", 1),
  t = document.querySelector("canvas").getContext("2d");
t.canvas.width = l("width", 500);
t.canvas.height = l("height", 500);
function h(e) {
  throw ((document.body.innerHTML = `<pre>${e}</pre>`), Error(e));
}
"gpu" in navigator ||
  h(
    "WebGPU not supported. Please enable it in about:flags in Chrome or in about:config in Firefox."
  );
const P = await navigator.gpu.requestAdapter();
P || h("Couldn\u2019t request WebGPU adapter.");
const i = await P.requestDevice();
i || h("Couldn\u2019t request WebGPU device.");
const T = i.createShaderModule({
    code: `
    struct Ball {
      radius: f32,
      position: vec2<f32>,
      velocity: vec2<f32>,
    }

    @group(0) @binding(0)
    var<storage, read> input: array<Ball>;

    @group(0) @binding(1)
    var<storage, read_write> output: array<Ball>;

    struct Scene {
      width: f32,
      height: f32,
    }

    @group(0) @binding(2)
    var<storage, read> scene: Scene;

    const PI: f32 = 3.14159;
    const TIME_STEP: f32 = 0.016;

    @compute @workgroup_size(64)
    fn main(
      @builtin(global_invocation_id)
      global_id : vec3<u32>,
    ) {
      let num_balls = arrayLength(&output);
      if(global_id.x >= num_balls) {
        return;
      }
      var src_ball = input[global_id.x];
      let dst_ball = &output[global_id.x];

      (*dst_ball) = src_ball;

      // Ball/Ball collision
      for(var i = 0u; i < num_balls; i = i + 1u) {
        if(i == global_id.x) {
          continue;
        }
        var other_ball = input[i];
        let n = src_ball.position - other_ball.position;
        let distance = length(n);
        if(distance >= src_ball.radius + other_ball.radius) {
          continue;
        }
        let overlap = src_ball.radius + other_ball.radius - distance;
        (*dst_ball).position = src_ball.position + normalize(n) * overlap/2.;

        // Details on the physics here:
        // https://physics.stackexchange.com/questions/599278/how-can-i-calculate-the-final-velocities-of-two-spheres-after-an-elastic-collisi
        let src_mass = pow(src_ball.radius, 2.0) * PI;
        let other_mass = pow(other_ball.radius, 2.0) * PI;
        let c = 2.*dot(n, (other_ball.velocity - src_ball.velocity)) / (dot(n, n) * (1./src_mass + 1./other_mass));
        (*dst_ball).velocity = src_ball.velocity + c/src_mass * n;
      }

      // Apply velocity
      (*dst_ball).position = (*dst_ball).position + (*dst_ball).velocity * TIME_STEP;

      // Ball/Wall collision
      if((*dst_ball).position.x - (*dst_ball).radius < 0.) {
        (*dst_ball).position.x = (*dst_ball).radius;
        (*dst_ball).velocity.x = -(*dst_ball).velocity.x;
      }
      if((*dst_ball).position.y - (*dst_ball).radius < 0.) {
        (*dst_ball).position.y = (*dst_ball).radius;
        (*dst_ball).velocity.y = -(*dst_ball).velocity.y;
      }
      if((*dst_ball).position.x + (*dst_ball).radius >= scene.width) {
        (*dst_ball).position.x = scene.width - (*dst_ball).radius;
        (*dst_ball).velocity.x = -(*dst_ball).velocity.x;
      }
      if((*dst_ball).position.y + (*dst_ball).radius >= scene.height) {
        (*dst_ball).position.y = scene.height - (*dst_ball).radius;
        (*dst_ball).velocity.y = -(*dst_ball).velocity.y;
      }
    }
  `,
  }),
  w = i.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" },
      },
    ],
  }),
  A = i.createComputePipeline({
    layout: i.createPipelineLayout({ bindGroupLayouts: [w] }),
    compute: { module: T, entryPoint: "main" },
  }),
  B = i.createBuffer({
    size: 2 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  E = i.createBuffer({
    size: s,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  S = i.createBuffer({
    size: s,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  }),
  p = i.createBuffer({
    size: s,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  }),
  C = i.createBindGroup({
    layout: w,
    entries: [
      { binding: 0, resource: { buffer: E } },
      { binding: 1, resource: { buffer: S } },
      { binding: 2, resource: { buffer: B } },
    ],
  });
function R() {
  return new Promise((e) => requestAnimationFrame(e));
}
let r = new Float32Array(new ArrayBuffer(s));
for (let e = 0; e < _; e++)
  (r[e * 6 + 0] = d(M, G)),
    (r[e * 6 + 2] = d(0, t.canvas.width)),
    (r[e * 6 + 3] = d(0, t.canvas.height)),
    (r[e * 6 + 4] = d(-100, 100)),
    (r[e * 6 + 5] = d(-100, 100));
let b;
i.queue.writeBuffer(B, 0, new Float32Array([t.canvas.width, t.canvas.height]));
for (;;) {
  performance.mark("webgpu start"), i.queue.writeBuffer(E, 0, r);
  const e = i.createCommandEncoder(),
    a = e.beginComputePass();
  a.setPipeline(A), a.setBindGroup(0, C);
  const o = Math.ceil(_ / 64);
  a.dispatchWorkgroups(o), a.end(), e.copyBufferToBuffer(S, 0, p, 0, s);
  const n = e.finish();
  i.queue.submit([n]), await p.mapAsync(GPUMapMode.READ, 0, s);
  const c = p.getMappedRange(0, s).slice();
  (b = new Float32Array(c)),
    p.unmap(),
    performance.mark("webgpu end"),
    performance.measure("webgpu", "webgpu start", "webgpu end"),
    x !== 0
      ? q(b)
      : (v++,
        (t.fillStyle = v % 2 == 0 ? "red" : "blue"),
        t.fillRect(0, 0, t.canvas.width, t.canvas.height)),
    (r = b),
    await R();
}
function q(e) {
  t.save(),
    t.scale(1, -1),
    t.translate(0, -t.canvas.height),
    t.clearRect(0, 0, t.canvas.width, t.canvas.height),
    (t.fillStyle = "red");
  for (let a = 0; a < e.length; a += 6) {
    const o = e[a + 0],
      n = e[a + 2],
      f = e[a + 3],
      c = e[a + 4],
      U = e[a + 5];
    let u = Math.atan(U / (c === 0 ? Number.EPSILON : c));
    c < 0 && (u += Math.PI);
    const g = n + Math.cos(u) * Math.sqrt(2) * o,
      y = f + Math.sin(u) * Math.sqrt(2) * o;
    t.beginPath(),
      t.arc(n, f, o, 0, 2 * Math.PI, !0),
      t.moveTo(g, y),
      t.arc(n, f, o, u - Math.PI / 4, u + Math.PI / 4, !0),
      t.lineTo(g, y),
      t.closePath(),
      t.fill();
  }
  t.restore();
}
function d(e, a) {
  return Math.random() * (a - e) + e;
}
