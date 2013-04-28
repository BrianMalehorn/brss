/// <reference path="./client-interfaces.ts"/>
/// <reference path="./definitions.ts"/>

module Read {

  ///////////////////////////////////////////////////
  // read feed
  ///////////////////////////////////////////////////

  var INITIAL_ITEMS : number = 10;
  var ADDITIONAL_ITEMS : number = 5;

  // Put all these items into #readList, setting all the extra insertion
  // stuff as well.
  var insertItems = function(items : ClItem[]) : void {

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
        .addClass('itemContainer')
         // store the item itself here in case I need it later
        .data("self", item);
      $("#readList").append(div);
    }

    // when the last item is in view, load the next ADDITIONAL_ITEMS items and
    // add them recursively.
    var last : JQuery = $(".itemContainer").last();
    last.bind('inview', function(event, isInView : bool) {
      if (isInView) {
        var item : ClItem = last.data("self");
        last.unbind('inview');
        $.ajax({
          type: 'get',
          url: "/next-n-items",
          data: {
            feedId: item.feedId,
            date: item.date,
            n: ADDITIONAL_ITEMS,
          },
          success: function(data : string) {
            var items : ClItem[] = JSON.parse(data);
            insertItems(items);
          },
        });
      }
    });

  };

  export var enterRead = function(feed : ClFeed, callback ?: () => void) {
    callback = callback || function() { };
    $("#read").css('display', 'block');
    Misc.changeHash("#read");
    Misc.lastFeed = feed;

    $("#read").css('display', 'block');
    $("#readList").append($("#loaderImage").clone());

    $.ajax({
      type: 'get',
      url: "/next-n-items",
      data: {
        feedId: feed._id,
        date: (new Date()).getTime(),
        n: INITIAL_ITEMS,
      },
      success: function(data : string) {
        // now that you have the items, add them all to the DOM.
        var items : ClItem[] = JSON.parse(data);
        $("#readList").empty();
        insertItems(items);
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
