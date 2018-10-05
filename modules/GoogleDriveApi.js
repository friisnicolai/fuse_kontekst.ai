const moment = require('modules/moment');
var FileSystem = require("FuseJS/FileSystem");

const CLIENT_ID = "13110585887-v56pbi671lfmt338fb0k2u5cs1ic5kv0.apps.googleusercontent.com";
var accessToken;
var refreshToken;

function setRefreshToken(t) {
	refreshToken = t;
}

function refreshAccessToken() {
	var url = encodeURI("https://www.googleapis.com/oauth2/v4/token");

	var options = {method : "POST"};
	
	options = Object.assign({}, options, {
		body: "refresh_token=" + refreshToken
		      + "&client_id=" + CLIENT_ID
		      + "&grant_type=refresh_token",
		headers: Object.assign({}, options.headers, {
			"Content-Type": "application/x-www-form-urlencoded"
		})
	});

	console.log(JSON.stringify(options));

	return fetch(url, options)
		.then(function(response) { return response.json(); })
		.then(function(responseObject) {
			accessToken = responseObject;
			accessToken.expires = moment().unix() + responseObject.expires_in - 60;
			console.log("Google Refresh Token Response: " + JSON.stringify(responseObject));	
			return responseObject; })
		.catch((reason) => {
			accessToken = null;
            console.log('Google Refresh Token: Error contacting backend ('+reason+') ');
        });		

}

function apiFetch(path, options) {
	var url = "https://www.googleapis.com/drive/v3" + path;
	console.log("GoogleDrive Fetch to " + url);

	if(options === undefined) {
		options = {};
	}
	
	options = Object.assign({}, options, {
		body: JSON.stringify(options.body),
		headers: Object.assign({}, options.headers, {
			"Accept": "application/json", "Authorization" : "Bearer " + accessToken.access_token
		})
	});

	return fetch(url, options)
		.then(function(response) { return response.json(); })
		.then(function(responseObject) {
			console.log("GoogleDrive REST API Response: " + JSON.stringify(responseObject));	
			return responseObject; })
		.catch((reason) => {
            console.log('GoogleDrive: Error contacting backend ('+reason+') ');
        });       
}

function apiAuthenticateFetch(path, options) {
	if(accessToken == null || accessToken.expires < moment().unix()) {
		return refreshAccessToken().then(function() { return apiFetch(path, options);});
	}
	else {
		return apiFetch(path, options);
	}
}

function apiFetchUpload(fileId, fileName) {
	var url = "https://www.googleapis.com/upload/drive/v3/files/" + fileId;
	console.log("GoogleDrive Upload to " + url);

	return FileSystem.readBufferFromFile(fileName).then(function(x) {
		var options = {method : "PATCH"};
		options = Object.assign({}, options, {
			body: x,
			headers: Object.assign({}, options.headers, {
				"Authorization" : "Bearer " + accessToken.access_token
			})
		});

		return fetch(url, options)
			.then(function(response) { return response.json(); })
			.then(function(responseObject) {
				console.log("GoogleDrive REST API Response: " + JSON.stringify(responseObject));	
				return responseObject; })
			.catch((reason) => {
	            console.log('GoogleDrive: Error contacting backend ('+reason+') ');
	        });   
	});   
}

function apiAuthenticateFetchUpload(fileId, fileName) {
	if(accessToken == null || accessToken.expires < moment().unix()) {
		return refreshAccessToken().then(function() { return apiFetchUpload(fileId, fileName);});
	}
	else {
		return apiFetchUpload(fileId, fileName);
	}
}

function uploadFile(fileName, filePath, folderId, mimeType, fileId) {
	if(fileId != null && fileId.length > 0) {
		return apiAuthenticateFetchUpload(fileId, filePath);
	}
	else {
		return apiAuthenticateFetch("/files",{
				method: "POST",
				headers : {"Content-Type": "application/json"},
				body: { "name": fileName,
  					    "mimeType": mimeType,
  						"parents": [
    						folderId
  						 ] 
					}
			})
			.then(function(x) {
				return apiAuthenticateFetchUpload(x.id, filePath);
			});
	}
}

function getOrCreateFolder(folderName, folderParent) {
	return apiAuthenticateFetch("/files?fields=files/id&q=" + encodeURI("name='" + folderName + "' and parents in '" + folderParent + "' and trashed=false"))
	.then(function(x) {
		if(x.files.length > 0) {
			return x.files[0].id;
		}
		else {
			return apiAuthenticateFetch("/files", {
				method: "POST",
				headers : {"Content-Type": "application/json"},
				body: { "name": folderName,
  					    "mimeType": "application/vnd.google-apps.folder",
  						"parents": [
    						folderParent
  						 ] 
					}
			}).then(function(y) {
				return y.id;
			});
		}
	});
}

function listFiles(folderId) {
	return apiAuthenticateFetch("/files?pageSize=1000&fields=files/id,files/name,files/size&q=" + encodeURI("parents in '" + folderId + "' and trashed=false"))
}


module.exports = {
	setRefreshToken : setRefreshToken,
	getOrCreateFolder : getOrCreateFolder,
	uploadFile : uploadFile,
	listFiles : listFiles
};