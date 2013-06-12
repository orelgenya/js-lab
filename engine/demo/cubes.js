function oni2Start() {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();

    for(var i = 0, r = 1, dy = 0; i < 5; i++, dy += r, r += 0.4, dy += r){
        cubes.push(new Cube({shift:[0, -dy, 0], radius:r}));//(Math.pow(-1, i))*(i+1)*4
    }


    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}
var cubes = [];

function tick(){
    requestAnimationFrame(tick);
    drawScene();
    handleKeys();
    animate();
}

var currentlyPressedKeys = {}

function handleKeyDown(event){
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event){
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys(){
    if(currentlyPressedKeys[33]){
        // page up
        z -= 0.5;
    }
    if(currentlyPressedKeys[34]){
        // page down
        z += 0.5;
    }
    if(currentlyPressedKeys[37]){
        // left cursor key
        ySpeed -= 1;
    }
    if(currentlyPressedKeys[39]){
        // right cursor key
        ySpeed += 1;
    }
    if(currentlyPressedKeys[38]){
        // up cursor key
        xSpeed -= 1;
    }
    if(currentlyPressedKeys[40]){
        // down cursor key
        xSpeed += 1;
    }
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

    shaderProgram.textureCoordAttribute  = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
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

var crateTexture;
function initTexture(){
    var crateImage = new Image();

    var texture = gl.createTexture();
    texture.image = crateImage;
    crateTexture = texture;

    crateImage.onload = function(){
        handleLoadedTexture(crateTexture);
    }
    crateImage.src = "crate.gif";
}

function handleLoadedTexture(texture){
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
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

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

var xRot = 0;
var xSpeed = 0;
var yRot = 0;
var ySpeed = 0;
var z = -32.0, y = 10.0;

Cube = function(config){
    config = config || {};
    this.shift = config.shift ? config.shift : [0,0,0];
    this.radius = config.radius ? config.radius : 1.0;

    this.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    var vertices = [
        // front
        -this.radius,   -this.radius,   this.radius,
        this.radius,    -this.radius,   this.radius,
        this.radius,    this.radius,    this.radius,
        -this.radius,   this.radius,    this.radius,
        // back
        -this.radius,   -this.radius,   -this.radius,
        -this.radius,   this.radius,    -this.radius,
        this.radius,    this.radius,    -this.radius,
        this.radius,    -this.radius,   -this.radius,
        // top
        -this.radius,   this.radius,    -this.radius,
        -this.radius,   this.radius,    this.radius,
        this.radius,    this.radius,    this.radius,
        this.radius,    this.radius,    -this.radius,
        // bottom
        -this.radius,   -this.radius,   -this.radius,
        this.radius,    -this.radius,   -this.radius,
        this.radius,    -this.radius,   this.radius,
        -this.radius,   -this.radius,   this.radius,
        // right
        this.radius,    -this.radius,   -this.radius,
        this.radius,    this.radius,    -this.radius,
        this.radius,    this.radius,    this.radius,
        this.radius,    -this.radius,   this.radius,
        // left
        -this.radius,   -this.radius,   -this.radius,
        -this.radius,   -this.radius,   this.radius,
        -this.radius,   this.radius,    this.radius,
        -this.radius,   this.radius,    -this.radius
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 3;
    this.vertexPositionBuffer.numItems = 24;

    this.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    var cubeVertexIndexes = [
        0,1,2, 0,2,3,       // front
        4,5,6, 4,6,7,       // back
        8,9,10, 8,10,11,    // top
        12,13,14, 12,14,15, // bottom
        16,17,18, 16,18,19, // right
        20,21,22, 20,22,23  // left
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndexes), gl.STATIC_DRAW);
    this.vertexIndexBuffer.itemSize = 1;
    this.vertexIndexBuffer.numItems = 36;

    this.vertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
    var textureCoords = [
        // front
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // back
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        // top
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        // bottom
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        // right
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        // left
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    this.vertexTextureCoordBuffer.itemSize = 2;
    this.vertexTextureCoordBuffer.numItems = 24;


    this.vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
    var vertexNormals = [
        // Front face
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        // Back face
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        // Top face
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        // Bottom face
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        // Right face
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    this.vertexNormalBuffer.itemSize = 3;
    this.vertexNormalBuffer.numItems = 24;
};


function drawCube(cube){
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        cube.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
        cube.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, crateTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
        cube.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.vertexIndexBuffer);

    mvPushMatrix();
    mat4.translate(mvMatrix, cube.shift);
    mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    setMatrixUniforms();
    mvPopMatrix();

    gl.drawElements(gl.TRIANGLES, cube.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawScene(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeigth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeigth, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, y, z]);

    var lighting = document.getElementById("lighting").checked;
    gl.uniform1i(shaderProgram.useLightingUniform, lighting);
    if(lighting){
        gl.uniform3f(
                shaderProgram.ambientColorUniform,
                parseFloat(document.getElementById("ambientR").value),
                parseFloat(document.getElementById("ambientG").value),
                parseFloat(document.getElementById("ambientB").value)
        );
        var lightingDirection = [
                parseFloat(document.getElementById("lightDirectionX").value),
                parseFloat(document.getElementById("lightDirectionY").value),
                parseFloat(document.getElementById("lightDirectionZ").value)
        ];
        var adjustedLD = vec3.create();
        vec3.normalize(lightingDirection, adjustedLD);
        vec3.scale(adjustedLD, -1);
        gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
        gl.uniform3f(
                shaderProgram.directionalColorUniform,
                parseFloat(document.getElementById("directionalR").value),
                parseFloat(document.getElementById("directionalG").value),
                parseFloat(document.getElementById("directionalB").value)
        );
    }

    for(var i = 0; i < cubes.length; i++)
        drawCube(cubes[i]);
}

var lastTime = 0;
function animate(){
    var timeNow = new Date().getTime();
    if(lastTime != 0){
        var elapsed = timeNow - lastTime;

        xRot += (xSpeed * elapsed) / 1000;
        yRot += (ySpeed * elapsed) / 1000;
    }
    lastTime = timeNow;
}

function degToRad(degrees){
    return degrees * Math.PI / 180;
}
