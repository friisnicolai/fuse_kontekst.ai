var GoogleApiAuth = require("modules/GoogleApiAuth");
var AppContext = require("modules/AppContext");
var GoogleDriveApi = require("modules/GoogleDriveApi");
var Observable = require("FuseJS/Observable");
var FileSystem = require("FuseJS/FileSystem");
const utils = require('modules/utils');
var Timer = require("FuseJS/Timer");



var googleDrive = Observable();
var syncStatus = Observable();
syncStatus.value = { "running" : false };

var runningSynchronize = false;



loadConfig().then(function(x) {
	googleDrive.value = x;
	GoogleDriveApi.setRefreshToken(x.userinfo.token.refresh_token);
});

function connectGoogleDrive() {
	setConnecting(true);
	GoogleApiAuth.authenticate().then(function(x) {
		googleDrive.value = { "connected" : true, "userinfo" : x};
		GoogleDriveApi.setRefreshToken(x.token.refresh_token);
		GoogleDriveApi.getOrCreateFolder("com.kontekstai.openkontekst", "root")
		.then(function(x) {
			googleDrive.value.root_folder = x;
			return x;
		})
		.then(function(x) {
			return GoogleDriveApi.getOrCreateFolder("media", x)
			.then(function(y) {
				googleDrive.value.media_folder = y;
				return x;
			});
		})
		.then(function(x) {
			return GoogleDriveApi.getOrCreateFolder("backup", x)
			.then(function(y) {
				googleDrive.value.backup_folder = y;
				return x;
			});
		})	
		.then(function(x) {
			return GoogleDriveApi.getOrCreateFolder("data", x)
			.then(function(y) {
				googleDrive.value.data_folder = y;
				return x;
			});
		})		
		.then(function(x) {
			storeConfig();
			setConnecting(false);
		});
	})
	.catch(function(e) {
		setConnecting(false);
	});
}

function cancelConnectGoogleDrive() {
	GoogleApiAuth.cancelAuthenticate();
	setConnecting(false);
}

function setConnecting(on) {
	var v = googleDrive.value;
	v.connecting = on;
	googleDrive.value = v;
}


function disconnectGoogleDrive() {
	googleDrive.value = { "connected" : false };
	storeConfig();
	setConnecting(false);
}

function storeConfig() {
	FileSystem.writeTextToFile(AppContext.configFilesLocation + "gooogledrive.json", JSON.stringify(googleDrive.value))
	.catch((e) => {
        console.log("Error storing GoogleDrive config" + e);
    });
}

function loadConfig() {
	return FileSystem.readTextFromFile(AppContext.configFilesLocation + "gooogledrive.json").then(function(x) {
		return JSON.parse(x);
	})
	.catch((e) => {
        console.log("Error loading GoogleDrive config" + e);
    });
}


function synchronize() {
	runningSynchronize = true;
	var localMediaFiles = {};
	var driveMediaFiles = {};
	var localBackupFiles = {};
	var driveBackupFiles = {};
	var localDataFiles = {};
	var driveDataFiles = {};

	FileSystem.listFiles(AppContext.mediaFilesLocation)
	.then(function(x) {
		localMediaFiles = x;
		return GoogleDriveApi.listFiles(googleDrive.value.media_folder); 
	})
	.then(function(x) {
		driveMediaFiles = x;
		return FileSystem.listFiles(AppContext.dataFilesLocation);
	})
	.then(function(x) {
		localDataFiles = x;
		return GoogleDriveApi.listFiles(googleDrive.value.data_folder); 
	})
	.then(function(x) {
		driveDataFiles = x;
		return FileSystem.listFiles(AppContext.backupFilesLocation);
	})	
	.then(function(x) {
		localBackupFiles = x;
		return GoogleDriveApi.listFiles(googleDrive.value.backup_folder);
	})
	.then(function(y) {
		driveBackupFiles = y;
		var filesToUpload = prepareFilesToUpload(localMediaFiles, AppContext.mediaFilesLocation, driveMediaFiles.files, googleDrive.value.media_folder, "image/jpeg", []);
		filesToUpload = prepareFilesToUpload(localBackupFiles, AppContext.backupFilesLocation, driveBackupFiles.files, googleDrive.value.backup_folder, "application/json", filesToUpload);
		filesToUpload = prepareFilesToUpload(localDataFiles, AppContext.dataFilesLocation, driveDataFiles.files, googleDrive.value.data_folder, "application/json", filesToUpload);
		if(filesToUpload.length > 0) {
			updateSyncStatus(true, "0 / " + filesToUpload.length);
			syncFiles(filesToUpload,0);
		}
		else {
			updateSyncStatus(true, "Nothing to synchronize");
			Timer.create(function() {
			    updateSyncStatus(false, "");
				googleDrive.value.last_sync = utils.getCurrentDateTimeString();
				googleDrive.value = googleDrive.value;
				storeConfig();
			}, 5000, false);			
		}
	});
}

function abortSynchronize() {
	runningSynchronize = false;
}

function syncFiles(fileList, fileNum) {
	if(fileNum < fileList.length && runningSynchronize) {
		GoogleDriveApi.uploadFile(fileList[fileNum].name, 
			                      fileList[fileNum].namePath, 
			                      fileList[fileNum].driveFolderId, 
			                      fileList[fileNum].mimetype,
			                      fileList[fileNum].fileId)
		.then(function(x) {
			updateSyncStatus(true, fileNum+1 + " / " + fileList.length);
			syncFiles(fileList, fileNum+1);
		});
	}
	else {
		if(runningSynchronize) {
			updateSyncStatus(false, "");
			googleDrive.value.last_sync = utils.getCurrentDateTimeString();
			googleDrive.value = googleDrive.value;
			storeConfig();
			runningSynchronize = false;
		}
		else {
			updateSyncStatus(false, "");
		}
	}
}

function prepareFilesToUpload(localFiles, localPath, driveFiles, driveFolderId, mimetype, filesToUpload) {
	driveHashtable = {};
	for (var i = 0; i < driveFiles.length; i++) {
		driveHashtable[localPath + driveFiles[i].name] = driveFiles[i];
	}

	for (var i = 0; i < localFiles.length; i++) {
		if(driveHashtable[localFiles[i]] == null) {
			filesToUpload.unshift(
				{ "name" : localFiles[i].substr(localPath.length, localFiles[i].length),
				  "namePath" : localFiles[i],
				  "driveFolderId" : driveFolderId,
				  "mimetype" : 	mimetype
				}
				);
		}
		else {
			var lf = FileSystem.getFileInfoSync(localFiles[i]);
			if(lf.length != driveHashtable[localFiles[i]].size) {
				filesToUpload.unshift(
					{ "name" : localFiles[i].substr(localPath.length, localFiles[i].length),
					  "namePath" : localFiles[i],
					  "driveFolderId" : driveFolderId,
					  "mimetype" : 	mimetype,
					  "fileId" : driveHashtable[localFiles[i]].id
					}
					);				
			}
		}
	}

	return filesToUpload;
}

function updateSyncStatus(running, msg) {
	syncStatus.value.message = msg;
	syncStatus.value.running = running;
	syncStatus.value = syncStatus.value;
}

module.exports = {
	googleDrive : googleDrive,
	connectGoogleDrive : connectGoogleDrive,
	disconnectGoogleDrive : disconnectGoogleDrive,
	cancelConnectGoogleDrive : cancelConnectGoogleDrive,
	synchronize : synchronize,
	abortSynchronize : abortSynchronize,
	syncStatus : syncStatus
};