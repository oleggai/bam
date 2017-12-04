
var keystone = require('keystone');
var Notification = keystone.list('Notification');
var Asset = keystone.list('Asset');

const TYPE_NDA = 'nda';
const TYPE_BID = 'bid';

module.exports.types = {};
module.exports.types.TYPE_NDA = TYPE_NDA;
module.exports.types.TYPE_BID = TYPE_BID;

module.exports.create = function(asset, type) {
    var NewNotification = new Notification.model({
        type: type
    });

    NewNotification.asset = asset;

    NewNotification.save(function(err, notification) {
        if(err) {
            next(err);
        }
    });
};

module.exports.find = function(user, callback) {
    Asset.model.find({user: user}).exec(function(err, assets) {
        var ids = assets.map(function(asset) {
            return asset.id;
        });

        Notification.model.find().where('asset').in(assets).populate('asset').exec(function(err, notifications) {
            if(err) {
                next(err);
            }

            var links = getLinks(notifications);
            callback(links);
        });
    });
};

module.exports.delete = function(assetId, type, callback) {
    Notification.model.find({asset: assetId, type: type}).remove(function(err) {
        if(err) {
            next(err);
        }
        callback();
    });
};

function getLinks(notifications) {

    var output = [];
    var links = [];
    var url = '';
    var label = '';
    var title = '';

    var filteredNotifications = notifications.filter(function(notification, index) {

        function compare(object) {
            if(notification.asset.id == object.notification.asset.id && notification.type == object.notification.type) {
                object.count++;
                return true;
            }
            return false;
        }

        if(output.find(compare)) {
            return false;
        } else {
            output.push({
                'notification': notification,
                'count': 1
            });
            return true;
        }
    });


    for(var i = 0; i < output.length; ++i) {

        var notification = output[i].notification;
        title = notification.asset.title;
        var count = output[i].count;
        switch (notification.type) {
            case TYPE_NDA:
                //
                url = '/asset/edit/' + notification.asset.id;
                label = 'NDA files attached';

                break;
            case TYPE_BID:
                //
                url = '/asset/prices/' + notification.asset.id;
                label = 'New bids';

                break;
        }

        links.push({
            url: url,
            label: label,
            count: count,
            title: title
        });
    }

    return links;
}

