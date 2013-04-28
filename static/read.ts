/// <reference path="./client-interfaces.ts"/>
/// <reference path="./definitions.ts"/>

module Read {

  ///////////////////////////////////////////////////
  // read feed
  ///////////////////////////////////////////////////

  // how many items to load to begin with.
  var NUM_INITIAL_ITEMS : number = 5;
  // how many more items to load at once
  var NUM_ADDITIONAL_ITEMS : number = 5;
  // 0: on the last element, load more. 1: on the 2nd to last element, load
  // more.
  var NTH_LAST : number = 4;

  Misc.assert(NUM_INITIAL_ITEMS > NTH_LAST);

  declare var fillDiv : (JQuery) => JQuery;
  declare var emptyDiv : (JQuery) => JQuery;
  declare var insertItems : (items : ClItem[]) => void;

  // given a div with div.data("self") being an item, empties it out and fills
  // its contents with the contents of item.
  var fillDiv = function(div : JQuery) : JQuery {
    var item : ClItem = div.data("self");
    (div
     .empty()
     .append($("<h3>") // title
             .append($("<a>")
                     .attr('href', item.url)
                     .attr('target', '_blank')
                     .text(item.title)))
     .append($("<div>") // description
             .html(item.description)
             .addClass('itemDescription'))
     .addClass('itemContainer'));
    return div;
  };

  var emptyDiv = function(div : JQuery) : JQuery {
    // fix the height of the div so when you empty it, it's size doesn't change
    div.height(div.height());
    return div.empty();
  };

  // Put all these items into #readList, setting all the extra insertion
  // stuff as well.
  var insertItems = function(items : ClItem[]) : void {

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var div = $("<div>").data("self", item);
      fillDiv(div);
      $("#readList").append(div);
    }

    // when the last item is in view, load the next ADDITIONAL_ITEMS items and
    // add them recursively.

    var containers : JQuery = $(".itemContainer");
    if (containers.length == 0)
      return;
    var index : number = containers.length - 1 - NTH_LAST;
    var last = $(containers[index]);
    console.log(last);
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
            n: NUM_ADDITIONAL_ITEMS,
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
        n: NUM_INITIAL_ITEMS,
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
