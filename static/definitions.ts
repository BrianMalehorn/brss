/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="../definitely-typed/jquery.d.ts"/>
/// <reference path="./client-interfaces.ts"/>

declare var _ : Lodash;

module View {
  export declare var enterView : (callback ?: () => void) => void;
  export declare var exitView : (callback ?: () => void) => void;
}

module Edit {
  export declare var enterEdit : (callback ?: () => void) => void;
  export declare var exitEdit : (callback ?: () => void) => void;
}

module Add {
  export declare var enterAdd : (callback ?: () => void) => void;
  export declare var exitAdd : (callback ?: () => void) => void;
}

module Read {
  export declare var enterRead : (feed : ClFeed, callback ?: () => void) => void;
  export declare var exitRead : (callback ?: () => void) => void;
}

module Misc {

  export var NO_ID : string = "NO ID";
  export var FACEBOOK_LOGIN_URL : string = "/auth/facebook";

  export declare var lastFeed : ClFeed;
  export declare var feeds : {[_id: string]: ClFeed;};
  export declare var user : ClUser;

  var hashChangeWasMine : bool = false;
  var oldHash : string = "#_=_";

  export var assert = function(b : bool, msg ?: string) : void {
    if (!msg) {
      msg = "assertion error";
    }
    if (!b) {
      throw msg;
    }
  };

  export var changeHash = function(hash : string) : void {
    hashChangeWasMine = true;
    window.location.hash = hash;
  };

  $(window).on('load', function() {
    window.onhashchange = function() {
      // if it wasn't mine (i.e. the user did it by hitting back), find out
      // where I was coming from and where I'm going to make make the swap
      if (!hashChangeWasMine) {

        var exit : (callback ?: () => void) => void = function() { };
        switch (oldHash) {
        case "#_=_":
        case "#view":
          exit = View.exitView;
          break;
        case "#edit":
          exit = Edit.exitEdit;
          break;
        case "#add":
          exit = Add.exitAdd;
          break;
        case "#read":
          exit = Read.exitRead;
          break;
        }

        var enter : (callback ?: () => void) => void = function() { };
        switch (window.location.hash) {
        case "#_=_":
        case "#view":
          enter = View.enterView;
          break;
        case "#edit":
          enter = Edit.enterEdit;
          break;
        case "#add":
          enter = Add.enterAdd;
          break;
        case "#read":
          enter = function(callback ?: () => void) : void {
            callback = callback || function() { };
            Read.enterRead(Misc.lastFeed, callback);
          };
          break;
        }

        // out with the old, then in with the new
        exit(enter);

      }

      oldHash = window.location.hash;
      // regardless of if this was a change I made or not, next time,
      // make it obvious that it wasn't intentional.
      hashChangeWasMine = false;
    };

  });


}
