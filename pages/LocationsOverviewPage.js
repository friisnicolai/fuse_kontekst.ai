var Observable = require("FuseJS/Observable");
var openkontekstapi = require("modules/OpenKontekstApi");
var FileSystem = require("FuseJS/FileSystem");
var AppContext = require("modules/AppContext");


var locations = Observable();
var locationsDisplay = locations.map(function(x) { 
		x.location_image_display = AppContext.mediaFilesLocation + x.location_image;
		return x; 
	}).where(function(y) {
		if(y.past_time != null) {
			return false;
		}
		else {
			return true;
		}
	});

var viewMode = this.Parameter;
var displaySelectionMode = viewMode.map(function(x) {
	return x == "selectionMode";
});


function refreshLocations() {
	openkontekstapi.getAllLocations()
	.then(function(x) {
		locations.replaceAll(x);
	});
	
}

function goToAddLocationsPage() {
	router.push("addlocationpage");
}

function selectLocation(arg) {
	if(displaySelectionMode.value) {
		AppContext.submitSelectedLocation(arg.data);
		goBack();
	}
	else {
		router.push("locationpage", arg.data);
	}
}

function goBack() {
	router.goBack();
}


module.exports = {
	locationsDisplay : locationsDisplay,
	locations : locations,
	goToAddLocationsPage : goToAddLocationsPage,
	refreshLocations : refreshLocations,
	selectLocation : selectLocation,
	viewMode : viewMode,
	displaySelectionMode : displaySelectionMode,
	goBack : goBack
};