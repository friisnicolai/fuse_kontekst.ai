var FileSystem = require("FuseJS/FileSystem");
var AppContext = require("modules/AppContext");
const utils = require('modules/utils');
var FuseJSSearch = require('modules/fuse');

var ROOT_URL = "";

var locationHashtable = {};
var agentHashtable = {};

function apiFetch(path, options) {
	var url = encodeURI(ROOT_URL + path);

	if(options === undefined) {
		options = {};
	}
	
	options = Object.assign({}, options, {
		body: JSON.stringify(options.body),
		headers: Object.assign({}, options.headers, {
			"Content-Type": "application/json", "x-apikey" : ""
		})
	});

	console.log("restdb.io REST API Request: " + JSON.stringify(options));

	return fetch(url, options)
		.then(function(response) { return response.json(); })
		.then(function(responseObject) {
			//console.log("restdb.io REST API Response: " + JSON.stringify(responseObject));	
			return responseObject; })
		.catch((reason) => {
            console.log('Error contacting backend ('+reason+') ');
        });
}



/*
function getAllEntries(agent_id) {
	return getAllLocations().then(function(x) {
		return apiFetch('/m-entry?q={"agent_id": "' + agent_id + '"}&sort=created_time&dir=1').then(function(y) {
			return addLocationsToEntries(y);
		});
	});
}
*/




function getAllEntries(agent_id) {
	return getAllLocations().then(function(x) {
		return loadEntriesFromLocalStorage(
			function(e) {
				if(e.agent_id != agent_id) { return false; } 
				return true;
			}, 
			sortBy("created_time", 1)
			)
		.then(function(y) {
			return addLocationsToEntries(y);
		});
	});
}

/*
function getEntriesBackup() {
	return apiFetch('/m-entry?sort=created_time&dir=1');
}
*/

function getEntriesBackup() {
	return loadEntriesFromLocalStorage();
}



/*
function getFutureContentTimeEntries(agent_id) {
	return getAllLocations().then(function(x) {
		return apiFetch('/m-entry?q={"agent_id": "' + agent_id + '", "content_time":{"$not": null}, "content_time":{"$gt":{"$date":"$currentDate"}}}&sort=content_time&dir=-1').then(function(y) {
			return addLocationsToEntries(y);
		});
	});	
}
*/

function getFutureContentTimeEntries(agent_id) {
	return getAllLocations().then(function(x) {
		return loadEntriesFromLocalStorage(
			function(e) {
				if(e.agent_id != agent_id) { return false; } 
				if(e.content_time == null) { return false; } 
				if(e.content_time < utils.getCurrentDateTimeString()) {return false; }
				return true;
			}, 
			sortBy("content_time", -1)
			)
		.then(function(y) {
			return addLocationsToEntries(y);
		});
	});
}

/*
function getPastContentTimeEntries(agent_id) {
	return getAllLocations().then(function(x) {
		return apiFetch('/m-entry?q={"agent_id": "' + agent_id + '", "content_time":{"$not": null}, "content_time":{"$lt":{"$date":"$currentDate"}}}&sort=content_time&dir=1').then(function(y) {
			return addLocationsToEntries(y);
		});
	});	
}
*/

function getPastContentTimeEntries(agent_id) {
	return getAllLocations().then(function(x) {
		return loadEntriesFromLocalStorage(
			function(e) {
				if(e.agent_id != agent_id) { return false; } 
				if(e.content_time == null) { return false; } 
				if(e.content_time > utils.getCurrentDateTimeString()) {return false; }
				return true;
			}, 
			sortBy("content_time", 1)
			)
		.then(function(y) {
			return addLocationsToEntries(y);
		});
	});
}

/*
function locGetAllEntries(location_id) {
	return apiFetch('/m-entry?q={"location_id": "' + location_id + '"}&sort=created_time&dir=1');
}
*/

function locGetAllEntries(location_id) {
	return loadEntriesFromLocalStorage(
		function(e) {
			if(e.location_id != location_id) { return false; } 
			return true;
		}, 
		sortBy("created_time", 1)
		);
}

/*
function locGetFutureContentTimeEntries(location_id) {
	return apiFetch('/m-entry?q={"location_id": "' + location_id + '", "content_time":{"$not": null}, "content_time":{"$gt":{"$date":"$currentDate"}}}&sort=content_time&dir=-1');
}
*/

