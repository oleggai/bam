var config = require('./config.json');	
var nodeMailer = require('nodemailer');
var i18n = require('i18n');
var dateformat = require('dateformat');
var numeral = require('numeral');
var html = require('./lib/html');
var sass = require('node-sass');
var fs = require('fs');
var cron = require('cron');
var async = require('async');
var path = require('path');
var linkify = require('html-linkify');
var requestContext = require('request-context');

global.__base  = __dirname + '/';

process.env.CLOUDINARY_URL = config.cloudinaryUrl;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

config.contactEmail = config.contactEmail || 'contact@bam.com';

var keystone = require('keystone');
var swig = require('swig');

swig.setDefaults({
	cache: false,
	locals: {
		dateformat: dateformat,
		baseUrl: config.baseUrl,
		contactEmail: config.contactEmail,
		numeral: numeral,
		html: html,
		linkify: linkify,
		ga: config.ga
	}
});

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.
keystone.init({
	'env': process.env.env,
	'name': 'BAM',
	'brand': 'BAM',
	'mongo': config.mongoUri || "mongodb://localhost/fmm",
	
	'marketplace items per page': 8,
	
	'sass': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'swig',
	
	'custom engine': swig.renderFile,
	
	'emails': 'templates/emails',
	'email transport': 'nodemailer',

	'cookie secret': config.cookieSecret,
	'cookie signin expire': 2629746000,
	
	'mandrill api key': config.mandrillApiKey,
	
	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'signin redirect': function(user, req, res) {
		if (user.canAccessKeystone) {
			return res.redirect('/keystone');
		}
		if (user.canAccessMarketplace) {
			return res.redirect('/');
		} else {
			return res.redirect('/profile/edit');
		}
	},
	'signout redirect': '/',
	'signout url': '/logout'
});

// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: require('underscore'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes

keystone.set('routes', require('./routes'));
keystone.set('recaptcha', { 
	siteKey:   config.recaptcha_site_key, 
	secretKey: config.recaptcha_secret_key
});

i18n.configure({
	locales:['en'],
	directory: __dirname + '/locales'
});

keystone.set('email from', {
	name: 'BAM',
	email: config.contactEmail
});

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

keystone.set('email locals', {
	logo_src: '/images/logo-email.gif',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	}
});

keystone.set('nav', {
	'users': 'users',
	'invites': 'invites',
	'assets': 'assets',
	'error-log': 'error-log',
	'audit-log': 'audit-log',
	'user-report': [{
		key: 'user-report',
		label: 'User Report',
		path: '/report/user'
	}],
	'asset-report': [{
		key: 'asset-report',
		label: 'Asset Report',
		path: '/report/asset'
	}],
	'contact-form-submissions': 'contact-form-submissions'
});

keystone.transporter = nodeMailer.createTransport(config.mailer);
// Rewrite standart Session lib
keystone.session = require('./lib/keystone/session');
// Rewrite standart Email lib
keystone.Email = require('./lib/keystone/email');
keystone.response = require('./lib/response');

keystone.app.get('/keystone/styles/keystone.min.css', function(req, res) {
	sass.render({file: './admin/public/styles/style.scss'}, function(err, result) {
		var output = './admin/public/styles/style.css';
		fs.writeFile(output, result.css, function() {
			res.sendFile(path.join(__dirname, output));
		});
	});
});

keystone.app.get('/keystone/js/common/ui.js', function(req, res) {
	var files = [
		'./node_modules/keystone/admin/public/js/common/ui.js',
		'./admin/public/js/linkify.js',
		'./admin/public/js/ui-custom.js'
	];
	var content = '';
	async.each(files, function(file, next) {
		fs.readFile(file, function(err, data) {
			content += data;
			next();
		});
	}, function() {
		res.set('Content-Type', 'application/javascript');
		res.send(content);
	});
});

keystone.app.use(requestContext.middleware('current'));
keystone.app.use(function(req, res, next) {
	requestContext.set('current:req', req);
	requestContext.set('current:res', res);
	next();
});

config.cron = config.cron || {};
keystone.jobs = {
	messageReminder: new cron.CronJob(config.cron.messageReminder || '0 0 * * *', require('./jobs/MessageReminder'), null, true),
	assetFailedMarker: new cron.CronJob(config.cron.assetFailedMarker || '0,30 * * * *', require('./jobs/AssetFailedMarker'), null, true),
	assetPreferred: new cron.CronJob(config.cron.assetPreferred || '*/10 * * * *', require('./jobs/AssetPreferred'), null, true)
};

// Start Keystone to connect to your database and initialise the web server
if (!keystone.get('do not start')) {
	keystone.start();
}
