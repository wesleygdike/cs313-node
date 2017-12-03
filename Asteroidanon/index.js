'use strict';
const ejs = require('ejs');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
var expressSession = require('express-session')({secret: 'asteroidanon', saveUninitialized: true, resave: true});
var sharedsession = require("express-socket.io-session");
const app = express();
//const { Client } = require('pg');


// Activate the server to listen
app.set('port', (process.env.PORT || 5000));
// Set static directory to public
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(expressSession);
const server = app.listen(app.get('port'), function() {
  console.log('AsteroidanonTestEnv app is running on port', app.get('port'));
});
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Landing Page
app.get('/', function(request, response) {
    console.log("Received Request");
  //response.render('pages/index'); TESTING LOGIN PAGE
    response.render('pages/login'); 
});

// Landing Page
app.post('/login', function(request, response) {
    console.log("Received login Request: " + request.body.username);
    request.session.user = {
        id : count++,
        name: request.body.username
    };

  //response.render('pages/index'); TESTING LOGIN PAGE
    response.render('pages/asteroidanon');
});

// WEB SOCKETS
const io = require('socket.io').listen(server);
io.use(sharedsession(expressSession, {autosave: true}));
// Register a callback function run when a new connection connects
var FlyingObject = require('./flyingObject');
//TESTING COUNT
var count = 0;
var name = 'test';
//Array to which we will assign our flying object data
var flyingObjects = [];
//Array of users for handling input
var users = [];
//When a new connection is established
io.on('connection', (socket) =>{
    console.log('a user connected');
    //create a user object for each connection
    var user = socket.handshake.session.user;
    user.score = 0;
    user.ship = new FlyingObject(500, 750, 10, 161.79, 0 ,0 , 0, 0);
    user.input = {
            boosting    :   false,
            turn        :   0,
            fire        :   false
        };
    user.reloaded = false,
    user.fire = function(){
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
                this.kill();
                this.user.score += points;
            };
            return laser;
        };
    //add the users ship to the data and get the index/id
    console.log('Assigning Ship: ' + JSON.stringify(user.ship));
    flyingObjects.push(user.ship);
    //add user to array for later use
    console.log('Assigning User: ' + user.name + user.id);
    users.push(user);
    //initiate scare tables
    updateScores();
    //When user disconnects
    socket.on('disconnect', function(){
            console.log('user: ' + user.name + user.id + ' disconnected');
            //remove that user and ship from the game
            var tempShipID = flyingObjects.splice(flyingObjects.indexOf(user.ship), 1);
            console.log('ship: ' + tempShipID[0].id + ' removed');
            var tempUserID = users.splice(users.indexOf(user), 1);
            console.log('user: ' + tempUserID[0].id + ' removed');
            //update Scores
            updateScores();
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
setInterval(dropRocks, 1000);

function gameLoop(){
    //update ship velocities due to input
    handleInput();
    //update flying objects
    update();
    //bring out your dead
    burrythedead();
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
    var Astrolist = [];
    var Laserlist = [];
    //console.log('Updating environment');
    //apply input changes move everything
    for (var i = 0; i < flyingObjects.length; i++) {
        if(flyingObjects[i].isAlive){
            //apply input changes move everything
            //console.log('Updating FlyingObject: ' + i);
            flyingObjects[i].update();
            //if we got an Asteroid add the index to the asteroid list
            if(flyingObjects[i].type == 2){
                //console.log('Adding FlyingObject: ' + i + 'to Astrolist');
                Astrolist.push(i);
            //if we got an Laser add the index to the laser list    
            } else if(flyingObjects[i].type == 1){
                //console.log('Adding FlyingObject: ' + i + 'to Laserlist');
                Laserlist.push(i);
            }
        //remove the undead    
        }
    }
    //collisions
    //Asteroids
    for (var i = 0; i < Astrolist.length; i++){
        var asteroid = flyingObjects[Astrolist[i]];
        //console.log('Ckecking collision on FlyingObject: ' + i);
        if(asteroid.isAlive){
            for(var j = 0; j < Math.max(Laserlist.length, users.length); j++){
                //Vrs Lasers 
                if(j < Laserlist.length){
                    if(flyingObjects[Laserlist[j]].isAlive && 
                        collision(asteroid, flyingObjects[Laserlist[j]])){
                        //We have a Laser collision with this Asteroid
                        //kill the Asteroid and the Laser while handling score
                        console.log('Collision between Laser & Asteroid, add score to: ' + flyingObjects[Laserlist[j]].user.id);
                        flyingObjects[Laserlist[j]].hit(asteroid.kill());
                        updateScores(); //CHANGE TO AN EJS 
                        continue;
                    }
                }
                //Vrs Ships
                if(j < users.length){
                    if(users[j].ship.isAlive && 
                        collision(asteroid,users[j].ship)){
                        //We have a Laser collision with this Asteroid
                        //kill the Asteroid and the Ship
                        console.log('Collision between Ship & Asteroid');
                        asteroid.kill();
                        //HANDLE GAME OVER CODE HERE
                        users[j].ship.kill();
                        updateScores();
                        continue;
                    }
                }
            }
        }
    }
}

function burrythedead(){
    //console.log('Burrying the dead');
    for (var i = 0; i < flyingObjects.length; i++) {
        if(!flyingObjects[i].isAlive){
            //remove the undead    
            console.log('Burrying the dead@: ' + i);
            flyingObjects.splice(i,1);
        } 
    }
}

function render(){
    //console.log('Sending flying Objects: ' + flyingObjects.length);
    io.emit('render', Array.from(flyingObjects));
}

function dropRocks(){
    console.log('Dropping Rocks');
    function TheAllOverer(max) {
        var randomized = Math.random() * max;
        if(Math.floor(Math.random() * 10)%2 == 0){
            randomized *= -1;
        }
        return randomized;
    };
    var newRock = new FlyingObject(
            500,                                //X
            400,                                //Y
            11,                                 //Radius
            TheAllOverer(361),                  //Direction
            TheAllOverer(1),                   //VelocityX
            TheAllOverer(1),                    //VelocityY
            .02,                                //Rotation
            2                                   //Type
            );
    //console.log('Created new Rock');
    
    //how many sides will the asteroid have?
    newRock.sides = Math.floor(Math.random() * 10 + 5);
    //console.log('Gave that rock ' + newRock.sides + ' sides');
    
    //give the asteroid a ridged apperance
    newRock.ridges = [];
    newRock.setRidges = function(){
            for(var i = 0; i < this.sides; i++){
                newRock.ridges.push(Math.random() * newRock.radius);
                //console.log('added asteroid ridge with value of: ' + newRock.ridges[i]);
            }
        };
    newRock.setRidges();
    //console.log('Gave that rock ridges');
    
    //point value of the rock
    newRock.pointValue = 1;
    //override kill method
    newRock.kill = function () {
      this.isAlive = false;
      return this.pointValue;
    };
    newRock.TheAllOverer = TheAllOverer;
    
    flyingObjects.push(newRock);
}

function collision(fObj1, fObj2){
    var dx = fObj1.x - fObj2.x;
    var dy = fObj1.y - fObj2.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < fObj1.radius + fObj2.radius) {
        //collision detected!
        return true;
    }else{
        //no collision
        return false;
    }
}

function updateScores(){
    app.render('partials/score_table', { users: users }, 
    function(err, html){
        console.log(html);
        io.emit('scores', html);
    });
}

/*
 * DATA STORE
 */
/*const dataStore = () => {
  client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    }),
//returns users
  getUsers = function() {
      var users = {};
      this.client.connect();
        client.query('SELECT * FROM astro_users;', (err, res) => {
          if (err) throw err;
          for(let row of res.rows){
              console.log(JSON.stringify(row));
          }
          client.end();
        });
        return users;
    };
 //insert new user
  addUser = function() {
      var users = {};
      this.client.connect();
        client.query('SELECT * FROM astro_users;', (err, res) => {
          if (err) throw err;
          users = res.rows;
          client.end();
        });
        return users;
    };
 //reuturns high scores
  getScores = function() {
      var scores = {};
      this.client.connect();
        client.query('SELECT * FROM high_scores;', (err, res) => {
          if (err) throw err;
          for(let row of res.rows) {
             //foreach logic
          }
          client.end();
        });
        return scores;
    };
};
*/