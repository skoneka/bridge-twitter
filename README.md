
# Twitter to Pryv bridge server

Node.JS server handling Twitter to Pryv integration. Manages the forwarding of selected user tweets to their Pryv account, including authorization on Twitter and Pryv, and configuration.

## Installation

To get the external dependencies, run:

    $npm install


## Usage

When running, the server application automatically tracks users described in the `/lib/twitter-users.json` file.
Their tweets and the tweets of the people they follow are forwarded in real-time to their pryv account.

To forward the entire timeline of a user to pryv, connect to the server like this:

	http://localhost:3000/user-timeline/jcdusse4

The server will respond with a list of ids resulting of the batch upload operation.

All tweets are stored as event with this specific type

	{
      "class": "note",
      "format": "twitter"
    }

No definitive data structure has been decided yet.
To simplify things, we could use the same structure as twitter's api and simply remove unnessecessary data with `delete object.property;`

Here's an example of the event's value property:

    {
	  "coordinates": null,
	  "id_str": "240859602684612608",
	  "entities": {
	    "urls": [
	      {
	        "expanded_url": "https://dev.twitter.com/blog/twitter-certified-products",
	        "url": "https://t.co/MjJ8xAnT",
	        "indices": [
	          22,
	          43
	        ],
	        "display_url": "dev.twitter.com/blog/twitter-c\u2026"
	      }
	    ],
	    "hashtags": [
	      {
			text: 'testing',
			indices: [ 8, 16 ]
          }
        ],
	    "user_mentions": [

	    ]
	  },
	  "text": "another #test message https://t.co/MjJ8xAnT",
	  "retweet_count": 0,
	  "in_reply_to_status_id_str": null,
	  "id": 240859602684612608,
	  "geo": null,
	  "retweeted": false,
	  "possibly_sensitive": false,
	  "in_reply_to_user_id": null,
	  "place": null,
	  "user": {
	    "name": "Twitter API",
	    "screen_name": "twitterapi"
	  },
	  "in_reply_to_screen_name": null
	}

## Tests

To run the tests, simply execute the makefile:

	$./makefile


## Comments

The ntwitter library has been slightly modified so it has been left in the node_modules folder.
