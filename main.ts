/// <reference path="./definitely-typed/express.d.ts"/>
/// <reference path="./definitely-typed/node.d.ts"/>
/// <reference path="./typescript-node-definitions/mongodb.d.ts"/>

import f = module('foo');
import fs = module('fs');
import express = module('express');

var app = express();
app.use(express.bodyParser());

var ipAddress : string = process.env.OPENSHIFT_INTERNAL_IP || "localhost";
var port : number = process.env.OPENSHIFT_INTERNAL_PORT || 8000;

app.get("/", function(request, response) : void {
    response.send("Hello, world!");
});

console.log("%s: trying on %s:%d",
            (new Date()).toString(), ipAddress, port);
app.listen(port, ipAddress, -1, function() : void {
    console.log("%s: started on %s:%d",
                (new Date()).toString(), ipAddress, port);
});
