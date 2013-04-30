/// <reference path="./client-interfaces.ts"/>
/// <reference path="./definitions.ts"/>

module Add {

  ///////////////////////////////////////////////////
  // add feed
  ///////////////////////////////////////////////////

  var showLoader = function() : void {
    $("#loader").css('display', 'block');
  };

  var hideLoader = function() : void {
    $("#loader").css('display', 'none');
  };

  // submit the search, ultimately going back to the home page.
  // async.
  var addSubmit = function() : void {
    var siteUrl : string = $("#searchBox").val();
    showLoader();
    exitAdd(function() {
      $.ajax({
        type: 'post',
        url: "/add-feeds",
        data: {
          url: siteUrl
        },
        success: function(data) {
          if (data === Misc.NO_ID) {
            window.location.href = Misc.FACEBOOK_LOGIN_URL;
            return;
          }
          // data is a JSON-encoded version of the feeds you added
          var feeds : ClFeed[] = JSON.parse(data);
          // a quick hack to make it obvious that I couldn't find anything.
          if (feeds.length === 0) {
            alert("No feeds found.");
          }
          hideLoader();
          View.enterView(null);
        }
      });
    });
  };

  var alreadyHammerfiedAddButton = false;

  export var enterAdd = function(callback ?: () => void) {
    callback = callback || function() { };
    $("#add")
      .removeClass("hiddenRight")
      .one('webkitTransitionEnd', function() {
        $("#searchBox").focus();
        Misc.changeHash("#add");
      });
    // empty the search box and put the cursor on it

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

  export var exitAdd = function(callback ?: () => void) {
    callback = callback || function() { };
    $("#searchBox").text("");
    $("#add")
      .addClass("hiddenRight")
      .one('webkitTransitionEnd', callback);
  };


  $(window).on('load', function() {
    $("#searchBox").keydown(function(event) {
      // if they hit return, submit it
      if (event.keyCode === 13) {
        addSubmit();
        // make it so that the key doesn't actually have its effect
        return false;
      }
    });
  });

}
