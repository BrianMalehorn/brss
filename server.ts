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
  clientSecret: "d91b10687ae303073fd80d1278c4c23c",
  callbackURL: "/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }));

passport.serializeUser(function(fbUser : I.FbUser, done : Function) {
  // user.id is something that anyone can access. Not quite a username, but
  // can still be accessed and spoofed. Therefore, create user.brssId to be
  // used on my actually application.
  database.getUser(fbUser, function(err, dbUser ?: I.DbUser) {
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
          successRedirect: "/view.html",
          failureRedirect: "/index.html"
        }));


/* Here, I have arbitrary requests to the server (this one just sends back a
   file). But if I wanted, I could look up request.user.brssId in a database
   where I store all the secure information and send it back. The only way it
   could be spoofed is if they knew my salt.
*/

// app.get("/success.html", function(request, response) {
//   response.send("you win!");
//   // response.sendfile("success.html");
// });


/********************************************************************
 * listeners
 ********************************************************************/

/* Find the current user's feeds and send them back */
app.get("/gimmie-my-feeds", function(request, response) {
  var brssId : string = request.user;
  database.getUserFeeds(brssId, function(err, feeds ?: I.DbFeed[]) {
    util.throwIt(err);
    response.send(JSON.stringify(feeds));
  });
});


/* Find all feeds at the given url, add them to the current user, and send
   the found feeds back to the user. */
app.post("/add-feed", function(request, response) {
  var brssId : string = request.user;
  var url : string = request.body.url;
  util.pp(url, "url");
  database.addUserFeeds(brssId, url, function(err, feeds ?: I.DbFeed[]) {
    util.throwIt(err);
    response.send(JSON.stringify(feeds));
  });
});


/* Delete the feeds from the current user. */
app.del("/delete-these-feeds", function(request, response) {
  var brssId : string = request.user;
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
