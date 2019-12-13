let wsServer = require('./server/wsServer.js');

const express = require('express');
const path = require('path');
const app = express();
const port = 8000; 

app.use(express.static(path.join(__dirname, 'client')));

app.get('/', (req, res) => {
    res.redirect('client.html');
});

app.get('/new-server', (req, res) => {
    let serverPort = wsServer.newServer();
    res.json({port: serverPort});
    // res.redirect("/");
});

app.get('/get-game', (req, res) => {
    let arr = wsServer.getGame(req.query.port);
    res.json({gameInfo: arr});
});

app.get('/get-servers', (req, res) => {
    res.redirect("/");
    return JSON.stringify(wsServer.servers);
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});