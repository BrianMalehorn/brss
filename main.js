

var express = require('express')
var app = express();
app.use(express.bodyParser());
var ipAddress = process.env.OPENSHIFT_INTERAL_IP || "localhost";
var port = process.env.OPENSHIFT_INTERAL_PORT || 8000;
app.get("/", function (request, response) {
    response.send("Hello, world!");
});
app.listen(port, ipAddress, -1, function () {
    console.log("%s: started on %s:%d", (new Date()).toString(), ipAddress, port);
});
