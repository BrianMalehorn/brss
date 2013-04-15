/* This file contains all the interfaces you'll need between different
 * files. Usage:

 import I = module('interfaces');
 var x : I.DbFeed = { ... };

 */

import mongo = module('mongodb');

/* Items and feeds stored in the database */
export interface DbFeed {
  title : string;
  description : string;
  url : string;
  _id : mongo.ObjectID;
}

export interface DbItem {
  title : string;
  description : string;
  url : string;
  date : number;
  feedId : mongo.ObjectID;
  _id : mongo.ObjectID;
}

export interface DbSalt {
  facebookId : string;
  salt : string;
}

export interface DbUser {
  fbId : string;        // '1923493'
  displayName : string; // 'Brian Malehorn'
  givenName : string;   // 'Brian'
  familyName : string;  // 'Malehorn'
  gender : string;      // 'male'
  profileUrl : string;  // 'facebook.com/bmalehorn'
  brssId : string;      // '8068f390040f4049ae'
  _id : mongo.ObjectID;
  feedIds : mongo.ObjectID[];
}

/* When you get an item via FeedParser (Fp), it's different then when you store
   it in the database. Thus, it's useful to have these distinctions. */
export interface FpFeed {
  description : string;
  title : string;
  link : string;
}

export interface FpItem {
  title : string;
  description : string;
  link : string;
  date : Date;
}

export interface FbUser {
  provider : string;             // 'facebook'
  id : string;                   // '1923493'
  username : string;             // 'bmalehorn'
  displayName : string;          // 'Brian Malehorn'
  name : {givenName : string;    // 'Brian'
          familyName : string;}; // 'Malehorn'
  gender : string;               // 'male'
  profileUrl : string;           // 'facebook.com/bmalehorn'
  emails : string;               // usually []
}
