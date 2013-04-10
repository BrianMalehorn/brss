$(document).ready(function() {

    var colors = ["blue", "red", "yellow"];
    var colorIndex = 0;
    var nextColor = function() {
        var color = colors[colorIndex];
        colorIndex = (colorIndex + 1) % colors.length;
        return color;
    };

    var currentNumber = 0;
    var nextNumber = function() {
        return ++currentNumber;
    };

    // firstDiv.on('appear', function(event) {
    //     console.log("@@@");
    // });

    $("body").append($("<div>")
                     .css("background-color", "green")
                     .css("height", "2000px")
                     .text("just keep scrolling!"));

    $("body").append( $("<div>")
                      .attr("id", "first")
                      .css("background-color", nextColor())
                      .css("height", "200px")
                      .text(nextNumber()))


    var alreadyAppeared = {};
    var addToEndOnFirstAppear = function(elem) {
        elem.appear();
        elem.on('appear', function() {
            // do nothing the next time you appear
            if (alreadyAppeared[elem.text()]) {
                return;
            }
            alreadyAppeared[elem.text()] = true;
            // insert the new div into the DOM
            var newDiv = $("<div>")
                .css("background-color", nextColor())
                .css("height", "200px")
                .text(nextNumber());
            $("body").append(newDiv);
            // and make that div spawn a new one similarly
            addToEndOnFirstAppear(newDiv);
        });
    };

    addToEndOnFirstAppear($("#first"));

});