function locGetFutureContentTimeEntries(location_id) {
	return loadEntriesFromLocalStorage(
		function(e) {
			if(e.location_id != location_id) { return false; } 
			if(e.content_time == null) { return false; } 
			if(e.content_time < utils.getCurrentDateTimeString()) { return false; }			
			return true;
		}, 
		sortBy("created_time", -1)
		);	
}

/*
function locGetPastContentTimeEntries(location_id) {
	return apiFetch('/m-entry?q={"location_id": "' + location_id + '", "content_time":{"$not": null}, "content_time":{"$lt":{"$date":"$currentDate"}}}&sort=content_time&dir=1');

}
*/

function locGetPastContentTimeEntries(location_id) {
	return loadEntriesFromLocalStorage(
		function(e) {
			if(e.location_id != location_id) { return false; } 
			if(e.content_time == null) { return false; } 
			if(e.content_time > utils.getCurrentDateTimeString()) { return false; }			
			return true;
		}, 
		sortBy("created_time", 1)
		);	
}

/*
function getAllAgents() {
	return apiFetch("/m-agent");
}
*/

function getAllAgents() {
	return loadAgentsFromLocalStorage();
}


function getLastestEntries() {
	//return apiFetch('/m-entry?h={"$groupby":["agent_id"], "$aggregate":["MAX:created_time"]}');
	return loadEntriesFromLocalStorage()
	.then(function(x) {
		var agentLatestEntries = {};
		for (var i = 0; i < x.length; i++) {
			if(agentLatestEntries[x[i].agent_id] == null) {
				agentLatestEntries[x[i].agent_id] = { "MAX created_time" : x[i] };
			}
			else if(agentLatestEntries[x[i].agent_id]["MAX created_time"].created_time < x[i].created_time) {
				agentLatestEntries[x[i].agent_id] = { "MAX created_time" : x[i] };
			}
		}
		return agentLatestEntries;
	});	
}

function getAllLocations() {
	return loadLocationsFromLocalStorage();
}

/*
function postEntry(entry_id, agent_id, content_text, created_time, gps_latitude, gps_longtitude, gps_altitude, importance, content_image, location_id, content_time) {
	return apiFetch("/m-entry", {
		method: "POST",
		body: {
			entry_id: entry_id,
			agent_id: agent_id,
			content_text : content_text,
			created_time : created_time,
			gps_latitude : gps_latitude,
			gps_longtitude : gps_longtitude,
			gps_altitude : gps_altitude,
			importance : importance,
			content_image : content_image,
			location_id : location_id,
			content_time : content_time
		}
	}).then(function(x) {
		if(locationHashtable[x.location_id] != null) {	
			x.location = locationHashtable[x.location_id];
		}
		else {
			x.location = {};
		}
		return x;
	});
}
*/

function postEntry(entry_id, agent_id, content_text, created_time, gps_latitude, gps_longtitude, gps_altitude, importance, content_image, location_id, content_time) {
	var newEntry = {};
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "entries.json").then(function(x) {
		var entryObj = JSON.parse(x);
		newEntry =  { _id : entry_id,
			entry_id: entry_id,
			agent_id: agent_id,
			content_text : content_text,
			created_time : created_time,
			gps_latitude : gps_latitude,
			gps_longtitude : gps_longtitude,
			gps_altitude : gps_altitude,
			importance : importance,
			content_image : content_image,
			location_id : location_id,
			content_time : content_time
		};
		entryObj.unshift(newEntry);
		entryObj.sort(sortBy("created_time", 1));
		return FileSystem.writeTextToFile(AppContext.dataFilesLocation + "entries.json", JSON.stringify(entryObj));
	}).then(function(x) {
		if(locationHashtable[newEntry.location_id] != null) {	
			newEntry.location = locationHashtable[newEntry.location_id];
		}
		else {
			newEntry.location = {};
		}
		return newEntry;
	});
}

function postLocation(location_id, name, description, gps_latitude, gps_longtitude, gps_radius, location_image, created_time) {
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "locations.json").then(function(x) {
		var locObj = JSON.parse(x);
		var newLocation = { location_id : location_id, 
							name : name,
							description : description,
							gps_latitude : gps_latitude,
							gps_longtitude : gps_longtitude,
							gps_radius : gps_radius,
							location_image : location_image,
							created_time : created_time
							};
		locObj.unshift(newLocation);
		console.log("updateLocation");
		return FileSystem.writeTextToFile(AppContext.dataFilesLocation + "locations.json", JSON.stringify(locObj));
	});
}

