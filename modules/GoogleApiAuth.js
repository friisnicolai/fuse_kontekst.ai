var InterApp = require("FuseJS/InterApp");

const REDIRECT_URI = "com.kontekstai:oauth2Callback";
const CLIENT_ID = "";

var authenticating = false;
var authPromiseResolve;
var authPromiseReject;

InterApp.on('receivedUri', function(uri) {
	if(authenticating) {
		console.log(uri);

		if(uri.indexOf(REDIRECT_URI) !== 0) {
			authPromiseReject("wrong_callback_uri_path");
			return;
		}
		if(uri.indexOf(REDIRECT_URI + "?error=access_denied") == 0) {
			authPromiseReject("access_denied");
			return;
		}		

		var uriAndFragment = uri.split("#");
		var authCode = uriAndFragment[0].split("code=")[1];
		var userinfo = {};

		getAccessToken(authCode)
		.then(function(x) {
			userinfo.token = x;
			return getUserInfo(x.access_token);
		})
		.then(function(y) {
			userinfo.user = y;
			authPromiseResolve(userinfo);
			authenticating = false;
		});
	}
});

function getAccessToken(authCode) {
	var url = encodeURI("https://www.googleapis.com/oauth2/v4/token");	
	var options = {method : "POST"};
	
	options = Object.assign({}, options, {
		body: "client_id=" + encodeURIComponent(CLIENT_ID) 
			+ "&code=" + encodeURIComponent(authCode)
			+ "&redirect_uri=" + encodeURIComponent("com.kontekstai:oauth2Callback")
			+ "&grant_type=authorization_code",
		headers: Object.assign({}, options.headers, {
			"Content-Type": "application/x-www-form-urlencoded"
		})
	});	

	return fetch(url, options)
		.then(function(response) { return response.json(); })
		.then(function(responseObject) {
			console.log("Google Token Response: " + JSON.stringify(responseObject));	
			return responseObject; })
		.catch((reason) => {
            console.log('Google Token: Error contacting backend ('+reason+') ');
        });		
}

function getUserInfo(accessToken) {
	var url = encodeURI("https://www.googleapis.com/oauth2/v2/userinfo");	
	var options = {method : "GET"};
	
	options = Object.assign({}, options, {
		headers: Object.assign({}, options.headers, {
			"Authorization": "Bearer " + accessToken
		})
	});	

	return fetch(url, options)
		.then(function(response) { return response.json(); })
		.then(function(responseObject) {
			console.log("Google UserInfo Response: " + JSON.stringify(responseObject));	
			return responseObject; })
		.catch((reason) => {
            console.log('Google UserInfo: Error contacting backend ('+reason+') ');
        });		
}

function authenticate() {
	return new Promise(function(resolve, reject) {
		authPromiseResolve = resolve;
		authPromiseReject = reject;
		var authUri = "https://accounts.google.com/o/oauth2/v2/auth"
			+ "?redirect_uri=" + encodeURIComponent(REDIRECT_URI)
			+ "&client_id=" + encodeURIComponent(CLIENT_ID)
			+ "&scope=" + encodeURIComponent("https://www.googleapis.com/auth/drive profile email")
			+ "&response_type=code";
		InterApp.launchUri(authUri);
		authenticating = true;
	});
}

function cancelAuthenticate() {
	authenticating = false;
}





module.exports = {
	authenticate : authenticate,
	cancelAuthenticate : cancelAuthenticate
};
