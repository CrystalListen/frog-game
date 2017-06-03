/* 
 *
 * This file provides the function of the game control Center, controller is a single example object for other modules to call.
 * Most of the code related to Game logic is written here, and any game element wants to know when to build it,
 * Or when you encounter an event, ask Controller. So you can interpret controller as the housekeeper of this game.
 *
 * Specifically, the controller has several functions:
 * 1. Control game start, pause, resume, reboot, etc.
 * 2. Keep the logical cycle of the game, creating new elements, or raising the level of the enemy, which can stop and restart
 * 3. Additions and deletions of game elements, but this part of the interface is not exposed, called by the internal function
 * 4. Provides an API for dealing with game events, including logic after encountering enemies and treasures
 * 5. Notifies Dommanager to update DOM elements as the player's game progresses
 * 6. Provides a two-dimensional array object Pavement, which represents the occupancy of the middle area of the screen and can be accessed externally
 *
 */

var Controller = (function(global) {

    var win = global.window;

    /* An object used to set the number of elements at the beginning of a game */
    var initialSettings = {
        treasureNum: 2,
        obstacleNum: 2,
        enemyNum: 5,
        enemyLevel: 1
    };

    /* Creates a two-dimensional array to mark whether the lattice is occupied by existing static elements.
     * Because it corresponds to the area of the road in the game, so named Pavement.
     * If the value of a coordinate is true, it means that the coordinate already has a fixed element, and the new static element cannot be generated here
     */
    var pavement = (function() {
        var matrix = [];

        /* Reset */
        matrix.reset = function() {
            for (var row = 0; row < 6; row++) {
                matrix[row] = [];
                for (var col = 0; col < 5; col++) {
                    matrix[row][col] = false;
                }
            }
        };

        /* Find out how many of its cells are true and return the result as a value
         * Its return value is used to determine whether static elements can continue to be added
         */
        matrix.getOccupiedNum = function() {
            var num = 0;
            this.forEach(function(eachRow) {
                eachRow.forEach(function(eachCell) {
                    num += (eachCell ? 1 : 0);
                });
            });
            return num;
        };

        /* You can do initialization by executing your own reset function. */
        matrix.reset();

        return matrix;
    })();

    /* Add enemy, quantity and rank as parameter pass
     * When there is no enemy in the current game, the level parameter is meaningful
     * If the Allenemies is not empty, the newly added enemy remains the same level as the first enemy in the array.
     */
    var addEnemy = function(num, level) {

        if (allEnemies.length > 0) {
            level = allEnemies[0].level;
        }
        for (var i = 0; i < num; i++) {
            allEnemies.push(new Enemy(level));
        }
    };

    /* Add obstructions, new quantities are passed as parameters, and if a large number of grids are already occupied, cancel the addition */
    var addObstacle = function(num) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() <= 10) {
                allObstacles.push(new Obstacle());
            }
        }
    };

    /* Add the treasure, the new quantity is passed as the parameter, if the road surface already has a large number of lattice to occupy, then cancels adds */
    var addTreasure = function(num, ClassName) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() <= 12) {
                allTreasure.push(new ClassName());
            }
        }
    };

    /* According to the probability weight of various treasures, randomly generate a number of treasures, generate the number as a parameter pass */
    var addRandomTreasure = function(num) {

        /* Here set the probability weights of the various treasures appearing */
        var treasureList = [{
                ClassName: BlueGem,
                weight: 20
            },
            {
                ClassName: GreenGem,
                weight: 10
            },
            {
                ClassName: OrangeGem,
                weight: 15
            },
            {
                ClassName: Heart,
                weight: 10
            },
            {
                ClassName: Key,
                weight: 10
            },
            {
                ClassName: Star,
                weight: 5
            },
        ];

        var i, j;
        var totalWeight = 0;
        for (i = 0; i < treasureList.length; i++) {
            totalWeight += treasureList[i].weight;
        }

        var randomNum, currentTotalWeight, targetClass;
        for (i = 0; i < num; i++) {
            randomNum = Math.ceil(Math.random() * totalWeight);
            targetClass = treasureList[0].ClassName;
            currentTotalWeight = 0;

            /* Here the idea is to add the weight value in turn, conversion into a gradually increasing interval,
             * Then look at the randomly generated integers falling within that interval and then select the corresponding treasure class for the interval.
             * The greater the weight of the Treasure class, the corresponding range is also greater.
             */
            for (j = 0; j < treasureList.length - 1; j++) {
                currentTotalWeight += treasureList[j].weight;
                if (currentTotalWeight < randomNum) {
                    targetClass = treasureList[j + 1].ClassName;
                }
            }
            addTreasure(1, targetClass);
        }
    };

    /* function to restart the game */
    var restartGame = function() {

        /* First restore the player instance to its original state and then reset the top panel information */
        player.initLocation();
        player.lives = 3;
        player.score = 0;
        DomManager.updateLives();
        DomManager.updateScore();
        DomManager.resetMsg();

        DomManager.hideMenu();

        /* End the game loop on the last inning. */
        stopLoop();

        /* Clear the last inning of sapphire countdown effect (if not yet) */
        stopTimer();
        DomManager.setProgressBarLength(0);

        /* Restores the time flow to the default state and causes the engine internal timer to be reset by 0 */
        Engine.reset();

        /* Initializing game elements */
        initElements(initialSettings.treasureNum,
            initialSettings.obstacleNum,
            initialSettings.enemyNum,
            initialSettings.enemyLevel);

        /* Reset the game phase to 0 before opening the logic loop */
        stage = 0;
        startLoop();
    };

    /* Pause the game, where the role is not subject to keyboard response */
    var pauseGame = function() {

        /* Let time flow to 0, equivalent to pause animation,
         * But in fact the browser is still rendering, just the picture of each rendering is the same.
         * Because time is still, the player's score cannot change during this period, so the stage variable will not be changed.
         */

        Engine.setTimeSpeed(0);

        /* Pause Countdown Timer
         * Note that the countdown timer is timed according to the real time, not affected by the time in the engine,
         * Therefore, the pause or time delay based on the engine implementation does not work for the countdown timer.
         */
        pauseTimer();
    };

    /* Continue the game, restore the keyboard response, restore the time flow,
     * and start the countdown device, if the Lefttime is greater than 0, then continue with the last no end effect
     */
    var continueGame = function() {
        Engine.setTimeSpeed(1);

        if (leftTime > 0) {
            startTimer();
        }
    };

    /* Stop the game, determine the player's score can enter the rankings, players click OK and then restart the game */
    var endGame = function() {
        stopLoop();
        stopTimer();

        var endWords = 'Game Over';
        DomManager.setMsg(endWords);

        /* The following logic is asynchronous because the end of our game occurs in the player's update function.
         * So when the input box pops up, the render function of the player's last move animation has not been executed,
         * So we add a short delay, let this part of the deal take place after the step out
         */
        win.setTimeout(function() {
            /*Pop-up dialog prompt, game over*/

            win.alert(endWords + '\n Your score is '+ player.score);
            restartGame();
        }, 10);
    };

    /* This function is used to initialize the game element */
    var initElements = function(treasureNum, obstacleNum, enemyNum, level) {
        /* Empty several arrays first */
        allEnemies = [];
        allObstacles = [];
        allTreasure = [];

        /* Resets a two-dimensional array used to mark whether a lattice is occupied */
        pavement.reset();

        /* Add game Element last */
        addRandomTreasure(treasureNum);
        addObstacle(obstacleNum);
        addEnemy(enemyNum, level);
    };

    /* We divide the game into one phase, using variable stage to represent
     * Stage values determine when to increase the enemy, raise the level of the enemy, generate static elements and so on
     */
    var stage = 0;

    /* This variable is the ID of the game logic loop and is used as a parameter for Clearinterval () */
    var gameLoopId;

    /* The game logic loop function, according to the game time and the player current score, controls each element the increment and the level change */
    var startLoop = function() {

        /* First record the previous stage. */
        var lastStage = stage;

        /* Each time you perform the following Setinterval, you will need to clear the previous results */
        win.clearInterval(gameLoopId);

        /* This Setinterval function checks if the stage value changes every 1 seconds,
         * If there is a change, prepare new elements and raise the enemy level.
         * Store the return value of it, and then Clearinterval the call to stop the logical cycle of the game
         */
        gameLoopId = win.setInterval(function() {

            /* Only Player.score and Engine Gettime () two values are standard to enter the next stage
             * Early game, stage value is mainly determined by the game time, every 5 seconds to improve one file.
             * Late game, do not want players to automatically ascend to a high level by the beetle, and then use props to get points across the river,
             * Stage is determined more by fractions, so the growth of exponential functions is used as a limit.
             * Individual circumstances will cause stage to stay motionless, such as the player at the starting point of the machine.
             */
            var timeLimitStage = Engine.getTime() / 5.0,
                scoreLimitStage = Math.sqrt(player.score) * 1.25;
            stage = Math.floor(Math.min(timeLimitStage, scoreLimitStage));

            if (stage !== lastStage) {
                allEnemies.forEach(function(enemy) {
                    enemy.level += 1;
                });
                addRandomTreasure(1);

                if (stage % 3 === 0) {
                    if (allEnemies.length < 4) {
                        addEnemy(1, stage);
                    }
                    addObstacle(1);
                }
                if (stage % 4 === 0) {
                    if (allEnemies.length < 8) {
                        addEnemy(1, stage);
                    }
                }
                if (stage % 6 === 0) {
                    addTreasure(1, Key);
                }
                if (stage % 8 === 0) {
                    addTreasure(1, GreenGem);
                }
                if (stage % 12 === 0) {
                    addTreasure(1, Heart);
                }
            }
            lastStage = stage;

        }, 1000);
    };

    /* End the game loop */
    var stopLoop = function() {
        win.clearInterval(gameLoopId);
    };

    /* Add a variable Lastcrosstime, used to record the last river time, if a short period of time across the river, there are bonus points */
    var lastCrossTime = 0;
    /* Use a variable to record the continuous number of consecutive rivers, uninterrupted means that 22 between the set interval */
    var k = 1;
    var resetMsgId = 0;

    /* If you get to the top of the river, increase the score, give the message。
     * The role of the player will stay for a short period of time, so that players can see clearly, the role did reach the river.
     * Other roles are normal during this period, except that the player role is fixed and not subject to keyboard response.
     * The role then returns to the initial position and the keyboard resumes the response.
     */
    var crossRiver = function() {
        win.clearTimeout(resetMsgId);
        var crossTime = Date.now();
        if (crossTime - lastCrossTime < 2800) {
            k = k < 4 ? (k + 1) : 4;
        } else {
            k = 1;
        }

        /* The more the game phase, the higher the score of a single crossing. */
        var awardScore = (10 + stage) * k;
        player.score += awardScore;
        DomManager.updateScore();

        var congratsWords = [
            'Good Job!',
            'Nice Move!',
            'Well Done!',
            'You Need Water!'
        ];

        var randomIndex = Math.floor(Math.random() * congratsWords.length);

        var continuityWords = 'Fast Crossing\n' +
            k + ' * ' + awardScore + ' Scores Awarded';

        if (k > 1) {
           DomManager.setMsg(continuityWords);
            DomManager.setMsgColor('#fbf850');
        } else {
           DomManager.setMsg(congratsWords[randomIndex]);
        }

        /* Then the last time the river was updated to the present, for the next comparison*/
        lastCrossTime = Date.now();

        /* 0.5 seconds to return the role and restore the keyboard response, and 1 seconds to restore the text region */
        win.setTimeout(function() {
            player.initLocation();
        }, 500);
        resetMsgId = win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* When you collide with the enemy, all the elements will be stationary for a short period of time, so that the player can see the occurrence of the collision
     * Subtract a little bit of life from the player and then determine if the player's remaining life is 0 and further processed.
     */
    var collideWithEnemy = function() {

        player.lives -= 1;
        DomManager.updateLives();
        DomManager.setMsgColor('#f13');

        /* If the remaining life value is greater than 0, reset the role position, subtract a drop of blood, and then continue the game.
         * If the remaining life value is 0, it prompts game over and restarts the game.
         */
        if (player.lives > 0) {
            var collisionWords = 'Oops! Collide with a bug!';
            DomManager.setMsg(collisionWords);
            win.setTimeout(function() {
                DomManager.resetMsg();
                player.initLocation();
                continueGame();
            }, 1500);

        } else {
            endGame();
        }
    };

    /* Timerid the countdown timer used to mark the progress bar is the return value of the Setinterval function.
     * When the effect of a sapphire is not over, and another sapphire is encountered, the last countdown timer 
     * will need to be emptied first. The ID variable is called by the Clearinterval function.
     * When you pause the game, empty the countdown device, resume the game and keep the countdown
     * To restart the game, to ensure that the previous set of sapphire countdown effect has expired, so also to clear the countdown device.
     */
    var timerId;

    /* Get the sapphire, slow it down, and keep it up for a short period of time.
     * Let time slow is to start a countdown device, and constantly reduce the Lefttime, when it is 0 o'clock, the time flow rate return to normal
     */
    var obtainBlueGem = function() {

        /* This countdown timer is like an old-fashioned alarm clock.
         * This setting Lefttime is equivalent to winding it up, not more than 5000, or 5 seconds.
         */
        leftTime = 5000;
        startTimer();
    };


    /* This variable is the core of the countdown, the residual time of the reaction time deceleration effect, is the global variable within the controller */
    var leftTime = 0;

    /* Start the countdown device, the core is to start the Setinterval () function, and constantly update the Lefttime until it is reduced to 0,
     * After every a reduction, the Dommanager is informed that the length of the progress bar is reflected in the same proportion.
     */
    var startTimer = function() {
        Engine.setTimeSpeed(0.2);
        var words = 'Time Slowing Down';
        DomManager.setMsg(words);

        /* Lefttime up to 5 seconds. */
        var maxTime = 5000;
        leftTime = Math.min(maxTime, leftTime);
        /* The time interval of rendering affects the smoothness of the progress bar animation */
        var dt = 10;

        /* Before you start Setinterval, you need to clear the previous loop */
        win.clearInterval(timerId);

        /* Countdown timer, Lefttime gradually reduced until 0, only to trigger the time flow rate back to normal */
        timerId = win.setInterval(function() {
            leftTime -= dt;
            leftTime = Math.max(leftTime - dt, 0);
            DomManager.setProgressBarLength(leftTime / maxTime);
            if (leftTime <= 0) {
                Engine.setTimeSpeed(1);
                DomManager.resetMsg();
                win.clearInterval(timerId);
            }
        }, dt);
    };

    /* Suspend countdown timer, game execution */
    var pauseTimer = function() {
        win.clearInterval(timerId);
    };

    /* Stop Countdown, execute when game restarts */
    var stopTimer = function() {
        win.clearInterval(timerId);
        leftTime = 0;
        DomManager.setProgressBarLength(0);
    };

    /* To get the emerald, to reduce an enemy, if there is only one enemy left, the effect is to get the medium fraction
     * If the game is late, the emerald can subtract two of enemies.
     */
    var obtainGreenGem = function() {
        if (allEnemies.length <= 1) {
            var awardScore = 30 + 2 * stage;
            player.score += awardScore;
            DomManager.updateScore();
            var scoreWords = ' Scores Awarded!';
            DomManager.setMsg(awardScore + scoreWords);
        } else {
           var k = 1;
            allEnemies = allEnemies.slice(0, allEnemies.length - k);
             var eliminatedWords = ' Bug Eliminated!';
            DomManager.setMsg(k + eliminatedWords);
        }

        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* Orange Gems can move all enemies beyond the left side of the screen. */
    var obtainOrangeGem = function() {
        allEnemies.forEach(function(enemy) {
            enemy.x = -200;
        });
        var pushWords = 'Push Bugs Away!!';
        DomManager.setMsg(pushWords);
        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* Get the heart and restore a little life. If the life reaches the upper limit, then the medium score is obtained */
    var obtainHeart = function() {
        if (player.lives < 5) {
            player.lives += 1;
            DomManager.updateLives();
            var lifeWords = 'One More Life!';
            DomManager.setMsg(lifeWords);
        } else {
            var awardScore = 50 + 2 * stage;
            player.score += awardScore;
            DomManager.updateScore();
            var scoreWords = ' Extra Scores';
            DomManager.setMsg(player.score + scoreWords);
        }
        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* When you get the key, remove a stone (if there is a stone on the screen) and get a few points */
    var obtainKey = function() {

        /* Check if any obstables exist */
        if(allObstacles.length)
        {
            var rockWords = 'Remove a Rock!';
            DomManager.setMsg(rockWords);
            /* Random removal of an obstacle */
            var index = Math.floor(Math.random() * (allObstacles.length-1));
            var rock = allObstacles[index];
            var row = rock.y / Board.cellHeight,
            col = rock.x / Board.cellWidth;
            Controller.pavement[row][col] = false;
            allObstacles.remove(rock);

        }
        else{
            var rockWords = 'No Rock!';
            DomManager.setMsg(rockWords);
        }

        player.score += 20 + Math.floor(stage * 0.5);
        DomManager.updateScore();

        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* Getting a star can get a lot of points */
    var obtainStar = function() {
        var awardScore = 100 + 3 * stage;
        player.score += awardScore;
        DomManager.updateScore();
        var scoreWords = ' Scores Awarded!';
        DomManager.setMsg(awardScore + scoreWords);
        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

   global.Controller = Controller;
    /* Controller objects expose these methods and objects by name to understand their role*/
    return {
        /* Two-dimensional Array object that represents the occupancy of the intermediate area */
        pavement: pavement,

        /* This object is used to customize the number of elements and enemy levels at the start of the game. */
        initialSettings: initialSettings,

        /* Control the game process */
        restartGame: restartGame,
        pauseGame: pauseGame,
        continueGame: continueGame,

        /* The following set of APIs is used to handle the logic after the event occurs */
        crossRiver: crossRiver,
        collideWithEnemy: collideWithEnemy,
        obtainBlueGem: obtainBlueGem,
        obtainGreenGem: obtainGreenGem,
        obtainOrangeGem: obtainOrangeGem,
        obtainKey: obtainKey,
        obtainHeart: obtainHeart,
        obtainStar: obtainStar
    };
})(this);
