// WebSocket connection
console.log('game running');
const connection = new WebSocket('wss://***REMOVED***:8080');
var player;
var activePos;
var test;
const commands = {
    ac: function (crd) {
        console.log('setting active position at ' + crd);
        activePos = crd;
    },
    mm: function (crd) {
        document.getElementById('winIndicator').innerText = " "
        console.log('destroy a piece at ' + activePos);
        amzPos[1] = amzPos[1].filter(e => e !== activePos);
        amzPos[2] = amzPos[2].filter(e => e !== activePos);
        if (amzPos[1].length < amzPos[2].length) {
            console.log('create white piece at ' + crd);
            amzPos[1].push(crd);
        } else {
            console.log('create black piece at ' + crd);
            amzPos[2].push(crd);
        }
        activePos = '';
    },
    ar: function (crd) {
        document.getElementById('winIndicator').innerText = " "
        console.log('create an arrow at ' + crd);
        arrwPos.push(crd);
    },
    pl: function (id) {
        console.log('connected to game');
        player = id;
        console.log('player ' + player);
    },
    mx: function () {
        console.log('there are already 2 players connected')
    },
    rr: function () {
        start();
    },
    gs: function (state) {
        if (state.charAt(0) == player) {
            if (player == '1') {
                document.getElementById('turnIndicator').innerText = "YOUR TURN (WHITE)"
            } else {
                document.getElementById('turnIndicator').innerText = "YOUR TURN (BLACK)"
            }
        } else if (state.charAt(0) == 0) {
            document.getElementById('turnIndicator').innerText = "WAITING FOR 2 PLAYERS"
        } else {
            document.getElementById('turnIndicator').innerText = "WAITING FOR THE OTHER PLAYER"
        }
    },
    wi: function (winner) {
        if (winner.charAt(0) == 1) {
            document.getElementById('winIndicator').innerText = "WHITE WINS"
        } else {
            document.getElementById('winIndicator').innerText = "BLACK WINS"
        }
    },
};
// Getting moves back from vps
connection.onmessage = (event) => {
    // log move info
    console.log("WebSocket recieved message: " + event.data);
    commands[event.data.substring(0, 2)](event.data.substring(2, 4));
    drawBoard();
};
//Console log
connection.onopen = (event) => {
    console.log('WebSocket is sucessfully connected.');
};
connection.onclose = (event) => {
    console.log('WebSocket has closed.');
};
connection.onerror = (event) => {
    console.error('WebSocket error:', event);
};
//--------------
// Drawing board
var canvas;
var imgSqr;
var amzPos;
var arrwPos;
function start() {
    document.getElementById('arrow').hidden = true;
    document.getElementById('queen1').hidden = true;
    document.getElementById('queen2').hidden = true;
    document.getElementById('dark').hidden = true;
    document.getElementById('light').hidden = true;
    amzPos = {
        1: ['06', '39', '69', '96'],
        2: ['03', '30', '60', '93']
    };
    arrwPos = [];
    activePos = '';
    drawBoard();
}
function drawBoard() {
    canvas = document.getElementById('gameArea');
    ctx = canvas.getContext('2d');
    for (x = 0; x < 10; x++) {
        for (y = 0; y < 10; y++) {
            if ((y % 2 == 0 && x % 2 == 0) || (y % 2 !== 0 && x % 2 !== 0)) {
                imgSqr = dark;
            } else {
                imgSqr = light;
            }
            ctx.drawImage(imgSqr, x * 50, y * 50, 50, 50);
            charPos = x.toString() + y.toString();
            if (amzPos[1].includes(charPos)) {
                imgSqr = queen1;
            }
            if (amzPos[2].includes(charPos)) {
                imgSqr = queen2;
            }
            if (arrwPos.includes(charPos)) {
                imgSqr = arrow;
            }
            ctx.drawImage(imgSqr, x * 50, y * 50, 50, 50);
            if (charPos == activePos) {
                ctx.fillStyle = "#42f453";
                ctx.globalAlpha = 0.2;
                ctx.fillRect(x * 50, y * 50, 50, 50);
                ctx.globalAlpha = 1;
            }
        }
    }
}
//--------------
//Click handling
var rect;
var cX;
var cY;
function clientClick(event) {
    rect = canvas.getBoundingClientRect();
    cX = event.clientX - rect.left - 5;
    cX = Math.trunc(cX / 50);
    cY = event.clientY - rect.top - 5;
    cY = Math.trunc(cY / 50);
    coord = cX.toString() + cY.toString();
    console.log("clicked at " + coord);
    connection.send('c' + coord + player);
}
//--------------