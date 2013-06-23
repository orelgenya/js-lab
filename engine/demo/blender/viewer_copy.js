Mesh = function(config){
    if(!config) return;
    this.gl = config.gl;
    this.position = config.position
    this.vertices = config.vertices;
    this.vertexIndexes = config.vertexIndexes;
    this.mode = (config.mode != undefined) ? config.mode : gl.TRIANGLES;
};
Mesh.prototype.initBuffers = function(){
    // position
    this.vertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
    this.vertexPositionBufferItemSize = 3;
    this.vertexPositionBufferNumItems = this.vertices.length/3;

    // indexes
    this.vertexIndexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertexIndexes), this.gl.STATIC_DRAW);
    this.vertexIndexBufferItemSize = 1;
    this.vertexIndexBufferNumItems = this.vertexIndexes.length;
}
Scene = function(config){
    this.meshes = [];
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
//    var me = blend.blocks[bi];
//    console.log(me);
//    bi = blend.findBlockIndexByPointer(me.structs[0]['*mvert']);
//    if(!bi) return;
    var mesh = blend.resolvePointersForBlock(bi).structs[0];
    console.log(mesh);
    var mvert = mesh['*mvert'];
    var mloop = mesh['*mloop'];
    var mpoly = mesh['*mpoly'];
    var medge = mesh['*medge'];

    var vertices = [];
    var indexes = [];
    for(var i in mvert){
        var co = mvert[i]['co[3]'];
        vertices.push(co[0], co[1], co[2]);
    }
    function initPolygonTriangleIndexes(p){
        var ls = mpoly[p]['loopstart'];
        var k = mpoly[p]['totloop'];
        switch(k){
            case 3:
                indexes.push(mloop[ls]['v']);
                indexes.push(mloop[ls+1]['v']);
                indexes.push(mloop[ls+2]['v']);
                break;
            case 4:
                indexes.push(mloop[ls]['v']);
                indexes.push(mloop[ls+1]['v']);
                indexes.push(mloop[ls+2]['v']);
                indexes.push(mloop[ls]['v']);
                indexes.push(mloop[ls+2]['v']);
                indexes.push(mloop[ls+3]['v']);
                break;
            default:
                throw "Polygons with only 3 or 4 points are supported!";
        }
    }
/*    for(var p = 0; p < mpoly.length; p++){
//        initPolygonTriangleIndexes(p);
        var ls = mpoly[p]['loopstart'];
        var k = mpoly[p]['totloop'];
        for(var i = 0; i < k; i++)
            indexes.push(mloop[ls+i]['v']);
    } */
    var v = vertices;
    function pointToString(i){
        return "("+v[3*i]+","+v[3*i+1]+","+v[3*i+2]+")";
    }
    for(var i = 0; i < 2; i++){
        indexes.push(2*i);
        indexes.push(2*i+1);
    }
    /*for(var i = 0; i < medge.length && i < 10; i++){
        var e = medge[i];
        var v1 = e['v1'];
        var v2 = e['v2'];
        indexes.push(v1);
        indexes.push(v2);
        console.log(pointToString(v1)+" : "+pointToString(v2));
    }    */
//    v.v = verts;
//    v.xpush = function(){
//        for(var i in arguments){
//            var p = this.v.structs[arguments[i]];
//            for(var j = 0; j < 3; j++)
//                this.push(p["co[3]"][j]);
//        }
//    }
//    v.xpush(6,5,4,7);
//    v.xpush(2,1,0,3);
//    v.xpush(3,7,4,0);
//    v.xpush(2,1,5,6);
//    v.xpush(1,0,4,5);
//    v.xpush(2,6,7,3);
    var config = {vertices:vertices,indexes:indexes};
    console.log(config);
    test(config);
}

/////////////////////////////////

var scene;
function test(config) {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();

    var data = loadJson('data08.json');
    data.gl = gl;
    scene = new Scene(data);
   // scene.cloneMeshToPos(0, [0, 4, 0]);
//    scene.meshes[0].vertices = config.vertices;
//    scene.meshes[0].vertexIndexes = config.indexes;
    scene.meshes[0].mode = gl.LINES;
    //scene.cloneMeshToPos(0, [0, -4, 0]);

    scene.initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    oni2Start3(scene.meshes[0]);
}

function oni2Start3(mesh){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeigth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeigth, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        mesh.vertexPositionBufferItemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, mesh.vertexPositionBufferNumItems);
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
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for(var i = 0; i < names.length; i++){
        try {
            context = canvas.getContext(names[i]);
        } catch (e) { console.log(e); }
        if(context){
            break;
        }
    }
    if(context){
        context.viewportWidth = canvas.width;
        context.viewportHeigth = canvas.height;
        gl = WebGLDebugUtils.makeDebugContext(context);
    } else {
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
//    mat4.rotate(pMatrix, degToRad(180), [0, 1, 0]);


//    for(var i in scene.meshes){
//        drawMesh(scene.meshes[i]);
//    }
}

function drawMesh(mesh){
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            mesh.vertexPositionBufferItemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.vertexIndexBuffer);

    mvPushMatrix();
    mat4.translate(mvMatrix, mesh.position);
    mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    setMatrixUniforms();
    mvPopMatrix();
    gl.drawArrays(mesh.mode, 0, mesh.vertexPositionBufferNumItems);
//    gl.drawElements(mesh.mode, mesh.vertexIndexBufferNumItems, gl.UNSIGNED_SHORT, 0);
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
