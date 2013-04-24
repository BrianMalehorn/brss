/// <reference path="./client-interfaces.ts"/>
/// <reference path="./definitions.ts"/>

module View {

  ///////////////////////////////////////////////////
  // view feed
  ///////////////////////////////////////////////////

  // When you navigate to the subscriptionView page, you
  export var enterView = function(callback ?: () => void) {
    callback = callback || () => undefined;
    Misc.changeHash("#view");
    $("#view").css('display', 'block');

    // after both these ajax requests, call callback
    var lastly = _.after(2, callback);

    // update the user
    $.ajax({
      type: 'get',
      url: "/who-am-i-where-am-i",
      data: {
      },
      success: function(data : string) {
        Misc.user = JSON.parse(data);
        lastly();
      }
    });

    // update all of their subscription and put them in the DOM
    // ENDGAME: remove this ajax query if you've already got the data
    $.ajax({
      type: 'get',
      url: "/gimmie-my-feeds",
      data: {
      },
      success: function(data : string) {
        // cool, now we have the feeds array. Add it to the DOM.
        var unsorted : ClFeed[] = JSON.parse(data);
        var feeds : ClFeed[] = _.sortBy(unsorted, (f : ClFeed) => f.title);
        Misc.feeds = {};
        feeds.forEach(function(feed : ClFeed) {
          Misc.feeds[feed._id] = feed;
        });

        for (var _id in Misc.feeds) {
          var feed : ClFeed = Misc.feeds[_id];
          var div = ($('<div>')
                     .addClass('subscription')
                     // TODO: remove id thing. I don't think I ever
                     // use it
                     .attr('id', feed._id)
                     .text(feed.title));
          // if they click on this div, they should try to go read it
          (function(){
            var _feed = feed;
            div.onButtonTap(function() {
              exitView(function() {
                Read.enterRead(_feed);
              });
            });
          })();
          $("#subscriptionList").append(div);
        }

        lastly();
      }
    });
  };

  export var exitView = function(callback ?: Function) {
    callback = callback || function() { };
    $("#view").css('display', 'none');
    $("#subscriptionList").empty();
    callback();
  };



  $(window).on('load', function() {
    // and make it so when they click on the buttons at the
    // bottom, they can actually
    $('#addSubscription').onButtonTap(function() {
      // turn the lights off on your way out
      View.exitView(Add.enterAdd);
    });
    $('#editSubscription').onButtonTap(function() {
      View.exitView(Edit.enterEdit);
    });
  });

}
