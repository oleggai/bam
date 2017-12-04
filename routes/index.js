/**
 * This file is where you define your application routes and controllers.
 * 
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 * 
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 * 
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 * 
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 * 
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone');
var middleware = require('./middleware');
var i18n = require("i18n");
var importRoutes = keystone.importer(__dirname);

// Add-in i18n support
keystone.pre('routes', i18n.init);

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers);
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

keystone.set('404', require('../lib/log').error404);
keystone.set('500', require('../lib/log').error500);

// Import Route Controllers
var routes = {
	views: importRoutes('./views'),
	profile: importRoutes('./views/profile'),
	asset: importRoutes('./views/asset'),
	message: importRoutes('./views/message'),
	ajax: importRoutes('./views/ajax'),
	reports: importRoutes('../admin/views/reports'),
	report_user: importRoutes('../admin/views/reports/user'),
	report_asset: importRoutes('../admin/views/reports/asset')
};

// Setup Route Bindings
exports = module.exports = function(app) {	
	
	// Views
	app.get('/', routes.views.index);
	app.get('/why-we', routes.views.why_we);
	app.get('/how-it-works', routes.views.how_it_works);
	app.get('/legal', routes.views.legal);
	app.get('/liquidity', routes.views.liquidity);
	app.get('/who-we-are', routes.views.who_we_are);
	app.get('/terms-and-conditions', routes.views.terms_and_conditions);
	app.get('/confidentiality', routes.views.confidentiality);
	app.get('/marketplace', middleware.requireFullUser, routes.views.marketplace);
	app.get('/faq', routes.views.faq);
	app.all('/contact', routes.views.contact);
	app.get('/confirmation/code/:code', routes.views.confirmation);
	app.all('/reset-password/request', routes.views.reset_password.step1);
	app.all('/reset-password/process/:code', routes.views.reset_password.step2);
	
	// user need to be logged in
	app.all('/broker/remove/:id', middleware.requireFullUser, routes.views.profile.broker);

	app.get('/my-assets', middleware.requireFullUser, routes.asset.my_assets);
	app.all('/asset/new', middleware.requireFullUser, routes.asset.asset_edit);
	app.all('/asset/view/:id', middleware.requireFullUser, routes.asset.asset_view);
	app.all('/asset/edit/:id', middleware.requireFullUser, routes.asset.asset_edit);

	app.all('/profile', middleware.requireUser, routes.profile.profile);
	app.all('/profile/edit', middleware.requireUser, routes.profile.profile_edit);

	app.all('/messages', middleware.requireFullUser, routes.message.messages);
	app.all('/messages/send', middleware.requireFullUser, routes.message.send);
	app.all('/messages/send-to-buyer', middleware.requireFullUser, routes.message.send_to_buyer);
	app.post('/messages/flag', middleware.requireFullUser, routes.message.flag);
	app.all('/messages/:asset_id', middleware.requireFullUser, routes.message.messages);
	app.all('/messages/:asset_id/:receiver', middleware.requireFullUser, routes.message.messages);

	app.all('/file-upload/public-docs', middleware.requireFullUser, routes.ajax.file_upload);
	app.all('/file-upload/docs/asset/:asset_id', middleware.requireFullUser, routes.ajax.file_upload);
	app.all('/asset/:id/signed-nda-upload', middleware.requireFullUser, routes.ajax.signed_nda_upload);
	app.all('/file/delete/:id', middleware.requireFullUser, routes.ajax.file_delete);
	app.all('/file/change_label/:id', middleware.requireFullUser, routes.ajax.file_change_label);
	app.all('/file/show/:id', middleware.requireFullUser, routes.ajax.file_show);
	app.all('/nda/show/:id', middleware.ndaFiles, routes.ajax.file_show);	
	app.all('/nda/delete/:id', middleware.ndaFiles, routes.ajax.file_delete);
	app.all('/asset/:asset_id/nda/:request_id/:resolution', middleware.requireFullUser, routes.ajax.nda_request);
	app.all('/asset/update_user_rank', middleware.requireFullUser, routes.ajax.user_rank);
	app.all('/asset/update_bam_rank', middleware.requireFullUser, routes.ajax.bam_rank);
	app.post('/asset/bid', middleware.requireFullUser, routes.asset.bid);
	app.post('/price/acknowledge', middleware.requireFullUser, routes.asset.acknowledge);
	app.post('/price/publish', middleware.requireFullUser, routes.asset.publish);
	app.all('/asset/prices/:id', middleware.requireFullUser, routes.asset.prices);
	app.post('/asset/share', middleware.requireFullUser, routes.asset.share);
	app.post('/asset/favorite', middleware.requireFullUser, routes.asset.favorite);

	app.all('/report/user', middleware.requireAdmin, routes.reports.user);
	app.all('/report/asset', middleware.requireAdmin, routes.reports.asset);
	app.all('/report/user/:id/visited-assets', middleware.requireAdmin, routes.report_user.visited_assets);
	app.all('/report/user/:id/communications', middleware.requireAdmin, routes.report_user.communications);
	app.all('/report/asset/:id/bids', middleware.requireAdmin, routes.report_asset.bids);
	app.all('/report/asset/:id/favorite-users', middleware.requireAdmin, routes.report_asset.favorite_users);
	app.all('/report/asset/:id/user-ranks', middleware.requireAdmin, routes.report_asset.user_ranks);
	app.all('/report/asset/:id/visited-by', middleware.requireAdmin, routes.report_asset.visited_by);
	app.all('/send-invites', middleware.requireAdmin, routes.reports.invite);
	app.all('/update-asset-bam-ranks', middleware.requireAdmin, routes.asset.assets_ranks_edit);
	
	app.all('/login', middleware.requireAnonymous, routes.views.login);
	app.all('/register', middleware.requireAnonymous, routes.views.register);
	app.all('/register/:key', middleware.requireAnonymous, routes.views.register);
	app.all('/logout', middleware.requireUser, routes.views.logout);

    app.post('/notification/delete', middleware.requireUser, routes.ajax.notification_delete);

	app.get('/admin', function(req, res) {
		res.redirect('/keystone');
	});

};
