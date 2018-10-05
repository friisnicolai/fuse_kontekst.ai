var sbankenApi = require("modules/SbankenApi");
var Observable = require("FuseJS/Observable");

var account = Observable();
var accountNumber = account.map(function(x) { return x.item.accountNumber; });
var accountName = account.map(function(x) { return x.item.name; });
var accountBalance = account.map(function(x) { return x.item.balance; });

var transactions = Observable();

refresh();

function refresh() {
	sbankenApi.getAccount("")
	.then(function(acc) {
		account.value = acc;
	}
	);

	sbankenApi.getTransactions("")
	.then(function(trans) {
		transactions.replaceAll(trans.items);
	}
	);	
}

module.exports = {
	account : account,
	accountNumber : accountNumber,
	accountName : accountName,
	accountBalance : accountBalance,
	refresh : refresh,
	transactions : transactions
};