Mesh = function(config){
    if(!config) return;
    this.gl = config.gl;
    this.position = config.position
    this.vertices = config.vertices;
    this.vertexIndexes = config.vertexIndexes;
    this.textureFile = config.textureFile;
    this.textureCoords = config.textureCoords;
    this.vertexNormals = config.vertexNormals;
    this.position = config.position;
};
Mesh.prototype.initBuffers = function(){
    // position
    this.vertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
    this.vertexPositionBufferItemSize = 3;
    this.vertexPositionBufferNumItems = 24;

    // indexes
    this.vertexIndexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertexIndexes), this.gl.STATIC_DRAW);
    this.vertexIndexBufferItemSize = 1;
    this.vertexIndexBufferNumItems = 36;

    // texture coordinates
    this.vertexTextureCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), this.gl.STATIC_DRAW);
    this.vertexTextureCoordBufferItemSize = 2;
    this.vertexTextureCoordBufferNumItems = 24;

    // normals
    this.vertexNormalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertexNormals), this.gl.STATIC_DRAW);
    this.vertexNormalBufferItemSize = 3;
    this.vertexNormalBufferNumItems = 24;
}
Mesh.prototype.initTextures = function(texture){
    this.texture = texture;
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture.image);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
    this.gl.generateMipmap(this.gl.TEXTURE_2D);

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
}
Scene = function(config){
    this.meshes = [];
    this.lights = [];
    this.textures = {};
    if(!config) return;
    this.gl = config.gl;
    if(config.meshes){
        for(var i = 0; i < config.meshes.length; i++){
            config.meshes[i].gl = this.gl;
            this.meshes.push(new Mesh(config.meshes[i]));
        }
    }
}
Scene.prototype.addMesh = function(mesh){
    this.meshes.push(mesh);
}
Scene.prototype.cloneMeshToPos = function(i, pos){
    var mesh = new Mesh(this.meshes[i]);
    mesh.position = pos;
    this.meshes.push(mesh);
}
Scene.prototype.initBuffers = function(){
    for(var i in this.meshes){
        this.meshes[i].initBuffers();
    }
}
Scene.prototype.initTextures = function(){
    for(var i in this.meshes){
        var file = this.meshes[i].textureFile;
        if(file){
            var texture = this.textures[file];
            if(!texture){
                this.textures[file] = {
                    loaded : false,
                    meshes : []
                };
            }
            this.textures[file].meshes.push(this.meshes[i]);
        }
    }
    for(var file in this.textures){
        this.loadTexture(file);
    }

}
Scene.prototype.loadTexture = function(file){
    var tex = this.textures[file];
    var gltex = this.gl.createTexture();
    tex.texture = gltex;

    var image = new Image();
    gltex.image = image;

    var self = this;
    image.onload = function(){
        tex.loaded = true;
        for(var i in tex.meshes){
            tex.meshes[i].initTextures(gltex);
        }
        for(var i in self.textures){
            if(!self.textures[i].loaded) return;
        }
        self.ready = true;
    }
    image.src = file;
}



///////////////////////////
function startViewer(){
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
    document.getElementById('file').addEventListener('change', handleFileSelect, false);
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    // files is a FileList of File objects. List some properties.
    for (var i = 0, f; f = files[i]; i++) {
        console.log('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.dataSize, ' bytes, last modified: ',
            f.lastModifiedDate.toLocaleDateString(), '</li>');
    }
    startRead();
}

function startRead() {
    // obtain input element through DOM

    var file = document.getElementById('file').files[0];
    if(file){
        getAsText(file);
    }
}

function getAsText(readFile) {

    var reader = new FileReader();

    // Handle progress, success, and errors
    reader.onprogress = updateProgress;
    reader.onload = loaded;
    reader.onerror = errorHandler;

    // Read file into memory as UTF-16
    //reader.readAsText(readFile, "UTF-16");
    reader.readAsArrayBuffer(readFile);

}

function updateProgress(evt) {
    if (evt.lengthComputable) {
        // evt.loaded and evt.total are ProgressEvent properties
        var loaded = (evt.loaded / evt.total);
        var bar = document.getElementById('bar');
        if (loaded < 1) {
            // Increase the prog bar length
            bar.style.width = (loaded * 200) + "px";
        } else {
            bar.style.width = "200px";
        }
    }
}

function loaded(evt) {
    // Obtain the read file data
    var file = evt.target.result;
    console.log("loaded "+file.byteLength);

    var blend = new BlenderReader(file);
    blend.read();
    console.log(blend);
    var s = blend.reviewStruct("Mesh");
    console.log(s);
    blend.readData();
    console.log(blend);
    blend.logBlocksCount();
    var bi = blend.findBlockIndexByCode('ME');
    if(!bi) return;
    var me = blend.blocks[bi];
    console.log(me);
    bi = blend.findBlockIndexByPointer(me.structs[0]['*mvert']);
    if(!bi) return;
    var verts = blend.blocks[bi];
    console.log(verts);
    var v = [];
    v.v = verts;
    v.xpush = function(){
        for(var i in arguments){
            var p = this.v.structs[arguments[i]];
            for(var j = 0; j < 3; j++)
                this.push(p["co[3]"][j]);
        }
    }
    v.xpush(6,5,4,7);
    v.xpush(2,1,0,3);
    v.xpush(3,7,4,0);
    v.xpush(2,1,5,6);
    v.xpush(1,0,4,5);
    v.xpush(2,6,7,3);
    console.log(v);
    test(v);
}

/////////////////////////////////

var scene;
function test(v) {


    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();

    var data = loadJson('data08.json');
    data.gl = gl;
    data.meshes[0].vertices = v;
    scene = new Scene(data);
    scene.cloneMeshToPos(0, [0, 4, 0]);
    scene.cloneMeshToPos(0, [0, -4, 0]);

    scene.initBuffers();
    scene.initTextures();

    var id = setInterval(function(){
        if(scene.ready){
            clearInterval(id);
            oni2Start2();
        }
    }, 500);
}

function oni2Start2() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}

function loadJson(fileName){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', fileName, false);
    xhr.send(null);
    if (xhr.readyState == 4) {
        return JSON.parse(xhr.responseText);
    }
}

function tick(){
    requestAnimationFrame(tick);
    drawScene(scene);
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
    shaderProgram.alphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
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

var cubeVertexPositionBuffer;
var cubeVertexIndexBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexNormalBuffer;
function initBuffers(){
     // cube position
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    var vertices;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    // cube indexes
    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndexes;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndexes), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;

    // cube texture coordinates
    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 24;

    cubeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    var vertexNormals;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    cubeVertexNormalBuffer.itemSize = 3;
    cubeVertexNormalBuffer.numItems = 24;
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
var z = -15.0;

function drawScene(scene){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeigth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeigth, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, z]);


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

    var blending = document.getElementById("blending").checked;
    if(blending){
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.uniform1f(shaderProgram.alphaUniform, parseFloat(document.getElementById("alpha").value));
    } else {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
    }

    for(var i in scene.meshes){
        drawMesh(scene.meshes[i]);
    }
}

function drawMesh(mesh){
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            mesh.vertexPositionBufferItemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
            mesh.vertexTextureCoordBufferItemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
            mesh.vertexNormalBufferItemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.vertexIndexBuffer);

    mvPushMatrix();
    mat4.translate(mvMatrix, mesh.position);
    mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    setMatrixUniforms();
    mvPopMatrix();

    gl.drawElements(gl.TRIANGLES, mesh.vertexIndexBufferNumItems, gl.UNSIGNED_SHORT, 0);
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
