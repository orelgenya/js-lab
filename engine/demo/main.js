requirejs.config({
    baseUrl: '../js'
});

requirejs(['engine'], function(engine){
    console.log('Hello from Demo app!');
    engine.init({
        id: 'game-canvas',
        //renderTo: 'game-box',
        width: '500',
        height: '500'
    });
});