const moment = require('modules/moment');

function getDateTimeString(originalDateTimeString) {
   if(originalDateTimeString == null || originalDateTimeString.length == 0) {
      return "";
   }
	var createdMoment = moment(originalDateTimeString); 			
	var nowMoment = moment();
	if(createdMoment.format("DD.MM.YYYY") != nowMoment.format("DD.MM.YYYY")) {
		return createdMoment.format("DD.MM.YYYY HH:mm");
	}
	else {
		return createdMoment.format("HH:mm");
	}
}

function getCurrentDateTimeString() {
	return moment().format();
}

function uuid() {
   var chars = '0123456789abcdef'.split('');

   var uuid = [], rnd = Math.random, r;
   uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
   uuid[14] = '4'; // version 4

   for (var i = 0; i < 36; i++)
   {
      if (!uuid[i])
      {
         r = 0 | rnd()*16;

         uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
      }
   }

   return uuid.join('');
}

function dashCombine(val1, val2) {
   if(val1 != null && val1.length > 0 && val2 != null && val2.length > 0) {
      return val1 + " - " + val2;
   }
   else if(val1 != null && val1.length > 0) {
      return val1;
   }
   else if(val2 != null && val2.length > 0) {
      return val2;
   }
   else {
      return "";
   }
}

module.exports = {
	getDateTimeString : getDateTimeString,
	getCurrentDateTimeString : getCurrentDateTimeString,
	uuid : uuid,
   dashCombine : dashCombine
};