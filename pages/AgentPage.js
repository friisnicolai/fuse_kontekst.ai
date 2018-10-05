var Observable = require("FuseJS/Observable");
var GeoLocation = require("FuseJS/GeoLocation");
var openkontekstapi = require("modules/OpenKontekstApi");
const moment = require('modules/moment');
const utils = require('modules/utils');
var camera = require("FuseJS/Camera");
var cameraRoll = require("FuseJS/CameraRoll");
var FileSystem = require("FuseJS/FileSystem");
var AppContext = require("modules/AppContext");

var agent = this.Parameter;

var importanceIcons = {"-1" : "💩", 0 : "", 1 : "🔷", 2 : "💙", 3 : "💚", 4 : "💛", 5 : "💜", 6 : "❤", 7 : "💖", 8 : "💖💖", 9 : "💖💖💖", 10 : "😇"};

var entries = Observable();

var entriesDisplay = entries.map(function(x) { 
		x.created_time_display = utils.getDateTimeString(x.created_time);
		x.content_time_display = utils.getDateTimeString(x.content_time);
		x.has_location = x.location.location_id != null;
		if(x.content_time_display != x.created_time_display) {
			x.time_location_display = utils.dashCombine(x.content_time_display, x.location.name);
			x.calendar_display = true;
		}
		else {
			x.time_location_display = utils.dashCombine(null, x.location.name);
			x.calendar_display = false;
		}
		x.importance_display = importanceIcons[x.importance];
		x.content_image_display = AppContext.mediaFilesLocation + x.content_image;
		return x; 
	})
	.where(function(x) { 
		if(pastFilter.value) {
			if(x.past_time != null) {
				return true;
			}
			else {
				return false;
			}
		}
		else if(x.past_time != null) {
			return false;
		}	
		else {return true;}
	})
	.where(function(x) {	
		if(x.importance != null) {
			return x.importance >= importanceFilter.value;
		}
		else {return true;}
	});

var numberOfEntries = new Observable(0);

var agents = {};

var entryText = Observable();
entryText.value = "";


var importanceFilter = Observable(0);

var importanceFilterIcon = importanceFilter.map(function(x) {
	return importanceIcons[x];
});

var importanceFilterOpacity = importanceFilter.map(function(x) {
	return 0.2 + x*0.2;
});

function refreshEntries() {
	postInProgress.value = "Visible";
	if(futureMode.value) {
		openkontekstapi.getFutureContentTimeEntries(agent.value.agent_id)
		.then(function(entriesList) {
			agents[agent.value.agent_id] = entriesList;
			numberOfEntries.value = entriesList.length;
			entries.replaceAll(agents[agent.value.agent_id]);	
			resetOffset();
			postInProgress.value = "Hidden";
		})
		.catch(function(error) {console.log("Error AgentPage.refreshEntries: " + JSON.stringify(error));});
	}
	else if(pastMode.value) {
		openkontekstapi.getPastContentTimeEntries(agent.value.agent_id)
		.then(function(entriesList) {
			agents[agent.value.agent_id] = entriesList;
			numberOfEntries.value = entriesList.length;
			entries.replaceAll(agents[agent.value.agent_id]);	
			resetOffset();
			postInProgress.value = "Hidden";
		})
		.catch(function(error) {console.log("Error AgentPage.refreshEntries: " + JSON.stringify(error));});	
	}	
	else {
		openkontekstapi.getAllEntries(agent.value.agent_id)
		.then(function(entriesList) {
			agents[agent.value.agent_id] = entriesList;
			numberOfEntries.value = entriesList.length;
			entries.replaceAll(agents[agent.value.agent_id]);	
			resetOffset();
			postInProgress.value = "Hidden";
		})
		.catch(function(error) {console.log("Error AgentPage.refreshEntries: " + JSON.stringify(error));});
	}

}

function clearEntries() {
	postInProgress.value = "Hidden";
	entries.replaceAll([]);
}

var postInProgress = new Observable("Hidden");

function postEntry() {
	var entryImageName = "";
	if(entryImage.value != null) {
		var newImage = AppContext.mediaFilesLocation + entryImage.value.name;
        FileSystem.copy(entryImage.value.path, newImage);
        entryImageName = entryImage.value.name;
	}

	var location_id = null;
	if(entryLocation.value != null) {
		location_id = entryLocation.value.location_id;
	}

	var content_time = utils.getCurrentDateTimeString();
	var m = moment(futureTime.value, "DD.MM.YYYY HH:mm");
	if(m.isValid()) {
		content_time = m.format();
	}

	if(entryText.value.length > 0) {
		postInProgress.value = "Visible";
		var imp = 0;
		if(importanceFilter.value > -1) {
			imp = importanceFilter.value;
		}

		GeoLocation.getLocation(5000).then(function(location) {
			openkontekstapi.postEntry(utils.uuid(), 
								 	agent.value.agent_id, 
								 	entryText.value, 
								 	utils.getCurrentDateTimeString(), 
								 	location.latitude,
								 	location.longitude,
								 	location.altitude,
								 	imp,
								 	entryImageName,
								 	location_id,
								 	content_time)
			.then(function(x) {
				entries.add(x);
				resetOffset();

			});
			entryText.value = "";
			clearEntryImage();
			clearEntryLocation();
			clearFutureTime();
			postInProgress.value = "Hidden";
		});
		
	}
	else {
		refreshEntries();
	}
	
}


