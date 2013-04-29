/// <reference path="./definitely-typed/express.d.ts"/>
/// <reference path="./definitely-typed/node.d.ts"/>
/// <reference path="./typescript-node-definitions/mongodb.d.ts"/>
/// <reference path="./definitions/lodash.d.ts"/>


/* This file stores all of the server-level futzing: what urls go to what
   database calls, what port the server gets started on, login information,
   etc.
*/

import mongo = module('mongodb');
import fs = module('fs');
import express = module('express');
import http = module('http');
var passport = require('passport');
var sha1 : (s : string) => string = require('sha1');
var _ : Lodash = require('./static/lodash.js');
require('source-map-support').install();

import util = module('utilities');
import database = module('database');
import I = module('interfaces');

var app = express();

app.configure(function() {
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.session({secret: "oinwopnsdkcljasdk"}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + "/static"));
});

/********************************************************************
 * constants
 ********************************************************************/

interface Constants {
  ipAddress : string;
  port : number;
}

var c : Constants = {
  ipAddress: process.env.OPENSHIFT_INTERNAL_IP || "localhost",
  port: process.env.OPENSHIFT_INTERNAL_PORT || 80
};


/********************************************************************
 * passport stuff
 ********************************************************************/

var FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
  clientID: "232792796862700",
  clientSecret: "961a0670ad0bd8f05eeabfa33ce230a0",
  callbackURL: "/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }));

passport.serializeUser(function(fbUser : I.FbUser, done : Function) {
  // user.id is something that anyone can access. Not quite a username, but
  // can still be accessed and spoofed. Therefore, create user.brssId to be
  // used on my actually application.
  database.getFbUser(fbUser, function(err, dbUser ?: I.DbUser) {
    util.throwIt(err);
    done(null, dbUser.brssId);
  });
});

passport.deserializeUser(function(brssId, done) {
  done(null, brssId);
});

app.get("/auth/facebook", passport.authenticate('facebook'));

app.get("/auth/facebook/callback",
        passport.authenticate('facebook', {
          successRedirect: "/brss.html",
          failureRedirect: "/index.html"
        }));


/********************************************************************
 * listeners
 ********************************************************************/


/////////////////////////////////////////////////
// GET
/////////////////////////////////////////////////

/* Find the current user's feeds and send them back */
app.get("/gimmie-my-feeds", function(request, response) {
  var brssId : string = request.user;
  if (!brssId) {
    response.send("NO ID");
    return;
  }
  database.getUserFeeds(brssId, function(err, feeds ?: I.DbFeed[]) {
    util.throwIt(err);
    response.send(JSON.stringify(feeds));
  });
});

app.get("/who-am-i-where-am-i", function(request, response) {
  var brssId : string = request.user;
  if (!brssId) {
    response.send("NO ID");
    return;
  }
  database.getUser(brssId, function(err, user ?: I.DbUser) {
    util.throwIt(err);
    response.send(JSON.stringify(user));
  });
});


app.get("/gimmie-some-items", function(request, response) {
  var feedId : string = request.query.feedId;
  database.getSomeItems(feedId, function(err, items ?: I.DbItem[]) {
    util.throwIt(err);
    response.send(JSON.stringify(items));
  });
});

app.get("/get-item", function(request, response) {
  var itemId : string = request.query.itemId;
  database.getItem(itemId, function(err, item ?: I.DbItem) {
    util.throwIt(err);
    response.send(JSON.stringify(item));
  });
});

app.get("/next-n-items", function(request, response) {
  var feedId : string = request.query.feedId;
  var date : number = _.parseInt(request.query.date);
  var n : number = _.parseInt(request.query.n);
  util.assert(feedId !== undefined && date !== undefined && n !== undefined);
  util.pp({feedId: feedId, date: date, n: n}, "nextNItemsData");
  // console.log("next n items: +
  database.nextNItems(feedId, date, n, function(err, items ?: I.DbItem[]) {
    util.throwIt(err);
    response.send(JSON.stringify(items));
  });
});

/////////////////////////////////////////////////
// POST
/////////////////////////////////////////////////

/* Find all feeds at the given url, add them to the current user, and send
   the found feeds back to the user. */
app.post("/add-feeds", function(request, response) {
  var brssId : string = request.user;
  if (!brssId) {
    response.send("NO ID");
    return;
  }
  var url : string = request.body.url;
  url = util.httpize(url);
  database.addUserFeeds(brssId, url, function(err, feeds ?: I.DbFeed[]) {
    util.logIt(err);
    if (err) {
      feeds = [];
    }
    response.send(JSON.stringify(feeds));
  });
});

/////////////////////////////////////////////////
// DELETE
/////////////////////////////////////////////////

/* Delete the feeds from the current user. */
app.del("/delete-these-feeds", function(request, response) {
  var brssId : string = request.user;

  if (!brssId) {
    response.send("NO ID");
    return;
  }
  var feedIds : string[] = request.body.feedIds;
  util.pp(feedIds, "feedIds");
  database.deleteUserFeeds(brssId, feedIds, function(err) {
    util.throwIt(err);
    response.send("Nothing to see here, folks!");
  });
});


/********************************************************************
 * start!
 ********************************************************************/

database.start(function(err) {
  util.throwIt(err);
  console.log("%s: trying on %s:%d",
              (new Date()).toString(), c.ipAddress, c.port);
  app.listen(c.port);
  console.log("%s: started on %s:%d",
              (new Date()).toString(), c.ipAddress, c.port);
  // app.listen(c.port, c.ipAddress, -1, function() : void {
});
