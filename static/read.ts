/// <reference path="./client-interfaces.ts"/>
/// <reference path="./definitions.ts"/>

module Read {

  ///////////////////////////////////////////////////
  // read feed
  ///////////////////////////////////////////////////

  export var enterRead = function(feed : ClFeed, callback ?: () => void) {
    callback = callback || function() { };
    $("#read").css('display', 'block');
    Misc.changeHash("#read");
    Misc.lastFeed = feed;

    // TODO: make it possible for them to leave this page! No button out.
    $.ajax({
      type: 'get',
      url: "/gimmie-some-items",
      data: {
        feedId: feed._id
      },
      success: function(data : string) {
        // now that you have the items, add them all to the DOM.
        var items : ClItem[] = JSON.parse(data);
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var div = $("<div>")
            .append($("<h3>")
                    .append($("<a>")
                            .attr('href', item.url)
                            .attr('target', '_blank')
                            .text(item.title)))
            .append($("<div>")
                    .html(item.description)
                    .addClass('itemDescription'))
            .addClass('itemContainer');
          // we prepend here because we want earliest at the very top
          $("#read").prepend(div);
        }
        $("#read").css('display', 'block');
        var back = $("<div>").addClass("button").text("back");

        back.onButtonTap(function() {
          exitRead(View.enterView);
        });
        $("#read").prepend(back)
        callback();
      }
    });
  };

  export var exitRead = function(callback ?: () => void) : void {
    callback = callback || function() { };
    $("#read").css('display', 'none');
    $("#read").empty();
    callback();
  };


}
