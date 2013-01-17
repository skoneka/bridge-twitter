
## Twitter to Pryv bridge server

Node.JS server handling Twitter to Pryv integration. Manages the forwarding of selected user tweets to their Pryv account, including authorization on Twitter and Pryv, and configuration.

# Installation

To get the external dependencies, run:

    $npm install


# Usage

When running, the server application automatically tracks users described in the `/lib/twitter-users.json` file.
Their tweets and the tweets of the people they follow are forwarded in real-time to pryv.

To forward the entire timeline of a user to pryv, connect to the server like this:

	http://localhost:3000/user-timeline/jcdusse4

The server will respond with a list of ids resulting of the batch upload operation.

All tweets are stored as event with this specific type

	{
      "class": "note",
      "format": "twitter"
    }

No definitive structure has been decided yer.

# Tests

For the moment, mocha has to be installed globally. In the project folder type:

	$mocha

