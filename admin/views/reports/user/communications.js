var keystone = require('keystone');
var dateformat = require('dateformat');
var _ = require('underscore');
var User = keystone.list('User');
var Message = keystone.list('Message');

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	view.on('init', function(next) {
		User.model.findById(req.params.id).exec(function(err, user) {
			var locals = _.extend(res.locals, {
				nav: keystone.nav,
				section: {key: 'user-report'},
				brand: keystone.get('brand'),
				title: keystone.get('brand') + ': Communications of ' + user.name.full,
				page: 'user-report',
				backUrl: '/',
				user: req.user,
				User: keystone.list('User'),
				signout: keystone.get('signout url'),
				reportUser: user,
				dateformat: dateformat
			});
			Message.model.find({'$or': [
				{sender: user.id},
				{receiver: user.id}
			]}).sort('-createdAt').populate('asset sender receiver').exec(function(err, messages) {
				var items = [];
				messages.forEach(function(message) {
					var item = items.find(function(item) {
						return message.asset && item.asset.id == message.asset.id;
					});
					if (!item && message.asset) {
						item = {
							asset: message.asset,
							messages: []
						};
						items.push(item);
					}
					if (item) {
						item.messages.push(message);
					}
				});
				locals.items = items;
				next();
			});
		});
	});
	view.render('admin/report-user-communications.jade');
};
