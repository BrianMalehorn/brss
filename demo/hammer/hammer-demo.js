/* Demo of hammer.js */

$(document).ready(function() {

    var div = $("#message")[0];

    Hammer(div).on('tap', function(event) {
        $(div).text("You just tapped me!");
    });

    Hammer(div).on('doubletap', function(event) {
        $(div).text("You just double tapped me!");
    });

    Hammer(div).on('hold', function(event) {
        $(div).text("You're holding me!");
    });

    Hammer(div).on('dragleft', function(event) {
        $(div).text("dragleft: " + event.gesture.deltaX + "px");
    });

    Hammer(div).on('dragright', function(event) {
        $(div).text("dragright: " + event.gesture.deltaX + "px");
    });

    Hammer(div).on('swipeleft', function(event) {
        $(div).text("You just swiped left!");
    });

    Hammer(div).on('swiperight', function(event) {
        $(div).text("You just swiped right!");
    });

});
