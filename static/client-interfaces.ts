interface ClUser {
  fbId : string;        // '1923493'
  displayName : string; // 'Brian Malehorn'
  givenName : string;   // 'Brian'
  familyName : string;  // 'Malehorn'
  gender : string;      // 'male'
  profileUrl : string;  // 'facebook.com/bmalehorn'
  brssId : string;      // '8068f390040f4049ae'
  _id : string;
  feedIds : string[];
}


/* Client feed. _id is tranferred into just its string. */
interface ClFeed {
  title : string;
  description : string;
  url : string;
  _id : string;
}


interface ClItem {
  title : string;
  description : string;
  url : string;
  date : number;
  feedId : string;
  _id : string;
}
