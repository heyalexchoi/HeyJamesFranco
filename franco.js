#!/usr/bin/env/node
var env = require('node-env-file');
var Twit = require('twit');
var Q = require('q');
var Mailgun = require('mailgun').Mailgun;
var mgRecipients = require('./mailgun-recipients');
env(__dirname + '/.env');

var hourlyRetweetLimit = 100;
var hourlyFavoriteLimit = 100;
var hourlyFollowLimit = 5;
var hourlyErrorLimit = 100;

// credentials stored in local, uncommitted .env file
var T = new Twit({
	consumer_key:         process.env.TWITTER_CONSUMER_KEY 
	, consumer_secret:      process.env.TWITTER_CONSUMER_SECRET
	, access_token:         process.env.TWITTER_ACCESS_TOKEN
	, access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var mg = new Mailgun(process.env.MAILGUN_API_KEY);

// every hour, reset counts, send emails
// do not tweet if count is >=100
function Counter() {
	this.retweets = 0;
	this.favorites = 0;
	this.followed = 0;
	this.retweetErrors = 0;
	this.favoriteErrors = 0;
	this.followedErrors = 0;
	this.tweets = 0;
	this.connected = 0;
	this.limit = 0;
	this.disconnect = 0;
	this.connect = 0;
	this.reconnect = 0;
	this.warning = 0;
};

var counter = new Counter();

function emailCounterNumbers() {
	// email the hour's work to recipients
	var message = '\n' + Date() 
	+ '\n retweeted: ' + counter.retweets 
	+ '\n favorited: ' + counter.favorites 
	+ '\n followed: ' + counter.followed
	+ '\n retweet errors: ' + counter.retweetErrors 
	+ '\n favorite errors: ' + counter.favoriteErrors
	+ '\n followed errors: ' + counter.followedErrors
	+ '\n tweets: ' + counter.tweets
	+ '\n connected' + counter.connected
	+ '\n limit' + counter.limit
	+ '\n disconnect' + counter.disconnect
	+ '\n connect' + counter.connect
	+ '\n reconnect' + counter.reconnect
	+ '\n warning' + counter.warning;

		mg.sendText('heyjamesfranco@heyjamesfranco.com', //sender
			mgRecipients, //recipient(s)
			"franco update", //subject
			message, // text
			null,
			null,
			function(error) { //callback
				if (error) console.error(Date() + 'mailgun error' + error);	
			});
	}

// every hour:
var interval = setInterval( function () {
	emailCounterNumbers();
		// reset the counter
		counter = new Counter();

	}, 1000 * 60 * 60);


// retweets tweet with tweetID, asynchronously returns response via callback.
function reTweetID(tweetID) {
	return Q.Promise(function (fullfill, reject) {
		T.post('statuses/retweet/:id', { id: tweetID.toString() }, function(error, data, response) {
			if (error) reject(error);
			else fullfill(data);
		});
	});	
}

function favoriteTweetID(tweetID) {
	return Q.Promise(function (fullfill, reject) {
		T.post('favorites/create', { id: tweetID.toString() }, function(error, data, response) {
			if (error) reject(error);
			else fullfill(data);
		});	
	});
}

function followUserID (userID) {
	return Q.Promise(function (fullfill, reject) {
		T.post('friendships/create', { user_id: userID.toString() }, function(error, data, response) {
			if (error) reject(error);
			else fullfill(data);
		});	
	});
}


var francoID = '2708171460';
var francoScreenName = 'heyjamesfranco';
// monitor any mentions of:
var keywords = [ 'james franco', '@jamesfrancotv', '@heyjamesfranco' ];
var stream = T.stream('statuses/filter', { track: keywords.join() })

// stream emitted tweet event:
stream.on('tweet', function (tweet) {
	console.log(Date() + 'tweet: ' + tweet.text);
	counter.tweets ++;

	// stop doing stuff until the end of the hour if we get too many errors
	if (counter.retweetErrors + counter.favoriteErrors + counter.followedErrors > hourlyErrorLimit) {
		return;
	}

	// ignore my own tweets
	if (tweet.user.id_str === francoID) {
		console.log('take no action on my own tweet: ' + tweet.text);
		return;
	}

	// retweet if below hourly limit and did not already RT
	if (counter.retweets < hourlyRetweetLimit 
		&& !tweet.current_user_retweet && !tweet.retweeted) {
		reTweetID(tweet.id_str)
		.then(function(data) {
			console.log(Date() + 'retweeted: ' + data.text);
			counter.retweets ++;
			console.log('RETWEET THIS IS ME' + data.user.screen_name + data.user.id_str);
		})
		.catch(function(error) {
			console.error(Date() + 'retweet error: ' + error.message);
			counter.retweetErrors ++;
		});
	}
	// favorite if did not already favorite
	if (counter.favorites < hourlyFavoriteLimit && !tweet.favorited) {
		favoriteTweetID(tweet.id_str)
		.then(function (data) {
			console.log(Date() + 'favorited: ' + data.text);
			counter.favorites ++;
		})
		.catch(function(error) {
			console.error(Date() + 'favorite error:' + error.message);
			counter.favoriteErrors ++;
		});
	}
	// follow tweet's user if not already following and no requests and below 5 follow requests/hour
	if (!tweet.user.following 
		&& !tweet.user.follow_request_sent
		&& counter.followed < hourlyFollowLimit) {
		followUserID(tweet.user.id_str)
	.then(function (data) {
		console.log(Date() + 'followed: ' + data.screen_name);
		counter.followed ++;
	})
	.catch( function (error) {
		console.error(Date() + 'follow error:' + error.message);
		counter.followedErrors ++;
	});
}
})


stream.on('connected', function (response) {
	console.error(Date() + 'connected:' + response);
	counter.connected ++;
})

stream.on('limit', function (limitMessage) {
	console.error(Date() + 'limit: ' + limitMessage);
	counter.limit ++;
})

stream.on('disconnect', function (disconnectMessage) {
	console.error(Date() + 'disconnect: ' + disconnectMessage);
	counter.disconnect ++;
})

stream.on('connect', function (request) {
	console.error(Date() + 'connect: ' + request);
	counter.connect ++;
})


stream.on('reconnect', function (request, response, connectInterval) {
	console.error(Date() + 'reconnect: ' + request + response + connectInterval);
	counter.reconnect ++;
})

stream.on('warning', function (warning) {
	console.error(Date() + 'warning: ' + warning);
	counter.warning ++;
})



// error message:
/*
{
  message:      '...',  // error message
  statusCode:   '...',  // statusCode from Twitter
  code:         '...',  // error code from Twitter
  twitterReply: '...',  // raw response data from Twitter
  allErrors:    '...'   // array of errors returned from Twitter
}
*/
// start and stop stream:
// stream.start();
// stream.stop();
