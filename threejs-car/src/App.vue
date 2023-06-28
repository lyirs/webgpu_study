<script setup lang="ts">
import { ref } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// @ts-ignore
import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer.js";
// @ts-ignore
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
import * as Nodes from "three/examples/jsm/nodes/Nodes.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// @ts-ignore
import { color } from "three/nodes";
import gsap from "gsap";

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
controls.target.set(0.4, 1.2, 0);
controls.enableDamping = true;
// 渲染场景
function animate() {
  controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// 全景环境贴图
const textureLoader = new THREE.TextureLoader();
const envMap = textureLoader.load("texture/scene.jpg");
envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.flipY = false;
scene.background = envMap;
scene.environment = envMap;

// 天空球
const sphere = new THREE.SphereGeometry(50, 64, 64);
sphere.scale(1, 1, -1);
envMap.flipY = true;
const skyboxMaterial = new THREE.MeshBasicMaterial({
  map: envMap,
});
const skybox = new THREE.Mesh(sphere, skyboxMaterial);
skybox.position.set(0, 10, 0);
scene.add(skybox);

// 地面材质纹理
// @ts-ignore
const uvNode = Nodes.uv().mul(5);
const fabricTexture = textureLoader.load(
  "texture/fabric/FabricPlainWhiteBlackout009_COL_2K.jpg"
);
fabricTexture.wrapS = fabricTexture.wrapT = THREE.RepeatWrapping;
// 地面法向贴图
const fabricNormalMap = textureLoader.load(
  "texture/fabric/FabricPlainWhiteBlackout009_NRM_2K.png"
);
fabricNormalMap.wrapS = fabricNormalMap.wrapT = THREE.RepeatWrapping;
// 地面高光贴图
const fabricSheen = textureLoader.load(
  "texture/fabric/FabricPlainWhiteBlackout009_GLOSS_2K.jpg"
);
fabricSheen.wrapS = fabricSheen.wrapT = THREE.RepeatWrapping;
// 模型阴影贴图
const aoTexture = textureLoader.load("texture/ferrari_ao.png");
// 地面
const planeGeometry = new THREE.CircleGeometry(40, 64);
const planeMaterial = new Nodes.MeshPhysicalNodeMaterial({
  side: THREE.DoubleSide,
});
// @ts-ignore
planeMaterial.colorNode = Nodes.texture(fabricTexture, uvNode).mul(
  Nodes.texture(
    aoTexture,
    // @ts-ignore
    Nodes.uv().mul(Nodes.vec2(30, 14)).add(Nodes.vec2(-14.525, -6.52))
  )
);
planeMaterial.normalNode = Nodes.texture(fabricNormalMap, uvNode);
// @ts-ignore
planeMaterial.sheenNode = Nodes.texture(fabricSheen, uvNode);
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// 创建光源
const ambient = new THREE.AmbientLight(0xffffff);
scene.add(ambient);
const spotLight = new THREE.SpotLight(0xffffff, 100);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 8;
spotLight.penumbra = 0.3;
scene.add(spotLight);

// 创建视频对象
const video = document.querySelector("#video") as HTMLVideoElement;

// 加载模型
let carMaterial: any = null;
let leftDoor: { rotation: gsap.TweenTarget; }, rightDoor: { rotation: gsap.TweenTarget; };
const loader = new GLTFLoader();
loader.load("model/zeekr.glb", (gltf) => {
  const model = gltf.scene;
  model.traverse(function (child: any) {
    if (child.isMesh) {
      if (child.name === "车顶窗") {
        child.material.transparent = true;
      }
      if (child.name === "挡风玻璃") {
        child.material.transparent = true;
        child.material.opacity = 0.1;
        child.material.thickness = 2;
      }
      if (child.name === "后右车门窗") {
        child.material.color = new THREE.Color(0x333333);
        child.material.transparent = true;
        child.material.opacity = 0.8;
        child.material.thickness = 2;
      }
      if (child.name == "车灯罩") {
        child.material.transparent = true;
        child.material.opacity = 0.5;
        child.material.thickness = 2;
      }
      if (child.name == "机盖2") {
        child.material.color = new THREE.Color(0xffccff);
        child.material.roughness = 0.3;
        child.material.clearcoat = 1;
        child.material.clearcoatRoughness = 0;
        carMaterial = child.material;
      }
      if (child.material && child.material.name == "视频纹理") {
        video.play();
        let videoTexture = new THREE.VideoTexture(video);
        child.material = new THREE.MeshPhongMaterial({
          map: videoTexture,
          emissiveMap: videoTexture,
        });
        // video.addEventListener("loadeddata", () => {
        //   video.play();
        //   let videoTexture = new THREE.VideoTexture(video);
        //   child.material = new THREE.MeshPhongMaterial({
        //     map: videoTexture,
        //     emissiveMap: videoTexture,
        //   });
        // });
      }
      if (child.name === "前左车门p") {
        leftDoor = child;
      }
      if (child.name === "前右车门p") {
        rightDoor = child;
      }
    }
  });
  scene.add(model);
});

// 添加点光源
const pointLight = new THREE.PointLight(0xff9999, 1);
pointLight.position.set(4, 4, 0);
scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0x99ffff, 1);
pointLight2.position.set(-4, 4, 0);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xff99ff, 1);
pointLight3.position.set(0, 4, 4);
scene.add(pointLight3);

