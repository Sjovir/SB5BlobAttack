const {Server} = require('ws');
const {Game} = require('./game.js');
var exports = module.exports = {};

exports.servers = servers = [];

let clientUpdate = (wsServer, data) => {
    data = JSON.parse(data);
    // console.log(data);
    if (data.playerKey !== undefined) {
        if (data.keydown !== undefined) {
            wsServer.game.playerPressKey(data.playerKey, data.keydown);
        } else if(data.keyup !== undefined) {
            wsServer.game.playerReleaseKey(data.playerKey, data.keyup);
        } else {
            wsServer.game.addPlayer(data.playerKey);
        }
    }
}

let sendData = (gamePort, gameData) => {
    for(let i = 0; i < servers.length; i++) {
        let server = servers[i];
        if (gamePort === server["options"]["port"]) {
            server.clients.forEach(c => c.send(JSON.stringify(gameData)));
        }
    }
}

exports.newServer = function() {
    let port = makeNewPort();
    if (port == null) {
        console.log("No more ports, unable to make new server.");
        return; 
    }

    let wsServer = new Server({port: port});
    servers.push(wsServer);

    wsServer.on('connection', (ws) => {
        ws.on('close', () => console.log('Closing connection..'));

        ws.on('message', (data) => {
            clientUpdate(wsServer, data);
        });
        ws.on('keydown', (data) => {
            console.log(data);
        });
    });

    wsServer.game = new Game(port, sendData);
    
    console.log('New server socket on port ' + port);

    return port;
}

exports.getGame = function(gamePort, playerName) {
    for(let i = 0; i < servers.length; i++) {
        let server = servers[i];
        if (gamePort == server.options.port) {
            let game = this.servers[i]['game'];
            
            if (game.players.find(player => player.name === playerName) !== undefined) {
                let error = "The game is full. No more players allowed";
                return { error };
            }
            
            return {game, playerKey: playerName};
        }
    } 
    return null;
}

let makeNewPort = () => {
    let port = 7000; 
    let maxPort = 7999;  
    if (servers.length != 0) {
        let newPort = getMaxPort();
        if (newPort == maxPort) {
            console.log("All the ports are taken.");
            return null; 
        } else {
            port = ++newPort; 
        }
    }
    return port; 
}

let getMaxPort = () => {
    let port = 0; 
    for(let i = 0; i < servers.length; i++) {
        let tmpPort = servers[i]["options"]["port"];
        if (tmpPort > port) {
            port = tmpPort; 
        }
    }
    return port; 
}