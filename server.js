const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
var connections = 0;
// Grab certificate
const server = https.createServer({
    cert: fs.readFileSync('/etc/letsencrypt/live/***REMOVED***/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/***REMOVED***/privkey.pem')
});
// Specify the server to websocket
const wss = new WebSocket.Server({
    server: server
});
// Specify port to listen to
server.listen(8080)
console.log("WebSocket online")
// waits for connection to be established from the client
// the callback argument ws is a unique for each client
wss.on('connection', (ws) => {
    console.log('attempted connect.');
    if (connections > 1) {
        ws.send('mx');
        ws.close();
    } else {
        connections++;
        if (connections == 2) {
            reset();
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    console.log('told the clients the game has started');
                    client.send('gs11');
                }
            });
        } else if (connections == 1) {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('gs00');
                }
            });
        }
        console.log(connections + ' clients connected');
        ws.send('pl' + connections)
        var aliveCheck = setInterval(check, 1000);
        function check() {
            if (ws.readyState !== 1) {
                connections--;
                reset();
                ws.close();
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send('gs00');
                        client.send('pl1')
                    }
                });
                console.log(connections + ' clients connected');
                clearInterval(aliveCheck);
            }
        };
    }
    // runs a callback on message event
    ws.on('message', (data) => {
        console.log('recieved websocket message: ' + data)
        message = '';
        if (data[0] == 'c' && connections == 2) {
            rCrd = data.substring(1, 3);
            console.log('got a click at ' + rCrd + ' from player ' + data[3]);
            if (gamestate[1] == '1') {
                if (gamestate[0] == data[3]) {
                    if (amzPos[gamestate[0]].includes(rCrd)) {
                        activePos = rCrd;
                        console.log('active position is now set to ' + activePos + 'and the game state is now ' + gamestate);
                        message = 'ac' + activePos;
                        validMoves();
                    } else {
                        console.log('attempted move');
                        // slope = (parseInt(activePos[0]) - parseInt(data[1])) / (parseInt(activePos[1]) - parseInt(data[2]));
                        // console.log('slope of ' + slope)
                        if (moves.includes(rCrd)) {
                            amzPos[1] = amzPos[1].filter(e => e !== activePos);
                            amzPos[2] = amzPos[2].filter(e => e !== activePos);
                            if (amzPos[1].length < amzPos[2].length) {
                                console.log('create white piece at ' + rCrd);
                                amzPos[1].push(rCrd);
                            } else {
                                console.log('create black piece at ' + rCrd);
                                amzPos[2].push(rCrd);
                            }
                            console.log(amzPos);
                            message = 'mm' + rCrd;
                            activePos = '';
                            gamestate = gamestate[0] + '2';
                            validMoves();
                        }
                    }
                }
            } else if (gamestate[1] == '2') {
                if (moves.includes(rCrd)) {
                    message = 'ar' + rCrd;
                    arrwPos.push(rCrd);
                    if (gamestate[0] == '1') {
                        gamestate = '21'
                    } else {
                        gamestate = '11'
                    }
                }
            }
            // sends the data to all connected clients
            if (message !== '') {
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        console.log('sent message to a client: ' + message);
                        client.send(message);
                        client.send('gs'+gamestate)
                    }
                });
            }
            console.log(winCon(1))
            console.log(winCon(2))
            if (winCon(1) !== false) {
                if (winCon(1) > winCon(2)) {
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send('wi1w');
                            reset();
                        }
                    });
                } else {
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send('wi2w');
                            reset();
                        }
                    });
                }
            }
        }
    });
});
function validMoves() {
    moves = [];
    var paths = {
        up: [0, 1],
        down: [0, -1],
        right: [1, 0],
        left: [-1, 0],
        upRight: [1, 1],
        upLeft: [-1, 1],
        downRight: [1, -1],
        downLeft: [-1, -1]
    };
    for (let step = 1; step < 9; step++) {
        for (const dir in paths) {
            var square = (parseInt(rCrd[0]) + (parseInt(paths[dir][0]) * step)).toString() + (parseInt(rCrd[1]) + (parseInt(paths[dir][1]) * step)).toString();
            //console.log('x vlaue of click: ' + parseInt(rCrd[0]));
            //console.log('change in x for direction: ' + paths[dir][0] * step);
            //console.log('y vlaue of click: ' + parseInt(rCrd[1]));
            //console.log('change in y for direction: ' + paths[dir][1] * step);
            //console.log(square);
            if (amzPos[1].includes(square) == false && amzPos[2].includes(square) == false && arrwPos.includes(square) == false) {
                moves.push(square);
            } else {
                paths[dir] = [0, 0]
            }
        }
    }
    return (moves);
}


function winCon(player) {
    viruses = []
    virusCount = 0;
    for (let a = 0; a < 10; a++) {
        viruses[a] = [];
        for (let b = 0; b < 10; b++) {
            viruses[a][b] = 'empty';
        }
    }
    for (let a = 0; a < 10; a++) {
        for (let b = 0; b < 10; b++) {
            if (amzPos[player].includes(String(a) + String(b))) {
                viruses[a][b] = 'virus';
                virusCount++;
            }
        }
    }
    if (player == 1) {
        for (let a = 0; a < 10; a++) {
            for (let b = 0; b < 10; b++) {
                if (amzPos[2].includes(String(a) + String(b))) {
                    viruses[a][b] = 'player';
                }
            }
        }
    }
    if (player == 2) {
        for (let a = 0; a < 10; a++) {
            for (let b = 0; b < 10; b++) {
                if (amzPos[1].includes(String(a) + String(b))) {
                    viruses[a][b] = 'player';
                }
            }
        }
    }
    for (let a = 0; a < 10; a++) {
        for (let b = 0; b < 10; b++) {
            if (arrwPos.includes(String(a) + String(b))) {
                viruses[a][b] = 'wall';
            }
        }
    }
    let end = 0
    possibleWin = true;
    while (end == 0) {
        end = 1
        for (let a = 0; a < 10; a++) {
            for (let b = 0; b < 10; b++) {


                if (viruses[a][b] == 'virus') {


                    for (let c = -1; c < 2; c++) {
                        if (viruses[a + c]) {
                            for (let d = -1; d < 2; d++) {



                                if (viruses[a + c][b + d] == 'empty') {
                                    viruses[a + c][b + d] = 'virus'
                                    virusCount++
                                    end = 0
                                }
                                if (viruses[a + c][b + d] == 'player') {
                                    possibleWin = false;
                                }


                            }
                        }
                    }
                }


            }
        }
    }
    if (possibleWin == true) {
        return (virusCount);
    } else {
        return (false);
    }
}


// game info
var gamestate;
var activePos;
var message;
var moves;
var rCrd;
var amzPos;
var arrwPos;
function reset() {
    gamestate = '11'
    activePos = '';
    moves = [];
    amzPos = {
        1: ['06', '39', '69', '96'],
        2: ['03', '30', '60', '93']
    };
    arrwPos = [];
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            console.log('reseting game for each client');
            client.send('rr');
        }
    });
}