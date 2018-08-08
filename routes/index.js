var express = require('express');
var router = express.Router();
var fs = require('fs-extra-promise');
var util = require('util');
var extend = require('node.extend');
var moment = require('moment');
var bibtex = require('bibtex-parser');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
require('string.prototype.endswith');

var publications = JSON.parse(fs.readFileSync('bibtex/publications.json', 'utf8'));
var BIB_FILES = 'bibtex';
var bib_data = fs.readdirSync(BIB_FILES).map(function(f) { if(f.endsWith('.bib')){return formatBib(f, bibtex(fs.readFileSync(BIB_FILES + '/' + f, 'utf-8'))); } else {return null;} }).filter(Boolean);
bib_data.sort(compareBib);
var travel_data = JSON.parse(fs.readFileSync('public/travel.json', 'utf8'));
travel_data = Object.keys(travel_data).map(function(f) {return extend(travel_data[f], {'days':formatTravelDate(travel_data[f])});}); //TODO: there's a function for this, but I forget what it is.
travel_data.sort(compareTravel);

var selectedPublications = bib_data.filter(function(f) { return (f.type == 'paper' || f.type == 'note' || f.type == 'journal')});

function formatBib(f, bib) {
	var name = Object.keys(bib)[0];
	bib = extend(extend(bib[name], publications[name]), {'bib':BIB_FILES + '/' + f});
	bib.AUTHOR = bib.AUTHOR.split(" and ").map(function(n) {return n.split(",").reverse().join(' ').replace(/ /g, "\xa0").trim()}); //reverse hack will work in all trivial cases, e.g. Epstein, Daniel A.
	if('BOOKTITLE' in bib) { //Most of my publications have a book title field (e.g., conference publications).
		bib.BOOKTITLE = bib.BOOKTITLE.replace(/\\/g, "").replace(/#38;/g, "");
	}
	if('JOURNAL' in bib) { //A few have journals instead.
		bib.JOURNAL = bib.JOURNAL.replace(/\\/g, "").replace(/#38;/g, "");
	}
	if('SERIES' in bib) {
		bib.SERIES = bib.SERIES.replace(/'/g, 20); // '15 -> 2015
	}
	bib.NAME = name;
	return bib;
}

function compareBib(a, b) {
	var ma = moment(a.date, "MMM YYYY").valueOf();
	var mb = moment(b.date, "MMM YYYY").valueOf();
	if(ma != mb) {
		return ma > mb ? -1 : 1;
	}
	var typeSortOrder = ['paper', 'note', 'journal', 'organizer', 'wip', 'workshop', 'poster', 'dissertation'];
	var ta = typeSortOrder.indexOf(a.type);
	var tb = typeSortOrder.indexOf(b.type)
	if(ta != tb) {
		return ta > tb ? 1 : -1;
	}
	//There are non-breaking spaces in these strings. Be careful of that when copy-pasting.
	var oa = a.AUTHOR.indexOf('Daniel A. Epstein');
	var ob = b.AUTHOR.indexOf('Daniel A. Epstein');
	if(oa != ob) {
		return oa > ob ? 1 : -1;
	}
	var al = a.AUTHOR.length;
	var bl = b.AUTHOR.length;
	if(al != bl) {
		return al > bl ? 1 : -1;
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
	if(ma.month() == mb.month() && ma.date() == mb.date()) {
		return ma.format("MMMM D");
	} else if(ma.month() == mb.month()) {
		return ma.format("MMMM D") + "-" + mb.format("D");
	} else {
		return ma.format("MMMM D") + "-" + mb.format("MMMM D");
	}
}

/* GET home page. */
router.get('/', function(req, res, next) {
	var futureLimit = 10;
	var futureTravel = travel_data.filter(function(f) {return moment(f.endDate, "MMM DD YYYY").valueOf() >= moment().subtract(1, 'days').valueOf();}).reverse().slice(0, futureLimit);
	var pastAmount = Math.max(7 - futureTravel.length, 1);

	//Include all past travel from this calendar year
	var pastTravel = travel_data.filter(function(f) {return moment(f.endDate, "MMM DD YYYY").valueOf() < moment().subtract(1, 'days').valueOf() && moment(f.endDate, "MMM DD YYYY").year() == moment().year();}).slice(0, pastAmount);
	pastTravel.reverse();
	var travelDictionary = {'pastTravel':pastTravel, 'futureTravel':futureTravel};
	res.render('index', extend(travelDictionary, {'bib':selectedPublications}));
});

router.get('/cv*', function(req, res, next) {
	fs.readFileAsync("public/docs/cv.pdf").then(function (data,err) {
    	res.contentType("application/pdf");
    	res.send(data);
	});
});

router.get('/research_statement*', function(req, res, next) {
	fs.readFileAsync("public/docs/research_statement_web.pdf").then(function (data,err) {
    	res.contentType("application/pdf");
    	res.send(data);
	});
});

router.get('/teaching_statement*', function(req, res, next) {
	fs.readFileAsync("public/docs/teaching_statement_web.pdf").then(function (data,err) {
    	res.contentType("application/pdf");
    	res.send(data);
	});
});

router.get('/diversity_statement*', function(req, res, next) {
	fs.readFileAsync("public/docs/diversity_statement_web.pdf").then(function (data,err) {
    	res.contentType("application/pdf");
    	res.send(data);
	});
});

router.get('/publications_all', function(req, res, next) {
	res.render('publications', {'bib': bib_data, 'conference':true, 'journal':true, 'workshop':true});
});

router.get('/publications', function(req, res, next) {
	res.render('publications', {'bib': bib_data, 'conference':true, 'journal':true});
});

router.get('/robots.txt', function(req, res, next) {
	res.contentType('text/plain');
	res.send("User-agent: *");
});

router.get('/projects', function(req, res, next) {
	var bib_practices = bib_data.filter(function(b) { return ['CORDEIRO_CHI_2015', 'EPSTEIN_UBICOMP_2015', 'EPSTEIN_CHI_2016C', 'EPSTEIN_CHI_2017', 'SCHROEDER_DIS_2018'].indexOf(b.NAME) != -1; });
	var bib_design = bib_data.filter(function(b) { return ['EPSTEIN_DIS_2014', 'EPSTEIN_CHI_2016A', 'EPSTEIN_CHI_2016B', 'EPSTEIN_UBICOMP_2016', 'KARKAR_CHI_2017'].indexOf(b.NAME) != -1; });
	var bib_social = bib_data.filter(function(b) { return ['EPSTEIN_UBICOMP_2013', 'EPSTEIN_CSCW_2015', 'EPSTEIN_CHI_2016B', 'CARAWAY_CSCW_2017_ONLINEFIRST'].indexOf(b.NAME) != -1; });
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

router.get('/133', function(req, res, next) {
	res.redirect(302, 'http://ics133-fa18.depstein.net');
});

module.exports = router;
