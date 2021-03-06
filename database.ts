/// <reference path="./definitely-typed/express.d.ts"/>
/// <reference path="./definitely-typed/node.d.ts"/>
/// <reference path="./typescript-node-definitions/mongodb.d.ts"/>
/// <reference path="./definitions/lodash.d.ts"/>

/* This file handles anything that touches the database: creating new feeds,
   adding them to database, getting stuff from the database, etc.
 */

/********************************************************************
 * exported functions
 ********************************************************************/

/* Given a url like "http://xkcd.com/", adds the entries to the server */
declare var addBySiteUrl : (url : string,
                            callback ?: (err, feeds ?: I.DbFeed[]) => void)
                          => void;

/* Given a Facebook user, go look them up/create them in the database. */
declare var getFbUser : (fbUser : I.FbUser,
                       callback : (err : any, dbUser ?: I.DbUser) => void)
                      => void;

/* Just get the latest version of the user from the server.  This is the
   preferred way to update client data rather than trying to duplicate every
   server operation locally to save a few function calls. */
declare var getUser : (brssId : string,
                       callback : (err, user ?: I.DbUser) => void) => void;

/* Given a user, give me an array of all of their feeds. */
declare var getUserFeeds : (brssId : string,
                            callback : (err : any, feeds ?: I.DbFeed[]) => void)
                      => void;

/* Given a url, adds all the feeds at that url to the user and calls the
   callback with those feeds. */
declare var addUserFeeds : (brssId : string, url : string,
                            callback : (err, feed ?: I.DbFeed[]) => void)
                      => void;

/* Given a user and a list of feed ID's, removes those feeds from user.feedIds
 */
declare var deleteUserFeeds : (brssId : string, badIds : string[],
                               callback : (err : any) => void) => void;


/* Just get some number of items. I'll worry about getting specific ones
   out later when I'm doing infinite scrolling. */
declare var getSomeItems : (feedId : string,
                            callback : (err, items ?: I.DbItem[]) => void)
                        => void;

/* Given a feed, returns n items with a date later than the one given. It may
 * return fewer than n items without an error if there aren't more than n items
 * remaining. */
declare var nextNItems : (feedId : string, date : number, n : number,
                          callback : (err, items ?: I.DbItem[]) => void)
                      => void;

/* Get an item just by ID. */
declare var getItem : (itemId : string,
                       callback : (err, item ?: I.DbItem) => void) => void;

/* Given an RSS url like http://xkcd.com/rss.xml, downloads the page and adds the feed to the database, if not already there. */
declare var addFeedFromRssUrl : (rssUrl : string,
                                 callback ?: (err, feed ?: I.DbFeed) => void)
                        => void;

/* Start the actual server (boot up the database and set the timeout on
   updating the database */
declare var start : (callback ?: Function) => void;


/********************************************************************
 * imports
 ********************************************************************/

var FeedParser = require('feedparser');
var jsdom = require('jsdom');
var request = require('request');
var _ : Lodash = require('./static/lodash.js');
var sha1 : (s : string) => string = require('sha1');
import mongo = module('mongodb');

import util = module('utilities');
import I = module('interfaces');

require('source-map-support').install();


/********************************************************************
 * interfaces
 ********************************************************************/

/* Data structure to hold global info. */
interface Glob {
  isUpdating : bool;
}

interface Constants {
  UPDATE_INTERVAL : number;
  SALT_STRING : string;
  SALT_LENGTH : number;
}

interface Db {
  items : mongo.Collection;
  feeds : mongo.Collection;
  salts : mongo.Collection;
  users : mongo.Collection;
}

/********************************************************************
 * variable declarations
 ********************************************************************/

var glob : Glob = {isUpdating: false};

var c : Constants = {
  // how often, in MS, I attempt an update
  // END: set to something smaller, like 60 * 1000
  UPDATE_INTERVAL: 20 * 1000 * 60,
  SALT_STRING: "ABCDEFHGIJKLMNOPQRSTUVWXYZ",
  SALT_LENGTH: 50,
};

var db : Db = {
  items : undefined,
  feeds : undefined,
  salts : undefined,
  users : undefined,
};

/********************************************************************
 * actual code
 ********************************************************************/

