const {Server} = require('ws');
const {readFileSync} = require('fs');
const {createServer} = require('https');
const url = require('url')

const {Game} = require('./game.js');

const Entities = require('html-entities').Html5Entities
const entities = new Entities();

var exports = module.exports = {};
exports.servers = servers = [];

exports.COOKIE_NAME = COOKIE_NAME = 'BlobAttackCookie';

let clientUpdate = (wsServer, data) => {
    data = JSON.parse(data);
    // console.log(data);
    if (data.playerKey !== undefined) {
        let name = entities.encode(data.name);
        let playerKey = data.playerKey;
        // console.log(name);
        if (data.keydown !== undefined) {
            wsServer.game.playerPressKey(playerKey, data.keydown);
        } else if(data.keyup !== undefined) {
            wsServer.game.playerReleaseKey(playerKey, data.keyup);
        } else {;
            wsServer.game.addPlayer(name, playerKey);
        }
    }
}

let sendData = (gamePort, gameData) => {
    for(let i = 0; i < servers.length; i++) {
        let server = servers[i];
        if (gamePort === server.game.port) {
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

    let newGame = new Game(port, sendData);
    
    let httpsServer = createServer({
        key: readFileSync('./ssl/private.key'),
        cert: readFileSync('./ssl/public.cert')
    });

    let verifyClient = function (info, callback) {
        let origin = info.origin;

        let request = info.req;
        let cookies = request.rawHeaders.find(entry => entry.includes(COOKIE_NAME));
        let cookie = cookies.split(';').find(entry => entry.includes(COOKIE_NAME));
        let cookieKey = cookie.split('=').pop();
        
        let playerName = '';
        let urlString = url.parse(request.url);
        let query = urlString.query;
        if (query !== null) {
            let playerNameQuery = query.split('&').find(entry => entry.includes('name'));
            playerName = playerNameQuery.split('=').pop();
        }
        let playerKey = encryptName(playerName, cookieKey);
        
        console.log('Verify Client: ' + cookieKey);
        
        if (origin === "https://localhost:8000" && newGame.keys.includes(playerKey) && newGame.getPlayer(playerKey) === null) {
           status= true; // Verified
        } else {
           status= false; // Not Verified
        }
        callback (status);
    }

    let wsServer = new Server({ server: httpsServer, verifyClient});
    
    servers.push(wsServer);

    wsServer.on('connection', (ws) => {
        ws.on('close', () => console.log('Closing connection..'));

        ws.on('message', (data) => {
            clientUpdate(wsServer, data);
        });
    });

    wsServer.game = newGame;
    
    httpsServer.listen(port);

    console.log('New server socket on port ' + port);

    return port;
}

exports.getGame = function(gamePort, playerName, cookieKey) {
    for(let i = 0; i < servers.length; i++) {
        let server = servers[i];
        // console.log(server);
        
        if (gamePort == server.game.port) {
            let game = this.servers[i]['game'];
            // console.log(game);
            
            let playerKey = encryptName(playerName, cookieKey);
            // if (game.players.find(player => player.name === playerName) !== undefined) {
            if (game.getPlayer(playerKey) !== null) {
                let error = "The name is already in use. Please select another name";
                return { error };
            } else if (game.players.length >= 4) {
                let error = "The game is full. No more players allowed";
                return { error };
            }
            
            game.addKey(playerKey);
            return {game, playerKey};
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

let encryptName = (name, key) => {
    let encryptKey = key.toString();
    let playerKey = '';
    for (let i = 0; i < encryptKey.length; i += 3) {
        let charIndex = i % name.length;
        let characterKey = name.charCodeAt(charIndex);
        let encryptKeyPart = encryptKey.charAt(i) + encryptKey.charAt(i + 1) + encryptKey.charAt(i + 2);
        let diff = encryptKeyPart - characterKey
        playerKey += Math.abs(diff);
        console.log(playerKey + ' diff:' + diff);
    }
    
    return playerKey + name;
}