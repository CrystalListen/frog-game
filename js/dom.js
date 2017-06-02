/* 
 *
 * This file is used to manipulate the DOM elements on the screen, including changing its display, 
 * getting its properties, adding response events, and so on.
 *
 */

DomManager = (function(global) {
    /* The following DOM elements are used to reflect the game state */
    var doc = global.document,
        scoreTxt = doc.getElementById('score'),
        msgTxt = doc.getElementById('msg'),
        lifeTxt = doc.getElementById('life'),
        progressBar = doc.getElementById('progress-bar'),
        topBar = doc.getElementById('top-bar'),
        menuButton = doc.getElementById('btn-menu'),
        menu = doc.getElementById('menu'),

        instructionButton = doc.getElementById('btn-instruction'),
        instructionBoard = doc.getElementById('instruction-board'),
        closeInstructionButton = doc.getElementById('btn-close-instruction'),

        roleListButton = doc.getElementById('btn-role'),
        roleList = doc.getElementById('role-list'),
        restartButton = doc.getElementById('btn-restart');

    /* Give the title bar of the game, and the button of the menu bar, set the corresponding name according to the language. */
    var initDomText = function() {
        var gameTitleWords = 'Arcade Game';
        doc.getElementById('game-title').innerText = gameTitleWords;
        var roleListButtonWords = 'Role';
        roleListButton.innerText = roleListButtonWords;
        var instructionButtonWords = 'Instruction';
        instructionButton.innerText = instructionButtonWords;
        var restartButtonWords = 'Restart';
        restartButton.innerText = restartButtonWords;
    };

     /* Resets the Information bar above the center and the parameter is empty */
    var resetMsg = function() {
        var defaultWords = 'Move to the river above';
        msgTxt.innerText = defaultWords;
        msgTxt.style.color = '#fff';
    };

    /* Set the text of the InfoBar, the string to be displayed */
    var setMsg = function(msg) {
        msgTxt.innerText = msg;
    };

    /* Set the color of the InfoBar, a string representing the color */
    var setMsgColor = function(color) {
        msgTxt.style.color = color;
    };

    /* Update the score bar to the left of the top */
    var updateScore = function() {
        var scoreWords = 'Score: ';
        scoreTxt.innerText = scoreWords + player.score;
    };

    /* Update the Life value bar above right */
    var updateLives = function() {
        lifeTxt.innerText = '';
        for (var i = 0; i < player.lives; i++) {
            lifeTxt.innerText += '♥';
        }
    };

    /* Sets the length of a progress bar, a number between 0 and 1, representing the ratio of its maximum length*/
    var setProgressBarLength = function(ratio) {
        /* ratio in [0, 1]*/
        ratio = Math.max(ratio, 0);
        ratio = Math.min(ratio, 1);
        progressBar.style.width = (maxBarWidth * ratio) + 'px';
    };
    /* In order to avoid Setprogressbarlength frequent reads layout property, will Maxbarwidth take out the value ahead of time
     * But if the browser width changes, this Maxbarwidth needs to respond to the adjustment
     */
    var maxBarWidth = topBar.offsetWidth;
    Window.onresize = function() {
        maxBarWidth = topBar.offsetWidth;
    };

    /* Add a click response event in a menu */
    /* Defines a variable to mark whether the menu bar is hidden */
    var isMenuHidden = true;
    var showMenu = function() {
        menu.style.height = '186px';
        menu.style.borderBottom = '2px solid #251';
        isMenuHidden = false;
        /* When the menu bar appears, the game pauses */
        Controller.pauseGame();
    };
    var hideMenu = function() {
        menu.style.height = 0;
        menu.style.borderBottom = 0;
        isMenuHidden = true;
        /* When the menu bar is hidden, the game continues */
        Controller.continueGame();
    };

    /* Mouse on the role button, will pop up the two-level menu, for the player to customize the appearance of the role */
    /* Defines a variable to mark whether the role selection bar is hidden */
    var isSelectionListHidden = true;
    var showSelectionList = function() {
        roleList.style.width = '310px';
        isSelectionListHidden = false;
    };
    var hideSelectionList = function() {
        roleList.style.width = '0';
        isSelectionListHidden = false;
    };

    /* Determine if the landing device is a PC */
    var isPC = function() {
        var userAgentInfo = navigator.userAgent;
        var Agents = ["Android", "iPhone",
            "SymbianOS", "Windows Phone",
            "iPad", "iPod"
        ];
        var flag = true;
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = false;
                break;
            }
        }
        return flag;
    };

    /* Add a variety of event responses, just once at the start of the game, called by Engine Init () */
    var addEventListener = function() {

        /* Perform a function that names the title and button first */
        initDomText();

        /* Monitor keyboard Click events for Gamers */
        doc.addEventListener('keyup', function(e) {
            var allowedKeys = {
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down'
            };
            player.handleInput(allowedKeys[e.keyCode]);
            if(e.keyCode === 38){
                player.checkWins();
            }
        });

        menuButton.onclick = function(e) {
            /* Click on the menu button when the Click event stops up */
            e.stopPropagation();
            if (isMenuHidden) {
                showMenu();
            } else {
                hideMenu();
            }
        };

        /* In addition to the menu buttons and the role buttons below, clicking on the other areas of the screen will hide the menu bar */
        doc.onclick = function() {
            hideMenu();
            hideSelectionList();
        };


         /* Click on the Role button when clicking on the event stops up */
        roleListButton.onclick = function(e) {
            e.stopPropagation();
        };

        /* Move the mouse over the role button, or move to the level two menu that pops up, and the level two menu will be displayed */
        roleListButton.onmouseover = function() {
            showSelectionList();
        };
        roleList.onmouseover = function() {
            showSelectionList();
        };
        /* The mouse leaves the Role list button, and it leaves the two-level menu that pops up, and the level two menu is hidden */
        roleListButton.onmouseout = function() {
            hideSelectionList();
        };
        roleList.onmouseout = function() {
            hideSelectionList();
        };

        instructionButton.onclick = function(e) {
            /* Click on the button, the Click event should stop up, or the game will lose the pause effect */
            e.stopPropagation();
            hideMenu();
            Controller.pauseGame();
            instructionBoard.style.display = 'block';
        };

        /* When you click the OK button in the game Description panel, close the panel
         * Because the Click event is passed up to the document, the Hidemenu () is triggered to continue the game
         */
        closeInstructionButton.onclick = function() {
            instructionBoard.style.display = 'none';
        };

        /* Initialize an image from the role menu */
        var roleImages = [
            'images/char-boy.png',
            'images/char-cat-girl.png',
            'images/char-horn-girl.png',
            'images/char-pink-girl.png',
            'images/char-princess-girl.png'
        ];

        /* Clicking a picture on the role menu bar will change the player's image to the appropriate shape */
        for (var i = 0; i < roleImages.length; i++) {
            var roleImg = doc.getElementById('role-' + i);
            roleImg.src = Util.getImg(roleImages[i]);
             /* Resolve the problem of incorrect value I in an asynchronous call in an immediate execution */
            (function(index) {
                roleImg.onclick = function() {
                    player.sprite = roleImages[index];
                    hideSelectionList();
                };
            })(i);
        }

        /* Restart the game by clicking the Restart button */
        restartButton.onclick = function() {
            Controller.restartGame();
        };
    };

    return {
        resetMsg: resetMsg,
        setMsg: setMsg,
        setMsgColor: setMsgColor,
        updateScore: updateScore,
        updateLives: updateLives,

        setProgressBarLength: setProgressBarLength,

        hideMenu: hideMenu,

        addEventListener: addEventListener
    };

})(this);
