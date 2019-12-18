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

    var webSockOpts=
    {port         :port
    ,verifyClient : function (info, callback) {
        var question=null//url.parse(info.req.url, true, true);
        let origin = info.origin
        console.log(info);
        
        if (origin === "https://localhost:8000") {
           status= true; // I'm happy
           code  = 400;  // everything OK
           msg   = '';   // nothing to add
        } else {
           status= false; // I'm noy happy
           code  = 404;  //  key is invalid
           msg   = 'Unauthorized cookie key';
        }
        callback (status,code,msg);
      }
    };
    // let wsServer = new Server(webSockOpts);
    // let wsServer = new Server({port: port});
    let wsServer = new Server({ server: httpsServer});
    // var WebSocketServer = require('websocket').server;
    // let wsServer = new WebSocketServer({ httpServer: httpsServer });
    servers.push(wsServer);

    wsServer.on('connection', (ws) => {
        // console.log(ws);
        
        ws.on('close', () => console.log('Closing connection..'));

        ws.on('message', (data) => {
            clientUpdate(wsServer, data);
        });
        ws.on('request', (request) => {
            console.log(request);
            console.log(request.cookies);
        });
        // ws.on('keydown', (data) => {
        //     console.log(data);
        // });
    });

    wsServer.game = new Game(port, sendData);
    
    httpsServer.listen(port);

    console.log('New server socket on port ' + port);

    return port;
}

exports.getGame = function(gamePort, playerName, cookieKey) {
    console.log("Get-game: " + gamePort + " | " + playerName);
    
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
    }
    
    return playerKey;
}