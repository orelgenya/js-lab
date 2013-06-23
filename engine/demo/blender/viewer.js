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
            meshes = extractMeshes(objects);
            for(var i in objects) console.log(i + ' - '+objects[i]['id']['name[66]']);

            var mn = document.getElementById("mesh_num");
            mn.innerHTML = meshes.length;
            var scene = {meshes: meshes};
            g.drawScene(scene);


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
                    if(x[i] < meshes.length)
                        scene.meshes.push(meshes[x[i]]);
                }
            } else scene.meshes = meshes;
            g.drawScene(scene);
        }
    }, false);
}

function extractMeshes(objects){
    var obj, mesh, mvert, medge, co, e;
    var res = [], vertices, indexes;
    for(var i in objects){
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
        res.push({vertices:vertices, indexes:indexes, loc:obj['loc[3]']});
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