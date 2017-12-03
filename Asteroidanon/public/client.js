var socket;
var canvas;
var flyingObjects = [];
var scores;
var el;
var input = {
  boosting  :   false,
  clock     :   false,
  counter   :   false,
  fire      :   false
};
// Using the P5 Javascript library
function setup() {
    //Set up the Canvas
    canvas = createCanvas(1000,800);
    canvas.parent('canvas-holder');
    el = document.getElementById('servertime');
    drawingEl = document.getElementById('drawingnotes');
    scores = document.getElementById('scoreTable');
    //create a socket
    socket = io();
    //TEST FUNCTION, Basic Sockets
    socket.on('time', function(timeString) {
        el.innerHTML = 'Server time: ' + timeString;
    });
    //Updates the Client flying object data
    socket.on('render', function(data) {
        //el.innerHTML = 'Flying Object: X:' + data[0].x + ", Y:" + data[0].y ;
        flyingObjects = data;
    });
    //Udates the scores
    socket.on('scores', function(data) {
        //loads a table
        scores.innerHTML = data;
    });
}
// Using the P5 Javascript library
function draw() {
    background(0);
    //Flying Objects
    for (var i = 0; i < flyingObjects.length; i++) {
        render(flyingObjects[i]);
    }
}
//DYNAMIC DISPLAY FUNCTIONS
function render(toRender){
//drawingEl.innerHTML = "Trying To Render type: " + toRender.type;
    switch(toRender.type){
        //SHIP
        case 0:     push();
                    translate(toRender.x, toRender.y);
                    rotate(toRender.direction + PI / 2);
                    fill(0);
                    stroke(255);
                    triangle(-toRender.radius, toRender.radius, toRender.radius, toRender.radius, 0, -toRender.radius);
                    //drawingEl.innerHTML = "Debug msg here";
                    pop();break;
        //LASER
        case 1:     push();
                    translate(toRender.x, toRender.y);
                    rotate(toRender.direction + PI / 2);
                    fill(0);
                    stroke(255);
                    line(0,0,0,-toRender.radius);
                    //drawingEl.innerHTML = "rendered LASER";
                    pop();break;
        //ASTEROID
        case 2:     push();
                    translate(toRender.x, toRender.y);
                    rotate(toRender.direction + PI / 2);
                    fill(0);
                    stroke(255);
                    beginShape(); //TESTING SQUARE 1ST
                    for (var i = 0; i < toRender.sides; i++) {
                      var angle = map(i, 0, toRender.sides, 0, TWO_PI);
                      var r = toRender.radius + toRender.ridges[i];
                      var x = r * cos(angle);
                      var y = r * sin(angle);
                      vertex(x, y);
                    }
                    endShape(CLOSE);
                    //drawingEl.innerHTML = "rendered Asteroid";
                    pop();break;
    }
}
//Listen for User Input
var keymap = {};
$(document).ready(function(){
    $(document).keydown(function(event){ 
        keyChanged(event);
    });
    $(document).keyup(function(event){ 
        keyChanged(event);
    });
});
//Act on change in input
function keyChanged(event) {
    keymap[event.key] = event.type == 'keydown';
    
    if(keymap[' ']){
        //stops downward browser scrolling
        event.preventDefault();    
    }
    input.fire = keymap[' '];
    input.boosting = keymap['w'];
    input.counter = keymap['a'];
    input.clock = keymap['d'];
    //Input is ready to send
    updateInput();
}
//Update input, sends input data to server
function updateInput(){
    socket.emit('inputchange', input);
}
