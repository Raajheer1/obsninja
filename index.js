var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var https = require('https');
const domain = 'node.presentationman.com';
const WebSocket = require("ws");

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/static/index.html'));
});

app.use(express.static("static/"));

https.createServer({
    cert: fs.readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
    key: fs.readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`)
}, app).listen(443);

var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);

const server = https.createServer({
    cert: fs.readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
    key: fs.readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`)
});

const wss = new WebSocket.Server({ server });
console.log("WebSocket Server is running on Port 8080\n\n");
var numtotal = 0;

wss.on('connection', (ws) => {
    console.log("Client Connected\n\n");
    ++numtotal;
    console.log(numtotal);

    ws.room = [];
    ws.send(JSON.stringify({ msg: "Welcome to the ChatRoom!" }));


    ws.on('message', (data) => {
            console.log('message: ', data);
            var message = JSON.parse(data);

            if (message.join) {
                    ws.room.push(message.join);
            }
            if (message.room) {
                    broadcast(JSON.stringify(message));
            }
            if (message.msg) {
                    console.log('message: ', message.msg);
            }
    });

    ws.on('error', (e) => {
            console.log(e);
            --numtotal;
    });
    ws.on('close', (e) => {
            console.log("The WebSocket Closed; Event: " + e);
            --numtotal;
    });
});

function broadcast(message) {
    wss.clients.forEach(client => {
            if(client.room.indexOf(JSON.parse(message).room) > -1){
                    client.send(message);
            }
    });
}

server.listen(8080, () => {
    console.log("Server is listening on port 8080.");
});

