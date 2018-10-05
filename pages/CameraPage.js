var cameraRoll = require("FuseJS/CameraRoll");
var camera = require("FuseJS/Camera");
var FileSystem = require("FuseJS/FileSystem");
var Observable = require("FuseJS/Observable");
var AppContext = require("modules/AppContext");

var image = Observable();


function openCamera() {
	camera.takePicture(1200,1600)
    .then(function(img) {
        console.log(JSON.stringify(img));
        
        var newImage = AppContext.mediaFilesLocation + img.name;
        FileSystem.copy(img.path, newImage)
        .then(function() {
            image.value = newImage;
            console.log(JSON.stringify(image));
        });
        
        //return cameraRoll.publishImage(img);
    }
    , function(error) {
        // Will called if an error occurred.
    });
}

function openCameraRoll() {
	cameraRoll.getImage()
    .then(function(image) {
        console.log(JSON.stringify(image));
    }, function(error) {
        // Will be called if the user aborted the selection or if an error occurred.
    });
}

 module.exports = {
	openCamera : openCamera,
	openCameraRoll : openCameraRoll,
    image : image
};