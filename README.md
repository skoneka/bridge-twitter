# Twitter to Pryv bridge server

Node.JS server handling Twitter to Pryv integration. Manages the forwarding of selected user tweets to their Pryv account, including authorization on Twitter and Pryv, and configuration.


## Setting up the development environment on a Mac

Read, then execute `./scripts/setup-dev-environment.bash`. It will check for Mongo DB in the parent folder and install it if necessary.


## Usage

When running, the server application automatically tracks users stored in a mongo db (a script to populate the db is coming).
Their tweets and the tweets of the people they follow are forwarded in real-time to their pryv account.
The server relies on the boolean value twitter.isFilterActive to decide if only specific tweets must be forwarded, based on a filter defined as a string in `twitter.filter`.

All tweets are stored as events with this specific type

	{
      "class": "message",
      "format": "twitter"
    }

No definitive data structure has been decided yet.
For the moment, we use the same structure as twitter's api (unnecessary properties can be removed with `delete object.property;`)


## API description

    GET /user-timeline/user

Retrieves the last 3200 tweets of the user and forwards them to his pryv account.
The server will respond with a list of ids resulting of the batch upload operation.
Tweets already present are skipped.

***

    GET /user-settings-schema

Provides the schema of the user settings. Currently it looks like this:

    {
	  "title": "User Settings Schema",
	  "type": "object",
	  "properties": {
	    "twitter": {
	      "type": "object",
	      "properties": {
	        "filter": {
	          "type": "string"
	        },
	        "filterIsActive": {
	          "type": "boolean"
	        },
	        "credentials": {
	          "type": "object",
	          "properties": {
	            "access_token_key": {
	              "type": "string"
	            },
	            "access_token_secret": {
	              "type": "string"
	            },
	            "consumer_key": {
	              "type": "string"
	            },
	            "consumer_secret": {
	              "type": "string"
	            },
	            "username": {
	              "type": "string"
	            }
	          }
	        }
	      }
	    },
	    "pryv": {
	      "type": "object",
	      "properties": {
	        "channelId": {
	          "type": "string"
	        },
	        "folderId": {
	          "type": "string"
	        },
	        "credentials": {
	          "type": "object",
	          "properties": {
	            "username": {
	              "type": "string"
	            },
	            "auth": {
	              "type": "string"
	            }
	          }
	        }
	      }
	    },
	    "required": [
	      "twitter",
	      "pryv"
	    ]
	  }
	}

***

    GET /user-settings/user

Provides settings of the user

***

    PUT /user-settings/user

Updates user settings
For example, to update the filter of the user, this json must be provided:

    {
      'twitter': {
      	'filter': '+Z'
      }
    }

***

    POST /user-settings

Creates user settings for a new user.
For example, to insert a new user, this json must be provided:

    {
      "twitter": {
        "filter": "+Y",
        "filterIsActive": true,
        "credentials": {
          "access_token_key": "atk-string",
          "access_token_secret": "ats-string",
          "consumer_key": "ck-string",
          "consumer_secret": "cs-string",
          "username": "twitter-username"
        }
      },
      "pryv": {
        "channelId": "channelID-string",
        "folderId": "folderId-string",
        "credentials": {
          "auth": "auth-string",
          "username": "pryv-username"
        }
      }
    }

***

    GET /auth-process-details

Provides information about the OAuth procedure.
For now is displays:

    {
      "url": "https://api.twitter.com/oauth/authorize",
      "info": "pryv's token must be provided"
    }

***

For development purposes, this API call:

	GET /users

Provides the settings of all users in the db.


## Tests

To run the tests, simply execute the makefile:

	$make


## License

(Revised BSD license.)

Copyright (c) 2013, PrYv S.A. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of PrYv nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PRYV BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
