var keystone = require('keystone');
var _ = require('underscore');
var dateformat = require('dateformat');
var Asset = keystone.list('Asset');
var User = keystone.list('User');

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	view.on('init', function(next) {
		Asset.model.findById(req.params.id).exec(function(err, asset) {
			var locals = _.extend(res.locals, {
				nav: keystone.nav,
				section: {key: 'asset-report'},
				brand: keystone.get('brand'),
				title: keystone.get('brand') + ': Asset ' + asset.title + ' bids',
				page: 'asset-report',
				backUrl: '/',
				user: req.user,
				User: keystone.list('User'),
				signout: keystone.get('signout url'),
				reportAsset: asset,
				dateformat: dateformat
			});
			var prices = asset.prices.filter(function(price) {
				return price.successfull;
			});
			var userIds = prices.map(function(price) {
				return price.user.toString();
			});
			User.model.find({_id: {$in: userIds}}).exec(function(err, users) {
				var items = prices.reverse();
				items.forEach(function(item) {
					item.bidder = users.find(function(user) {
						return item.user.toString() == user.id;
					});
				});
				locals.items = items;
				next();
			});			
		});
	});
	view.render('admin/report-asset-bids.jade');
};
