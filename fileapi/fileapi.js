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

//    var x = new Uint8Array(file, 0, file.byteLength);
//    console.log(x);
    var blend = new BlenderReader(file);
    blend.read();
    console.log(blend);
    // xhr.send(fileString)
}

BlenderReader = function(file){
    this.file = file;
    this.blocks = [];
    this.offset = 0;
}
BlenderReader.prototype.read = function(){
    this.readHeader();
    var notENDB = true;
    var bhead;
    while(notENDB){
        bhead = this.readFileBlockHeader();
        if(bhead.code == "DNA1"){
            //this.readDNA();
        }else if(bhead.code == "ENDB"){
            notENDB = false;
        }
        this.offset += bhead.size;
        this.blocks.push(bhead);
        console.log(bhead.code);
    }
}
BlenderReader.prototype.readHeader = function(){
    var h = new Uint8Array(file, 0, 12);
    this.version = String.fromCharCode.apply(null, h);
    this.pointerSize = this.version.charAt(7);
    if(this.pointerSize == '_') this.pointerSize = 4;
    else if(this.pointerSize = '-') this.pointerSize = 8;
    else throw 'Unexpected psize: '+this.pointerSize;
    this.blockHeaderSize = 16 + this.pointerSize;
    this.offset = 12;
}
BlenderReader.prototype.readFileBlockHeader = function(){
    var pos = this.offset;
    var bhead = {};
    var code = new Uint8Array(file, pos, 4); pos += 4;
    bhead.code = String.fromCharCode.apply(null, code);

    var size = new Uint32Array(file, pos, 1); pos += 4;
    bhead.size = size[0];

    var pointer = new Uint8Array(file, pos, this.pointerSize); pos += this.pointerSize;
    bhead.pointer = pointer;

    var buf = new Uint32Array(file, pos, 2);
    bhead.index = buf[0];
    bhead.num = buf[1];

    this.offset += this.blockHeaderSize;
    return bhead;
}
BlenderReader.prototype.readDNA = function(){
    var pos = this.offset;
    var dna = {};
    var name = new Uint8Array(file, pos, 8); pos += 8;
    dna.name = String.fromCharCode.apply(null, name);

    var num = new Uint32Array(file, pos, 1); pos += 4;
    dna.num = num[0];

    for(var i = 0; i < dna.num; ){

    }

    var pointer = new Uint8Array(file, pos, blend.pointerSize); pos += blend.pointerSize;
    bhead.pointer = pointer;

    var buf = new Uint32Array(file, pos, 2); pos += 8;
    bhead.index = buf[0];
    bhead.num = buf[1];

    this.offset += this.blockHeaderSize;
    return bhead;
}

function readString(size, updatePos){
    var code = new Uint8Array(file, pos, size);
    if(updatePos) pos += size;
    return String.fromCharCode.apply(null, code);
}

function errorHandler(evt) {
    if(evt.target.error.name == "NotReadableError") {
        // The file could not be read
        console.log("error");
        console.log(evt.target.error);
    }
}