/* Given a pre-existing feed, update all of its items */
var updateItems = function(feed : I.DbFeed, callback ?: Function) {
  console.log("update items: " + util.sify(feed.url));
  if (!callback) callback = util.throwIt;

  request(feed.url)
    .pipe(new FeedParser({}))
    .on('error', callback)
    .on('end', callback)
    .on('article', function(fpItem : I.FpItem) {
      // If they didn't put a date, shame on them.
      // Give it the current date.
      if (!fpItem.date) {
        fpItem.date = new Date();
      }

      // try to find exact match in the database
      util.pp(fpItem.link, "fpItem.link");
      db.items.find(
        {url: fpItem.link, feedId: feed._id}).toArray(
          function(err, a) {
            util.throwIt(err);

            // util.pp(a, "a");

            var dbItem : I.DbItem = {
              title: fpItem.title,
              description: fpItem.description,
              url: fpItem.link,
              date: fpItem.date.getTime(),
              feedId: feed._id,
              _id: new mongo.ObjectID()
            }

            if (a.length === 0) {
              // otherwise, make a I.DbItem and insert it into the db
              console.log("inserting db item: " + util.sify(dbItem.url));
              db.items.insert(dbItem, {safe : true}, util.throwIt);
            } else if (a.length === 1) {
              console.log("db item already there: " + util.sify(fpItem.link));
            } else {
              console.log("removing db item: " + util.sify(dbItem.url));
              db.items.remove(dbItem, function(err) {
                util.throwIt(err);
                console.log("inserting db item: " + util.sify(dbItem.url));
                db.items.insert(dbItem, {safe: true}, util.throwIt);
              });
            }
          });
    });
};

/* Given a url like "http://xkcd.com/rss.xml", adds the the feed to the server
   (if it's not already there) and updates all of its elements and if callback
   is given, calls it. */
var updateFeed = function(rssUrl : string,
                          callback ?: (err, feed ?: I.DbFeed) => void) {
  if (!callback) callback = util.throwIt;

  rssUrl = util.httpize(rssUrl);

  console.log("update feed: " +  util.sify(rssUrl));

  addFeedFromRssUrl(rssUrl, function(err, feed ?: I.DbFeed) {
    if (err) return callback(err);
    updateItems(feed, function(err) {
      if (err) return callback(err);
      callback(null, feed);
    });
  });
};


var addFeedFromRssUrl = function(rssUrl : string,
                                 callback ?: (err, feed ?: I.DbFeed) => void)
: void {

  db.feeds.findOne({url: rssUrl}, function(err, feed ?: I.DbFeed) {
    if (!err && feed) {
      return callback(null, feed);
    }

    request(rssUrl)
      .pipe(new FeedParser({}))
      .on('error', callback)
      .on('meta', function(fpFeed : I.FpFeed) {

        var dbFeed : I.DbFeed = {
          title: fpFeed.title,
          description: fpFeed.description,
          url: rssUrl,
          _id: new mongo.ObjectID(),
        };

        db.feeds.insert(dbFeed, function(err) {
          if (err) return callback(err);
          updateItems(dbFeed, function(err) {
            if (err) return callback(err);
            callback(null, dbFeed);
          });
        });
      });
  });
};


/* Given a url like "http://xkcd.com/", adds the entries to the
   server */
export var addBySiteUrl = function(url : string,
                                   callback ?: (err, feeds ?: I.DbFeed[])
                                   => void)
: void {
  if (!callback) {
    callback = util.throwIt;
  }

  // if it ends with a "/", strip it off
  if (url.charAt(url.length-1) == "/") {
    url = url.substring(0, url.length-1);
  }

  // download the webpage
  request({url: url}, function(err, response, body) {
    if (err) return callback(err);
    // parse the html into a dom
    jsdom.env({
      html: body,
      scripts: ['static/jquery-1.9.1.js']
    }, function (err, window) {
      if (err) return callback(err);
      // get out the url of the rss
      var $ = window.jQuery;

      var jqFeeds = $("link[type='application/rss+xml']");
      var rssUrls : string[] = _.pluck(jqFeeds, 'href');
      var prependHttp = function(s : string) {
        // if it doesn't start with "http://", prepend the url to the rssUrl
        if (s.indexOf("http://") !== 0 && s.indexOf("https://") !== 0)
          return url + "/" + s;
        return s;
      };
      rssUrls = _.map(rssUrls, prependHttp);
      // rssUrls = ["http://xkcd.com/rss.xml", ...]

      // this will be filled with rssUrls.length feeds
      var feeds : I.DbFeed[] = [];

      // when you're finally done, call callback
      var lastly = _.after(rssUrls.length, function() {
        callback(null, feeds);
      });

      // get each rss, inserting each one into feeds
      _.range(rssUrls.length).forEach(function(i : number) {
        // try to look it up in the database
        db.feeds.findOne({url: rssUrls[i]}, function(err, feed ?: I.DbFeed) {
          // if you couldn't find it in the database, go download it and
          // update it
          if (err || !feed) {
            util.pp(rssUrls, "rssUrls");
            util.pp(i, "i");

            updateFeed(rssUrls[i], function(err, downloadedFeed ?: I.DbFeed) {
              if (err) return callback(err);
              feeds[i] = downloadedFeed;
              lastly();
            });
          } else {
            // otherwise, you found it, so no need to download it
            feeds[i] = feed;
            lastly();
          }
        });
      });

    });
  });
};


