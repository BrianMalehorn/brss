/// <reference path="./client-interfaces.ts"/>
/// <reference path="./definitions.ts"/>

module Edit {

  ///////////////////////////////////////////////////
  // edit/remove feeds
  ///////////////////////////////////////////////////

  export var enterEdit = function(callback ?: () => void) {
    callback = callback || function() { };
    $("#edit")
      .removeClass("hiddenRight")
      .one('webkitTransitionEnd', function() {
        Misc.changeHash("#edit");
      });

    // generate keepList's elements
    for (var _id in Misc.feeds) {
      (function(){
        var feed = Misc.feeds[_id];
        // each one will have a div with a checkbox and some text inside
        var div = $('<div>')
          .addClass('keeper')
          .data("id", feed._id);
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

  export var exitEdit = function(callback ?: () => void) {
    callback = callback || function() { };
    $("#edit")
      .addClass("hiddenRight")
      .one('webkitTransitionEnd', function() {
        $("#keepList").empty();
        callback();
      });
  };


  $(window).on('load', function() {
    $("#saveSubscription").onButtonTap(function() {
      // you need to get these out ahead of time, before exitEdit
      // removes them
      var bads = $(".keeper.bad");
      var badIds : string[] = _.map(bads, (e) => $(e).data("id"));
      exitEdit(null);
      $.ajax({
        type: 'delete',
        url: "/delete-these-feeds",
        data: {
          feedIds: badIds
        },
        success: function(data) {
          if (data === Misc.NO_ID) {
            window.location.href = Misc.FACEBOOK_LOGIN_URL;
            return;
          }
          View.enterView(null);
        }
      });
    });
  });

}
