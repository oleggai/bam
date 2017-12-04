var keystone = require('keystone');
var _ = require('underscore');
var Asset = keystone.list('Asset');
var User = keystone.list('User');

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	view.on('init', function(next) {
		Asset.model.findById(req.params.id).populate('userRanks').exec(function(err, asset) {
			var locals = _.extend(res.locals, {
				nav: keystone.nav,
				section: {key: 'asset-report'},
				brand: keystone.get('brand'),
				title: keystone.get('brand') + ': Asset ' + asset.title + ' user ranks',
				page: 'asset-report',
				backUrl: '/',
				user: req.user,
				User: keystone.list('User'),
				signout: keystone.get('signout url'),
				reportAsset: asset
			});
			var userIds = asset.userRanks.map(function(rank) {
				return rank.user.toString();
			});
			User.model.find({_id: {$in: userIds}}).sort('email').exec(function(err, users) {
				locals.items = users.map(function(user) {
					var rank = asset.userRanks.find(function(item) {
						return item.user.toString() == user.id;
					}).value;
					return {user: user, rank: rank};
				});
				next();
			});
		});
	});
	view.render('admin/report-asset-user-ranks.jade');
};
