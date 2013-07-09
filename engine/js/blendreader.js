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
    this.version = readString0(h, 0);
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
    bhead.code = readString0(code, 0);

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
    dna.SDNANAME = readString0(sdnaname, 0);

    // parseNames
    pos = readStrings0(this.file, pos, this.offset + bhead.dataSize - pos, dna.names);
    pos = allign(pos, 4);

    // parseTypes
    var type = new Uint8Array(this.file, pos, 4); pos += 4;
    dna.TYPE = readString0(type, 0);
    pos = readStrings0(this.file, pos, this.offset + bhead.dataSize - pos, dna.types);
    pos = allign(pos, 4);

    var tlen = new Uint8Array(this.file, pos, 4); pos += 4;
    dna.TLEN = readString0(tlen, 0);

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
    dna.STRC = readString0(strc, 0);

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
BlenderReader.prototype.logBlocksCount = function(){
    var blocks = {};
    for(var b in this.blocks){
        var code = this.blocks[b].code;
        if(!blocks[code]){
            blocks[code] = 1;
        } else blocks[code]++;
    }
    for(var code in blocks){
        console.log(code + "[" + blocks[code]+"]");
    }
};
BlenderReader.prototype.logBlockData = function(code){
    for(var b in this.blocks){
        if(this.blocks[b].code == code){
            console.log(this.blocks[b]);
        }
    }
};
BlenderReader.prototype.readData = function(){
    for(var i in this.blocks){
        this.readBlock(this.blocks[i]);
    }
};
BlenderReader.prototype.readBlock = function(b){
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
};
BlenderReader.prototype.readMeshes = function(){
    return this.readStructsByBlockCode('ME');
};
BlenderReader.prototype.readStructsByBlockCode = function(code){
    var blocks = [];
    for(var i in this.blocks){
        var b = this.blocks[i];
        if(b.code == code){
            this.readBlock(b);
            this.resolvePointersForBlock(i);
            for(var s in b.structs){
                blocks.push(b.structs[s]);
            }
        }
    }
    return blocks;
};
BlenderReader.prototype.readBlocks = function(code){
    var blocks = [];
    for(var i in this.blocks){
        var b = this.blocks[i];
        if(b.code == code){
            this.readBlock(b);
            this.resolvePointersForBlock(i);
            blocks.push(b);
        }
    }
    return blocks;
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
                        fvalue = readString0(buffer, 0);
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
        try{
            var num = new bufType(this.file, this.offset, 1);
            this.offset += elSize;
            return num[0];
        }catch(e){
            console.log(e);
            this.offset += elSize;
            return null;
        }
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
            for(var i = 0; i < arrSize; i++){
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
BlenderReader.prototype.findBlockIndexByPointer = function(pointer){
    var b = this.blocks;
    for(var i in b){
        if(b[i].pointer == pointer) return i;
    }
    return null;
};
BlenderReader.prototype.findBlockIndexByCode = function(code){
    var b = this.blocks;
    for(var i in b){
        if(b[i].code == code) return i;
    }
    return null;
};
BlenderReader.prototype.resolvePointersForBlock = function(idx, cache){
    if(!cache) cache = [];
    cache[idx] = 1;
    var b = this.blocks[idx];
    for(var i in b.structs){
        var s = b.structs[i];
        for(var j in s){
            if(j.indexOf('*') != -1) {
                idx = this.findBlockIndexByPointer(s[j]);
                if(idx){
                    var v = this.blocks[idx];
                    if(!v.structs) this.readBlock(v);
                    if(!cache[idx]){
//                        console.log('resolve for b['+idx+'] = '+ v.code);
                        this.resolvePointersForBlock(idx, cache);
                    }
                    if(!v.structs || v.structs.length == 0) s[j] = null;
                    else if(v.structs.length == 1) s[j] = v.structs[0];
                    else{
                        s[j] = v.structs;
                    }
                }
            }
        }
    }
    return b;
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
    while(buffer.length > end && buffer[end] != 0){
        end++;
    }
    return String.fromCharCode.apply(null, buffer.subarray(pos, end));
}

function allign(offset, i) {
    while (offset%i != 0) {
        offset++;
    }
    return offset;
}

function errorHandler(evt) {
    if(evt.target.error.name == "NotReadableError") {
        // The file could not be read
        console.log("error");
        console.log(evt.target.error);
    }
}