function updateLocation(location_id, name, description, gps_latitude, gps_longtitude, gps_radius, location_image, created_time) {
	var updatedLocation;
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "locations.json").then(function(x) {
		var locObj = JSON.parse(x);	
		for (var i = 0; i < locObj.length; i++) {
			if(locObj[i].location_id == location_id) {
				locObj[i].name = name;
				locObj[i].description = description;
				locObj[i].gps_latitude = gps_latitude;
				locObj[i].gps_longtitude = gps_longtitude;
				locObj[i].gps_radius = gps_radius;
				locObj[i].location_image = location_image;
				locObj[i].created_time = created_time;
				updatedLocation = locObj[i];
			}
		}

		return FileSystem.writeTextToFile(AppContext.dataFilesLocation + "locations.json", JSON.stringify(locObj)).then(function() {
			return updatedLocation;
		});
	});
}

function updateLocationPastTime(location_id, past_time) {
	var updatedLocation;
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "locations.json").then(function(x) {
		var locObj = JSON.parse(x);

		for (var i = 0; i < locObj.length; i++) {
			if(locObj[i].location_id == location_id) {
				locObj[i].past_time = past_time;
				updatedLocation = locObj[i];
			}
		}

		return FileSystem.writeTextToFile(AppContext.dataFilesLocation + "locations.json", JSON.stringify(locObj)).then(function() {
			return updatedLocation;
		});
	});
}


/*
function updateEntryImportance(_id, importance) {
	return apiFetch("/m-entry", {
	method: "POST",
	body: {
		_id : _id,
		importance : importance
	}
	});
}
*/

function updateEntry(entry_id, agent_id, content_text, created_time, gps_latitude, gps_longtitude, gps_altitude, importance, content_image, location_id, content_time) {
	var updatedEntry;
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "entries.json").then(function(x) {
		var entryObj = JSON.parse(x);

		for (var i = 0; i < entryObj.length; i++) {
			if(entryObj[i].entry_id == entry_id) {
				entryObj[i].agent_id = agent_id;
				entryObj[i].content_text = content_text;
				entryObj[i].created_time = created_time;
				entryObj[i].gps_latitude = gps_latitude;
				entryObj[i].gps_longtitude = gps_longtitude;
				entryObj[i].gps_altitude = gps_altitude;
				entryObj[i].importance = importance;
				entryObj[i].content_image = content_image;
				entryObj[i].location_id = location_id;
				entryObj[i].content_time = content_time;
				updatedEntry = entryObj[i];
			}
		}

		return FileSystem.writeTextToFile(AppContext.dataFilesLocation + "entries.json", JSON.stringify(entryObj)).then(function() {
			return addLocationToEntry(updatedEntry);
		});
	});		
}

function updateEntryImportance(_id, importance) {
	var updatedEntry;
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "entries.json").then(function(x) {
		var entryObj = JSON.parse(x);

		for (var i = 0; i < entryObj.length; i++) {
			if(entryObj[i]._id == _id) {
				entryObj[i].importance = importance;
				updatedEntry = entryObj[i];
			}
		}

		return FileSystem.writeTextToFile(AppContext.dataFilesLocation + "entries.json", JSON.stringify(entryObj)).then(function() {
			return updatedEntry;
		});
	});
}

/*
function updateEntryPastTime(_id, past_time) {
	return apiFetch("/m-entry", {
	method: "POST",
	body: {
		_id : _id,
		past_time : past_time
	}
	});
}
*/


function updateEntryPastTime(_id, past_time) {
	var updatedEntry;
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "entries.json").then(function(x) {
		var entryObj = JSON.parse(x);

		for (var i = 0; i < entryObj.length; i++) {
			if(entryObj[i]._id == _id) {
				entryObj[i].past_time = past_time;
				updatedEntry = entryObj[i];
			}
		}

		return FileSystem.writeTextToFile(AppContext.dataFilesLocation + "entries.json", JSON.stringify(entryObj)).then(function() {
			return updatedEntry;
		});
	});
}

function addLocationsToEntries(entries) {
	for (var i = 0; i < entries.length; i++) {
		if(entries[i].location_id != null && entries[i].location_id != "") {
			if(locationHashtable[entries[i].location_id] != null) {
				entries[i].location = locationHashtable[entries[i].location_id];
			}
			else {
				entries[i].location = {};
			}
		}
		else {
			entries[i].location = {};
		}
	}	
	return entries;
}