const pointLight4 = new THREE.PointLight(0x00ffff, 1);
pointLight4.position.set(0, 4, -4);
scene.add(pointLight4);

// 监听交互事件
let timeline = gsap.timeline();
const enterCar = () => {
  timeline.to(camera.position, {
    z: -0.1,
    x: 0.43,
    y: 1.24,
    duration: 1,
    ease: "power2.inOut",
  });
};

const outCar = () => {
  timeline.to(camera.position, {
    z: 6,
    x: 0,
    y: 2,
    duration: 1,
    ease: "power2.inOut",
  });
};

// 设置颜色选项
const colors = [
  {
    name: "红色",
    color: "rgb(255,0,0)",
  },
  {
    name: "蓝色",
    color: "rgb(0,0,255)",
  },
  {
    name: "紫色",
    color: "rgb(255,0,255)",
  },
  {
    name: "白色",
    color: "rgb(255,255,255)",
  },
];

const isColor = ref(false);
const toggleColor = () => {
  isColor.value = !isColor.value;
};

const changeColor = (color: THREE.ColorRepresentation | undefined) => {
  carMaterial.color = new THREE.Color(color);
};

// 开车门
let isOpen = false;
let timeline1 = gsap.timeline();
let timeline2 = gsap.timeline();
const openDoor = () => {
  if (isOpen) {
    isOpen = false;
    timeline1.to(leftDoor.rotation, {
      y: 0,
      duration: 1,
      ease: "power2.inOut",
    });
    timeline2.to(rightDoor.rotation, {
      y: 0,
      duration: 1,
      ease: "power2.inOut",
    });
  } else {
    isOpen = true;
    timeline1.to(leftDoor.rotation, {
      y: -Math.PI / 4,
      duration: 1,
      ease: "power2.inOut",
    });
    timeline2.to(rightDoor.rotation, {
      y: Math.PI / 4,
      duration: 1,
      ease: "power2.inOut",
    });
  }
};
</script>

<template>
  <div>
    <div class="colors" v-show="isColor">
      <div
        class="color"
        v-for="(item, index) in colors"
        :key="index"
        :style="{ backgroundColor: item.color }"
        @click="changeColor(item.color)"
      ></div>
    </div>
    <div class="tab">
      <div class="btn" @click="toggleColor">
        <div class="btn-icon1"></div>
        <div class="btn-text">颜色</div>
      </div>
      <div class="btn" @click="enterCar">
        <div class="btn-icon2"></div>
        <div class="btn-text">内饰</div>
      </div>
      <div class="btn" @click="outCar">
        <div class="btn-icon3"></div>
        <div class="btn-text">车身</div>
      </div>
      <div class="btn" @click="openDoor">
        <div class="btn-icon3"></div>
        <div class="btn-text">开车门</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  z-index: 100;
  color: #fff;
}
.btn {
  width: 33.33%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.btn-icon1 {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-size: 100% 100%;
  background-image: url("assets/img/car3.png");
}
.btn-icon2 {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-size: 100% 100%;
  background-image: url("assets/img/car.png");
}
.btn-icon3 {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-size: 100% 100%;
  background-image: url("assets/img/car2.png");
}
.colors {
  width: 100vw;
  height: 100px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  left: 0;
  bottom: 100px;
  z-index: 100;
}
.color {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 5px solid rgba(255, 255, 255, 0.5);
}
</style>
