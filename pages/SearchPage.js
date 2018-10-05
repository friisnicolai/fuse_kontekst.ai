var Observable = require("FuseJS/Observable");
var openkontekstapi = require("modules/OpenKontekstApi");
var AppContext = require("modules/AppContext");
const utils = require('modules/utils');

var importanceIcons = {"-1" : "💩", 0 : "", 1 : "🔷", 2 : "💙", 3 : "💚", 4 : "💛", 5 : "💜", 6 : "❤", 7 : "💖", 8 : "💖💖", 9 : "💖💖💖", 10 : "😇"};

var searchResult = Observable();

var searchForValue = Observable();
var searchInProgress = Observable("Hidden");

var importanceFilter = Observable(0);

var importanceFilterIcon = importanceFilter.map(function(x) {
	return importanceIcons[x];
});

var importanceFilterOpacity = importanceFilter.map(function(x) {
	return 0.2 + x*0.2;
});

var searchResultDisplay = searchResult.map(function(x) { 
		x.created_time_display = utils.getDateTimeString(x.created_time);
		x.content_time_display = utils.getDateTimeString(x.content_time);
		x.has_location = x.location.location_id != null;
		if(x.created_time_display == x.content_time_display) {
			x.time_location_display = x.location.name;
		}
		else {
			x.time_location_display = utils.dashCombine(x.content_time_display, x.location.name);
		}
		x.importance_display = importanceIcons[x.importance];
		x.content_image_display = AppContext.mediaFilesLocation + x.content_image;
		return x; 
	})
	.where(function(x) {	
		if(x.importance != null) {
			return x.importance >= importanceFilter.value;
		}
		else {return true;}
	});


function refreshSearch() {
	searchInProgress.value = "Visible";
	scrollToTop();
	openkontekstapi.searchEntries(searchForValue.value)
	.then(function(x) {
		searchResult.replaceAll(x);
		resetLimit();
		searchInProgress.value = "Hidden";
	});

}

function changeImportanceFilter() {
	if(importanceFilter.value < 4) {
		importanceFilter.value = importanceFilter.value + 1;
	}
	else {
		importanceFilter.value = -1;
	}
	searchResult.replaceAll(searchResult.toArray());
	resetLimit();
}

/* Handling scrolling in list */
var limit = Observable();

function increaseLimit() {
    if(limit.value <= searchResult.length) {
    	limit.value = limit.value + 5;
    }
}

function resetLimit() {
	scrollToTop();
	limit.value = 20;
}

function scrollToTop() {
	theScrollview.gotoRelative(0,0);
}

function activatePage() {
	if(!searchResult.length > 0) {
		refreshSearch();
	}
}

function goToImageViewPage(arg) {
	var entryParam = arg.data;
	router.push("imageviewpage", entryParam);
}

module.exports = {
	refreshSearch : refreshSearch,
	searchResultDisplay : searchResultDisplay,
	activatePage : activatePage,
	limit : limit,
	increaseLimit : increaseLimit,
	scrollToTop : scrollToTop,
	searchForValue : searchForValue,
	searchInProgress : searchInProgress,
	changeImportanceFilter : changeImportanceFilter,
	importanceFilterOpacity : importanceFilterOpacity,
	goToImageViewPage : goToImageViewPage
};