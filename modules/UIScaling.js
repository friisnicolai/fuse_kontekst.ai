var Observable = require("FuseJS/Observable");

var normalFontSize = Observable(16);
var smallFontSize = Observable(11);

function tablet() {
	normalFontSize.value = 20;
	smallFontSize.value = 15;
	console.log("Tablet");
}

function phone() {
	normalFontSize.value = 16;
	smallFontSize.value = 11;
	console.log("Phone");
}



module.exports = {		
	tablet : tablet,
	phone : phone,
	normalFontSize : normalFontSize,
	smallFontSize : smallFontSize
};