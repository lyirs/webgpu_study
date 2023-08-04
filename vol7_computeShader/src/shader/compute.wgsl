@group(0) @binding(0) var<storage, read> input: array<f32, 7>;
@group(0) @binding(1) var<storage, read_write> velocity: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> model: array<mat4x4<f32>>;
@group(0) @binding(3) var<uniform> viewProjection : mat4x4<f32>;
@group(0) @binding(4) var<storage, read_write> mvp : array<mat4x4<f32>>;

// 如何知道当前线程对应的数据或像素坐标呢？ 在vs入口函数中有vertex_index和instance_index两个参数表明当前正在处理的顶点index与物体index，而在cs中：
// local_invocation_id  对应当前组中的index
// global_invocation_id  对应整体数据中的index
// @workgroup_size(size)修饰符，表示每个工作组有size（这里设为128）个线程
const size = u32(128);
@compute @workgroup_size(size)
fn main(
    @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
) {
    // 由于这是一个1维的线程分配（只有x轴），所以只需要使用GlobalInvocationID.x
    var index = GlobalInvocationID.x;
    if(index >= u32(input[0])){
        return;
    }
    var xMin = input[1];
    var xMax = input[2];
    var yMin = input[3];
    var yMax = input[4];
    var zMin = input[5];
    var zMax = input[6];
    var pos = model[index][3];
    var vel = velocity[index];
    // 函数检查更新后的位置是否超出了边界，如果超出了边界，就将位置限制在边界上，并反转速度方向。
    // x
    pos.x += vel.x;
    if(pos.x < xMin){
        pos.x = xMin;
        vel.x = -vel.x;
    }else if(pos.x > xMax){
        pos.x = xMax;
        vel.x = -vel.x;
    }
    // y
    pos.y += vel.y;
    if(pos.y < yMin){
        pos.y = yMin;
        vel.y = -vel.y;
    }else if(pos.y > yMax){
        pos.y = yMax;
        vel.y = -vel.y;
    }
    // z
    pos.z += vel.z;
    if(pos.z < zMin){
        pos.z = zMin;
        vel.z = -vel.z;
    }else if(pos.z > zMax){
        pos.z = zMax;
        vel.z = -vel.z;
    }
    // update velocity
    // 保存到对应的buffer中
    velocity[index] = vel;
    // update position in model matrix
    model[index][3] = pos;
    // update mvp
    // 不要返回给js计算mvp，直接在这里计算完毕
    mvp[index] = viewProjection * model[index];
}