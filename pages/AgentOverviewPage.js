var Observable = require("FuseJS/Observable");
var openkontekstapi = require("modules/OpenKontekstApi");
const moment = require('modules/moment');
const utils = require('modules/utils');


var agents = Observable();
var allAgents;

refreshAgents();

function refreshAgents() {
	openkontekstapi.getAllAgents()
	.then(function(agentsList) {
		allAgents = agentsList;
		agents.replaceAll(allAgents);	
		refreshLatestEntries();
	})
	.catch(function(error) {"Error refreshAgents: " + console.log(JSON.stringify(error));});
}

function refreshLatestEntries() {
	openkontekstapi.getLastestEntries().then(function(latest) {
	
	for(var i = 0; i < allAgents.length; i++) {
		var agent = allAgents[i];

		if(latest[agent.agent_id] != null) {
			agent.latest_entry = latest[agent.agent_id]["MAX created_time"];
			agent.latest_entry.created_time = utils.getDateTimeString(latest[agent.agent_id]["MAX created_time"].created_time);
		}
	}
	agents.replaceAll(allAgents);

	})
	.catch(function(error) {console.log(JSON.stringify(error));});
}

function refreshEntriesNotifications() {
}


function goToAgent(arg) {
	var agent = arg.data;
	router.push("agentpage", agent);
}

function endLoading(){
    isLoading.value = false;
}

function reloadHandler(){
    isLoading.value = true;
	refreshLatestEntries();
    setTimeout(endLoading, 1000);
}

var isLoading = Observable(false);



module.exports = {
	agents : agents,
	refreshAgents : refreshAgents,
	refreshEntriesNotifications : refreshEntriesNotifications,
	goToAgent: goToAgent,
    isLoading: isLoading,
    reloadHandler: reloadHandler
};