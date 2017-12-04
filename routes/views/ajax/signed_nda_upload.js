var keystone = require('keystone');
var User = keystone.list('User');
var Nda = keystone.list('Nda');
var _ = require('lodash');
var fs = require('fs-extra');

var notification = require(__base + 'lib/Notification');

exports = module.exports = function (req, res, next) {
	if (!_.isEmpty(req.files) && !_.isEmpty(req.files['signed-nda[]'] && req.params.id) ) {
		var file = req.files['signed-nda[]'];
		var tmp_path = file.path;
		var target_path = './uploads/files/signed-nda/' + file.name;
		try {
			fs.copy(tmp_path, target_path, function () {
				fs.unlink(tmp_path, function() {
					var newDocument = new Nda.model();
					newDocument.name = file.originalname;
					newDocument.size = file.size;
					newDocument.path = target_path;
					newDocument.user = req.user.id;
					newDocument.asset = req.params.id;
					newDocument.save(function (err, doc) {
						doc.populate('asset', function(err, doc) {
							doc.asset.populate('user', function(err, asset) {
								new keystone.Email('signed-nda-upload-notification').send({
									to: asset.user.email,
									subject: 'BAM: Signed NDA was added to asset ' + asset.title,
									asset: asset,
									sender: req.user,
									receiver: asset.user,
									link: {
										asset: '/asset/view/' + asset.id,
										nda: '/nda/show/' + doc.id
									}
								});

								notification.create(asset, notification.types.TYPE_NDA);

								res.status(200).json({
									files: [{
										name: file.originalname,
										size: file.size,
										url: '/nda/show/' + doc.id,
										docId: '' + doc.id,
										deleteUrl: '/nda/delete/' + doc.id,
										deleteType: 'DELETE'
									}]
								});								
							});
						});
					});					
				});
			});
		}
		catch (err) {
			res.status(500).json({
				files: [{
					name: file.name,
					label: req.body.document_label,
					size: file.size,
					error: e.message
				}]
			});
		}
	}
	else {
		next();
	}
};