function updateImportance(entry, change) {
	var newImportance = entry.importance;
	if(entry.importance == -1 && change < 0) {

	}
	else if (entry.importance != null && entry.importance >= -1 && entry.importance < 10) {
		newImportance = entry.importance + change;
	}
	else if (entry.importance != null && change < 1 && entry.importance == 10) {
		newImportance = entry.importance + change;
	}	
	else if(entry.importance == null) {
		newImportance = 0 + change;
	}

	var entryIndex = entries.indexOf(entry);
	var updatedEntry = entries.getAt(entryIndex);
	updatedEntry.importance = newImportance;
	entries.replaceAt(entryIndex, updatedEntry);
	openkontekstapi.updateEntryImportance(entry._id, entry.importance);
}

function replaceEntry(updatedEntry) {
	var entryIndex = entries.indexOf(updatedEntry);
	entries.replaceAt(entryIndex, updatedEntry);
}

function changeImportanceFilter() {
	if(importanceFilter.value < 4) {
		importanceFilter.value = importanceFilter.value + 1;
	}
	else {
		importanceFilter.value = -1;
	}
	entries.replaceAll(agents[agent.value.agent_id]);
	resetOffset();
}

var pastFilter = Observable(false);
var pastFilterDisplay = pastFilter.map(function(x) {
	if(x) { return "On";}
	else {return "Off";}
});

function changePastFilter() {
	pastFilter.value = !pastFilter.value;
	entries.replaceAll(agents[agent.value.agent_id]);
	resetOffset();
}

var futureMode = Observable(false);
var futureModeDisplay = futureMode.map(function(x) {
	if(x) { return "On";}
	else {return "Off";}
});

function toggleFutureMode() {
	futureMode.value = !futureMode.value;
	pastMode.value = false;
	refreshEntries();
}

var pastMode = Observable(false);
var pastModeDisplay = pastMode.map(function(x) {
	if(x) { return "On";}
	else {return "Off";}
});

function togglePastMode() {
	pastMode.value = !pastMode.value;
	futureMode.value = false;
	refreshEntries();
}


/* Stuff to do with UI navigation and activation */

function swipedLeft(arg) {
	updateImportance(arg.data, -1);
}

function swipedRight(arg) {
	updateImportance(arg.data, 1);
}

function addToPast(arg) {
	arg.data.past_time = utils.getCurrentDateTimeString();
	openkontekstapi.updateEntryPastTime(arg.data._id, arg.data.past_time);
	replaceEntry(arg.data);
}

function goBack() {
	router.goBack();
}

var lastAgent = "";

function activate() {
	if(lastAgent == "" || lastAgent != agent.value.agent_id) {
		entries.clear();
		refreshEntries();
		lastAgent = agent.value.agent_id;
	}
	
}

function deactivate() {

}

/* Handling scrolling in list */

var limit = 10;
var offset = Observable();

function increaseOffset() {
    changeOffset(5);
}

function decreaseOffset() {
    changeOffset(-5);
}

function changeOffset(diff) {
    var nextOffset = offset.value + diff;
    if (nextOffset >= 0) {
        offset.value = nextOffset;
    }
}

function resetOffset() {
	if(entriesDisplay.length - limit > 0) {
		offset.value = entriesDisplay.length - limit;
	}
	else {
		offset.value = 0;
	}
	scrollToBottom();
	
}

function scrollToBottom() {
	theScrollview.gotoRelative(1,1);
}



/*  Camera and image stuff */
var entryImage = Observable(); 
var entryImageTaken = entryImage.map(function(x) { return x != null; });

function openCamera() {
	camera.takePicture(1200,1600)
    .then(function(img) {
   		entryImage.value = img;
   		return cameraRoll.publishImage(img);
    }
    , function(error) {
        // Will called if an error occurred.
    });
}

function openCameraRoll() {
	cameraRoll.getImage()
    .then(function(img) {
    	entryImage.value = img;
    }, function(error) {
        // Will be called if the user aborted the selection or if an error occurred.
    });
}

function clearEntryImage() {
	entryImage.value = null;
}

function goToImageViewPage(arg) {
	var entryParam = arg.data;
	router.push("imageviewpage", entryParam);
}

/* Location stuff  */
var entryLocation = Observable();
var entryLocationAdded = entryLocation.map(function(x) { return x != null; });

function openSelectLocation() {
	AppContext.addSelectLocationCallback(function(x) {
		console.log(JSON.stringify(x));
		entryLocation.value = x;
	 });	
	router.push("selectLocation", "selectionMode");

}

function clearEntryLocation() {
	entryLocation.value = null;
}


var displayAddFutureTime = Observable(false);

