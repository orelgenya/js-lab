function oni2Start() {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();
    initTexture();
    initBuffers();
    initWorldObjects();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}

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

var zoom = -15;
var tilt = 90;
var spin = 0;
function handleKeys(){
    if(currentlyPressedKeys[33]){
        // page up
        zoom -= 0.1;
    }
    if(currentlyPressedKeys[34]){
        // page down
        zoom += 0.1;
    }
    if(currentlyPressedKeys[38]){
        // up cursor key
        tilt += 2;
    }
    if(currentlyPressedKeys[40]){
        // down cursor key
        tilt -= 2;
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

    shaderProgram.textureCoordAttribute  = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
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

var starVertexPositionBuffer;
var starVertexTextureCoordBuffer;
function initBuffers(){
     // star position
    starVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    var vertices = [
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    starVertexPositionBuffer.itemSize = 3;
    starVertexPositionBuffer.numItems = 4;

    // star texture coordinates
    starVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
    var textureCoords = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    starVertexTextureCoordBuffer.itemSize = 2;
    starVertexTextureCoordBuffer.numItems = 4;
}

var starTexture;
function initTexture(){
    starTexture = gl.createTexture();
    starTexture.image = new Image();
    starTexture.image.onload = function () {
        handleLoadedTexture(starTexture);
    };
    starTexture.image.src = "star.gif";
}

function handleLoadedTexture(texture){
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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

function drawScene(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeigth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeigth, 0.1, 100.0, pMatrix);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, zoom]);
    mat4.rotate(mvMatrix, degToRad(tilt), [1, 0, 0]);

    var twinkle = document.getElementById("twinkle").checked;

    for(var i in stars){
        stars[i].draw(tilt, spin, twinkle);
        spin += 0.1;
    }
}

var stars = [];
function initWorldObjects(){
    var numStars = 50;
    for(var i = 0; i < numStars; i++){
        stars.push(new Star((i/numStars)*5.0, i / numStars));
    }
}

function Star(startingDistance, rotationSpeed){
    this.angle = 0;
    this.dist  = startingDistance;
    this.rotationSpeed = rotationSpeed;

    this.randomiseColors();
}

Star.prototype.draw = function (tilt, spin, twinkle) {
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(this.angle), [0.0, 1.0, 0.0]);
    mat4.translate(mvMatrix, [this.dist, 0.0, 0.0]);

    mat4.rotate(mvMatrix, degToRad(-this.angle), [0.0, 1.0, 0.0]);
    mat4.rotate(mvMatrix, degToRad(-tilt), [1.0, 0.0, 0.0]);

    if (twinkle) {
        gl.uniform3f(shaderProgram.colorUniform, this.twinkleR, this.twinkleG, this.twinkleB);
        drawStar();
    }

    mat4.rotate(mvMatrix, degToRad(spin), [0.0, 0.0, 1.0]);

    gl.uniform3f(shaderProgram.colorUniform, this.r, this.g, this.b);
    drawStar();

    mvPopMatrix();
};

var effectiveFPMS = 60/1000;
Star.prototype.animate = function(elapsedTime){
    this.angle += this.rotationSpeed * effectiveFPMS * elapsedTime;
    this.dist -= 0.01 * effectiveFPMS * elapsedTime;
    if(this.dist < 0.0){
        this.dist += 5.0;
        this.randomiseColors();
    }
};

Star.prototype.randomiseColors = function(){
    this.r = Math.random();
    this.g = Math.random();
    this.b = Math.random();

    this.twinkleR = Math.random();
    this.twinkleG = Math.random();
    this.twinkleB = Math.random();
};

function drawStar(){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, starTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
            starVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            starVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, starVertexPositionBuffer.numItems);
}

var lastTime = 0;
function animate(){
    var timeNow = new Date().getTime();
    if(lastTime != 0){
        var elapsed = timeNow - lastTime;

        for(var i in stars){
            stars[i].animate(elapsed);
        }
    }
    lastTime = timeNow;
}
function degToRad(degrees){
    return degrees * Math.PI / 180;
}