function addLocationToEntry(entry) {
	if(entry.location_id != null && locationHashtable[entry.location_id] != null) {
		entry.location = locationHashtable[entry.location_id];
	}
	else {
		entry.location = {};
	}
	return entry;
}

function addAgentsToEntries(entries) {
	for (var i = 0; i < entries.length; i++) {	
		entries[i].agent = agentHashtable[entries[i].agent_id];
	}
	return entries;	
}


/* Local storage stuff */
function loadLocationsFromLocalStorage() {
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "locations.json").then(function(x) {
		var locObj = JSON.parse(x);

		locationHashtable = {};
		for (var i = 0; i < locObj.length; i++) {
			locationHashtable[locObj[i].location_id] = locObj[i];
		}
		locObj.sort(sortBy("name", 1));

		return locObj;
	});
}

function loadEntriesFromLocalStorage(filterFunction, sortFunction) {
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "entries.json").then(function(x) {
		var entriesObj = JSON.parse(x);

		var resultSet = [];

		if(filterFunction != null) {
			for (var i = 0; i < entriesObj.length; i++) {
				if(filterFunction(entriesObj[i])) {
					resultSet.unshift(entriesObj[i]);	
				}
			}
		}
		else {
			resultSet = entriesObj;
		}

		if(sortFunction != null) {
			resultSet.sort(sortFunction);
		}
		return resultSet;
	});	
}

function searchEntries(searchFor) {
	return searchEntriesFromLocalStorage(null, sortBy("created_time", -1), searchFor);
}

function searchEntriesFromLocalStorage(filterFunction, sortFunction, searchFor) {
	return loadLocationsFromLocalStorage()
	.then(function(x) {
		return loadAgentsFromLocalStorage();
	})
	.then(function(x) {
		return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "entries.json");
	})
	.then(function(x) {
		var entriesObj = JSON.parse(x);

		var resultSet = [];

		if(filterFunction != null) {
			for (var i = 0; i < entriesObj.length; i++) {
				if(filterFunction(entriesObj[i])) {
					resultSet.unshift(entriesObj[i]);	
				}
			}
		}
		else {
			resultSet = entriesObj;
		}

		if(sortFunction != null) {
			resultSet.sort(sortFunction);
		}

		resultSet = addLocationsToEntries(resultSet);
		resultSet = addAgentsToEntries(resultSet);

		if(searchFor != null && searchFor.length > 0) {
			var searchOptions = {
			  shouldSort: true,
			  threshold: 0.4,
			  tokenize: true,
			  location: 0,
			  distance: 100,
			  maxPatternLength: 32,
			  minMatchCharLength: 1,
			  keys: [
			    "content_text",
			    "agent.name"
			]
			};		

			console.log("Searching");
			var fuseSearch = new FuseJSSearch(resultSet, searchOptions);
			var resultSet = fuseSearch.search(searchFor);
		}

		return resultSet;
	});	
}

function loadAgentsFromLocalStorage() {
	return FileSystem.readTextFromFile(AppContext.dataFilesLocation + "agents.json").then(function(x) {
		var agentObj = JSON.parse(x);

		agentHashtable = {};
		for (var i = 0; i < agentObj.length; i++) {
			agentHashtable[agentObj[i].agent_id] = agentObj[i];
		}

		return agentObj;
	});
}

function sortBy(prop, order) {
   	return function(a,b) {
   		var al = a[prop].toLowerCase();
   		var bl =  b[prop].toLowerCase();
      	if(al > bl) {
          	return order;
      	} else if(al < bl) {
          	return -order;
      	}
      	return 0;
   }
}





module.exports = {
	getAllEntries: getAllEntries,
	getAllAgents : getAllAgents,
	getLastestEntries : getLastestEntries,
	postEntry : postEntry,
	updateEntryImportance : updateEntryImportance,
	updateEntryPastTime : updateEntryPastTime,
	getAllLocations : getAllLocations,
	postLocation : postLocation,
	getFutureContentTimeEntries : getFutureContentTimeEntries,
	getPastContentTimeEntries : getPastContentTimeEntries,
	locGetAllEntries : locGetAllEntries,
	locGetFutureContentTimeEntries : locGetFutureContentTimeEntries,
	locGetPastContentTimeEntries : locGetPastContentTimeEntries,
	updateLocation : updateLocation,
	updateLocationPastTime : updateLocationPastTime,
	getEntriesBackup : getEntriesBackup,
	searchEntries : searchEntries,
	updateEntry : updateEntry
};