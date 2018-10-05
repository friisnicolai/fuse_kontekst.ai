var FileSystem = require("FuseJS/FileSystem");

const mediaFilesLocation = FileSystem.androidPaths.externalFiles + "/media/";
const configFilesLocation = FileSystem.androidPaths.externalFiles + "/config/";
const backupFilesLocation = FileSystem.androidPaths.externalFiles + "/backup/";
const dataFilesLocation = FileSystem.androidPaths.externalFiles + "/data/";


var selectLocationCallback;
var editLocationCallback;
var router;

var listEditEntryPromises = {};

function setRouter(r) {
	router = r;
}

function addSelectLocationCallback(callback) {
	selectLocationCallback = callback;
}

function submitSelectedLocation(loc) {
	selectLocationCallback(loc);
	selectLocationCallback = null;
}

function addEditLocationCallback(callback) {
	editLocationCallback = callback;
}

function submitEditLocation(loc) {
	editLocationCallback(loc);
	editLocationCallback = null;
}

function editEntry(entry) {
	return new Promise(function(resolve, reject) {
		listEditEntryPromises[entry.entry_id] = { resolve : resolve, reject : reject};
		router.push("entrypage", entry);
	});	
}

function cancelEditEntry(entry) {
	listEditEntryPromises[entry.entry_id].reject();
}

function submitEditEntry(entry) {
	listEditEntryPromises[entry.entry_id].resolve(entry);
}


module.exports = {
	addSelectLocationCallback : addSelectLocationCallback,
	submitSelectedLocation : submitSelectedLocation,
	addEditLocationCallback : addEditLocationCallback,
	submitEditLocation : submitEditLocation,
	mediaFilesLocation : mediaFilesLocation,
	configFilesLocation : configFilesLocation,
	backupFilesLocation : backupFilesLocation,
	dataFilesLocation : dataFilesLocation,
	editEntry : editEntry,
	setRouter : setRouter,
	cancelEditEntry : cancelEditEntry,
	submitEditEntry : submitEditEntry
};
