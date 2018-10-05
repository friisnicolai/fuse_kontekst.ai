var openkontekstapi = require("modules/OpenKontekstApi");
var Observable = require("FuseJS/Observable");
var AppContext = require("modules/AppContext");
const moment = require('modules/moment');
const utils = require('modules/utils');
var FileSystem = require("FuseJS/FileSystem");



var backupStatus = Observable();
backupStatus.value = { "running" : false };


function createBackup() {	
	backupStatus.value = { "running" : true };

	var backup = {
		"backup_id" : utils.uuid(),
		"name" : "backup_1",
		"created_time" : utils.getCurrentDateTimeString(),
		"kontekst" : {}
	};

	
	return openkontekstapi.getAllLocations().then(function(x) {
		backup.m_locations = x;	
		return openkontekstapi.getAllAgents();
	})
	.then(function(x) {
		backup.m_agents = x;
		return openkontekstapi.getEntriesBackup();
	})
	.then(function(x) {
		backup.m_entries = x;
		return FileSystem.writeTextToFile(AppContext.backupFilesLocation + "backup-" + moment().format("YYYY-MM-DD-hh-mm") + "-" + utils.uuid() + ".json", JSON.stringify(backup))
	})
	.then(function(x) {
		backupStatus.value = { "running" : false };
		return x;
	})
	.catch((e) => {
        console.log("Error creating backup" + e);
    });
}

function listBackups() {
	return FileSystem.listFiles(AppContext.backupFilesLocation)
	.then(function(x) {
		var backupFiles = [];
		for (var i = 0; i < x.length; i++) {
			var lf = FileSystem.getFileInfoSync(x[i]);
			lf.name = lf.fullName.substr(AppContext.backupFilesLocation.length, x[i].length);
			backupFiles.unshift(lf);
		}
		backupFiles.sort(function(a,b) {
			var nameA = a.name.toUpperCase();
			 var nameB = b.name.toUpperCase();
			 if (nameA < nameB) {
			    return 1;
			 }
			 if (nameA > nameB) {
			  	return -11;
			 }
			 return 0;
		});		
		return backupFiles;
	});
}

module.exports = {
	createBackup : createBackup,
	listBackups : listBackups,
	backupStatus : backupStatus
};