var Observable = require("FuseJS/Observable");
var GeoLocation = require("FuseJS/GeoLocation");
var openkontekstapi = require("modules/OpenKontekstApi");
const moment = require('modules/moment');
const utils = require('modules/utils');
var camera = require("FuseJS/Camera");
var cameraRoll = require("FuseJS/CameraRoll");
var FileSystem = require("FuseJS/FileSystem");
var ImageTools = require("FuseJS/ImageTools");
var AppContext = require("modules/AppContext");


var locationName = Observable("");
var locationDescription = Observable("");
var locationLatitude = Observable("");
var locationLongtitude = Observable("");
var locationRadius = Observable(20);

var locationImage = Observable();
var locationImagePath = locationImage.map(function(x) { if(x != null) {return x.path;} else {return null;}});
var locationImageTaken = locationImage.map(function(x) { return x != null; });

var originaLocation = this.Parameter;

function activatePage() {
	locationName.value = originaLocation.value.name;
	locationDescription.value = originaLocation.value.description;
	locationLatitude.value = originaLocation.value.gps_latitude;
	locationLongtitude.value = originaLocation.value.gps_longtitude;
	locationRadius.value = originaLocation.value.gps_radius;
	locationImage.value = {path : AppContext.mediaFilesLocation + originaLocation.value.location_image,
                           name : originaLocation.value.location_image};

 }


function editLocation() {
	if(locationName.value.length > 0 && locationLatitude.value.length > 0 && locationLongtitude.value.length > 0) {
		var locationImageName = null;
		if(locationImage.value != null) {
			if(locationImage.value.name == originaLocation.value.location_image) {
				locationImageName = originaLocation.value.location_image;
			}
			else {
				var newImage = AppContext.mediaFilesLocation + locationImage.value.name;
	        	FileSystem.copy(locationImage.value.path, newImage);
	        	locationImageName = locationImage.value.name;
	        }
		}

		openkontekstapi.updateLocation(originaLocation.value.location_id,
									 locationName.value,
									 locationDescription.value,
									 locationLatitude.value,
									 locationLongtitude.value,
									 locationRadius.value,
									 locationImageName,
									 utils.getCurrentDateTimeString()
									)
		.then(function(x) {
			locationName.value = "";
			locationDescription.value = "";
			locationLatitude.value = "";
			locationLongtitude.value = "";
			locationRadius.value = 20;
			locationImage.value = null;
			AppContext.submitEditLocation(x);
			goBack();
		});

	}
}

function setToMyLocation() {
	GeoLocation.getLocation(5000).then(function(location) {
		locationLatitude.value = location.latitude;
		locationLongtitude.value  =location.longitude;
	});
}

function clearImage() {
	locationImage.value = null;
}

function openCamera() {
	camera.takePicture(1200,1600)
    .then(function(img) {
		var imgToolOptions = {
    		mode: ImageTools.SCALE_AND_CROP,
    		desiredWidth: 262,
    		desiredHeight: 230,
    		performInPlace : true
			};
		ImageTools.resize(img, imgToolOptions).then(function(x) {
			locationImage.value = x;
		});			
    }
    , function(error) {
        // Will called if an error occurred.
    });
}

function openCameraRoll() {
	cameraRoll.getImage()
    .then(function(img) {
 		var imgToolOptions = {
    		mode: ImageTools.SCALE_AND_CROP,
    		desiredWidth: 262,
    		desiredHeight: 230,
    		performInPlace : true
			};
		ImageTools.resize(img, imgToolOptions).then(function(x) {
			locationImage.value = x;
		});	
    }, function(error) {
        // Will be called if the user aborted the selection or if an error occurred.
    });
}

function goBack() {
	router.goBack();
}

module.exports = {
	goBack : goBack,
	setToMyLocation : setToMyLocation,
	locationName : locationName,
	locationDescription : locationDescription,
	locationLatitude : locationLatitude,
	locationLongtitude : locationLongtitude,
	locationRadius : locationRadius,
	locationImage : locationImage,
	locationImagePath : locationImagePath,
	openCamera : openCamera,
	editLocation : editLocation,
	clearImage : clearImage,
	locationImageTaken : locationImageTaken,
	openCameraRoll : openCameraRoll,
	activatePage : activatePage,
	originaLocation : originaLocation
};