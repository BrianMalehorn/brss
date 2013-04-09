var express = require("express");
var app = express();

app.get("/:filename", function(request, response) {
    response.sendfile(request.params.filename);
});

app.listen(8000);
