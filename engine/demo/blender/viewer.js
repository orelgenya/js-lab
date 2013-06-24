var gl;
function startViewer(){
    var g = new Engine({
        canvasId: "canvas"
    });
    g.drawScene();

    var meshes;
    FM.init({
        id: "file",
        onprogress: function(e){
            if (e.lengthComputable) {
                var loaded = (e.loaded / e.total);
                var bar = document.getElementById('bar');
                bar.style.width = (loaded < 1) ? (loaded * 200) + "px" : "200px";
            }
        },
        onerror: function(e){
            if(e.target.error.name == "NotReadableError") {
                console.log("error");
                console.log(e.target.error);
            }
        },
        onload: function(e){
            var file = e.target.result;
            console.log("loaded "+file.byteLength);
            var blend = new BlenderReader(file);
            blend.read();


            blend.logBlocksCount();

            var objects = blend.readBlocks('OB');
            console.log(objects);
            var map = {}, structs = [], tree = [];
            for(var i in objects){
                var o = objects[i];
                map[o.pointer] = objects[i];
                for(var j in o.structs){
                    structs.push(o.structs[j]);
                }
            }
            for(var i in structs){
                var s = structs[i];
                if(!s['*parent']) {
                    tree.push(s)
                    console.log(i + ' - '+s['id']['name[66]'] + ' - Parent!');
                } else
                    console.log(i + ' - '+s['id']['name[66]']);
            }
            meshes = extractMeshes(structs);

            for(var i in blend.blocks){
                var b = blend.blocks[i];
                if(b.code.indexOf('OB') == 0){
                    console.log(b.pointer + ' -> ' + b.structs[0]['id']['name[66]']);
                }
            }

            var mn = document.getElementById("mesh_num");
            mn.innerHTML = meshes.length;
            var scene = {meshes: meshes};
            g.drawScene(scene);

            var objects = blend.readStructsByBlockCode('SC');
            console.log(objects);
            var base = objects[0]['base'];
            var idx = blend.findBlockIndexByPointer(base['*next']);
            console.log(idx);
        }
    });

    var m = document.getElementById("mesh");
    m.addEventListener('keypress', function(e){
        if(e.which == 13){
            var m = document.getElementById("mesh");
            var scene = {};
            if(m.value){
                scene.meshes = [];
                var x = m.value.split(',');
                for(var i = 0; i < x.length; i++){
                    var z = meshes[x[i]];
                    if(!z) z = map[x[i]];
                    if(z) scene.meshes.push(z);
                }
            } else scene.meshes = meshes;
            g.drawScene(scene);
        }
    }, false);
}

var map = {};
function extractMeshes(objects){
    for(var i in objects){
        map[objects[i]['id']['name[66]']] = {};
    }
    var id, pid;
    var obj, mesh, mvert, medge, co, e;
    var res = [], resmesh, vertices, indexes;
    for(var i in objects){
        id = objects[i]['id']['name[66]'];
        if(objects[i]['*parent'])
            pid = objects[i]['*parent']['id']['name[66]'];
        else pid = null;

        obj = objects[i];
        mesh = obj['*data'];
        if(!mesh) continue;
        mvert = mesh['*mvert'];
        medge = mesh['*medge'];
        if(!medge) continue;
        vertices = [];
        indexes = [];
        for(var j in mvert){
            co = mvert[j]['co[3]'];
            vertices.push(co[0], co[1], co[2]);
        }
        for(var j = 0; j < medge.length; j++){
            e = medge[j];
            indexes.push(e.v1);
            indexes.push(e.v2);
        }
        map[id].vertices = vertices;
        map[id].indexes = indexes;
        map[id].loc = obj['loc[3]'];
        map[id].rot = obj['rot[3]'];
        map[id].id = id;
        map[id].color = [0.84, 0.86, 0.89   ,1.0];
        if(!pid) res.push(map[id]);
        else {
            var pmesh = map[pid];
            if(!pmesh.submesh) pmesh.submesh = [];
            pmesh.submesh.push(map[id]);
            map[id].parent = pmesh;
        }
    }
    return res;
}

FM = {
    init: function(c){
        this.c = c;
        if(!this.checkApiSupport()){
            alert('The File APIs are not fully supported in this browser.');
            return;
        }
        var self = this;
        document.getElementById(c.id).addEventListener('change', function(e){
            self.handleFileSelect.call(self, e)}, false);
    },
    checkApiSupport: function(){
        return (window.File && window.FileReader && window.FileList && window.Blob);
    },
    handleFileSelect: function(e){
        var files = e.target.files;
        for (var i = 0, f; f = files[i]; i++) {
            console.log(escape(f.name), ' (', f.type || 'n/a', ') - ',
                f.dataSize, ' bytes, last modified: ', f.lastModifiedDate.toLocaleDateString());
            this.readFile(f);
        }
    },
    readFile: function(f){
        var reader = new FileReader();

        // Handle progress, success, and errors
        reader.onprogress = this.c.onprogress;
        reader.onload = this.c.onload;
        reader.onerror = this.c.onerror;

        // Read file into memory as UTF-16
        //reader.readAsText(readFile, "UTF-16");
        reader.readAsArrayBuffer(f);
    }
};