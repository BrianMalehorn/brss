/// <reference path="./definitely-typed/express.d.ts"/>
/// <reference path="./definitely-typed/node.d.ts"/>
/// <reference path="./typescript-node-definitions/mongodb.d.ts"/>

import f = module('foo');
import fs = module('fs');
import express = module('express');
import http = module('http');
var FeedParser = require('feedparser');
var jsdom = require('jsdom');
var request = require('request');
import mongo = module('mongodb');

var client = new mongo.Db('testDb', new mongo.Server('localhost', 27017),{w:1});
var db = {items: undefined, feeds: undefined};

var app = express();
app.use(express.bodyParser());

var ipAddress : string = process.env.OPENSHIFT_INTERNAL_IP || "localhost";
var port : number = process.env.OPENSHIFT_INTERNAL_PORT || 8000;

/*****************************************
 * stuff I'll probably move into other files
 *****************************************/

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

var glob : Glob = {isUpdating: false};

var c : Constants = {
  // how often, in MS, I attempt an update
  UPDATE_INTERVAL: 10 * 1000
}


var throwIt = function(err) {
  if (err)
    throw err;
};

var sify = function(obj : any) : string {
  return JSON.stringify(obj, null, "\t");
};

var assert = function(cond : bool, msg ?: string) {
  if (!msg) {
    msg = "assertion error";
  }
  if (!cond) {
    throw msg;
  }
};

/*****************************************
 * actual code
 *****************************************/

app.get("/", function(request, response) : void {
  response.send("Hello, world!");
});


/* Given a pre-existing feed, update all of its items */
var updateItems = function(feed : DbFeed, callback ?: any) {
  console.log("update items: " + sify(feed.url));
  if (!callback) {
    callback = throwIt;
  }

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
            throwIt(err);

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
              console.log("inserting db item: " + sify(dbItem.url));
              db.items.insert(dbItem, {safe : true}, throwIt);
            } else if (a.length === 1) {
              console.log("db item already there: " + sify(fpItem.link));
            } else {
              console.log("removing db item: " + sify(dbItem.url));
              db.items.remove(dbItem, function(err) {
                throwIt(err);
                console.log("inserting db item: " + sify(dbItem.url));
                db.items.insert(dbItem, {safe: true}, throwIt);
              });
            }
          });
    });
};

/* Given a url like "http://xkcd.com/rss.xml", adds the the feed to the server
   (if it's not already there) and updates all of its elements and if callback
   is given, calls it. */
var updateFeed = function(url : string, callback ?: any) {
  if (!callback)
    callback = throwIt;

  if (url.indexOf("http://") === -1) {
    url = "http://" + url;
  }
  // replace "//" with "/"
  url = url.replace(/\/\//g, "/");
  url = url.replace("http:/", "http://");
  console.log("update feed: " +  sify(url));

  db.feeds.find({url: url}).toArray(function(err, feeds : DbFeed[]) {
    if (err) return callback(err);

    // should never have duplicates
    assert(feeds.length <= 1, "duplicate feeds: " + sify(url));

    if (feeds.length === 0) {
      console.log("creating db feed: " + sify(url));
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
var addBySiteUrl = function(uri : string, callback ?: any) : void {

  if (!callback) {
    callback = throwIt;
  }

  // if it ends with a "/", strip it off
  if (uri.charAt(uri.length-1) == "/") {
    uri = uri.substring(0, uri.length-1);
  }

  // download the webpage
  request({uri: uri}, function(err, response, body) {
    if (err) return callback(err);
    // parse the html into a dom
    jsdom.env({
      html: body,
      scripts: ['static/jquery-1.9.1.js']
    }, function (err, window) {
      if (err) return callback(err);
      // get out the url of the rss
      var $ = window.jQuery;
      var rssUrl : string = $("link[type='application/rss+xml']")[0].href;
      // if it doesn't start with "http://", prepend the uri to the rssUrl
      if (rssUrl.indexOf("http://") != 0) {
        rssUrl = uri + "/" + rssUrl;
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

    var numUpdated = 0;
    var releaseIfFinished = function() {
      assert(numUpdated <= dbFeeds.length,
             "finished updating more feeds than we started");
      if (numUpdated === dbFeeds.length) {
        console.log("\n*********** done updating! ***********"
                    + "\n\n");
        glob.isUpdating = false;
      }
    };

    // try to release it right now. If 0 feeds in db, will release
    releaseIfFinished();

    // count how many feeds have been updated. When this reaches
    // dbFeeds.length, we know we're done, so release the lock
    // on glob.isUpdating
    for (var i = 0; i < dbFeeds.length; i++) {
      updateItems(dbFeeds[i], function(err) {
        numUpdated++;
        releaseIfFinished();
        throwIt(err);
      });
    }
  });
};


/* The function to start it all */
var main = function() : void {

  client.open(function(err) {
    throwIt(err);
    client.collection('feeds', function(err, collection) {
      throwIt(err);
      db.feeds = collection;
      client.collection('items', function(err, collection) {
        throwIt(err);
        db.items = collection;

        console.log("%s: trying on %s:%d",
                    (new Date()).toString(), ipAddress, port);
        app.listen(port, ipAddress, -1, function() : void {
          console.log("%s: started on %s:%d",
                      (new Date()).toString(), ipAddress, port);

          // want to have stuff run every time? Put it here

          // setInterval(updateEverything, c.UPDATE_INTERVAL);

        });
      });
    });
  });
};

main();
