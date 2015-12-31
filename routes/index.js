var express = require('express');
var router = express.Router();
var fs = require('fs');
var util = require('util');
var extend = require('node.extend');
var moment = require('moment');
var request = require('request-promise');
var xpath = require('xpath');
var dom = require('xmldom-silent').DOMParser;
var twitter = require('twitter');
var Promise = require('promise');
var bibtex = require('bibtex-parser');

var twitter_credentials = JSON.parse(fs.readFileSync('data/twitter_credentials.json', 'utf8'));
var fitbit_credentials = JSON.parse(fs.readFileSync('data/fitbit_credentials.json', 'utf8'));
var fitbit = require('simple-oauth2')({site: 'https://api.fitbit.com', tokenPath: '/oauth2/token', clientID:fitbit_credentials.clientID, clientSecret:fitbit_credentials.clientSecret});
var fitbit_access_token = fitbit.accessToken.create({access_token: fitbit_credentials.access_token, refresh_token: fitbit_credentials.refresh_token, expires_in:3600});
var twitter_client = new twitter(twitter_credentials);

var publications = JSON.parse(fs.readFileSync('data/publications.json', 'utf8'));
var BIB_FILES = 'public/bibtex';
var bib_data = fs.readdirSync(BIB_FILES).map(function(f) { return formatBib(f, bibtex(fs.readFileSync(BIB_FILES + '/' + f, 'utf-8'))); });
bib_data.sort(compareBib);

function formatBib(f, bib) {
	var name = Object.keys(bib)[0];
	return extend(extend(bib[name], publications[name]), {'bib':BIB_FILES + '/' + f});
}

function compareBib(a, b) {
	var ma = moment(a.date, "MMM YYYY").valueOf();
	var mb = moment(b.date, "MMM YYYY").valueOf();
	if(ma > mb) { //inverse year sort
		return -1;
	} else if(ma < mb) {
		return 1;
	}
	return 0; //TODO: more detailed sorting when pubs were published at the same time
}

function getPromises() {
	return [request({uri: "http://kindle.amazon.com/profile/Daniel/4607804/reading"}),
	fitbit.api('GET', util.format('/1/user/23PXR4/activities/date/%s.json', moment().subtract(1, 'days').format('YYYY-MM-DD')), {access_token: fitbit_access_token.token.access_token}),
	new Promise(function(fulfill, reject) {twitter_client.get('statuses/user_timeline', {screen_name:'daepstein', count:'1'}, function(error, tweets) {if(error) reject(error); else fulfill(tweets); }); })];
}

function parseAPICalls(results) {
	var data = {};
	var doc = new dom().parseFromString(results[0]);
	var nodes = xpath.select('//*[@class="bookInfo"]', doc);
	data.kindle = nodes[0].textContent.split("by")[0].trim();
	data.fitbit = results[1].summary.steps;
	data.twitter = results[2][0].text;
	return data;
}

/* GET home page. */
router.get('/', function(req, res, next) {
	Promise.all(getPromises()).then(function(results) {
		res.render('index', parseAPICalls(results));
	}).catch(function(err) { //try refreshing the fitbit token to see if that helps...
		console.log('Refreshing fitbit token...');
		fitbit_access_token.refresh().then(function saveToken(newToken) {
			fitbit_access_token = newToken;
			//write the new token to the credentials file, in hope this saves us in the future
			fitbit_credentials.access_token = newToken.token.access_token;
			fitbit_credentials.refresh_token = newToken.token.refresh_token;
			fs.writeFileSync('data/fitbit_credentials.json', JSON.stringify(fitbit_credentials));
			Promise.all(getPromises()).then(function(results) { //try again
				res.render('index', parseAPICalls(results));
			}).catch(function(err) {
				res.render('index', {kindle:'Nothing', fitbit:0, twitter:'Nothing'});
			})
		});
	});
});

router.get('/cv*', function(req, res, next) {
	var cv = "public/docs/cv.pdf";
	fs.readFile(cv, function (err,data) {
    	res.contentType("application/pdf");
    	res.send(data);
	});
})

router.get('/publications', function(req, res, next) {
	res.render('publications', {'bib': bib_data});
});

router.get('/projects', function(req, res, next) {
	res.render('projects', {});
});

module.exports = router;