var updateEverything = function() : void {

  /* Primitive locking to avoid race conditions (what if two threads detect
     that they should download the webpage, download it, and put both into
     the database?) If I'm already updating, just skip for now and wait
     around until next time */
  if (glob.isUpdating) {
    console.log("\n*********** " + "update already running; skipping update"
                + " ***********\n\n");
    return;
  }
  console.log("\n*********** " + "starting update" + " ***********\n\n");
  glob.isUpdating = true;

  // get all the feeds, and then look them up
  db.feeds.find({}).toArray(function(err, dbFeeds : I.DbFeed[]) {
    if (err) {
      glob.isUpdating = false;
      throw err;
    }

    var releaseIfFinished = _.after(dbFeeds.length, function() {
      console.log("\n*********** done updating! ***********\n\n");
      glob.isUpdating = false;
    });

    // count how many feeds have been updated. When this reaches
    // dbFeeds.length, we know we're done, so release the lock
    // on glob.isUpdating
    for (var i = 0; i < dbFeeds.length; i++) {
      updateItems(dbFeeds[i], function(err) {
        releaseIfFinished();
        util.logIt(err);
      });
    }
  });
};


/* Give me a random salt. */
export var generateSalt =  function() : string {
  var s = c.SALT_STRING;
  var n = c.SALT_LENGTH;
  var range = _.range(n);
  var indices = _.map(range, function() { return _.random(s.length-1) });
  var chars = _.at(s, indices);
  return _.reduce(chars, function(x, y) { return x+y });
}

/* What is the salt for this user? */
var getSalt = function(facebookId : string,
                       callback : (err : any, salt ?: string) => any)
                    : void {
   db.salts.find({facebookId: facebookId}).toArray(function(err, a : I.DbSalt[]) {
     if (err) return callback(err);
     util.assert(a.length <= 1,
                 "more than one salt per facebookId: " + util.sify(a));
     // if you already have the salt, just return it.
     if (a.length === 1) return callback(null, a[0].salt);

     // if you don't already have it, create it, insert it,
     // and call the callback on it
     var newEntry : I.DbSalt = {
       facebookId: facebookId,
       salt: generateSalt()
     };
     db.salts.insert(newEntry, function(err) {
       callback(err, newEntry.salt);
     });
   });
};

/* Give me the database version of this user. If they don't exist, create
 * them. */
export var getFbUser = function(fbUser : I.FbUser,
                              callback : (err : any, user ?: I.DbUser) => void)
                            : void {
  db.users.find({fbId: fbUser.id}).toArray(function(err, a : I.DbUser[]) {
    if (err) return callback(err);
    util.assert(a.length <= 1,
                "more than one user per facebookId: " + util.sify(a));
    if (a.length === 1) return callback(null, a[0]);

    // guess it's not there. Get the salt for this person and stick
    // them in the database
    getSalt(fbUser.id, function(err, salt ?: string) {
      if (err) return callback(err);

      var dbUser : I.DbUser = {
        fbId: fbUser.id,
        displayName: fbUser.displayName,
        givenName: fbUser.name.givenName,
        familyName: fbUser.name.familyName,
        gender: fbUser.gender,
        profileUrl: fbUser.profileUrl,
        brssId: sha1(salt + fbUser.id),
        _id: new mongo.ObjectID(),
        feedIds: [],
      };

      db.users.insert(dbUser, function(err) {
        callback(err, dbUser);
      });

    });
  });
};

export var getUser = function(brssId : string,
                              callback : (err, user ?: I.DbUser) => void)
: void {
  db.users.findOne({brssId: brssId}, function(err, user ?: I.DbUser) {
    if (err || !user) {
      callback(err || !user);
    } else {
      callback(null, user);
    }
  });
}


export var getUserFeeds = function(brssId : string,
                                   callback : (err : any,
                                               feeds ?: I.DbFeed[]) => void)
: void {
  db.users.findOne({brssId: brssId}, function(err, user : I.DbUser) {
    if (err || !user) return callback(err || !user);
    if (user === null) return callback("user is null!");
    db.feeds.find({_id: {$in: user.feedIds}}).toArray(callback);
  });
};

