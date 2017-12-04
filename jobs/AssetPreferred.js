var keystone = require('keystone');
var Asset = keystone.list('Asset');
var User = keystone.list('User');
var interestNotify = require(__base + 'lib/interestNotification');

exports = module.exports = function () {
	Asset.model.find({isActiveByUser: true, isActiveByBAM: true, failed: false}).exec(function(err, assets) {
		User.model.find({isActive: true, isConfirmed: true}).exec(function(err, users) {
			users.forEach(function(user) {

				interestNotify(assets, user);

			});
			Asset.model.update({_id: {$in: assets.map(function(asset) {
				return asset.id;
			})}}, {$set: {notified: true}}, {multi: true}, function() {});
		});
	});
};
