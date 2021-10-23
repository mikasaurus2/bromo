# What is this repository for?

This is my attempt to recreate a music listening DJ site that was shut down.
Friends can visit the site and queue up YouTube music videos. It will then
take turns playing videos from each person's queue.

Please note, this is a pretty dated project and the code has not been changed since 2015.


### Directory Structure ###
**app**

This contains the server side code.

**app/router**

These are the server side API handlers for incoming requests.

**app/schema**

These are the mongoDB schema definitions.

**config**

Configuration parsing module.

**public**

These are all the front end files that deal with the initial landing
page (login screen).

**view**

These are the protected front end files. This is the stuff you see
once you log in and are authenticated. (Playlist management
and searching) This is the main page on which the user will
spend their time.


### Configuration File ###

To start, the server needs to parse a configuration file with some parameters.
This file shouldn't be committed, since it contains secrat keyz. It should
be called 'config.json' since this name is in the .gitignore file and will
not be added or committed to the repository.

Here's an example file (it just contains this JSON object):

    {
      "port" : portnumber,
      "mongoDatabase" : "mongodb://user:password@localhost/database",
      "jwtSecret" : "some_secret_key",
      "youtubeApiKey" : "youtube_api_key"
    }

### How do I get set up? ###

Make sure you have node and npm installed.

Once you get the repository, you'll have to generate your node_modules/ directory. This is not checked into the repository because it has a lot of stuff in it. So, you should run this at the project root directory:

    npm install

Now you should be able to run the service. The main application file is server_main.js. So, you'd run the following:

    node server_main.js



