var express = require('express');
var passport = require('passport');
var sha1 = require('sha1');

var app = express();

var SALT = "Super duper secret salt!";

app.configure(function() {
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(express.session({secret: "foo"}));
    app.use(passport.initialize());
    app.use(passport.session());
});

var FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
    clientID: "232792796862700",
    clientSecret: "d91b10687ae303073fd80d1278c4c23c",
    callbackURL: "http://localhost:8000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(JSON.stringify(profile, null, "\t"));
        return done(null, profile);

}));

passport.serializeUser(function(user, done) {
    // user.id is something that anyone can access. Not quite a username, but
    // can still be accessed and spoofed. Therefore, create user.brssId to be
    // used on my actually application.
    user.brssId = sha1(SALT + user.id);
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get("/auth/facebook", passport.authenticate('facebook'));

app.get("/auth/facebook/callback",
        passport.authenticate('facebook',
                              { successRedirect: "/success.html",
                                failureRedirect: "/index.html"}));


/* Here, I have arbitrary requests to the server (this one just sends back a
   file). But if I wanted, I could look up request.user.brssId in a database
   where I store all the secure information and send it back. The only way it
   could be spoofed is if they knew my salt.

   I could make this even more secure by generating a random salt for each user
   and storing each one in the database, but that seems like a lot of effort
   for a demo.
*/
app.get("/success.html", function(request, response) {
    console.log(JSON.stringify(request.user, null, "\t"));
    response.sendfile("success.html");
});

app.get("/:filename", function(request, response) {
    response.sendfile(request.params.filename);
});

app.listen(8000);
