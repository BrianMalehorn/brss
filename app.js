#!/bin/env/node

var express = require('express');
var fs = require('fs');
var app = express();
app.use(express.bodyParser());

var port = process.env.OPENSHIFT_INTERNAL_PORT;
// debug or no default port means testing: port 8000
port = !port ? 8000 : port;
var ipAddress = process.env.OPENSHIFT_INTERNAL_IP || "localhost";

app.get("/", function(request, response) {
    response.send("Hello, world!");
});

console.log("%s: Attempting to start server on %s:%d",
            Date(Date.now()), ipAddress, port);
app.listen(port, ipAddress, function() {
    console.log("%s: Node server started on %s:%d",
                Date(Date.now()), ipAddress, port);
});
