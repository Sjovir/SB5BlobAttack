let connected = false;
let ws;
let name;
var canvas;

let establishConnection = function() {
    if (connected) return;
    let port = document.getElementById("inputID").value;
    getGame(port);
};

let initializeWebSocket = function(game) {
    let url = document.getElementById("inputUrl").value;
    let port = document.getElementById("inputID").value;
    amountOfPlayers = game["players"].length;
    // console.log("player amount: " + amountOfPlayers);
    

    if (amountOfPlayers > 3) {
        document.getElementById("errmsg").innerHTML =
        "The max amount of players: " +
        amountOfPlayers +
        ", has been reached, join a new game or make your own.";
    } else {
        ws = new WebSocket("ws://" + url + ":" + port);
        ws.onopen = () => {
        name = document.getElementById("inputName").value;
        ws.send(JSON.stringify({ name }));
        connected = true;
        console.log("connected");
        createCanvas();
        };
        ws.onclose = () => {
        connected = false;
        console.log("disconnected");
        };
        ws.onerror = e => console.log("Something went wrong:", e);

        ws.onmessage = gameData => {
            let msg = JSON.parse(gameData.data);
            if (msg.type === "UPDATE") {
                let playerData = msg.players;
                updateCanvas(playerData);
                updatePlayerInfo(playerData);
            } else if (msg.type === "END") {
                let winner = msg.winner
                console.log(winner.name + " has won the game");
            } else
                console.log("Invalid message received");
            
        };
    }
};

document.onkeydown = event => {
    if (!connected) return;

    switch (event.key) {
        case "ArrowLeft":
        ws.send(JSON.stringify({ name, keydown: "LEFT" }));
        break;
        case "ArrowRight":
        ws.send(JSON.stringify({ name, keydown: "RIGHT" }));
        break;
        case " ":
        ws.send(JSON.stringify({ name, keydown: "SPACE" }));
        default:
        // console.log("Not a valid key");
    }
};

document.onkeyup = event => {
    if (!connected) return;

    switch (event.key) {
        case "ArrowLeft":
        ws.send(JSON.stringify({ name, keyup: "LEFT" }));
        break;
        case "ArrowRight":
        ws.send(JSON.stringify({ name, keyup: "RIGHT" }));
        break;
        default:
        // console.log("Not a valid key");
    }
};

let createCanvas = () => {
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 350;
    canvas.context = canvas.getContext("2d");
    canvas.context.shadowBlur = 10;
    canvas.context.shadowColor = "black";
    document.body.insertBefore(canvas, document.getElementById("empty"));

    canvas.clear = () => {
        canvas.context.clearRect(0, 0, canvas.width, canvas.height); // clear canvas in order to update current posisitons
    };
    console.log(canvas);
};

let updateCanvas = playerData => {
    canvas.clear();

    playerData.forEach(player => {
        let ctx = canvas.context;
        let points = player.positions;
        ctx.fillStyle = player.color;

        points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, player.size / 2, 0, 2 * Math.PI);
        ctx.fill();
        });
    });
};

let updatePlayerInfo = playerData => {
    let div = document.getElementById("opps");
    let playerColor = document.getElementById("player-color");
    div.innerHTML = "";
    playerColor.innerHTML = "";

    playerData.forEach(player => {
        let name = player.name;
        let color = player.color;
        div.innerHTML += `<span style="color: ${color};"> ${name} </span> <br>`;
    });
}

let getGame = function(port) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        let gameArr = [];
        gameArr = JSON.parse(xmlHttp.responseText).gameInfo;
        if (gameArr !== undefined) {
            initializeWebSocket(gameArr);
        }
        }
    };
    xmlHttp.open("GET", "/get-game?port=" + port, true); // true for asynchronous
    xmlHttp.send();
};