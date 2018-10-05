var Observable = require("FuseJS/Observable");
var GeoLocation = require("FuseJS/GeoLocation");
var openkontekstapi = require("modules/OpenKontekstApi");
var AppContext = require("modules/AppContext");
const utils = require('modules/utils');
const moment = require('modules/moment');
var camera = require("FuseJS/Camera");
var cameraRoll = require("FuseJS/CameraRoll");
var FileSystem = require("FuseJS/FileSystem");

var progressSpinning = Observable("Hidden");

var originalEntry; //this.Parameter;

var entryContentText = Observable();
var entryCreatedTimeDisplay = Observable();
var entryImageDisplay = Observable();
var entryImageSetFlag = entryImageDisplay.map(function(x) { return x != null && x != ""; });

var entryLocation = Observable();
var entryLocationName = entryLocation.map(function(x) { return x.name; }); 
var entryLocationImage = entryLocation.map(function(x) { return AppContext.mediaFilesLocation + x.location_image; });
var entryLocationDescription = entryLocation.map(function(x) { return x.description; }); 
var entryLocationSetFlag = entryLocation.map(function(x) { return x.location_id != null; });

var newEntryImage;

var entryContentTime = Observable();
var displayEntryContentTime = entryContentTime.map(function(x) {
	return (x != "");
});

var valuesChanged = Observable(false);

entryLocation.onValueChanged(module, function(x) {
	if(x != null && originalEntry.location != null && x.location_id != originalEntry.location.location_id) {
		valuesChanged.value = true;
	}
});

entryImageDisplay.onValueChanged(module, function(x) {
	if(x != null && originalEntry != null && x != AppContext.mediaFilesLocation + originalEntry.content_image) {
		valuesChanged.value = true;	
	}
});

entryContentText.onValueChanged(module, function(x) {
	if(originalEntry != null && x != originalEntry.content_text) {
		valuesChanged.value = true;	
	}
});

entryContentTime.onValueChanged(module, function(x) {
	if(originalEntry != null && x != moment(originalEntry.content_time).format("DD.MM.YYYY HH:mm")) {
		valuesChanged.value = true;	
	}
});



this.Parameter.onValueChanged( module, function(x) {
	originalEntry = x;
	fillValuesFromEntry(x);
});

function fillValuesFromEntry(x) {
	valuesChanged.value = false;
	progressSpinning.value = "Hidden";
	entryContentText.value = x.content_text;
	entryCreatedTimeDisplay.value = utils.getDateTimeString(x.created_time);
	if(x.content_image != null && x.content_image != "") {
		entryImageDisplay.value = AppContext.mediaFilesLocation + x.content_image;
	}
	else {
		entryImageDisplay.value = null;
	}
	newEntryImage = null;
	entryLocation.value = x.location;
	entryContentTime.value = moment(x.content_time).format("DD.MM.YYYY HH:mm");
}

function editEntry() {
	if(valuesChanged.value) {
		progressSpinning.value = "Visible";
		var updatedContentTime = utils.getCurrentDateTimeString();
		if(entryContentTime.value != "") {
			var m = moment(entryContentTime.value, "DD.MM.YYYY HH:mm");
			if(m.isValid()) {
				updatedContentTime = m.format();
			}
		}


		var entryImageName = "";
		if(entryImageDisplay.value != null && entryImageDisplay.value != "") {
			entryImageName = originalEntry.content_image;
		}
		else {
			entryImageName = "";
		}

		if(newEntryImage != null && newEntryImage.name != originalEntry.content_image) {
			var newImage = AppContext.mediaFilesLocation + newEntryImage.name;
	        FileSystem.copy(newEntryImage.path, newImage);
	        entryImageName = newEntryImage.name;
		}


		
		openkontekstapi.updateEntry(originalEntry.entry_id, 
									originalEntry.agent_id, 
									entryContentText.value, 
									utils.getCurrentDateTimeString(), 
									originalEntry.gps_latitude, 
									originalEntry.gps_longtitude, 
									originalEntry.gps_altitude, 
									originalEntry.importance, 
									entryImageName, 
									entryLocation.value.location_id, 
									updatedContentTime)
		.then(function(x) {
			progressSpinning.value = "Hidden";
			valuesChanged.value = false;
			console.log(JSON.stringify(x));
			originalEntry = x;
			fillValuesFromEntry(x);
			AppContext.submitEditEntry(x);
			router.goBack();
		});
	}
}



function clearLocation() {
	entryLocation.value = {};
}


function goBack() {
	//AppContext.cancelEditEntry(originalEntry.value);
	
	router.goBack();
}

function revertEdit() {
	fillValuesFromEntry(originalEntry);
}


function addDateTime() {
	entryContentTime.value = moment().format("DD.MM.YYYY HH:mm");
}

function removeDateTime() {
	entryContentTime.value = "";
}

function openSelectLocation() {
	AppContext.addSelectLocationCallback(function(x) {
		entryLocation.value = x;
	 });	
	router.push("selectLocation", "selectionMode");

}

function openCamera() {
	camera.takePicture(1200,1600)
    .then(function(img) {
   		newEntryImage = img;
   		entryImageDisplay.value = img.path;
   		return cameraRoll.publishImage(img);
    }
    , function(error) {
        // Will called if an error occurred.
    });
}

function openCameraRoll() {
	cameraRoll.getImage()
    .then(function(img) {
    	newEntryImage = img;
    	entryImageDisplay.value = img.path;
    }, function(error) {
        // Will be called if the user aborted the selection or if an error occurred.
    });
}

function clearImage() {
	entryImageDisplay.value = "";
	newEntryImage = null;
}


module.exports = {
	goBack : goBack,
	entryContentText : entryContentText,
	entryCreatedTimeDisplay : entryCreatedTimeDisplay,
	entryImageDisplay : entryImageDisplay,
	entryLocation : entryLocation,
	entryLocationName : entryLocationName,
	entryLocationImage : entryLocationImage,
	entryLocationDescription : entryLocationDescription,
	entryLocationSetFlag : entryLocationSetFlag,
	entryContentTime : entryContentTime,
	originalEntry : originalEntry,
	clearLocation : clearLocation,
	displayEntryContentTime : displayEntryContentTime,
	addDateTime : addDateTime,
	removeDateTime : removeDateTime,
	openSelectLocation : openSelectLocation,
	valuesChanged : valuesChanged,
	clearImage : clearImage,
	entryImageSetFlag : entryImageSetFlag,
	openCamera : openCamera,
	openCameraRoll : openCameraRoll,
	revertEdit : revertEdit,
	editEntry : editEntry,
	progressSpinning : progressSpinning
};