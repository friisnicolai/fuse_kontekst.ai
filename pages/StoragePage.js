var GoogleDrive = require("modules/GoogleDrive");
var DataBackup = require("modules/DataBackup");
var Observable = require("FuseJS/Observable");
const utils = require('modules/utils');

var connectedGoogleDrive = GoogleDrive.googleDrive.map(function(x) {
    x.last_sync_display = utils.getDateTimeString(x.last_sync);
    return x;
});

var syncStatus = GoogleDrive.syncStatus;
var backupStatus = DataBackup.backupStatus;

var backupList = Observable();

loadBackupList();

function goBack() {
	router.goBack();
}

function connectGoogleDrive() {
	GoogleDrive.connectGoogleDrive();
}

function cancelConnectGoogleDrive() {
	GoogleDrive.cancelConnectGoogleDrive();
}

function disconnectGoogleDrive() {
	GoogleDrive.disconnectGoogleDrive();
}

function backupNow() {
    if(!DataBackup.backupStatus.value.running) {
    	DataBackup.createBackup().then(function(x) {
            loadBackupList();
        });
     }   
}

function loadBackupList() {
    DataBackup.listBackups().then(function(x) {
        backupList.replaceAll(x);
    });    
}

function synchronizeGoogleDrive() {
    if(!syncStatus.value.running) {
        GoogleDrive.synchronize();
    }
    else {
        GoogleDrive.abortSynchronize();
    }
}

module.exports = {
    goBack : goBack,
    connectGoogleDrive : connectGoogleDrive,
    backupNow : backupNow,
    connectedGoogleDrive : connectedGoogleDrive,
    disconnectGoogleDrive : disconnectGoogleDrive,
    cancelConnectGoogleDrive : cancelConnectGoogleDrive,
    synchronizeGoogleDrive : synchronizeGoogleDrive,
    syncStatus : syncStatus,
    backupList : backupList,
    backupStatus : backupStatus
};