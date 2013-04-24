/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="../definitely-typed/jquery.d.ts"/>
/// <reference path="./view.ts"/>
/// <reference path="./edit.ts"/>
/// <reference path="./add.ts"/>
/// <reference path="./read.ts"/>

// I would use this, but it crashes tsc!
// $(window).load(function() {

$(window).on('load', function() {

  View.enterView(null);

});
