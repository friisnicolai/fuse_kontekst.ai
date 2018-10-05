var Observable = require("FuseJS/Observable");
var entryParam = this.Parameter;

var imageFile = entryParam.map(function(x) { return x.content_image_display; });


function log() {
	console.log(JSON.stringify(entryParam));
}

module.exports = {
	imageFile : imageFile,
	log : log
};