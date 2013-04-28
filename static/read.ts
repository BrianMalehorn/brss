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

  declare var fillDiv : (JQuery) => void;
  declare var emptyDiv : (JQuery) => void;
  declare var insertItems : (items : ClItem[]) => void;

  var feedIdThatLoadsMoreItems : string = "";

  // given a div with div.data("self") being an item, empties it out and fills
  // its contents with the contents of item.
  var fillDiv = function(div : JQuery) : void {
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
  };

  var emptyDiv = function(div : JQuery) : void {
    // fix the height of the div so when you empty it, its size doesn't change
    div.height(div.height());
    div.empty();
  };

  // Put all these items into #readList, setting all the extra insertion
  // stuff as well.
  var insertItems = function(items : ClItem[]) : void {

    var divs : JQuery[] = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var div = $("<div>").data("self", item);
      fillDiv(div);
      divs.push(div);
      $("#readList").append(div);
    }

    // now that you've added some, select which feed should load more items
    var containers : JQuery = $(".itemContainer");
    if (containers.length == 0)
      return;
    var index : number = containers.length - 1 - NTH_LAST;
    feedIdThatLoadsMoreItems = $(containers[index]).data("self")._id;

    // for every div, make it hide/show itself when scrolled
    // over. Additionally, if it is The Feed That Shall Bring Others, it
    // triggers more items to be loaded.
    divs.forEach(function(div : JQuery) {

      var onViewChange = function(event, isInView : bool) {
        var item : ClItem = div.data("self");

        if (isInView) {
          fillDiv(div);
        } else {
          emptyDiv(div);
        }

        if (isInView && item._id === feedIdThatLoadsMoreItems) {
          // if this ajax call takes a while, get rid of
          // feedIdThatLoadsMoreItems so that more re-scrolls don't load more
          // and more items while you're waiting
          feedIdThatLoadsMoreItems = "";
          var allDivs : JQuery = $(".itemContainer");
          Misc.assert(allDivs.length > 0);
          var lastItem : ClItem = $(allDivs[allDivs.length-1]).data("self");
          $.ajax({
            type: 'get',
            url: "/next-n-items",
            data: {
              feedId: lastItem.feedId,
              date: lastItem.date,
              n: NUM_ADDITIONAL_ITEMS,
            },
            success: function(data : string) {
              var items : ClItem[] = JSON.parse(data);
              insertItems(items);
            },
          });
        }
      };

      div.bind('inview', onViewChange);

      // $(window).one('scroll', function() {
      //   console.log(div.data("inview"));
      //   // onViewChange(null, div.data("inview"));
      // });

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
