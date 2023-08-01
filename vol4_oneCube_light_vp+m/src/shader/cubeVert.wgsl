struct Uniforms {   
    view_project_mat : mat4x4<f32>,
    model_mat : mat4x4<f32>,           
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
    let m_position:vec4<f32> = uniforms.model_mat * pos; 
    output.v_position = m_position; 
    // 矩阵对向量进行变换                 
    // normal_mat是法线矩阵，它用来将法线从模型空间变换到世界空间。 
    // 将顶点的法线（normal）从模型空间变换到世界空间。通过用法线矩阵乘以模型空间中的法线向量实现
    // 光照计算通常在世界空间中进行。在模型空间中，法线向量可能不正确地表示顶点相对于世界的方向
    output.v_normal =  uniforms.normal_mat * normal;  
    // view_project_mat是视图投影矩阵，它将顶点从世界空间变换到裁剪空间。裁剪空间中的顶点会经过裁剪操作，以删除位于视锥体以外的顶点，
    // 然后通过透视除法变换到归一化设备坐标（NDC）空间，并最终被光栅化为屏幕空间中的像素。
    // m_position是已经通过模型矩阵变换到世界空间的顶点位置，现在我们通过应用视图投影矩阵将其变换到裁剪空间。              
    output.position = uniforms.view_project_mat * m_position;     
    return output;
}