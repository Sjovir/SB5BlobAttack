let wsServer = require('./server/wsServer.js');

const express = require('express');
const cookieParser = require('cookie-parser')
const path = require('path');
const app = express();
const {readFileSync} = require('fs');
const {createServer} = require('https');

const port = 8000; 
exports.COOKIE_NAME = COOKIE_NAME = 'BlobAttackCookie';

// need cookieParser middleware before we can do anything with cookies
app.use(cookieParser());

// set a cookie
app.use(function (req, res, next) {
    // check if client sent cookie
    var cookie = req.cookies[COOKIE_NAME];
    if (cookie === undefined)
    {
        // no: set a new cookie
        var randomNumber=Math.random().toString();
        randomNumber=randomNumber.substring(2, randomNumber.length);
        res.cookie(COOKIE_NAME, randomNumber, { maxAge: 900000, httpOnly: true, secure: true });
        console.log('cookie created successfully');
    } 
    else
    {
        // yes, cookie was already present 
        console.log('cookie exists', cookie);
    } 
    next();
});

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
    let arr = wsServer.getGame(req.query.port, req.query.name, req.cookies[COOKIE_NAME]);
    res.json({gameInfo: arr});
});

app.get('/get-servers', (req, res) => {
    res.redirect("/");
    return JSON.stringify(wsServer.servers);
});

let httpsServer = createServer({
    key: readFileSync('./ssl/private.key'),
    cert: readFileSync('./ssl/public.cert')
    }, app);

    httpsServer.listen(port, () => {
        wsServer.setup(app);
        console.log(`Listening on port: ${port}`);
    });