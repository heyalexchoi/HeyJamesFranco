#!/usr/bin/env/node
console.log("Hey James Franco");

var env = require('node-env-file');
var Twit = require('twit');

env(__dirname + '/.env');

// credentials stored in local, uncommitted .env file
var T = new Twit({
    consumer_key:         process.env.TWITTER_CONSUMER_KEY 
  , consumer_secret:      process.env.TWITTER_CONSUMER_SECRET
  , access_token:         process.env.TWITTER_ACCESS_TOKEN
  , access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// search twitter for (count) number of replies to @jamesfrancotv. executes callback function on array of tweet results
function getReplies(count, repliesCallback) {
	T.get('search/tweets', { q:"jamesfrancotv", "in_reply_to_screen_name":'jamesfrancotv', count: count}, function(error, data, response) {
	if (error !== null) {
		console.error(Date() + 'getReplies error: ' + error);		
	} else {
		repliesCallback(data.statuses);	
	}
});	
}
// search twitter for (count) number of tweets to @jamesfrancotv. executes callback function on array of tweet results
function getMentions(count, callback) {
	T.get('search/tweets', { q:"@jamesfrancotv", count: count}, function(error, data, response) {
	if (error !== null) {
		console.error(Date() + 'getMentions error: ' + error);		
	} else {
		callback(data.statuses);	
	}
});	
}
// retweets tweet with tweetID, then executes callback function. 
// tweetCount and errorCount tally success/failure
function reTweetID(tweetID, callback, tweetCount, errorCount) {	
	T.post('statuses/retweet/:id', { id: tweetID.toString() }, function (err, data, response) {
  		if (err !== null) {
  			errorCount ++;
  			console.error(Date() + 'retweet error #' + errorCount + ' err.code: '
				      + err.code + ' err.message: ' + err.message + ' response status code: ' +  response.statusCode);
  		}
  		else {
  			tweetCount ++;  			
  		}
  		callback(tweetCount, errorCount);
});
}

function favoriteTweetID(tweetID, callback, favoriteCount, errorCount) {
	T.post('favorites/create', { id: tweetID.toString() }, function (error, data, response) {
		if (error) {
			errorCount ++;
			console.error(Date() + 'favorite error #' + errorCount + ' error code: ' + error.code + 'error message: ' 
				+ error.message);
		} else {
			favoriteCount ++;
		}
		callback(favoriteCount, errorCount);
	});
}
// recursively calls reTweetID on array of tweets. logs tweets and errors on completion.
function reTweetTweets(tweets, tweetCount, errorCount, favoriteCount) {
	if (tweets.length < 1) {
		console.log(Date() + 'tweeted: ' + tweetCount + 'times. ' + 'favorited: ' + favoriteCount + 'times. ' + errorCount + ' errors');
		return;
	}
	var tweet = tweets.pop();	
	favoriteTweetID(tweet.id_str, function(){}, favoriteCount, errorCount);
	reTweetID(tweet.id_str, function(tweetCount,errorCount) {
		reTweetTweets(tweets, tweetCount, errorCount, favoriteCount);
	}, tweetCount, errorCount);
	
}

// retweets (count) number of replies to @jamesfrancotv's tweets
function sayHeyToJames(count){
//getReplies(count, function (replies) {
getMentions(count, function (tweets) {
	var tweetCount = 0;
	var errorCount = 0;
	var favoriteCount = 0;
	reTweetTweets(tweets, tweetCount, errorCount, favoriteCount);
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
