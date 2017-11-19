
module.exports = FlyingObject;
function FlyingObject(x, y, rd, d, vx, vy, rt, type) {
    this.x = x;
    this.y = y;
    this.radius = rd;
    this.direction = d;
    this.rotation = rt;
    this.velocityX = vx;
    this.velocityY = vy;
    this.isAlive = true;
    this.type = type;
    
    /*
     * Mutators
     */
    //ROTATION
    this.alterRotation = function(changeBy) {
        this.rotation += changeBy;
    };
    
    this.setRotation = function(setTo){
        this.rotation = setTo;
    };
    //DIRECTION
    this.alterDirection = function(changeBy) {
        this.direction += changeBy;
        if (this.direction > 360){
            this.direction -= 360;
        } else if (this.direction < 0) {
            this.direction += 360;
        }
    };
    
    this.setDirection = function(setTo){
        this.alterDirection(setTo - this.direction);
    };
    //VELOCITY
    this.alterVelocity = function(x, y) {
        this.velocityX += x;
        this.velocityY += y;
    };
    
    this.setVelocity = function(x, y) {
        this.velocityX = x;
        this.velocityY = y;
    };

    //POSITION
    this.alterPosition = function(x, y) {
        this.x += x;
        this.y += y;        
    };
    
    this.setPosition = function(x, y) {
        this.x = x;
        this.y = y;
    };

    //RADIUS
    this.alterRadius = function(changeBy) {
        this.radius += changeBy;
    };
    
    this.setRadius = function(setTo){
        this.radius = setTo;
    };
    //ISALIVE
    this.kill = function(){
        this.isAlive = false;
    };
    
    /*
     * Operation Functions
     */
    //BOOST
    this.boost = function(){
        var forcex = Math.cos(this.direction);
        var forcey = Math.sin(this.direction);
        var force = .2;
        this.alterVelocity(forcex * .2, forcey * .2);
    };
    //UPDATE
    this.update = function(){
      this.alterDirection(this.rotation);
      this.alterPosition(this.velocityX, this.velocityY);  
    };
    this.getType = function(){
        return this.type;
    };
};