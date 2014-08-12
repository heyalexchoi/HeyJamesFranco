#!/usr/bin/env/node
console.log("Hey James Franco");

var env = require('node-env-file');
var Twit = require('twit');
var Q = require('q');

env(__dirname + '/.env');

// credentials stored in local, uncommitted .env file
var T = new Twit({
	consumer_key:         process.env.TWITTER_CONSUMER_KEY 
	, consumer_secret:      process.env.TWITTER_CONSUMER_SECRET
	, access_token:         process.env.TWITTER_ACCESS_TOKEN
	, access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// search twitter for (count) number of tweets to @jamesfrancotv. returns promise that fullfills with array of tweets
function getMentions(count) {
	return Q.Promise(function (resolve, reject) {
		T.get('search/tweets', { q: "@jamesfrancotv", count: count }, function(error, data, response) {
			if (error) reject(error);
			else resolve(data.statuses);
		});
	});
}

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

// retweets (count) number of replies to @jamesfrancotv's tweets
function sayHeyToJames(count) {
	var favoriteCount = 0;
	var retweetCount = 0;
	var favoriteErrorCount = 0;
	var retweetErrorCount = 0;
	// get all the mentions
	getMentions(count)
	// retweet and favorite all of them
	.then(function(tweets) {
		var retweetPromises = tweets.map(function(tweet) {
			reTweetID(tweet.id_str).then(function(data) {
				retweetCount ++;
			})
			.fail(function(error) {
				retweetErrorCount ++;
				console.error(Date() + error.allErrors);
			})
			.done();
		});
		var favoritePromises = tweets.map(function(tweet) {
			favoriteTweetID(tweet.id_str).then(function(data) {
				favoriteCount ++;
			})
			.fail(function(error) {
				favoriteErrorCount ++;
				console.error(Date() + error.allErrors);
			})
			.done();
		});
		var bothPromises = favoritePromises.concat(retweetPromises);
		return Q.allSettled(bothPromises);
		})
	.then(function() {
		console.log('\n' + Date() + '\nretweeted: ' + retweetCount + '\nfavorited: ' + favoriteCount 
			+ '\n retweet errors: ' + retweetErrorCount + '\n favorite errors: ' + favoriteErrorCount);
	});
}

if(require.main == module) {
	console.error(Date() + 'Invoked at command line.');
	var args = process.argv;
    // can take positive numerical argument to say hey to james that many times
    if (args.length != 3 || Number.isNaN(args[2]) || args[2] < 1) {
    	sayHeyToJames(1);  

    } else {
    	sayHeyToJames(args[2]);
    }
} else {
	console.error(Date() + 'Invoked via library call');
}

exports.sayHeyToJames = sayHeyToJames;
