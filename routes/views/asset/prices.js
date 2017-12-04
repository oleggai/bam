var keystone = require('keystone');
var Asset = keystone.list('Asset');

var async = require('async');
var notification = require(__base + 'lib/Notification');

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;
	view.on('init', function(next) {
		if (req.params.id) {
			Asset.model.findById(req.params.id).exec(function (err, asset) {
				locals.asset = asset;
				if (asset.user == req.user.id) {


					async.parallel([function(callback) {
                        notification.delete(asset.id, notification.types.TYPE_BID, function() {
                            callback(null);
                        });
					}, function(callback) {
                        var prices = asset.prices.filter(function(price) {
                            return price.successfull;
                        });
                        prices.forEach(function (price) {
                            price.buyer = asset.assetNicknames(price.user).otherNickname;
                        });
                        locals.prices = prices.reverse();
                        callback(null);
					}], function(err, results) {
						if(err) {
							next(err);
						}
                        next();
					});
				}
				else {
					res.status('403').send('You have no access to this page');
				}
			});
		}
		else {
			next();
		}
	});
	view.render('asset/asset-prices');
};
