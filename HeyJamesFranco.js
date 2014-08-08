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
	tweetID = tweetID.toString();
	T.post('statuses/retweet/:id', { id: tweetID.toString() }, function (err, data, response) {
  		if (err !== null) {
  			errorCount ++;
  			console.error(Date() + 'retweet error #' + errorCount + ' : ' + err);
  		}
  		else {
  			tweetCount ++;  			
  		}
  		callback(tweetCount, errorCount);
});
}
// recursively calls reTweetID on array of tweets. logs tweets and errors on completion.
function reTweetTweets(tweets, tweetCount, errorCount) {
	if (tweets.length < 1) {
		console.log(Date() + 'tweeted: ' + tweetCount + 'times. ' + errorCount + ' errors');
		return;
	}
	var tweet = tweets.pop();	
	reTweetID(tweet.id_str, function(tweetCount,errorCount) {
		reTweetTweets(tweets, tweetCount, errorCount);
	}, tweetCount, errorCount);
	
}

// retweets (count) number of replies to @jamesfrancotv's tweets
function sayHeyToJames(count){
//getReplies(count, function (replies) {
getMentions(count, function (tweets) {
	var tweetCount = 0;
	var errorCount = 0;
	reTweetTweets(tweets, tweetCount, errorCount);
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

// twit library examples:

//
//  tweet 'hello world!'
//
/*
T.post('statuses/update', { status: 'hello world!' }, function(err, data, response) {
  console.log(data)
})
*/

/*
T.post('statuses/update', { status: '@HiJamesFranco @JamesFrancoTV HI' }, function(err, data, response) {
	console.log(data);
	//console.error(err);
	console.log(err);
	//console.log(response);
});
*/


/*

var getTweets = T.get('search/tweets', { q: 'jamesfrancotv', count: 100 }, function(error, data, response) {
	console.log(error);
	var statuses = data.statuses;
	// factor this out
	statuses.map(function(status) {
		//console.log(status.user.screen_name);
		//console.log(status.text);
	});
	return statuses;
})

*/
/*
setInterval(function(){
	//post;
  console.log('test');
  T.get('search/tweets', { q: })
}, 1000);
*/
/*
//
//  search twitter for all tweets containing the word 'banana' since Nov. 11, 2011
//
T.get('search/tweets', { q: 'banana since:2011-11-11', count: 100 }, function(err, data, response) {
  console.log(data)
})

//
//  get the list of user id's that follow @tolga_tezel
//
T.get('followers/ids', { screen_name: 'tolga_tezel' },  function (err, data, response) {
  console.log(data)
})

//
//  retweet a tweet with id '343360866131001345'
//
T.post('statuses/retweet/:id', { id: '343360866131001345' }, function (err, data, response) {
  console.log(data)
})

//
//  destroy a tweet with id '343360866131001345'
//
T.post('statuses/destroy/:id', { id: '343360866131001345' }, function (err, data, response) {
  console.log(data)
})

//
// get `funny` twitter users
//
T.get('users/suggestions/:slug', { slug: 'funny' }, function (err, data, response) {
  console.log(data)
})

//
//  stream a sample of public statuses
//
var stream = T.stream('statuses/sample')

stream.on('tweet', function (tweet) {
  console.log(tweet)
})

//
//  filter the twitter public stream by the word 'mango'.
//
var stream = T.stream('statuses/filter', { track: 'mango' })

stream.on('tweet', function (tweet) {
  console.log(tweet)
})

//
// filter the public stream by the latitude/longitude bounded box of San Francisco
//
var sanFrancisco = [ '-122.75', '36.8', '-121.75', '37.8' ]

var stream = T.stream('statuses/filter', { locations: sanFrancisco })

stream.on('tweet', function (tweet) {
  console.log(tweet)
})

//
// filter the public stream by english tweets containing `#apple`
//

var stream = T.stream('statuses/filter', { track: '#apple', language: 'en' })

stream.on('tweet', function (tweet) {
  console.log(tweet)
})
*/
