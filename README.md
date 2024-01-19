<h1 align="center">WebGPU Study</h1>

<div align="center">

![Static Badge](https://img.shields.io/badge/chrome-113+-green)
![Static Badge](https://img.shields.io/badge/pnpm-8.2.0-8A2BE2)
![Static Badge](https://img.shields.io/badge/vite-4.3.2-blue)

![Static Badge](https://img.shields.io/badge/typescript-5.0.4-orange)
![Static Badge](https://img.shields.io/badge/wgpu--matrix-2.5.0-orange)
![Static Badge](https://img.shields.io/badge/dat.gui-0.7.9-orange)

</div>

<hr/>

<h3 align="center">

💡 **文件说明** 💡

</h3>

| 文件                                | 描述                                                                |
| ----------------------------------- | ------------------------------------------------------------------- |
| drawio                              | 一些流程图之类的                                                    |
| vol0_triangle                       | 最基础的画三角形                                                    |
| vol1_oneCube                        | 一个旋转的正方体                                                    |
| vol1_oneCube_MSAA                   | 抗锯齿                                                              |
| vol1_oneCube_image_textureSampling  | 图片纹理采样                                                        |
| vol1_oneCube_canvas_textureSampling | 画布纹理采样                                                        |
| vol1_oneCube_video_textureSampling  | 视频纹理采样                                                        |
| vol1_oneCube_indexBuffer            | 索引缓冲区                                                          |
| vol2_twoCubes                       | 两个旋转的正方体                                                    |
| vol2_twoCubesMSAA                   | 两个旋转的正方体带抗锯齿                                            |
| vol3_sphere_wireFrame               | 一个旋转的线框球体                                                  |
| vol4_oneCube_light_mv+p             | 一个具有照明效果的旋转的正方体（模型视图矩阵+投影矩阵实现）         |
| vol4_oneCube_light_vp+m             | 一个具有照明效果的旋转的正方体（视图投影矩阵+模型矩阵实现）         |
| vol5_objects_light                  | 带有基础照明的多个物体                                              |
| vol5_objects_light_layout           | 带有基础照明的多个物体（创建 pipeline 时指定 layout 而非使用 auto） |
| vol6_shadowMapping                  | 利用阴影贴图实现实时阴影                                            |
| vol6_shadowMapping_two_lights       | 两个光源下的阴影处理                                                |
| vol7_computeShader                  | 利用计算着色器模拟数十万物体动态移动                                |
| vol8_worker                         | 使用 worker 线程进行渲染                                            |
| vol8_worker_axes                    | 添加坐标轴辅助器                                                    |
| vol9_camera_control                 | 简易相机控制器                                                      |
| vol10_renderBundles                 | 命令束 RenderBundle                                                 |
| proj1_gameOfLife                    | 生命游戏                                                            |
| proj2_firework                      | 简易烟花 与 wgsl 中内存地址对齐说明                                 |
| proj3_imageBlur                     | 简易图像均值模糊                                                    |
| proj3_imageBlur_Gaussian            | 基于亮度的高斯模糊                                                  |
| proj4_galaxy                        | 简易银河                                                            |

<h3 align="center">

<hr/>

📚 **我的 wgsl shadertoy** 📚

</h3>

<div align="center">

[shadertoy 在线游玩](https://lyirs.github.io/my-webgpu-shadertoy/dist/)

[github 仓库](https://github.com/lyirs/my-webgpu-shadertoy)

</div>

<h3 align="center">

<hr/>

💡 **一些网站** 💡

</h3>

- [WebGPU 最新版本](https://www.w3.org/TR/webgpu/)
- [WebGPU 中文翻译文档](https://www.orillusion.com/zh/webgpu.html)
- [WGSL 最新版本](https://www.w3.org/TR/WGSL/)
- [WGSL 中文翻译文档](https://www.orillusion.com/zh/wgsl.html)
- [WebGPU 说明](https://gpuweb.github.io/gpuweb/explainer/)
- [WebGPU 说明 中文翻译文档](https://www.orillusion.com/zh/explainer.html)
- [google 工程师维护的 WebGPU 示例](https://github.com/austinEng/webgpu-samples)
- [WebGPU API C++版本](https://dawn.googlesource.com/dawn)
- [官方演示](https://webgpu.github.io/webgpu-samples)

<div>
</div>

- [WebGPU 博客](https://alain.xyz/blog/raw-webgpu)
- [WebGPU 示例](https://webgpu-gpu-book.drxudotnet.com/)

<div>
</div>

- [内存地址对齐计算工具网站](https://webgpufundamentals.org/webgpu/lessons/resources/wgsl-offset-computer.html)

<hr/>

<h3 align="center">

<h3 align="center">

💡 **基本使用** 💡

</h3>

进入对应项目

```bash
├─ 📂 node_modules/ # 👶 Dependencies
│ ├─ 📁 wgpu-matrix # ➕ Linear Algebra
│ └─ 📁 ... # 🕚 Other Dependencies (TypeScript, etc.)
├─ 📂 src/ # 🌟 Source Files
│ ├─ 📄 index.html # 📇 Main HTML file
│ └─ 📄 main.ts # 🔺 Triangle Renderer
├─ 📄 .gitignore # 👁️ Ignore certain files in git repo
├─ 📄 package.json # 📦 Node Package File
└─ 📃 readme.md # 📖 Read Me!
```

### 依赖安装

`pnpm i`

### 运行

`pnpm dev`