function addFutureTime() {
	displayAddFutureTime.value = true;
	futureTime.value = moment().format("DD.MM.YYYY HH:mm");
}

function removeFutureTime() {
	displayAddFutureTime.value = false;
	futureTime.value = "";
}

var futureTime = Observable(moment().format(""));
var dateTimePattern = "dd.mm.yyyy hh.mm";
var futureTimePattern = Observable("");
var oldFutureTime = "";
var futureTimeValid = Observable(true);

function futureTimeChanged() {
	var newFutureTime = futureTime.value;

	if(futureTime.value.length == 2 && oldFutureTime.length == 1) {
		newFutureTime = futureTime.value + ".";
	}
	else if(futureTime.value.length == 2 && oldFutureTime.length == 3) {
		newFutureTime = futureTime.value.substring(0,1);
	}
	else if(futureTime.value.length == 5 && oldFutureTime.length == 4) {
		newFutureTime = futureTime.value + ".";
	}
	else if(futureTime.value.length == 5 && oldFutureTime.length == 6) {
		newFutureTime = futureTime.value.substring(0,4);
	}	
	else if(futureTime.value.length == 10 && oldFutureTime.length == 9) {
		newFutureTime = futureTime.value + " ";
	}
	else if(futureTime.value.length == 10 && oldFutureTime.length == 11) {
		newFutureTime = futureTime.value.substring(0,9);
	}
	else if(futureTime.value.length == 13 && oldFutureTime.length == 12) {
		newFutureTime = futureTime.value + ":";
	}
	else if(futureTime.value.length == 13 && oldFutureTime.length == 14) {
		newFutureTime = futureTime.value.substring(0,12);
	}
	else if(futureTime.value.length > 16) {
		newFutureTime = futureTime.value.substring(0,16);
	}			


	var m = moment(newFutureTime, "DD.MM.YYYY HH:mm");

	if(futureTime.value.length > 1 && !m.isValid()) {
		futureTimeValid.value = false;
	} 
	else {
		futureTimeValid.value = true;
	}

	if(futureTime.value.length > 5 && m.isValid()) {
		futureTime.value = newFutureTime;
	} 
	else if (futureTime.value.length > 5) {
		futureTime.value = oldFutureTime;
	}
	else {
		futureTime.value = newFutureTime;
	}

	if(futureTime.value.length == 0) {
		futureTimePattern.value = dateTimePattern;
	}
	else {
		futureTimePattern.value = futureTime.value + dateTimePattern.substring(futureTime.value.length, dateTimePattern.length);
	}

	oldFutureTime = futureTime.value;
}

function clearFutureTime() {
	displayAddFutureTime.value = false;
	futureTime.value = "";
}

function goToLocationPage(arg) {
	router.push("locationpage", arg.data.location);
}

function goToEntryPage(arg) {
	AppContext.editEntry(arg.data)
	.then(function(x) {
		var entryIndex = entries.indexOf(arg.data);
		entries.replaceAt(entryIndex, x);
	})
	.catch(function() {});
}

module.exports = {
	agent : agent,
	entries : entries,
	entriesDisplay : entriesDisplay,
	refreshEntries : refreshEntries,
	clearEntries : clearEntries,
	postEntry : postEntry,
	entryText : entryText,
	swipedLeft : swipedLeft,
	swipedRight : swipedRight,
	importanceIcons : importanceIcons,
	goBack: goBack,
	changeImportanceFilter: changeImportanceFilter,
	importanceFilter : importanceFilter,
	importanceFilterIcon : importanceFilterIcon,
	importanceFilterOpacity : importanceFilterOpacity,
	numberOfEntries : numberOfEntries,
	addToPast: addToPast,
	changePastFilter : changePastFilter,
	pastFilterDisplay : pastFilterDisplay,
	pastFilter : pastFilter,
	entryImage : entryImage,
	entryImageTaken : entryImageTaken,
	openCamera : openCamera,
	openCameraRoll : openCameraRoll,
	clearEntryImage : clearEntryImage,
	goToImageViewPage : goToImageViewPage,
	activate : activate,
	deactivate : deactivate,
	limit : limit,
	offset : offset,
	increaseOffset : increaseOffset,
	decreaseOffset : decreaseOffset,
	scrollToBottom : scrollToBottom,
	postInProgress : postInProgress,
	openSelectLocation : openSelectLocation,
	entryLocation : entryLocation,
	entryLocationAdded : entryLocationAdded,
	clearEntryLocation : clearEntryLocation,
	displayAddFutureTime : displayAddFutureTime,
	addFutureTime : addFutureTime,
	removeFutureTime : removeFutureTime,
	futureTime : futureTime,
	futureTimeChanged : futureTimeChanged,
	futureTimePattern : futureTimePattern,
	futureTimeValid : futureTimeValid,
	toggleFutureMode : toggleFutureMode,
	futureMode : futureMode,
	futureModeDisplay : futureModeDisplay,
	togglePastMode : togglePastMode,
	pastMode : pastMode,
	pastModeDisplay : pastModeDisplay,
	goToLocationPage : goToLocationPage,
	goToEntryPage : goToEntryPage
};