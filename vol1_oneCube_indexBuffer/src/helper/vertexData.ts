export const CubeData = () => {
    const vertexData = new Float32Array([
        // float3 position, float2 uv
        +1, -1, +1,    1, 1,  // 0
        -1, -1, +1,    0, 1,  // 1
        -1, -1, -1,    0, 0,  // 2
        +1, -1, -1,    1, 0,  // 3
        +1, +1, +1,    1, 1,  // 4
        +1, -1, +1,    0, 1,  // 5
        +1, -1, -1,    0, 0,  // 6
        +1, +1, -1,    1, 0,  // 7
        -1, +1, +1,    1, 1,  // 8
        +1, +1, +1,    0, 1,  // 9
        +1, +1, -1,    0, 0,  // 10
        -1, +1, -1,    1, 0,  // 11
        -1, -1, +1,    1, 1,  // 12
        -1, +1, +1,    0, 1,  // 13
        -1, +1, -1,    0, 0,  // 14
        -1, -1, -1,    1, 0,  // 15
        -1, -1, +1,    0, 0,  // 16
        +1, -1, +1,    1, 0,  // 17
        +1, -1, -1,    1, 1,  // 18
        -1, -1, -1,    0, 1,  // 19
    ]);

    const indexData = new Uint32Array([
        0, 1, 2,  3, 0, 2,   // face1
        4, 5, 6,  7, 4, 6,   // face2
        8, 9, 10, 11, 8, 10, // face3
        12, 13, 14, 15, 12, 14, // face4
        4, 13, 16, 16, 17, 4, // face5
        18, 19, 14, 7, 18, 14, // face6
    ]);

    return {
        vertexData,
        indexData
    };
};
