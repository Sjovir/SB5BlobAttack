const {Player, Point, COLOR, DIRECTION} = require('./player.js');
var exports = module.exports = {};

const WIDTH = 800;
const HEIGHT = 350;
const SPAWN_MARGIN = 20;
const FRAME_RATE = 10;

exports.Game = class Game {
    constructor (port, _sendDataMethod) {
        this.port = port;
        this.sendDataMethod = _sendDataMethod;
        this.sendDataMethod;
        this.newRound();
    }

    start () {
        if (this.started)
            return;
        
        setInterval(this.update.bind(this), 1000 / FRAME_RATE);
        this.started = true;

        console.log("Game startet on port " + this.port);
    }

    addPlayer (name) {
        if (!this.validatePlayer(name))
            return false;

        let startPosition = getRandomPosition(this.players);
        let speed = 36 / FRAME_RATE;
        let angleSpeed = 72 / FRAME_RATE;
        let angle = Math.random() * 360;
        let size = 10;

        let color = getRandomColor(this.players);

        this.players.push(new Player(name, startPosition.x, startPosition.y, 
            speed, angleSpeed, angle, size, color, FRAME_RATE));
        

        this.sendDataMethod(this.port, {type: "UPDATE", players: this.players});

        console.log("Added " + this.players[this.players.length - 1].name);
        
        return true;
    }

    playerPressKey (playerName, key) {
        let player = getPlayer(playerName, this.players);
        
        if (key === "SPACE") {
            if (this.winner === undefined)
                this.start();
            else
                this.newRound(this.players);
        } else if (player !== null) {
            player.changeDirection(true, key);
        }
    }

    playerReleaseKey (playerName, key) {
        let player = getPlayer(playerName, this.players);
        
        if (player !== null) {
            player.changeDirection(false, key);
        }
    }

    update () {
        if (!this.started || this.players.length === 0 || this.winner !== undefined) return;
        
        if (this.checkEndGame())
            return;

        this.players.forEach((player) => {
            if (player.alive)
                player.update();
        });
    
        this.checkCollision(this.players);

        this.sendDataMethod(this.port, {type: "UPDATE", players: this.players});
    }

    validatePlayer (name, color) {
        this.players.forEach(player => {
            if (player.name === name && player.color === color)
                return false;
        })

        return true;
    }

    newRound (previousPlayers) {
        this.started = false;
        this.winner = undefined;
        this.players = [];

        if (previousPlayers !== undefined)
        {
            previousPlayers.forEach( player => {
                this.addPlayer(player.name);
            });
        }

    }

    checkEndGame () {
        if (this.winner !== undefined)
            return true;

        let playersAlive = getPlayersAlive(this.players);
        if (playersAlive.length === 1) { // End game
            this.winner = playersAlive.shift();
            this.sendDataMethod(this.port, {type: "END", winner: this.winner});
            console.log("Game (" + this.port + ") ended");
            return true;
        } else
            return false;
    }

    checkCollision () {
        this.players.forEach( targetPlayer => {
            if (!targetPlayer.alive)
                return;
            
            let targetName = targetPlayer.name;
            let targetRadius = targetPlayer.size;
    
            // Out of bounds
            if (targetPlayer.x < targetRadius / 2 || targetPlayer.x > WIDTH - targetRadius / 2 ||
                targetPlayer.y < targetRadius / 2 || targetPlayer.y > HEIGHT - targetRadius / 2) {
                this.killPlayer(targetPlayer);
                return;
            }
    
            // Collision with enemies
            this.players.forEach( enemyPlayer => {
                if (!targetPlayer.alive || this.winner !== undefined)
                    return;
                
                let enemyName = enemyPlayer.name;
                
                let enemyPositions = enemyPlayer.positions.slice();
                if (enemyPositions === undefined)       // No positions
                    return;
                
                if (targetName === enemyName)           // Delete own x positions
                {
                    let positionsToRemove = Math.ceil(targetRadius / targetPlayer.speed);
                    
                    positionsToRemove = positionsToRemove > enemyPositions.length ? 
                        enemyPositions.length : positionsToRemove;
                    
                    enemyPositions.splice(- positionsToRemove, positionsToRemove);
                }
    
                if (enemyPositions.length === 0)        // Check if any positions to collide with
                    return;
    
                enemyPositions.forEach( position => {
                    if (!targetPlayer.alive || this.winner !== undefined)
                        return;
                    
                    if (targetRadius > getDistance(targetPlayer, position))
                    {
                        this.killPlayer(targetPlayer);
                    }
                });
            });
        });
    }
    
    killPlayer (player) {
        player.alive = false;
        this.checkEndGame();
        console.log(player.name + " died x: " + player.x + " y: " + player.y);
    }

    getGameWidth () { return WIDTH;}
    getGameHeight () { return HEIGHT;}
}

let getRandomPosition = (players) => {
    let x, y;
    let collision = false;

    do {
        x = Math.random() * (WIDTH - 2 * SPAWN_MARGIN) + SPAWN_MARGIN;
        y = Math.random() * (HEIGHT - 2 * SPAWN_MARGIN) + SPAWN_MARGIN;

        players.forEach(player => {
            let xDiff = player.x - x;
            let yDiff = player.y - y;
            let distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

            if (distance < player.size)
                collision = true;
        });
    } while (collision === true);

    return new Point(x, y);
}

let getRandomColor = (players) => {
    let colors, index;
    let color = undefined;

    do {
        colors = Object.keys( COLOR );
        index = Math.floor(Math.random() * colors.length);
        color = COLOR[colors[index]];
        
        players.forEach( player => {
            if (player.color === color)
                color = undefined;
        });
    } while (color === undefined)

    return color;
}

let getPlayer = (playerName, players) => {
    let player = null;
    players.forEach(p => {
        if (p.name === playerName)
            player = p;
    });

    return player;
}

let getPlayersAlive = (players) => {
    let alive = []

    players.forEach( player => {
        if (player.alive)
            alive.push(player);
    });

    return alive;
}

let getDistance = (player, targetPoint) => {
    let xDiff = player.x - targetPoint.x;
    let yDiff = player.y - targetPoint.y;
    let distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

    return distance;
}