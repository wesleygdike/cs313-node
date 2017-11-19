'use strict';

const express = require('express');
const http = require('http');
const app = express();


// Activate the server to listen
app.set('port', (process.env.PORT || 5000));
// Set static directory to public
app.use(express.static(__dirname + '/public'));
const server = app.listen(app.get('port'), function() {
  console.log('AsteroidanonTestEnv app is running on port', app.get('port'));
});

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Landing Page
app.get('/', function(request, response) {
    console.log("Received Request");
  response.render('pages/index');
});

// WEB SOCKETS
const io = require('socket.io').listen(server);
// Register a callback function run when a new connection connects
var FlyingObject = require('./flyingObject');
//Array to which we will assign our flying object data
var flyingObjects = [];
//Array of users for handling input
var users = [];
//When a new connection is established
io.on('connection', (socket) =>{
    console.log('a user connected');
    //create a user object for each connection
    var user = {
        score : 0,
        ship : new FlyingObject(500, 750, 10, 161.79, 0 ,0 , 0, 0),
        input : {
            boosting    :   false,
            turn        :   0,
            fire        :   false
        }, 
        reloaded : false,
        fire : function(){
            var laser = new FlyingObject(
                        //place the laser at the tip of the ship
                        user.ship.x + (Math.cos(this.ship.direction) * this.ship.radius),   //x
                        user.ship.y + (Math.sin(this.ship.direction) * this.ship.radius),   //y
                        4,                                                                  //radius
                        user.ship.direction,                                                //direction
                        //add on velocity.. becuase lasers are faster than most ships
                        user.ship.velocityX + Math.cos(this.ship.direction) * 4,            //velocityX  
                        user.ship.velocityY + Math.sin(this.ship.direction) * 4,            //y velocictY
                        0,                                                                  //rotation
                        1);                                                                 //type
            //pass a ref to the user that fired the laser
            laser.user = user;
            //at some point lasers defuse and can do no more damage
            laser.framestilldeath = 100;
            laser.update = function() {
                    if (this.framestilldeath-- > 0){
                        this.alterDirection(this.rotation);
                        this.alterPosition(this.velocityX, this.velocityY);
                    } else {this.kill();}
                };
            //handle laser on hit events
            laser.hit = function(points) {
                this.photons.kill();
                this.user.score += points;
            };
            return laser;
        },
        shipid : 0,
        id : 0
    };
    //add the users ship to the data and get the index/id
    user.shipid = flyingObjects.push(user.ship);
    //add user to array for later use
    user.id = users.push(user);
    //When user disconnects
    socket.on('disconnect', function(){
      console.log('user disconnected');
      //remove that user and ship from the game
      flyingObjects.splice(user.shipid, 1);
      users.splice(user.id, 1);
    });
    //When user changes their input values
    socket.on('inputchange', function(data){
        //console.log('User: ' + user.id + 'changed their input');
        //update user input values
        user.input.boosting = data.boosting;
        user.input.clock = data.clock;
        user.input.counter = data.counter;
        user.input.fire = data.fire;
    });
});

//setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

//This is the main loop... well... it is kinda like a loop
setInterval(gameLoop, 30);

function gameLoop(){
    //update ship velocities due to input
    handleInput();
    //update flying objects
    update();
    //push the update to the clients
    render();
}

function handleInput(){
    for(var i = 0; i < users.length; i++){
        //update ship velocities
        if(users[i].input.boosting){
            users[i].ship.boost();
        }
        users[i].ship.setRotation(0);
        if(users[i].input.clock){
            users[i].ship.alterRotation(.1);
        }   
        if(users[i].input.counter){
            users[i].ship.alterRotation(-.1);
        }   
        //arm or disarm the laser cannons
        if(users[i].input.fire){
            if(users[i].reloaded){
                users[i].reloaded = false;
                //create a laser in the direction of the ship
                var laser = users[i].fire();
                //laser.photons.type = 1;
                flyingObjects.push(laser);
                console.log('User: ' + i + ' is getting their PEW PEW on: ' + laser.type);
            }
        } else { users[i].reloaded = true; }
    }
}

function update() {
    //console.log('Updating environment');
    //apply input changes move everything
    for (var i = 0; i < flyingObjects.length; i++) {
        if(flyingObjects[i].isAlive){
            flyingObjects[i].update();
        } else { flyingObjects.splice(i, 1); }
    }
}

function render(){
    //console.log('Sending flying Objects: ' + flyingObjects.length);
    io.emit('render', flyingObjects);
}

