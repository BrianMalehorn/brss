/// <reference path="./definitely-typed/express.d.ts"/>
/// <reference path="./definitely-typed/node.d.ts"/>
/// <reference path="./typescript-node-definitions/mongodb.d.ts"/>


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
require('source-map-support').install();

import util = module('utilities');
import database = module('database');

var app = express();

app.configure(function() {
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.session({secret: "askdfakljsd"}));
  app.use(passport.initialize());
  app.use(passport.session());
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
  port: process.env.OPENSHIFT_INTERNAL_PORT || 8000
};


/********************************************************************
 * passport stuff
 ********************************************************************/

var FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
    clientID: "232792796862700",
    clientSecret: "d91b10687ae303073fd80d1278c4c23c",
    callbackURL: "http://"+c.ipAddress+":"+c.port+"/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(util.sify(profile));
    return done(null, profile);
  }));

passport.serializeUser(function(user, done) {
  // user.id is something that anyone can access. Not quite a username, but
  // can still be accessed and spoofed. Therefore, create user.brssId to be
  // used on my actually application.

  console.log(util.sify(user));

  database.getSalt(user.id, function(err, salt ?: string) {
    util.throwIt(err);
    user.brssId = sha1(salt + user.id);
    done(null, user);
  });
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get("/auth/facebook", passport.authenticate('facebook'));

app.get("/auth/facebook/callback",
        passport.authenticate('facebook', {
          successRedirect: "/success.html",
          failureRedirect: "/index.html"
        }));


/* Here, I have arbitrary requests to the server (this one just sends back a
   file). But if I wanted, I could look up request.user.brssId in a database
   where I store all the secure information and send it back. The only way it
   could be spoofed is if they knew my salt.

   I could make this even more secure by generating a random salt for each user
   and storing each one in the database, but that seems like a lot of effort
   for a demo.
*/
app.get("/success.html", function(request, response) {
  util.sify(request.user);
  response.sendfile("success.html");
});


/********************************************************************
 * listeners
 ********************************************************************/

app.get("/", function(request, response) : void {
  response.send("Hello, world!");
});

database.start(function(err) {
  util.throwIt(err);
  console.log("%s: trying on %s:%d",
              (new Date()).toString(), c.ipAddress, c.port);
  app.listen(c.port, c.ipAddress, -1, function() : void {
    console.log("%s: started on %s:%d",
                (new Date()).toString(), c.ipAddress, c.port);
  });
});
