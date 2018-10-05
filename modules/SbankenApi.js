var credentials = require('modules/credentials');
const moment = require('modules/moment');

var authenticationToken = btoa(credentials.sbanken_api_key + ":" + credentials.sbanken_secret);

var ROOT_URL = "https://api.sbanken.no";

var accessToken;

function authenticate() {
	var url = encodeURI(ROOT_URL + "/identityserver/connect/token");

	var options = {method : "POST"};
	
	options = Object.assign({}, options, {
		body: "grant_type=client_credentials",
		headers: Object.assign({}, options.headers, {
			"Accept" : "application/json", "Content-Type": "application/x-www-form-urlencoded", "Authorization" : "Basic " + authenticationToken
		})
	});

	console.log("Sbanken authenticate request");

	return fetch(url, options)
		.then(function(response) { return response.json(); })
		.then(function(responseObject) {
			accessToken = responseObject;
			accessToken.expires = moment().unix() + responseObject.expires_in - 60;
			console.log("Sbanken REST API Response: " + JSON.stringify(responseObject));	
			return responseObject; })
		.catch((reason) => {
			accessToken = null;
            console.log('Sbanken: Error contacting backend ('+reason+') ');
        });	
}


function apiFetch(path, options) {
	var url = encodeURI(ROOT_URL + path);

	if(options === undefined) {
		options = {};
	}
	
	options = Object.assign({}, options, {
		body: JSON.stringify(options.body),
		headers: Object.assign({}, options.headers, {
			"Accept": "application/json", "Authorization" : accessToken.token_type + " " + accessToken.access_token
		})
	});

	return fetch(url, options)
		.then(function(response) { return response.json(); })
		.then(function(responseObject) {
			console.log("Sbanken REST API Response: " + JSON.stringify(responseObject));	
			return responseObject; })
		.catch((reason) => {
            console.log('Sbanken: Error contacting backend ('+reason+') ');
        });       
}

function apiAuthenticateFetch(path, options) {
	if(accessToken == null || accessToken.expires < moment().unix()) {
		return authenticate().then(function() {return apiFetch(path, options);});
	}
	else {
		return apiFetch(path, options);
	}
}

function getAccount(accountNumber) {
	return apiAuthenticateFetch("/bank/api/v1/accounts/" + credentials.sbanken_customer_id + "/" + accountNumber);
}

function getTransactions(accountNumber) {
	return apiAuthenticateFetch("/bank/api/v1/transactions/" + credentials.sbanken_customer_id + "/" + accountNumber);
}

module.exports = {
	getAccount : getAccount,
	getTransactions : getTransactions
};
