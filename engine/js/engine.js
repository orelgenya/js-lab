define(function(require, exports, module){
    console.log('Hello from engine closure');
    function initCanvas(config){
        var parent = config.renderTo ? document.getElementById(config.renderTo) : document.body;
        if(!parent) throw "Parent node wasn't found!";
        var canvas = document.createElement('canvas');
        canvas.width = config.width ? config.width : 500;
        canvas.height = config.height ? config.height : 500;
        if(config.id) canvas.id = config.id;
        parent.appendChild(canvas);
        return canvas;
    }
    function initGL(canvas){
        var names = ["webgl", "experimental-webgl"];
        var context = null;
        for (var i=0; i < names.length; i++) {
            try {
                context = canvas.getContext(names[i]);
            } catch(e) {}
            if (context) {
                break;
            }
        }
        if (context) {
            context.viewportWidth = canvas.width;
            context.viewportHeight = canvas.height;
        } else {
            alert("Failed to create WebGL context!");
        }
        return context;
    }
    return {
         init: function(config){
             this.canvas = initCanvas(config);
             this.gl = initGL(this.canvas);
         }
    };
});