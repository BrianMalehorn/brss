/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="../definitely-typed/jquery.d.ts"/>

declare var _ : Lodash;
import I = module('../interfaces');

/* The global state */
interface Global {
  feeds : {[_id: string]: I.ClFeed;};
  user : I.ClUser;
  // the #foo I current think it is. this should be one of "#add", "#view",
  // "#edit", "#read"
  oldHash : string;
  // Did I just change the hash? Or did the user?
  hashChangeWasMine : bool;
  // Keep track of the last visited feed in case they hit the back button.  You
  // should never read from this; its purpose is entirely for when they press
  // the back button. It should only be accessed by enterRead and exitRead.
  lastFeed : I.ClFeed;
}

var G : Global = {
  feeds: undefined,
  user: undefined,
  oldHash: "#_=_",
  hashChangeWasMine: true,
  lastFeed: undefined,
};

// I would use this, but it crashes tsc!
// $(window).load(function() {

$(window).on('load', function() {

  /********************************************************************
   * common functions
   ********************************************************************/

  var enterView : (callback ?: () => void) => void;
  var exitView : (callback ?: () => void) => void;

  var enterEdit : (callback ?: () => void) => void;
  var exitEdit : (callback ?: () => void) => void;

  var enterAdd : (callback ?: () => void) => void;
  var exitAdd : (callback ?: () => void) => void;

  var enterRead : (feed : I.ClFeed, callback ?: () => void) => void;
  var exitRead : (callback ?: () => void) => void;

  var changeHash : (hash : string) => void;

  /********************************************************************
   * implementation
   ********************************************************************/


  ///////////////////////////////////////////////////
  // misc utilities
  ///////////////////////////////////////////////////

  var changeHash = function(hash : string) : void {
    G.hashChangeWasMine = true;
    window.location.hash = hash;
  };

  ///////////////////////////////////////////////////
  // view feed
  ///////////////////////////////////////////////////

  // When you navigate to the subscriptionView page, you
  var enterView = function(callback ?: () => void) {
    callback = callback || () => undefined;
    changeHash("#view");
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
        var unsorted : I.ClFeed[] = JSON.parse(data);
        var feeds : I.ClFeed[] = _.sortBy(unsorted, (f : I.ClFeed) => f.title);
        G.feeds = {};
        feeds.forEach(function(feed : I.ClFeed) {
          G.feeds[feed._id] = feed;
        });

        for (var _id in G.feeds) {
          var feed : I.ClFeed = G.feeds[_id];
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
                enterRead(_feed);
              });
            });
          })();
          $("#subscriptionList").append(div);
        }

        lastly();
      }
    });
  };

  var exitView = function(callback ?: Function) {
    callback = callback || function() { };
    $("#view").css('display', 'none');
    $("#subscriptionList").empty();
    callback();
  };

  // and make it so when they click on the buttons at the
  // bottom, they can actually

  $('#addSubscription').onButtonTap(function() {
    // turn the lights off on your way out
    exitView(enterAdd);
  });
  $('#editSubscription').onButtonTap(function() {
    exitView(enterEdit);
  });

  ///////////////////////////////////////////////////
  // add feed
  ///////////////////////////////////////////////////

  var showLoader = function() : void {
    $("#loader").css('display', 'block');
  };

  var hideLoader = function() : void {
    $("#loader").css('display', 'none');
  };

  var alreadyHammerfiedAddButton = false;

  // submit the search, ultimately going back to the home page.
  // async.
  var addSubmit = function() : void {
    var siteUrl : string = $("#searchBox").val();
    exitAdd(function() {
      showLoader();
      $.ajax({
        type: 'post',
        url: "/add-feeds",
        data: {
          url: siteUrl
        },
        success: function(data) {
          // data is a JSON-encoded version of the feeds you added
          var feeds : I.ClFeed[] = JSON.parse(data);
          // a quick hack to make it obvious that I couldn't find anything.
          if (feeds.length === 0) {
            alert("No feeds found.");
          }
          hideLoader();
          enterView(null);
        }
      });
    });
  };

  var enterAdd = function(callback ?: () => void) {
    callback = callback || function() { };
    changeHash("#add");
    $("#add").css('display', 'block');

    // for some reason, it only works to hammerfy button when they're visible
    // or something. Has to be put in this function
    if (!alreadyHammerfiedAddButton) {
      alreadyHammerfiedAddButton = true;

      $("#addButton").onButtonTap(function() {
        addSubmit();
      });
    }

    callback();
  };

  var exitAdd = function(callback ?: () => void) {
    callback = callback || function() { };
    $("#add").css('display', 'none');
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

  var enterEdit = function(callback ?: () => void) {
    callback = callback || function() { };
    changeHash("#edit");
    $("#edit").css('display', 'block');


    // generate keepList's elements
    for (var _id in G.feeds) {
      (function(){
        var feed = G.feeds[_id];
        // each one will have a div with a checkbox and some text inside
        var div = $('<div>').addClass('keeper').attr('id', feed._id);
        var checkbox = $('<input>')
          .attr('type', 'checkbox')
          .prop('checked', false);
        div.onButtonTap(function() {
          // it's bad if it's checked
          div.toggleClass('bad');
          checkbox.prop('checked', div.hasClass('bad'));
        });
        checkbox.click(function() {
          // if you click on the checkbox, it will also be a click on the div,
          // causing a double-negative: the class will toggle but the checkbox
          // will toggle twice, staying the same. So when they click the
          // checkbox, make sure it's in the right state.
          checkbox.prop('checked', div.hasClass('bad'));
        });
        div.append(checkbox).append(feed.title);
        $("#keepList").append(div);
      })();
    }
  };

  var exitEdit = function(callback ?: () => void) {
    callback = callback || function() { };
    $("#edit").css('display', 'none');
    $("#keepList").empty();

    callback();
  };

  $("#saveSubscription").onButtonTap(function() {
    // you need to get these out ahead of time, before exitEdit
    // removes them
    var bads = $(".keeper.bad");
    var badIds : string[] = _.map(bads, (e) => e.id);
    exitEdit(function() : void {
      $.ajax({
        type: 'delete',
        url: "/delete-these-feeds",
        data: {
          feedIds: badIds
        },
        success: function(data) {
          enterView();
        }
      });
    });
  });

  ///////////////////////////////////////////////////
  // read feed
  ///////////////////////////////////////////////////

  var enterRead = function(feed : I.ClFeed, callback ?: () => void) {
    callback = callback || function() { };
    $("#read").css('display', 'block');
    changeHash("#read");
    G.lastFeed = feed;

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
          exitRead(enterView);
        });
        $("#read").prepend(back)
        callback();
      }
    });
  };


  var exitRead = function(callback ?: () => void) : void {
    callback = callback || function() { };
    $("#read").css('display', 'none');
    $("#read").empty();
    callback();
  };


  ///////////////////////////////////////////////////
  // misc listeners
  ///////////////////////////////////////////////////

  window.onhashchange = function() {
    // if it wasn't mine (i.e. the user did it by hitting back), find out
    // where I was coming from and where I'm going to make make the swap
    if (!G.hashChangeWasMine) {
      var exit : (callback ?: () => void) => void = function() { };
      switch (G.oldHash) {
      case "#view":
        exit = exitView;
        break;
      case "#edit":
        exit = exitEdit;
        break;
      case "#add":
        exit = exitAdd;
        break;
      case "#read":
        exit = exitRead;
        break;
      }

      var enter : (callback ?: () => void) => void = function() { };
      switch (window.location.hash) {
      case "#view":
        enter = enterView;
        break;
      case "#edit":
        enter = enterEdit;
        break;
      case "#add":
        enter = enterAdd;
        break;
      case "#read":
        enter = function(callback ?: () => void) : void {
          callback = callback || function() { };
          enterRead(G.lastFeed, callback);
        };
        break;
      }

      // out with the old, then in with the new
      exit(enter);

    }

    G.oldHash = window.location.hash;
    // regardless of if this was a change I made or not, next time,
    // make it obvious that it wasn't intentional.
    G.hashChangeWasMine = false;
  };


  ///////////////////////////////////////////////////
  // main
  ///////////////////////////////////////////////////

  enterView();

});
