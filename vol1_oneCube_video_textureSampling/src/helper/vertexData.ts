export const CubeData = () => {
    const vertexData = new Float32Array([
        // float3 position, float2 uv
        // face1
        +1, -1, +1,    1, 1,
        -1, -1, +1,    0, 1,
        -1, -1, -1,    0, 0,
        +1, -1, -1,    1, 0,
        +1, -1, +1,    1, 1,
        -1, -1, -1,    0, 0,
        // face2
        +1, +1, +1,    1, 1,
        +1, -1, +1,    0, 1,
        +1, -1, -1,    0, 0,
        +1, +1, -1,    1, 0,
        +1, +1, +1,    1, 1,
        +1, -1, -1,    0, 0,
        // face3
        -1, +1, +1,    1, 1,
        +1, +1, +1,    0, 1,
        +1, +1, -1,    0, 0,
        -1, +1, -1,    1, 0,
        -1, +1, +1,    1, 1,
        +1, +1, -1,    0, 0,
        // face4
        -1, -1, +1,    1, 1,
        -1, +1, +1,    0, 1,
        -1, +1, -1,    0, 0,
        -1, -1, -1,    1, 0,
        -1, -1, +1,    1, 1,
        -1, +1, -1,    0, 0,
        // face5
        +1, +1, +1,    1, 1,
        -1, +1, +1,    0, 1,
        -1, -1, +1,    0, 0,
        -1, -1, +1,    0, 0,
        +1, -1, +1,    1, 0,
        +1, +1, +1,    1, 1,
        // face6
        +1, -1, -1,    1, 1,
        -1, -1, -1,    0, 1,
        -1, +1, -1,    0, 0,
        +1, +1, -1,    1, 0,
        +1, -1, -1,    1, 1,
        -1, +1, -1,    0, 0
    ])

    return {
        vertexData,
    };
};