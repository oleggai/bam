
var keystone = require('keystone');

exports = module.exports = function(assets, user) {
    var matchedAssets = assets.filter(function(asset) {

        if(!user.isInNotifiedAssets(asset)) {
            user.notifiedAssets.push(asset);
            user.save(function(error) {});
            return user.matchAsset(asset);
        } else {
            return false;
        }
    }).sort(function(asset1, asset2) {
        if (asset1.title < asset2.title) {
            return -1;
        }
        if (asset1.title > asset2.title) {
            return 1;
        }
        return 0;
    });
    if (user.emailVolume != 'none' && matchedAssets.length > 0) {
        new keystone.Email('asset-preferred').send({
            to: user.email,
            subject: 'BAM: New assets of your interest appear',
            user: user,
            assets: matchedAssets
        });
    }
};
