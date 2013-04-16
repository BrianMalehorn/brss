/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="../definitely-typed/jquery.d.ts"/>

declare var _ : Lodash;
import I = module('../interfaces');
// TODO: make Hammer at least a little typesafe
declare var Hammer : any;

/* The global state */
interface Global {
  feeds : {[_id: string]: I.ClFeed;};
  user : I.ClUser;
}

var G : Global = {
  feeds: undefined,
  user: undefined,
};



$(document).ready(function() {


  ///////////////////////////////////////////////////
  // view feed
  ///////////////////////////////////////////////////

  // When you navigate to the subscriptionView page, you
  var switchToView = function(callback ?: () => void) {
    callback = callback || () => undefined;

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
        G.user = JSON.parse(data);
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
        $("#subscriptionList").empty();
        G.feeds = {};
        var feedsArray : I.ClFeed[] = JSON.parse(data);
        for (var i = 0; i < feedsArray.length; i++) {
          var feed = feedsArray[i];
          G.feeds[feed._id] = feed;
        }

        for (var _id in G.feeds) {
          var feed : I.ClFeed = G.feeds[_id];
          var div = ($('<div>')
                     .addClass('subscription')
                     .attr('id', feed._id)
                     .text(feed.title))[0];
          // if they click on this div, they should try to go read it
          (function(){
            var _feed = feed;
            Hammer(div).on('tap', function(event) {
              $("#view").css('display', 'none');
              switchToRead(_feed);
            });
          })();
          $("#subscriptionList").append(div);
        }

        lastly();
      }
    });
  };

  // and make it so when they click on the buttons at the
  // bottom, they can actually
  Hammer($('#addSubscription')[0]).on('tap', function(event) {
    // turn the lights off on your way out
    $("#view").css('display', 'none');
    switchToAdd();
  });

  Hammer($('#editSubscription')[0]).on('tap', function(event) {
    $("#view").css('display', 'none');
    switchToEdit();
  });


  ///////////////////////////////////////////////////
  // add feed
  ///////////////////////////////////////////////////

  var alreadyHammerfiedAddButton = false;

  // submit the search, ultimately going back to the home page.
  // async.
  var addSubmit = function(callback ?: Function) {
    callback = callback || function() { };
    var siteUrl : string = $("#searchBox").val();
    $.ajax({
      type: 'post',
      url: "/add-feeds",
      data: {
        url: siteUrl
      },
      success: function(data) {
        // data is a JSON-encoded version of the feeds you added
        $("#add").css('display', 'none');
        switchToView();
      }
    });
  };

  var switchToAdd = function(callback ?: () => void) {
    callback = callback || function() { };
    $("#add").css('display', 'block');

    // for some reason, it only works to hammerfy button when they're visible
    // or something. Has to be put in this function
    if (!alreadyHammerfiedAddButton) {
      alreadyHammerfiedAddButton = true;
      Hammer($("#addButton")[0]).on('tap', function(event) {
        addSubmit();
      });
    }

    callback();
  };

  $("#searchBox").keydown(function(event) {
    // if they hit return, submit it
    if (event.keyCode === 13) {
      addSubmit();
      // make it so that the key doesn't actually have its effect
      return false;
    }
  });



  ///////////////////////////////////////////////////
  // edit/remove feeds
  ///////////////////////////////////////////////////

  var switchToEdit = function(callback ?: () => void) {
    callback = callback || function() { };
    // make the old one not visible
    $("#edit").css('display', 'block');
    $("#keepList").empty();

    // generate keepList's elements
    for (var _id in G.feeds) {
      (function(){
        var feed = G.feeds[_id];
        // each one will have a div with a checkbox and some text inside
        var div = $('<div>').addClass('keeper').attr('id', feed._id);
        var checkbox = $('<input>')
          .attr('type', 'checkbox')
          .click(function() {
            // it's bad if it's not checked
            div.toggleClass('bad', !checkbox.is(':checked'));
          })
          .prop('checked', true);
        div.append(checkbox).append(feed.title);
        $("#keepList").append(div);
      })();
    }
  };

  Hammer($('#saveSubscription')[0]).on('tap', function(event) {
    var bads = $(".keeper.bad");
    var badIds : string[] = _.map(bads, (e) => e.id);
    console.log(badIds);
    $.ajax({
      type: 'delete',
      url: "/delete-these-feeds",
      data: {
        feedIds: badIds
      },
      success: function(data) {
        $("#edit").css('display', 'none');
        switchToView();
      }
    });
  });


  ///////////////////////////////////////////////////
  // read feed
  ///////////////////////////////////////////////////

  var switchToRead = function(feed : I.ClFeed, callback ?: () => void) {
    callback = callback || function() { };
    $("#read").css('display', 'block');

    // TODO: make it possible for them to leave this page! No button out.
    $.ajax({
      type: 'get',
      url: "/gimmie-some-items",
      data: {
        feedId: feed._id
      },
      success: function(data : string) {
        // now that you have the items, add them all to the DOM.
        var items : I.ClItem[] = JSON.parse(data);
        $("#read").empty();
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
        Hammer(back[0]).on('tap', function(event) {
          $("#read").css('display', 'none');
          switchToView();
        });
        $("#read").prepend(back)
        callback();
      }
    });
  };


  ///////////////////////////////////////////////////
  // main
  ///////////////////////////////////////////////////

  switchToView();

  // $.ajax({
  //   type: 'post',
  //   url: "/add-feed",
  //   data: {
  //     url: "http://foxnews.com"
  //   },
  //   success: function(data) {
  //     var feeds : I.DbFeed[] = JSON.parse(data);
  //     console.log(feeds);
  //     $subscriptionView.append($("<div>")
  //                              .text("added feeds: " + JSON.stringify(feeds)));
  //     $.ajax({
  //       type: 'get',
  //       url: "/gimmie-my-feeds",
  //       data: {
  //       },
  //       success: function(data) {
  //         var feeds : I.DbFeed[] = JSON.parse(data);
  //         $subscriptionView.append($("<div>")
  //                                  .text("my feeds: " + JSON.stringify(feeds)));
  //       }
  //     });
  //   }
  // });

});
