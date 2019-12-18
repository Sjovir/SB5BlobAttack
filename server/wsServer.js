const {Server} = require('ws');
const {Game} = require('./game.js');
const {readFileSync} = require('fs');
const {createServer} = require('https');

const Entities = require('html-entities').Html5Entities
const entities = new Entities();

var exports = module.exports = {};
exports.servers = servers = [];

let app = null;

let clientUpdate = (wsServer, data) => {
    data = JSON.parse(data);
    // console.log(data);
    if (data.playerKey !== undefined) {
        let name = entities.encode(data.playerKey)
        // console.log(name);
        if (data.keydown !== undefined) {
            wsServer.game.playerPressKey(name, data.keydown);
        } else if(data.keyup !== undefined) {
            wsServer.game.playerReleaseKey(name, data.keyup);
        } else {;
            wsServer.game.addPlayer(name);
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

exports.setup = function(expressApp) {
    app = expressApp;
}

exports.newServer = function() {
    let port = makeNewPort();
    if (port == null) {
        console.log("No more ports, unable to make new server.");
        return; 
    }
    
    let httpsServer = createServer({
        key: readFileSync('./ssl/private.key'),
        cert: readFileSync('./ssl/public.cert')
    }, app);

    // let wsServer = new Server({port: port});
    // let wsServer = new Server({ server: httpsServer});
    var WebSocketServer = require('websocket').server;
    let wsServer = new WebSocketServer({ httpServer: httpsServer });
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
    
    httpsServer.listen(port);

    console.log('New server socket on port ' + port);

    return port;
}

exports.getGame = function(gamePort, playerName) {
    console.log("Get-game: " + gamePort + " | " + playerName);
    
    for(let i = 0; i < servers.length; i++) {
        let server = servers[i];
        console.log(server);
        
        if (gamePort == server.game.port) {
            let game = this.servers[i]['game'];
            console.log(game);
            
            if (game.players.find(player => player.name === playerName) !== undefined) {
                let error = "The name is already in use. Please select another name";
                return { error };
            } else if (game.players.length >= 4) {
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