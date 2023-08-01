struct Uniforms {   
    model_view_mat : mat4x4<f32>,
    project_mat : mat4x4<f32>,           
    normal_mat : mat4x4<f32>,            
};
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct Output {
    @builtin(position) position : vec4<f32>,
    @location(0) v_position : vec4<f32>,
    @location(1) v_normal : vec4<f32>,
};

@vertex
fn main(@location(0) pos: vec4<f32>, @location(1) normal: vec4<f32>) -> Output {    
    var output: Output;            
    let m_position:vec4<f32> = uniforms.model_view_mat * pos; 
    output.v_position = m_position;                  
    output.v_normal =  uniforms.normal_mat * normal;
    output.position = uniforms.project_mat * m_position;               
    return output;
}

// mv + p 实现
// 模型矩阵（Model Matrix）：这个矩阵负责把模型从模型空间（Model Space）变换到世界空间（World Space）。模型空间是模型的原始坐标系统，原点通常在模型的中心。世界空间是一个更大的坐标系统，用于表示场景中所有对象的位置。
// 视图矩阵（View Matrix）：这个矩阵负责把模型从世界空间变换到视图空间（View Space，也叫相机空间）。视图空间的原点是相机的位置，向前看的方向是Z轴的负方向。
// 投影矩阵（Projection Matrix）：这个矩阵负责把模型从视图空间变换到裁剪空间（Clip Space）。在这个空间中，所有可见的对象都会被映射到一个单位立方体（从-1到1的范围）。

// 在vp+m方式中，你先在世界空间进行物体的变换（模型变换），然后将变换后的坐标投影到摄像机空间（视图投影变换）。在这个过程中，光源位置和视点位置都是在世界空间中定义的，因此它们无需进行任何转换。
// 而在mv+p方式中，你先将物体从世界空间变换到视图空间（视图变换），然后在视图空间中进行投影变换（投影变换）。这就意味着你的着色器是在视图空间中进行计算的，因此需要将光源位置和视点位置也转换到视图空间中，以便于进行正确的光照计算。