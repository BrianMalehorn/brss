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

/* Given a url like "http://xkcd.com/rss.xml", adds the the feed to the server
   (if it's not already there) and updates all of its elements and if callback
   is given, calls it. */
declare export var updateFeed : (url : string, callback ?: Function) => void;

/* Given a url like "http://xkcd.com/", adds the entries to the server */
declare export var addBySiteUrl : (url : string, callback ?: Function) => void;

/* Start the actual server (boot up the database and set the timeout on
 * updating the database */
declare export var start : (callback ?: Function) => void;


/********************************************************************
 * imports
 ********************************************************************/

import f = module('foo');
import util = module('utilities');

var FeedParser = require('feedparser');
var jsdom = require('jsdom');
var request = require('request');
var _ : Lodash = require('./static/lodash.js');
import mongo = module('mongodb');


/********************************************************************
 * interfaces
 ********************************************************************/

/* Items and feeds stored in the database */
interface DbFeed {
  title : string;
  description : string;
  url : string;
  _id : mongo.ObjectID;
}

interface DbItem {
  title : string;
  description : string;
  url : string;
  date : number;
  feedId : mongo.ObjectID;
  _id : mongo.ObjectID;
}

/* When you get an item via FeedParser (Fp), it's different then when you store
   it in the database. Thus, it's useful to have these distinctions. */
interface FpFeed {
  description : string;
  title : string;
  link : string;
}

interface FpItem {
  title : string;
  description : string;
  link : string;
  date : Date;
}

/* Data structure to hold global info. */
interface Glob {
  isUpdating : bool;
}

interface Constants {
  UPDATE_INTERVAL : number;
}

interface Db {
  items : mongo.Collection;
  feeds : mongo.Collection;
}

/********************************************************************
 * variable declarations
 ********************************************************************/

var glob : Glob = {isUpdating: false};

var c : Constants = {
  // how often, in MS, I attempt an update
  UPDATE_INTERVAL: 10 * 1000
};

var db : Db = {items : undefined,
               feeds : undefined};

/********************************************************************
 * actual code
 ********************************************************************/

/* Given a pre-existing feed, update all of its items */
var updateItems = function(feed : DbFeed, callback ?: Function) {
  console.log("update items: " + util.sify(feed.url));
  if (!callback) callback = util.throwIt;

  request(feed.url)
    .pipe(new FeedParser({}))
    .on('error', callback)
    .on('end', callback)
    .on('article', function(fpItem : FpItem) {
      // If they didn't put a date, shame on them.
      // Give it the current date.
      if (!fpItem.date) {
        fpItem.date = new Date();
      }

      // try to find exact match in the database
      db.items.find(
        {url: fpItem.link, date: fpItem.date.getTime()}).toArray(
          function(err, a) {
            util.throwIt(err);

            var dbItem : DbItem = {
              title: fpItem.title,
              description: fpItem.description,
              url: fpItem.link,
              date: fpItem.date.getTime(),
              feedId: feed._id,
              _id: new mongo.ObjectID()
            }

            if (a.length === 0) {
              // otherwise, make a DbItem and insert it into the db
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
var updateFeed = function(url : string, callback ?: Function) {
  if (!callback)
    callback = util.throwIt;

  if (url.indexOf("http://") === -1) {
    url = "http://" + url;
  }
  // replace "//" with "/"
  url = url.replace(/\/\//g, "/");
  url = url.replace("http:/", "http://");
  console.log("update feed: " +  util.sify(url));

  db.feeds.find({url: url}).toArray(function(err, feeds : DbFeed[]) {
    if (err) return callback(err);

    // should never have duplicates
    util.assert(feeds.length <= 1, "duplicate feeds: " + util.sify(url));

    if (feeds.length === 0) {
      console.log("creating db feed: " + util.sify(url));
      request(url)
        .pipe(new FeedParser({}))
        .on('error', callback)
        .on('meta', function(feed : FpFeed) {

          var dbFeed : DbFeed = {
            title: feed.title,
            description: feed.description,
            url: url,
            _id: new mongo.ObjectID()
          };

          db.feeds.insert(dbFeed, function(err) {
            if (err) throw err;
            updateItems(dbFeed, callback);
          });
        });
    } else {
      updateItems(feeds[0], callback);
    }
  });
};


/* Given a url like "http://xkcd.com/", adds the entries to the
   server */
var addBySiteUrl = function(url : string, callback ?: Function) : void {

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
      // TODO: insert all of the values
      var rssUrl : string = $("link[type='application/rss+xml']")[0].href;
      // if it doesn't start with "http://", prepend the url to the rssUrl
      if (rssUrl.indexOf("http://") != 0) {
        rssUrl = url + "/" + rssUrl;
      }
      updateFeed(rssUrl, callback);
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
  db.feeds.find({}).toArray(function(err, dbFeeds : DbFeed[]) {
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
        util.throwIt(err);
      });
    }
  });
};


/* The function to start it all */
var start = function(callback ?: Function) : void {
  if (!callback) callback = util.throwIt;

  var client = new mongo.Db('testDb',
                            new mongo.Server('localhost', 27017),{w:1});

  client.open(function(err) {
    if (err) return callback(err);
    client.collection('feeds', function(err, collection) {
      if (err) return callback(err);
      db.feeds = collection;
      client.collection('items', function(err, collection) {
        if (err) return callback(err);
        db.items = collection;

        // want to have stuff run every time? Put it here
        setInterval(updateEverything, c.UPDATE_INTERVAL);

        callback(null);

      });
    });
  });
};
