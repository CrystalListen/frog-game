/*
 *
 * This file defines the various element classes in the game, including Enemy class and Player class.
 * Enemy class have two of subcategories, Obstacle and Treasure.
 *
 * The following is the inheritance structure of the class:
 *
 *  +-- Enemy
 *  |     |
 *  |     +-- Obstacle
 *  |     |
 *  |     +-- Treasure --+-- BlueGem
 *  |                    +-- GreenGem
 *  |                    +-- OrangeGem
 *  |                    +-- Heart
 *  |                    +-- Key
 *  |                    +-- Star
 *  |
 *  +-- Player
 *
*/

/* Enemy Class */
var Enemy = function(level) {
    this.level = level;
    this.initLocation();

    /* The image/sprite for our enemies, this uses
     * a helper we've provided to easily load images
     */
    this.sprite = 'images/enemy-bug.png';
};

/* Subclasses may need to reset coordinates in a variety of situations, not just when initializing */
Enemy.prototype.initLocation = function() {

    var col,row;

    col = 0;
    row = Math.floor(Math.random() * (Board.vericalCells-2))+1;
    this.x = Board.column(col);
    this.y = Board.row(row);

    /* The enemy's velocity range changes with the grade, 
     * and K is a factor that changes with the rank.
     */
    var k = 1;
    var baseSpeed = 36;
    if (this.level < 36) {
        baseSpeed = 36 + this.level * k;
    } else if (this.level < 72) {
        baseSpeed = 36 + 36 * 1 + (this.level - 36) * 0.95;
    } else if (this.level < 108) {
        baseSpeed = 36 + 36 * 1 + 36 * 0.95 + (this.level - 72) * 0.88;
    } else if (this.level < 144) {
        baseSpeed = 36 + 36 * 1 + 36 * 0.95 + 36 * 0.88 +
            (this.level - 108) * 0.77;
    } else {
        baseSpeed = 36 + 36 * 1 + 36 * 0.95 + 36 * 0.88 +
            36 * 0.77 + (this.level - 144) * 0.6;
    }
    this.speed = baseSpeed * (2 + Math.random() * 3);

};


/* Update the enemy's position, required method for game
 * Parameter: dt, a time delta between ticks
 */
Enemy.prototype.update = function(dt) {
    /* Variables applied to each of our instances go here,
     * we've provided one for you to get started
     */
    this.move(this.speed*dt,0);

    /* When the enemy runs off the right side of the screen,
     * reset it to the left side of the screen 
     */
    if (this.x > Board.cellWidth * Board.horizonCells) {
        this.initLocation();
    }
};

/*Collision Checking*/
Enemy.prototype.checkCollision = function(object){
    if(this.y !== object.y) return false;
    return  Math.abs(object.x-this.x)<=Board.collisionRadius;
}

/* Draw the enemy on the screen, required method for game*/
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x , this.y+10,80,122);
};

Enemy.prototype.move = function(x,y){
    this.x += x;
    this.y += y;
}

/* The Obstacle class is a subclass of the Enemy class, and its main feature
 * is that the player cannot move to the area where the barrier is located 
 */
var Obstacle = function() {
    Enemy.call(this);
    this.sprite = 'images/Rock.png';
};

Obstacle.prototype = Object.create(Enemy.prototype);
Obstacle.prototype.constructor = Obstacle;

/* We have corrected the size and location of the obstacle at the time of drawing*/
Obstacle.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 10, this.y,80,136);
};


Obstacle.prototype.initLocation = function() {

    var col,row;
    /* The following loops ensure that newly generated static elements
     * do not overlap with existing static elements or players.
     * Get the location information on the canvas through two-dimensional variable Controller.pavement
     */
     do {
        col = Math.floor(Math.random() * (Board.horizonCells-1));
        row = Math.floor(Math.random() * (Board.vericalCells-2))+1;
        this.x = Board.column(col);
        this.y = Board.row(row);
      } while (Controller.pavement[row][col] || this.checkCollision(player)
      );
     Controller.pavement[row][col] = 'Obstacle';
};

/* The Treasure class is also a subclass of Enemy classes that 
 * contain static elements such as gems, life characters, etc.
 * Players move to the grid and causes it to disappear, triggering the effect
 */
var Treasure = function() {
    Enemy.call(this);
};

Treasure.prototype = Object.create(Enemy.prototype);
Treasure.prototype.constructor = Treasure;

/* We have corrected the size and location of the obstacle at the time of drawing*/
Treasure.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 21, this.y+25,60,102);
};
Treasure.prototype.obtain = function(){};
Treasure.prototype.checkCollision = function(object){
    if(this.y !== object.y) return false;
    return  this.x === object.x;
};
Treasure.prototype.collisionDeal = function(){
    if(this.checkCollision(player)){

        /* Trigger to do operations*/
        this.obtain(); 

        /* delete this treasure*/
        var row = this.y / Board.cellHeight,
            col = this.x / Board.cellWidth;
        Controller.pavement[row][col] = false;
        allTreasure.remove(this);
    }
};
Treasure.prototype.initLocation = function() {

    var col,row;
    /* The following loops ensure that newly generated static elements
     * do not overlap with existing static elements or players.
     * Get the location information on the canvas through two-dimensional variable Controller.pavement
     */
    do {
        col = Math.floor(Math.random() * (Board.horizonCells-1));
        row = Math.floor(Math.random() * (Board.vericalCells-2))+1;
        this.x = Board.column(col);
        this.y = Board.row(row);
     } while (Controller.pavement[row][col] || this.checkCollision(player)
     );
    Controller.pavement[row][col] = 'Treasure';
};

