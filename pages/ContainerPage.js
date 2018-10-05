var GoogleApiAuth = require("modules/GoogleApiAuth");
var GoogleDrive = require("modules/GoogleDrive");

var syncStatus = GoogleDrive.syncStatus;

function goBack() {
	console.log("Go back");
}

function openKontekst() {
	//GoogleApiAuth.authenticate();
}

function goToStoragePage() {
	router.push("storagepage");
}

module.exports = {
    goBack : goBack,
    openKontekst : openKontekst,
    goToStoragePage : goToStoragePage,
    syncStatus : syncStatus
};