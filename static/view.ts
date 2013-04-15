/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="../definitely-typed/jquery.d.ts"/>

declare var _ : Lodash;
import I = module('../interfaces');

$(document).ready(function() {
  console.log("Yay!");
  var $subscriptionView = $("#subscriptionView");
  var $subscriptionEdit = $("#subscriptionEdit");
  var $subscriptionAdd = $("#subscriptionAdd");
  var $subscriptionRead = $("#subscriptionRead");

  $.ajax({
    type: 'post',
    url: "/add-feed",
    data: {
      url: "http://foxnews.com"
    },
    success: function(data) {
      var feeds : I.DbFeed[] = JSON.parse(data);
      console.log(feeds);
      $subscriptionView.append($("<div>")
                               .text("added feeds: " + JSON.stringify(feeds)));
      $.ajax({
        type: 'get',
        url: "/gimmie-my-feeds",
        data: {
        },
        success: function(data) {
          var feeds : I.DbFeed[] = JSON.parse(data);
          $subscriptionView.append($("<div>")
                                   .text("my feeds: " + JSON.stringify(feeds)));
        }
      });
    }
  });
});
