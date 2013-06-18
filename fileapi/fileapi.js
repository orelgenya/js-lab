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
    var file = evt.target.result;
    console.log("loaded "+file.byteLength);

    var blend = new BlenderReader(file);
    blend.read();
    //console.log(blend);
    var s = blend.dna.structures;
    var t = blend.dna.types;
    var tl = blend.dna.typeLengths;
    for(var i in s){
        var tname = t[s[i].type];
        if(tname.indexOf("Mesh") != -1){
            console.log(t[s[i].type]);

        }
    }
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
            this.dna = this.readDNA(bhead);
        }else if(bhead.code == "ENDB"){
            notENDB = false;
        }
        this.offset += bhead.size;
        this.blocks.push(bhead);
    }
}
BlenderReader.prototype.readHeader = function(){
    var h = new Uint8Array(this.file, 0, 12);
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
    var code = new Uint8Array(this.file, pos, 4); pos += 4;
    bhead.code = String.fromCharCode.apply(null, code);

    var size = new Uint32Array(this.file, pos, 1); pos += 4;
    bhead.size = size[0];

    var pointer = new Uint8Array(this.file, pos, this.pointerSize); pos += this.pointerSize;
    bhead.pointer = pointer;

    var buf = new Uint32Array(this.file, pos, 2);
    bhead.index = buf[0];
    bhead.num = buf[1];

    this.offset += this.blockHeaderSize;
    return bhead;
}
BlenderReader.prototype.readDNA = function(bhead){
    var pos = this.offset;
    var dna = {names:[],types:[],typeLengths:[],structures:[]};
    var sdnaname = new Uint8Array(this.file, pos, 8); pos += 8;
    dna.SDNANAME = String.fromCharCode.apply(null, sdnaname);

    // parseNames
    pos = readStrings0(this.file, pos, this.offset + bhead.size - pos, dna.names);
    pos = allign(pos, 4);

    // parseTypes
    var type = new Uint8Array(this.file, pos, 4); pos += 4;
    dna.TYPE = String.fromCharCode.apply(null, type);
    pos = readStrings0(this.file, pos, this.offset + bhead.size - pos, dna.types);
    pos = allign(pos, 4);

    var tlen = new Uint8Array(this.file, pos, 4); pos += 4;
    dna.TLEN = String.fromCharCode.apply(null, tlen);

    tlen = dna.types.length;
//    var tlens = new Uint8Array(this.file, pos, 2*tlen);
    var tlens = new Uint16Array(this.file, pos, 32);
    for(var i = 0; i < tlen; i++){
        dna.typeLengths.push(tlens[i]);
    }
    pos += 2*tlen;
    pos = allign(pos, 4);

    // parseStructures
    var strc = new Uint8Array(this.file, pos, 4); pos += 4;
    dna.STRC = String.fromCharCode.apply(null, strc);

    var snum = new Uint32Array(this.file, pos, 1)[0]; pos += 4;
    for(var i = 0; i < snum; i++){
        var struct = {fields:[]};
        var buffer = new Uint16Array(this.file, pos, 2);
        struct.type = buffer[0]; pos += 2;
        var fnum = buffer[1]; pos += 2;
        var fields = new Uint16Array(this.file, pos, 2*fnum);
        for(var j = 0; j < fnum; j++){
            struct.fields.push({
                typeIndex: fields[2*j],
                nameIndex: fields[2*j+1]
            });
        }
        dna.structures.push(struct);
        pos += 4*fnum;
    }

    return dna;
}

function readStrings0(file, pos, maxLength, array){
    var num = new Uint32Array(file, pos, 1)[0];
    pos += 4; maxLength -= 4;

    var buffer = new Uint8Array(file, pos, maxLength);
    var offset = 0;
    for(var i = 0; i < num; i++){
        var value = readString0(buffer, offset);
        array.push(value);
        offset += value.length + 1;
    }
    return pos + offset;
}

function readString0(buffer, pos){
    if(pos >= buffer.length) return null;
    var end = pos;
    while(buffer[end] != 0){
        end++;
    }
    return String.fromCharCode.apply(null, buffer.subarray(pos, end));
}

function parseUnsignedShort(){

}

function allign(offset, i) {
    while (offset%i != 0) {
        offset++;
    }
    return offset;
}

function readString(file, size, updatePos){
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