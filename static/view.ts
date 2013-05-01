/// <reference path="./client-interfaces.ts"/>
/// <reference path="./definitions.ts"/>

module View {

  ///////////////////////////////////////////////////
  // view feed
  ///////////////////////////////////////////////////

  // When you navigate to the subscriptionView page, you
  export var enterView = function(callback ?: () => void) {
    callback = callback || () => undefined;

    $("#addSubscription").css('display', 'inline-block');
    $("#editSubscription").css('display', 'inline-block');

    Misc.showLeft("#view", function() {
      Misc.changeHash("#view");
    });

    // after both these ajax requests, call callback
    var lastly : Function = null;

    // first, put this loader in the way so they know they should
    // be waiting
    $("#subscriptionList").append($("#loaderImage").clone());

    var ajaxes = [{
      // update the user
      type: 'get',
      url: "/who-am-i-where-am-i",
      data: {
      },
      success: function(data : string) {
        if (data === Misc.NO_ID) {
          window.location.href = Misc.FACEBOOK_LOGIN_URL;
          return;
        }
        Misc.user = JSON.parse(data);
        lastly();
      }
    }, {
      // update all of their subscription and put them in the DOM
      // ENDGAME: remove this ajax query if you've already got the data
      type: 'get',
      url: "/gimmie-my-feeds",
      data: {
      },
      success: function(data : string) {
        if (data === Misc.NO_ID) {
          window.location.href = Misc.FACEBOOK_LOGIN_URL;
          return;
        }

        // cool, now we have the feeds array. Add it to the DOM.
        var unsorted : ClFeed[] = JSON.parse(data);
        var feeds : ClFeed[] = _.sortBy(unsorted, (f : ClFeed) => f.title);
        Misc.feeds = {};
        feeds.forEach(function(feed : ClFeed) {
          Misc.feeds[feed._id] = feed;
        });

        $("#subscriptionList").empty();
        _.values(Misc.feeds).forEach(function(feed : ClFeed) {
          // var feed : ClFeed = Misc.feeds[_id];
          var div = ($('<div>')
                     .addClass('subscription')
                     .text(feed.title));
          // if they click on this div, they should try to go read it
          div.onButtonTap(function() {
            exitView(null);
            Read.enterRead(feed, null);
          });
          $("#subscriptionList").append(div);
        });

        lastly();
      }
    }];

    lastly = _.after(ajaxes.length, callback);
    ajaxes.forEach($.ajax);

  };

  export var exitView = function(callback ?: Function) {
    callback = callback || function() { };

    window.scrollTo(0, 0);
    $("#addSubscription").css('display', 'none');
    $("#editSubscription").css('display', 'none');

    $("#view")
      .addClass("hiddenLeft")
      .one('webkitTransitionEnd', function() {
        $("#subscriptionList").empty();
        $("#view").css('display', 'none');
        callback();
      });

  };


  $(window).on('load', function() {
    // and make it so when they click on the buttons at the
    // bottom, they can actually

    $('#addSubscription').onButtonTap(function() {
      exitView(null);
      Add.enterAdd(null);
    });

    $('#editSubscription').onButtonTap(function() {
      exitView(null);
      Edit.enterEdit(null);
    });

  });

}
