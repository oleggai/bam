var keystone = require('keystone'),
	Broker = keystone.list('Broker'),
	async = require('async');

exports = module.exports = function(req, res) {

	// delete cache for all browsers
	res = keystone.response.nocache(res);

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'broker';
	locals.filters = {
		id: req.params.id
	};

	async.series([
		function(next) {
			Broker.model.findById(locals.filters.id)
				.remove(function(err) {
					if (err) {
						next(true);
					} else {
						next();
					}
				});
		}
	], function(err) {
		var rtn;
		if (err) {
			rtn = {success: false, message: res.__('Some error occurred when trying to delete your broker.')};
		} else {
			rtn = {success: true, message: res.__('Broker has been deleted.')};
		}
		res.json(rtn);
	});
};
