var keystone = require('keystone');
var _ = require('underscore');
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
				title: keystone.get('brand') + ': Users that added asset ' + asset.title + ' to favorites',
				page: 'asset-report',
				backUrl: '/',
				user: req.user,
				User: keystone.list('User'),
				signout: keystone.get('signout url'),
				reportAsset: asset
			});
			User.model.find({favoriteAssets: asset.id}).sort('email').exec(function(err, users) {
				locals.users = users;
				next();
			});
		});
	});
	view.render('admin/report-asset-favorite-users.jade');
};
