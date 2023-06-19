<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer.js";
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";

if (WebGPU.isAvailable() === false) {
  alert("WebGpu is not available");
  throw new Error("WebGpu is not available");
}

// 创建场景
const scene = new THREE.Scene();
// 创建相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// 设置相机位置
camera.position.set(0, 2, 6);
// 创建渲染器
const renderer = new WebGPURenderer({
  // 抗锯齿
  antialias: true,
});
// 设置渲染器大小
renderer.setSize(window.innerWidth, window.innerHeight);
// 添加渲染器到DOM
document.body.appendChild(renderer.domElement);
// 创建相机控制器
const controls = new OrbitControls(camera, renderer.domElement);

// 创建立方体
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 渲染场景
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
</script>

<template>
  <div></div>
</template>

<style scoped></style>
