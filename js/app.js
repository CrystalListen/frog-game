/* 
 *
 * The entire game can be described as below:
 *
 * 1. Instantiate the Resourse object (picture-loading tool), Engine object (animation rendering tool),
 *    Controller object (Game Logic Control Center), Dommanager object (DOM element control center),
 *    Util object (accessibility provider), Player object, 
 *    and three different categories of array Allenemies, Allobstacles, Alltreasure
 *
 * 2. Resourse cache all required picture resources
 *
 * 3. After all caches are successful, the Engine init () function is executed
 *
 * 4. The Engine init () function has several main tasks, one of which is to open animated rendering,
 *    the second is to start the game logic through the Controller API, 
 *    the third is to add the event response through Dommanager
 *
 * 5. Animation rendering is to let engine continue to execute the main function. 
 *    Specifically, all of the element objects, first perform the update () location,
 *    Perform render () using canvas for rendering. Of course, static elements 
 *    do not move, so the Update method is not executed    
 *
 * 6. Dommanager after a one-time join the Listener event, controller will call their own restart method,
 *    It is necessary to initialize the game elements at the beginning, to open the logic loop, and to 
 *    generate new game elements based on the duration of the game. Where does the game time get from?
 *    Responsible for the animation of the engine object rightfully assume this responsibility!
 *
 * 7. Then the player operates on its own, the player interacts with the game element by moving the
 *    character and notifies controller handles interactive events. Controller will therefore process
 *    the game logic and notify Dommanager to display the appropriate information.
 *
 *
 * Enjoy Your Game!
 *
 */

var Board = (function(global){
	/* The global constants used to define the size of the canvas, which the player cannot modify, is a mandatory set*/
    var cellWidth = 101, horizonCells = 5;
    var cellHeight = 83, vericalCells = 6;
    var boardWidth = cellWidth * horizonCells;
    var boardHeight = 606;

    /*when the destination less than collisionRadius, seem as collision*/
    var collisionRadius = 40;

    /*according to the row and coloum get the width and height
     * range 1 ~ horizonCells
     */
    var column = function(x){
        if(x>horizonCells || x < 0) return -1;
        return x*cellWidth;
    };

    /* range 1 ~ vericalCells*/
    var row = function(y){
        if(y>vericalCells || y < 0) return -1;
        return y*cellHeight;
    };

    /* Check if an instance is outside the bounds*/
    var exceedsLeftBoundary = function(x){
        return x<0;
    };
    var exceedsRigntBoundry = function(x){
        return x >= boardWidth;
    };
    var exceedsTopBoundry = function(y){
        return y < 0;
    };
    var exceedsBottomBoundry = function(y){
        return y >= cellHeight*vericalCells;
    };

    global.Board = Board;

    return {
        cellHeight : cellHeight,
        cellWidth : cellWidth,

        boardHeight : boardHeight,
        boardWidth : boardWidth,
        horizonCells : horizonCells,
        vericalCells : vericalCells,

        collisionRadius : collisionRadius,

        row : row,
        column : column,

        exceedsLeftBoundary : exceedsLeftBoundary,
        exceedsRigntBoundry : exceedsRigntBoundry,
        exceedsTopBoundry : exceedsTopBoundry,
        exceedsBottomBoundry : exceedsBottomBoundry
    }

})(this);

/*Adds remove() function for Array class, which can directly delete the element from the value of the element.*/
Array.prototype.indexOf = function(val){
    for(var i = 0; i< this.length;i++){
        if(this[i] === val) return i;
    }
    return -1;
}

Array.prototype.remove = function(val){
    var index = this.indexOf(val);
    if(index > -1){
        this.splice(index,1);
    }
}

/* Now instantiate your objects.
 * Place all enemy objects in an array called allEnemies
 * Place the player object in a variable called player
 */
var player = new Player();

var allEnemies = [];
var allObstacles = [];
var allTreasure = [];



