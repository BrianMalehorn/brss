/// <reference path="./definitely-typed/express.d.ts"/>
/// <reference path="./definitely-typed/node.d.ts"/>
/// <reference path="./typescript-node-definitions/mongodb.d.ts"/>


import mongo = module('mongodb');
import fs = module('fs');
import express = module('express');
import http = module('http');

import util = module('utilities');
import database = module('database');

var app = express();
app.use(express.bodyParser());

app.get("/", function(request, response) : void {
  response.send("Hello, world!");
});

var ipAddress : string = process.env.OPENSHIFT_INTERNAL_IP || "localhost";
var port : number = process.env.OPENSHIFT_INTERNAL_PORT || 8000;

database.start(function(err) {
  util.throwIt(err);
  console.log("%s: trying on %s:%d",
              (new Date()).toString(), ipAddress, port);
  app.listen(port, ipAddress, -1, function() : void {
    console.log("%s: started on %s:%d",
                (new Date()).toString(), ipAddress, port);
  });
});
