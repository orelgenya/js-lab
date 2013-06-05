function oni2Start() {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}

function tick(){
    requestAnimationFrame(tick);
    drawScene();
    animate();
}

var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeigth = canvas.height;
    } catch (e) {
        console.log(e);
    }
    if (!gl) {
        alert("Couldn't initialize WebGL!");
    }
}

var shaderProgram;
function initShaders(){
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        alert("Could not initialize shaders!");
    }

    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

function getShader(gl, id){
    var shaderScript = document.getElementById(id);
    if(!shaderScript) return null;

    var str = "";
    var k = shaderScript.firstChild;
    while(k){
        if(k.nodeType == 3) str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if(shaderScript.type == "x-shader/x-fragment"){
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if(shaderScript.type == "x-shader/x-vertex"){
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else return null;

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var pyramidVertexPositionBuffer;
var pyramidVertexColorBuffer;
var cubeVertexPositionBuffer;
var cubeVertexColorBuffer;
var cubeVertexIndexBuffer;
function initBuffers(){
    // pyramid position
    pyramidVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
    var vertices = [
        // front
        0.0,    1.0,    0.0,
        -1.0,   -1.0,   1.0,
        1.0,    -1.0,   1.0,
        // right
        0.0,    1.0,    0.0,
        1.0,   -1.0,   1.0,
        1.0,    -1.0,   -1.0,
        // back
        0.0,    1.0,    0.0,
        1.0,   -1.0,   -1.0,
        -1.0,    -1.0,   -1.0,
        // left
        0.0,    1.0,    0.0,
        -1.0,   -1.0,   -1.0,
        -1.0,    -1.0,   1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    pyramidVertexPositionBuffer.itemSize = 3;
    pyramidVertexPositionBuffer.numItems = 12;

    // pyramid color
    pyramidVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
    var colors = [
        // front
        1.0,    0.0,    0.0,    1.0,
        0.0,    1.0,    0.0,    1.0,
        0.0,    0.0,    1.0,    1.0,
        // right
        1.0,    0.0,    0.0,    1.0,
        0.0,    0.0,    1.0,    1.0,
        0.0,    1.0,    0.0,    1.0,
        // back
        1.0,    0.0,    0.0,    1.0,
        0.0,    1.0,    0.0,    1.0,
        0.0,    0.0,    1.0,    1.0,
        // left
        1.0,    0.0,    0.0,    1.0,
        0.0,    0.0,    1.0,    1.0,
        0.0,    1.0,    0.0,    1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    pyramidVertexColorBuffer.itemSize = 4;
    pyramidVertexColorBuffer.numItems = 12;

    // cube position
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    vertices = [
        // front
        -1.0,   -1.0,   1.0,
        1.0,    -1.0,   1.0,
        1.0,    1.0,    1.0,
        -1.0,   1.0,    1.0,
        // back
        -1.0,   -1.0,   -1.0,
        -1.0,   1.0,    -1.0,
        1.0,    1.0,    -1.0,
        1.0,    -1.0,   -1.0,
        // top
        -1.0,   1.0,    -1.0,
        -1.0,   1.0,    1.0,
        1.0,    1.0,    1.0,
        1.0,    1.0,    -1.0,
        // bottom
        -1.0,   -1.0,   -1.0,
        1.0,    -1.0,   -1.0,
        1.0,    -1.0,   1.0,
        -1.0,   -1.0,   1.0,
        // right
        1.0,    -1.0,   -1.0,
        1.0,    1.0,    -1.0,
        1.0,    1.0,    1.0,
        1.0,    -1.0,   1.0,
        // left
        -1.0,   -1.0,   -1.0,
        -1.0,   -1.0,   1.0,
        -1.0,   1.0,    1.0,
        -1.0,   1.0,    -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    // cube color
    cubeVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    colors = [
        [1.0, 0.0, 0.0, 1.0],   // front
        [1.0, 1.0, 0.0, 1.0],   // back
        [0.0, 1.0, 0.0, 1.0],   // top
        [1.0, 0.5, 0.5, 1.0],   // bottom
        [1.0, 0.0, 1.0, 1.0],   // right
        [0.0, 0.0, 1.0, 1.0]    // left
    ];
    var unpackedColors = [];
    for(var j in colors)
        for(var i = 0; i < 4; i++){
            unpackedColors = unpackedColors.concat(colors[j]);
        }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    cubeVertexColorBuffer.itemSize = 4;
    cubeVertexColorBuffer.numItems = 24;

    // cube indexes
    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndexes = [
        0,1,2, 0,2,3,       // front
        4,5,6, 4,6,7,       // back
        8,9,10, 8,10,11,    // top
        12,13,14, 12,14,15, // bottom
        16,17,18, 16,18,19, // right
        20,21,22, 20,22,23  // left
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndexes), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix(){
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix(){
    if(mvMatrix.length == 0) throw "Invalid mvPopMatrix!";
    mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms(){
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

var rPyramid = 0;
var rCube = 0;

function drawScene(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeigth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(60, gl.viewportWidth / gl.viewportHeigth, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [-1.5, 2.0, -7.0]);

    // triangle
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(rPyramid), [0, 1, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            pyramidVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
            pyramidVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, pyramidVertexPositionBuffer.numItems);

    mvPopMatrix();

    // square
    mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);

    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(rCube), [1, 1, 1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
            cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();
}

var lastTime = 0;
function animate(){
    var timeNow = new Date().getTime();
    if(lastTime != 0){
        var elapsed = timeNow - lastTime;

        rPyramid += (90 * elapsed) / 1000;
        rCube += (75 * elapsed) / 1000;
    }
    lastTime = timeNow;
}

function degToRad(degrees){
    return degrees * Math.PI / 180;
}
