/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="../definitely-typed/jquery.d.ts"/>

declare var _ : Lodash;
import I = module('../interfaces');
// TODO: make it at least a little typesafe
declare var Hammer : any;

/* The global state */
interface Global {
  feeds : {[_id: string]: I.ClFeed;};
}

var G : Global = {
  feeds: undefined,
};



$(document).ready(function() {


  // and make it so when they click on the buttons at the
  // bottom, they can actually
  Hammer($('#addSubscription')[0]).on('tap', function(event) {
    switchToAdd();
  });
  Hammer($('#editSubscription')[0]).on('tap', function(event) {
    switchToEdit();
  });
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

        // not needed: switchToView refreshes the feed list anyhow
        // // filter out the bad ids from G.feeds
        // var newFeeds : {[_id: string]: I.ClFeed;} = {};
        // var goodIds : string[] = _.difference(_.keys(G.feeds), badIds);
        // for (var i = 0; i < goodIds.length; i++) {
        //   var _id : string = goodIds[i];
        //   newFeeds[_id] = G.feeds[_id];
        // }
        // G.feeds = newFeeds;

        switchToView();
      }
    });
  });

  // When you navigate to the subscriptionView page, you
  var switchToView = function(callback ?: () => void) {
    callback = callback || () => undefined;

    $("#view").css('display', 'block');
    $("#edit").css('display', 'none');

    G.feeds = G.feeds || {};

    // ENDGAME: remove this ajax query if you've already got the data
    $.ajax({
      type: 'get',
      url: "/gimmie-my-feeds",
      data: {
      },
      success: function(data : string) {
        // cool, now we have the feeds array. Add it to the DOM.
        $("#subscriptionList").empty();
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
              switchToRead(_feed);
            });
          })();
          $("#subscriptionList").append(div);
        }

        callback();
      }
    });
  };

  var switchToAdd = function(callback ?: () => void) {
    console.log("switchToAdd!");
    // $("#view").css('display', 'none');
    // $("#add").css('display', 'block');
  };

  var switchToEdit = function(callback ?: () => void) {
    callback = callback || function() { };
    console.log("switchToEdit!");
    // make the old one not visible
    $("#view").css('display', 'none');
    $("#edit").css('display', 'block');
    console.log($("#keepList"));
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

    // var checkbox = $('<input>').attr('type', 'checkbox');
    // $("#edit").append(checkbox);
    // checkbox.click(function() {
    //   console.log("check!");
    // });

  };

  var switchToRead = function(feed : I.ClFeed, callback ?: () => void) {
    console.log("switchToRead!");
    console.log(feed);
  };


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
