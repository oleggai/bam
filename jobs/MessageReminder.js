var moment = require('moment');
var keystone = require('keystone');
var Message = keystone.list('Message');

exports = module.exports = function() {
	// Within 2 days means earlier than yesterday's 00:00:00
	var yesterday = moment().subtract(1, 'days').toDate();
	yesterday.setHours(0, 0, 0, 0);
	Message.model.find({
		reply: null,
		$or: [
			// Each message can be reminded not more than 3 times
			{unreplied: {$lt: 3}},
			{unreplied: {$exists: false}}
		],
		createdAt: {$lt: yesterday}
	}).populate('asset sender receiver').exec(function(err, messages) {
		var items = [];
		messages.forEach(function(message) {
			var item = items.find(function(item) {
				return item.user.id == message.receiver.id;
			});
			if (!item) {
				item = {user: message.receiver, assets: []};
				items.push(item);
			}
			var exists = item.assets.find(function(asset) {
				return asset.id == message.asset.id;
			});
			if (!exists) {
				item.assets.push(message.asset);
			}
		});
		Message.model.update({_id: {$in: messages.map(function(message) {
			return message.id;
		})}}, {$inc: {unreplied: 1}}, {multi: true}, function() {
			items.forEach(function(item) {
				new keystone.Email('message-reminder').send({
					to: item.user.email,
					subject: 'BAM: You have unreplied messages on BAM',
					user: item.user,
					assets: item.assets
				});
			});			
		});
	});
};