export var addUserFeeds = function(brssId : string, url : string,
                                   callback : (err, feeds ?: I.DbFeed[]) => void
) : void {
  db.users.findOne({brssId: brssId}, function(err, user : I.DbUser) {
    if (err || !user) return callback(err || !user);

    // TODO: figure out how to remove exports
    exports.addBySiteUrl(url, function(err, feeds ?: I.DbFeed[]) {
      if (err) return callback(err);

      // needed function due to duplicated code
      var gotMeMyFeeds = function(feeds : I.DbFeed[]) : void {

        // there actually were some feeds! Make a new version of the
        // user, add on the new feeds, and insert it back into the db

        // must be non-deep clone: deep messes up mongo.ObjectID
        var newUser : I.DbUser = _.clone(user);
        var newIds = _.map(feeds, (feed) => feed._id);
        var eachToString = (a) => _.map(a, (e) => e.toString());
        // turn them into strings, take their union, then map them back to
        // ObjectID's
        newUser.feedIds =
          _.map(
            _.union(
              eachToString(user.feedIds), eachToString(newIds)),
            (s : string) => new mongo.ObjectID(s));
        db.users.update({brssId: user.brssId}, newUser, function(err) {
          callback(err, feeds);
        });
      };

      if (feeds.length !== 0) {
        gotMeMyFeeds(feeds);
      } else {
        // So we found nothing at foo.com. Maybe it's actually an rss url?
        addFeedFromRssUrl(url, function(err, feed ?: I.DbFeed) {
          // util.pp(err, "err");
          // util.pp(feed, "feed");
          if (err) {
            // crap, didn't find anything treating foo.com as a website and
            // didn't find anything treating it as an rss feed. Give up.
            callback(null, []);
          } else {
            // otherwise, replace our empty list with this feed and procees
            // like nothing ever happened
            gotMeMyFeeds([feed]);
          }
        });
      }

    });
  });
};

export var deleteUserFeeds = function(brssId : string, badIds : string[],
                                      callback : (err : any) => void)
: void {
  db.users.findOne({brssId: brssId}, function(err, user : I.DbUser) {
    if (err || !user) return callback(err || !user);
    // make a new user, with user.feedIds not containing any of badIds
    var newUser : I.DbUser = _.clone(user);
    var eachToString = (a) => _.map(a, (e) => e.toString());
    newUser.feedIds =
      _.map(
        _.difference(eachToString(newUser.feedIds), badIds),
        (s : string) => new mongo.ObjectID(s));

    util.pp(user.feedIds, "user.feedIds");
    util.pp(badIds, "badIds");
    util.pp(newUser.feedIds, "newUser.feedIds");

    // finally, actually update the database
    db.users.update({brssId: brssId}, newUser, callback);
  });
};

export var getSomeItems = function(feedId : string,
                                   callback : (err, items ?: I.DbItem[]) =>void)
: void {
  db.items.find({feedId: new mongo.ObjectID(feedId)})
    .sort({date: -1})
    .limit(3)
    .toArray(callback);
};

export var nextNItems = function(feedId : string, date : number, n : number,
                                 callback : (err, items ?: I.DbItem[]) => void)
: void {
  db.items.find({feedId: new mongo.ObjectID(feedId),
                 date: {$lt: date}})
    .sort({date: -1})
    .limit(n)
    .toArray(callback);
};


export var getItem = function(itemId : string,
                              callback : (err, item ?: I.DbItem) => void)
: void {
  db.items.findOne({itemId: new mongo.ObjectID(itemId)},
                   function(err, item ?: I.DbItem) {
                     if (err || !item) return callback(err || !item);
                     callback(null, item);

                   });
};


/* The function to start it all */
export var start = function(callback ?: Function) : void {
  if (!callback) callback = util.throwIt;
  var client = new mongo.Db('testDb',
                            new mongo.Server('localhost', 27017),{w:1});

  client.open(function(err) {
    if (err) return callback(err);

    // when you're done, call this function
    var after = _.after(_.size(db), function() {
      setInterval(updateEverything, c.UPDATE_INTERVAL);
      updateEverything();
      callback(null);
    });

    // add all the collections to the server
    var keys : string[] = _.keys(db);
    for (var i : number = 0; i < keys.length; i++) {
      (function() {
        var key = keys[i];
        client.collection(key, function(err, collection) {
          util.throwIt(err);
          db[key] = collection;
          after();
        });
      })();
    }
  });
};