/* Subclasses of Treasure classes*/
var BlueGem = function() {
    Treasure.call(this);
    this.sprite = 'images/Gem Blue.png';
};
BlueGem.prototype = Object.create(Treasure.prototype);
BlueGem.prototype.constructor = BlueGem;
/*Trigger to do operations*/
BlueGem.prototype.obtain = function(){
    Controller.obtainBlueGem();
};


/* Subclasses of Treasure classes*/
var GreenGem = function() {
    Treasure.call(this);
    this.sprite = 'images/Gem Green.png';
};
GreenGem.prototype = Object.create(Treasure.prototype);
GreenGem.prototype.constructor = GreenGem;
/* Trigger to do operations */
GreenGem.prototype.obtain = function(){
    Controller.obtainGreenGem();
};


/* Subclasses of Treasure classes*/
var OrangeGem = function() {
    Treasure.call(this);
    this.sprite = 'images/Gem Orange.png';
};
OrangeGem.prototype = Object.create(Treasure.prototype);
OrangeGem.prototype.constructor = OrangeGem;
/* Trigger to do operations*/
OrangeGem.prototype.obtain = function(){
    Controller.obtainOrangeGem();
};


/* Subclasses of Treasure classes*/
var Heart = function() {
    Treasure.call(this);
    this.sprite = 'images/Heart.png';
};
Heart.prototype = Object.create(Treasure.prototype);
Heart.prototype.constructor = Heart;
Heart.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 21, this.y+35,60,102);
};
/* Trigger to do operations*/
Heart.prototype.obtain = function(){
    Controller.obtainHeart();
};


/* Subclasses of Treasure classes*/
var Key = function() {
    Treasure.call(this);
    this.sprite = 'images/Key.png';
};
Key.prototype = Object.create(Treasure.prototype);
Key.prototype.constructor = Key;
Key.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 12, this.y+10,80,136);
};
/* Trigger to do operations*/
Key.prototype.obtain = function(){
    Controller.obtainKey();
};

/* Subclasses of Treasure classes*/
var Star = function() {
    Treasure.call(this);
    this.sprite = 'images/Star.png';
};
Star.prototype = Object.create(Treasure.prototype);
Star.prototype.constructor = Star;
/* Trigger to do operations*/
Star.prototype.obtain = function(){
    Controller.obtainStar();
};


/* Instance variable of Player class, with life value information and fractional information
 * Need update () function, render () function, and Handleinput () function
 */
var Player = function(){
    var roleImages = [
        'images/char-boy.png',
        'images/char-cat-girl.png',
        'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png'
    ];
    var index = Math.floor(Math.random() * roleImages.length);
    this.sprite = roleImages[index];

    this.lives = 3;
    this.score = 0;

    this.star ='images/Star.png';

    this.initLocation();
};

/* Initlocation is called not only at initialization, but in the game 
 * as long as the character returns to its original position
 */
Player.prototype.initLocation = function() {
    this.x = Board.column(2);
    this.y = Board.row(5);
};

Player.prototype.update = function() {};

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y+5,105,151);
};

Player.prototype.move = function(x,y){
    this.x += x;
    this.y += y;
};

/* Confirm the four directions of Player, if there is an Obstacle entity*/
Player.prototype.checkRock = function(){
    var row = this.y / Board.cellHeight,
        col = this.x / Board.cellWidth;

    var result={
        left : true,
        right : true,
        top : true,
        bottom : true
    };

    /*left*/
    if((col - 1 >= 0) &&(Controller.pavement[row][col-1] === 'Obstacle'))
    {
        result.left = false;
    }
    /*right*/
    if((col < Board.horizonCells-1) && (Controller.pavement[row][col+1] === 'Obstacle'))
    {
        result.right = false;
    }
    /*up*/
    if((row-1 >= 0 ) && (Controller.pavement[row-1][col] === 'Obstacle'))
    {
        result.top = false;
    }
    /*down*/
    if((row  < Board.vericalCells-1) && (Controller.pavement[row+1][col] === 'Obstacle'))
    {
        result.bottom = false;
    }
    return result;
}

/* This listens for key presses and sends the keys to your
 * Player.handleInput() method. You don't need to modify this.
 */
Player.prototype.handleInput = function(direction) {

    var cellHeight = Board.cellHeight;
    var cellWidth = Board.cellWidth;

   var checkRock = this.checkRock();

    if('left' === direction && checkRock.left && !Board.exceedsLeftBoundary(this.x-cellWidth)){
        this.move(-cellWidth,0);
    }
    else if('right' === direction && checkRock.right && !Board.exceedsRigntBoundry(this.x+cellWidth)){
        this.move(cellWidth,0);
    }
    else if('up' === direction && checkRock.top && !Board.exceedsTopBoundry(this.y - cellHeight)){  
            this.move(0,-cellHeight);
    }
    else if('down' === direction && checkRock.bottom && !Board.exceedsBottomBoundry(this.y+cellHeight)){
        this.move(0,cellHeight);
    }

}

Player.prototype.checkWins = function(){
    if(this.y === 0){
        Controller.crossRiver();
    }
}

