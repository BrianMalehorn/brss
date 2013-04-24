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

    $("#read").css('display', 'block');
    $("#readList").append($("#loaderImage").clone());

    $.ajax({
      type: 'get',
      url: "/gimmie-some-items",
      data: {
        feedId: feed._id
      },
      success: function(data : string) {
        // now that you have the items, add them all to the DOM.
        var items : ClItem[] = JSON.parse(data);
        $("#readList").empty();
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
          $("#readList").prepend(div);
        }

        callback();
      }
    });
  };

  export var exitRead = function(callback ?: () => void) : void {
    callback = callback || function() { };
    $("#read").css('display', 'none');
    $("#readList").empty();
    callback();
  };


  $(window).on('load', function() {
    $("#readBack").onButtonTap(function() {
      exitRead(View.enterView);
    });
  });

}
