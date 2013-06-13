function test(){
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
    document.getElementById('file').addEventListener('change', handleFileSelect, false);
    getAsText("../READ");
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    // files is a FileList of File objects. List some properties.
    for (var i = 0, f; f = files[i]; i++) {
        console.log('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
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
    file = evt.target.result;
    console.log("loaded "+file.byteLength);
    readHeader();
    readFileBlock();
    console.log(blend);
    // xhr.send(fileString)
}
var file;
var pos = 0;
var blend = {blocks:[]};
function readHeader(){
    var h = new Uint8Array(file, 0, 12);
    blend.version = String.fromCharCode.apply(null, h);
    blend.psize = blend.version.charAt(7);
    if(blend.psize == '_') blend.psize = 4;
    else if(blend.psize = '-') blend.psize = 8;
    else throw 'Unexpected psize: '+blend.psize;
}
function readFileBlock(){
    var block = {};
    var code = new Uint8Array(file, pos, 4); pos += 4;
    block.code = String.fromCharCode.apply(null, code);

    var size = new Uint32Array(file, pos, 1); pos += 4;
    block.size = size[0];

    var pointer = new Uint8Array(file, pos, blend.psize); pos += blend.psize;
    block.pointer = pointer;

    var buf = new Uint32Array(file, pos, 2); pos += 8;
    block.index = buf[0];
    block.num = buf[1];
    blend.blocks.push(block);
}

function errorHandler(evt) {
    if(evt.target.error.name == "NotReadableError") {
        // The file could not be read
        console.log("error");
        console.log(evt.target.error);
    }
}