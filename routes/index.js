var express = require('express');
var router = express.Router();
var fs = require('fs-extra-promise');
var util = require('util');
var extend = require('node.extend');
var moment = require('moment');
var request = require('request-promise');
var xpath = require('xpath');
var dom = require('xmldom-silent').DOMParser;
var twitter = require('twitter');
var Promise = require('promise');
var bibtex = require('bibtex-parser');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
require('string.prototype.endswith');

var twitter_credentials = JSON.parse(fs.readFileSync('data/twitter_credentials.json', 'utf8'));
var fitbit_credentials = JSON.parse(fs.readFileSync('data/fitbit_credentials.json', 'utf8'));
var fitbit = require('simple-oauth2')({site: 'https://api.fitbit.com', tokenPath: '/oauth2/token', clientID:fitbit_credentials.clientID, clientSecret:fitbit_credentials.clientSecret});
var fitbit_access_token = fitbit.accessToken.create({access_token: fitbit_credentials.access_token, refresh_token: fitbit_credentials.refresh_token, expires_in:3600});
var twitter_client = new twitter(twitter_credentials);

var api_data = {};
var api_update = null;

var publications = JSON.parse(fs.readFileSync('bibtex/publications.json', 'utf8'));
var BIB_FILES = 'bibtex';
var bib_data = fs.readdirSync(BIB_FILES).map(function(f) { if(f.endsWith('.bib')){return formatBib(f, bibtex(fs.readFileSync(BIB_FILES + '/' + f, 'utf-8'))); } else {return null;} }).filter(Boolean);
bib_data.sort(compareBib);
var travel_data = JSON.parse(fs.readFileSync('public/travel.json', 'utf8'));
travel_data = Object.keys(travel_data).map(function(f) {return extend(travel_data[f], {'days':formatTravelDate(travel_data[f])});}); //TODO: there's a function for this, but I forget what it is.
travel_data.sort(compareTravel);

var selectedPublications = bib_data.filter(function(f) { return f.type == 'paper' || f.type == 'note' || f.type == 'journal';});

