let connected = false;
let ws;
let playerKey;
var canvas;

let establishConnection = function() {
    if (connected) return;
    let port = document.getElementById("inputID").value;
    let name = document.getElementById("inputName").value;
    getGame(port, name);
};

let initializeWebSocket = function(name, response) {
    if (response === null)
        return;

    if (response["error"] !== undefined) {
        document.getElementById("errmsg").innerHTML = response["error"];
        return;
    }

    playerKey = response["playerKey"];

    if (playerKey !== "" && playerKey !== undefined) {
        document.getElementById("errmsg").innerHTML = "";
        setupWebSocket(name, playerKey);
    } else {
        document.getElementById("errmsg").innerHTML =
            "Something went wrong when connecting to the game";
    }
};

let setupWebSocket = (name, playerKey) => {
    let url = document.getElementById("inputUrl").value;
    let port = document.getElementById("inputID").value;
    
    ws = new WebSocket("wss://" + url + ":" + port + '/?name=' + name);
        ws.onopen = () => {
            ws.send(JSON.stringify({ name, playerKey }));
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
            } else if (msg.type === "CLEAR") {
                canvas.clear();
            } else
                console.log("Invalid message received");
        };
}

document.onkeydown = event => {
    if (!connected) return;

    switch (event.key) {
        case "ArrowLeft":
            ws.send(JSON.stringify({ playerKey, keydown: "LEFT" }));
            break;
        case "ArrowRight":
            ws.send(JSON.stringify({ playerKey, keydown: "RIGHT" }));
            break;
        case " ":
            ws.send(JSON.stringify({ playerKey, keydown: "SPACE" }));
            break;
        default:
    }
};

document.onkeyup = event => {
    if (!connected) return;

    switch (event.key) {
        case "ArrowLeft":
            ws.send(JSON.stringify({ playerKey, keyup: "LEFT" }));
            break;
        case "ArrowRight":
            ws.send(JSON.stringify({ playerKey, keyup: "RIGHT" }));
            break;
        default:
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
};

let updateCanvas = playerData => {
    playerData.forEach(player => {
        let ctx = canvas.context;
        ctx.fillStyle = player.color;

        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size / 2, 0, 2 * Math.PI);
        ctx.fill();
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

let getGame = function(port, name) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        let gameArr = [];
        gameArr = JSON.parse(xmlHttp.responseText).gameInfo;
        if (gameArr !== undefined) {
            initializeWebSocket(name, gameArr);
        }
        }
    };
    xmlHttp.open("GET", "/get-game?port=" + port + "&name=" + name, true); // true for asynchronous
    xmlHttp.send();
};