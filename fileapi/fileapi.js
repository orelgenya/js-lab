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
        this.offset += bhead.dataSize;
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
    bhead.dataSize = size[0];

    var buffer = new Uint32Array(this.file, pos, this.pointerSize/4); pos += this.pointerSize;
    var pointer = buffer[0].toString(16);
    if(buffer.length == 2) pointer += buffer[1].toString(16);
    bhead.pointer = pointer;

    var buf = new Uint32Array(this.file, pos, 2);
    bhead.sdnaIndex = buf[0];
    bhead.countOfStructures = buf[1];

    this.offset += this.blockHeaderSize;
    bhead.dataOffset = this.offset;
    return bhead;
}
BlenderReader.prototype.readDNA = function(bhead){
    var pos = this.offset;
    var dna = {names:[],types:[],typeLengths:[],structures:[]};
    var sdnaname = new Uint8Array(this.file, pos, 8); pos += 8;
    dna.SDNANAME = String.fromCharCode.apply(null, sdnaname);

    // parseNames
    pos = readStrings0(this.file, pos, this.offset + bhead.dataSize - pos, dna.names);
    pos = allign(pos, 4);

    // parseTypes
    var type = new Uint8Array(this.file, pos, 4); pos += 4;
    dna.TYPE = String.fromCharCode.apply(null, type);
    pos = readStrings0(this.file, pos, this.offset + bhead.dataSize - pos, dna.types);
    pos = allign(pos, 4);

    var tlen = new Uint8Array(this.file, pos, 4); pos += 4;
    dna.TLEN = String.fromCharCode.apply(null, tlen);

    tlen = dna.types.length;
//    var tlens = new Uint8Array(this.file, pos, 2*tlen);
    var tlens = new Uint16Array(this.file, pos, tlen);
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
};
BlenderReader.prototype.readData = function(){
    for(var i in this.blocks){
        var b = this.blocks[i];
        if(this.isSDNAFileBlock(b)){
//            console.log("************************");
//            console.log("reading block["+i+"] " + b.code);
//            console.log("************************");
            this.offset = b.dataOffset;
            b.structs = [];
            for(var j = 0; j < b.countOfStructures; j++){
//                console.log("--------------------");
//                console.log("reading structure " + this.dna.types[this.dna.structures[b.sdnaIndex].type]);
//                console.log("--------------------");
                var x = this.readStruct(b.sdnaIndex);
                b.structs.push(x);
//                console.log(x);
            }
        }
    }
};
BlenderReader.prototype.isSDNAFileBlock = function(bhead){
    switch(bhead.code){
        case 'REND':
        case 'DNA1':
        case 'ENDB':
            return false;
        default:
            return true;
    }
};
BlenderReader.prototype.readStruct = function(sdnaIndex){
    var x = {};
    var s = this.dna.structures[sdnaIndex];
    var typeLength = this.dna.typeLengths[s.type];
    var f = s.fields;
    var type = this.dna.types[s.type];
    var offset = this.offset;
    for(var j in f){
        var ftype = this.dna.types[f[j].typeIndex];
        var fname = this.dna.names[f[j].nameIndex];
        var fvalue;
        var arraySize = countArraySize(fname);
        if(fname.indexOf('*') != -1){
            fvalue = this.readPointers(arraySize);
        }else{
            switch(ftype){
                case 'char':
                case 'uchar':
                        if(arraySize == -1) arraySize = 1;
                        var buffer = new Uint8Array(this.file, this.offset, arraySize); this.offset += arraySize;
                        fvalue = String.fromCharCode.apply(null, buffer);
                        break;
                case 'short':
                        fvalue = this.readNumbers(Int16Array, 2, arraySize);
                        break;
                case 'ushort':
                        fvalue = this.readNumbers(Uint16Array, 2, arraySize);
                        break;
                case 'int':
                        fvalue = this.readNumbers(Int32Array, 4, arraySize);
                        break;
                case 'float':
                        fvalue = this.readNumbers(Float32Array, 4, arraySize);
                        break;
                case 'double':
                        fvalue = this.readNumbers(Float64Array, 8, arraySize);
                        break;
                case 'double':
                        fvalue = this.readNumbers(Float64Array, 8, arraySize);
                        break;
                case 'uint64_t':
                        if(arraySize == -1) arraySize = 1;
                        var temp = this.readNumbers(Uint32Array, 4, arraySize*2);
                        if(temp.length == 2){
                            fvalue = temp[0]*256 + temp[1];
                        }else{
                            fvalue = [];
                            for(var i = 0; i < fvalue.length; i += 2){
                                fvalue.push(fvalue[i]*256 + fvalue[i+1]);
                            }
                        }
                        break;
                case 'uint32_t':
                        fvalue = this.readNumbers(Uint32Array, 4, arraySize);
                        break;
                default:
//                        console.log("Reading "+ftype+" "+fname);
                        if(arraySize == -1) arraySize = 1;
                        for(var i = 0; i < arraySize; i++){
                            fvalue = this.readStruct(this.findStructIndexByTypeIndex(f[j].typeIndex));
//                            console.log(fvalue);
                        }
                        //throw "Unsupported type!";
                        break;
            }
        }
        x[fname] = fvalue;
    }
    if(offset + typeLength != this.offset)
        throw "Offset error: {start: " + offset + ", end: " + this.offset + ", length: "+typeLength +"}";
    s.data = x;
    return x;
};
function countArraySize(field){
    var i1 = field.indexOf('[');
    if(i1 == -1) return i1;
    var arraySize = 1;
    for(var i2; i1 != -1; ) {
        i2 = field.indexOf(']');
        arraySize *= parseInt(field.substring(i1+1, i2), 10);
        field = field.substring(i2+1);
        i1 = field.indexOf('[');
    }
    return arraySize;
};
BlenderReader.prototype.readNumbers = function(bufType, elSize, arrSize){
    if(arrSize == -1){
        var num = new bufType(this.file, this.offset, 1);
        this.offset += elSize;
        return num[0];
    } else {
        var bufSize = elSize * arrSize;
        var buffer = new bufType(this.file, this.offset, arrSize); this.offset += bufSize;
        var array = [];
        for(var i = 0; i < arrSize; i++){
            array.push(buffer[i]);
        }
        return array;
    }
};
BlenderReader.prototype.readPointers = function(arrSize){
    var intsCount = this.pointerSize/4;
    if(arrSize == -1){
        var buffer = new Uint32Array(this.file, this.offset, intsCount);
        this.offset += this.pointerSize;
        var pointer = buffer[0].toString(16);
        if(buffer.length == 2) pointer += buffer[1].toString(16);
        return pointer;
    } else {
        var bufSize = this.pointerSize * arrSize;
        var buffer = new Uint32Array(this.file, this.offset, intsCount*arrSize); this.offset += bufSize;
        var array = [];
        if(intsCount == 2){
            for(var i = 0; i < arrSize; i++){
                array.push(buffer[2*i].toString(16)+buffer[2*i+1].toString(16));
            }
        }else{
            for(var i = 0, pos = 0; i < arrSize; i++){
                array.push(buffer[i].toString(16));
            }
        }
        return array;
    }
};
BlenderReader.prototype.readValue = function(func, arrSize){
    if(arrSize == -1) return func();
    var array = [];
    for(var i = 0; i < arrSize; i++){
        array.push(func());
    }
    return array;
};
BlenderReader.prototype.findStructIndexByPointer = function(pointer){
    var blocks = this.blocks;
    for(var i in blocks){
        if(blocks[i].pointer == pointer) return blocks[i].sdnaIndex;
    }
    return null;
};
BlenderReader.prototype.findStructIndexByTypeIndex = function(type){
    var s = this.dna.structures;
    for(var i in s){
        if(s[i].type == type) return i;
    }
    return null;
};
BlenderReader.prototype.reviewStruct = function(typeName){
    var s = this.dna.structures;
    var n = this.dna.names;
    var t = this.dna.types;
    var tl = this.dna.typeLengths;
    var x = {};
    for(var i in s){
        var si = s[i];
        var type = t[si.type];
        if(type == typeName){
            var f = si.fields;
            for(var j in f){
                x[n[f[j].nameIndex]] = t[f[j].typeIndex];
            }
        }
    }
    var z = {};
    z[typeName] = x;
    return z;
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