function formatBib(f, bib) {
	var name = Object.keys(bib)[0];
	bib = extend(extend(bib[name], publications[name]), {'bib':BIB_FILES + '/' + f});
	bib.AUTHOR = bib.AUTHOR.split(" and ").map(function(n) {return n.split(",").reverse().join(' ').replace(/ /g, "\xa0").trim()}); //reverse hack will work in all trivial cases, e.g. Epstein, Daniel A.
	bib.BOOKTITLE = bib.BOOKTITLE.replace(/\\/g, "").replace(/#38;/g, "");
	bib.SERIES = bib.SERIES.replace(/'/g, 20); // '15 -> 2015
	bib.NAME = name;
	return bib;
}

function compareBib(a, b) {
	var ma = moment(a.date, "MMM YYYY").valueOf();
	var mb = moment(b.date, "MMM YYYY").valueOf();
	if(ma != mb) {
		return ma > mb ? -1 : 1;
	}
	var typeSortOrder = ['paper', 'note', 'journal', 'organizer', 'wip', 'workshop', 'poster'];
	var ta = typeSortOrder.indexOf(a.type);
	var tb = typeSortOrder.indexOf(b.type)
	if(ta != tb) {
		return ta > tb ? 1 : -1;
	}
	return 0; //TODO: more detailed sorting when pubs were published at the same time at the same "priority" level
}

function compareTravel(a, b) {
	var ma = moment(a.startDate, "MMM DD YYYY").valueOf();
	var mb = moment(b.startDate, "MMM DD YYYY").valueOf();
	return ma > mb ? -1 : 1;
}

function formatTravelDate(trip) {
	var ma = moment(trip.startDate, "MMM DD YYYY");
	var mb = moment(trip.endDate, "MMM DD YYYY");
	if(ma.month() == mb.month()) {
		return ma.format("MMMM D") + "-" + mb.format("D");
	} else {
		return ma.format("MMMM D") + "-" + mb.format("MMMM D");
	}
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
	data.twitter = entities.decode(results[2][0].text);
	api_data = data;
	api_update = moment();
	return data;
}

/* GET home page. */
router.get('/', function(req, res, next) {
	var pastTravel = travel_data.filter(function(f) {return moment(f.endDate, "MMM DD YYYY").valueOf() < moment().valueOf();}).slice(0, 1);
	var futureTravel = travel_data.filter(function(f) {return moment(f.endDate, "MMM DD YYYY").valueOf() >= moment().valueOf();}).reverse().slice(0, 3);
	var travelDictionary = {'pastTravel':pastTravel, 'futureTravel':futureTravel};
	if(api_update != null && api_update.isAfter(moment().subtract(1, 'hours'))) { //API data is recent enough
		res.render('index', extend(api_data, travelDictionary, {'bib':selectedPublications}));
	} else { //retrieve new API data
		console.log("Getting fresh API data...");
		Promise.all(getPromises()).then(function(results) {
			res.render('index', extend(parseAPICalls(results), travelDictionary, {'bib':selectedPublications}));
		}).catch(function(err) { //try refreshing the fitbit token to see if that helps...
			console.log(err);
			console.log('Refreshing fitbit token...');
			fitbit_access_token.refresh().then(function saveToken(newToken) {
				if(newToken.token.access_token !== undefined) {
					//write the new token to the credentials file, in hope this saves us in the future
					fitbit_credentials.access_token = newToken.token.access_token;
					fitbit_credentials.refresh_token = newToken.token.refresh_token;
					fitbit_access_token = fitbit.accessToken.create({access_token: fitbit_credentials.access_token, refresh_token: fitbit_credentials.refresh_token, expires_in:3600});
					fs.writeFileAsync('data/fitbit_credentials.json', JSON.stringify(fitbit_credentials)).then(function() {
						Promise.all(getPromises()).then(function(results) { //try again
							res.render('index', extend(parseAPICalls(results), travelDictionary, {'bib':selectedPublications}));
						}).catch(function(err) {
							res.render('index', extend(travelDictionary, {kindle:'Nothing', fitbit:0, twitter:'Nothing', 'bib':selectedPublications}));
						});
				});
				}
				else {
					//Something went wrong, but let's not mess with the "good" credentials in the meantime.
					res.render('index', extend(travelDictionary, {kindle:'Nothing', fitbit:0, twitter:'Nothing', 'bib':selectedPublications}));
				}
				
			});
		});
	}
});

router.get('/cv*', function(req, res, next) {
	fs.readFileAsync("public/docs/cv.pdf").then(function (data,err) {
    	res.contentType("application/pdf");
    	res.send(data);
	});
})

router.get('/publications_all', function(req, res, next) {
	res.render('publications', {'bib': bib_data, 'conference':true, 'journal':true, 'workshop':true});
});

router.get('/publications', function(req, res, next) {
	res.render('publications', {'bib': bib_data, 'conference':true, 'journal':true});
});

router.get('/projects', function(req, res, next) {
	var bib_practices = bib_data.filter(function(b) { return ['CORDEIRO_CHI_2015', 'EPSTEIN_UBICOMP_2015', 'EPSTEIN_CHI_2016C'].indexOf(b.NAME) != -1; });
	var bib_design = bib_data.filter(function(b) { return ['EPSTEIN_DIS_2014', 'EPSTEIN_CHI_2016A', 'EPSTEIN_CHI_2016B', 'EPSTEIN_UBICOMP_2016'].indexOf(b.NAME) != -1; });
	var bib_social = bib_data.filter(function(b) { return ['EPSTEIN_UBICOMP_2013', 'EPSTEIN_CSCW_2015', 'EPSTEIN_CHI_2016B'].indexOf(b.NAME) != -1; });
	res.render('projects', {'bib_practices': bib_practices, 'bib_design': bib_design, 'bib_social': bib_social});
});

router.get('/bibtex/:bibfile.bib', function(req, res, next) {
	fs.readFileAsync(BIB_FILES + "/" + req.params.bibfile + ".bib", 'utf-8').then(function (data,err) {
		res.contentType("text/plain");
		if(!err) {
    		res.send(data);
		} else {
			res.send("No such bibfile.");
		}
	});
});

module.exports = router;
