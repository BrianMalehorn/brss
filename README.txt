Group members: Brian Malehorn
andrew ID:     malehorn@andrew.cmu.edu

Just looking for the source code?

    ls *.ts static/*.ts

~~~~~~~~~

My project is a simple RSS reader for mobile devices. Typescript and friends
are already installed in the current directory. To build it, type

    make

You also need mongod which you have to install yourself, since it's freakin'
huge.

    mongod --dbpath ./

Let's run the server. You need sudo permissions to listen on port 80, so

      sudo node server

~~~~~~~~~

This isn't quite enough, since it logs in through MY facebook developer page,
which will not be approving of your IP address. Go look in server.ts:58 and
change clientID and clientSecret to your own, recompile, run the server, and it
should actually work. You can just access the server at your own IP address
(NOT localhost, which messes with facebook login).
