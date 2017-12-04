var _ = require('underscore');
var keystone = require('keystone');
var async = require('async');

var notification = require(__base + 'lib/Notification');

exports.initLocals = function(req, res, next) {

    var locals = res.locals;
    locals.totalNotifications = 0;

    async.parallel([
        function(callback) {

            if (req.user) {


                locals.navLinks = [
                    { label: 'Marketplace', key: 'marketplace', href: '/marketplace' },
                    { label: 'How It Works', key: 'how-it-works', subLinks: [
                        {label: 'How It Works', key: 'how-it-works', href: '/how-it-works'},
                        {label: 'FAQ', key: 'faq', href: '/faq'},
                    ] },
                    { label: 'Company', key: 'who-we-are', class: '', subLinks: [
                        {label: 'About Us', key: 'profile', href: '/who-we-are'},
                        {label: 'Liquidity', key: 'my-assets', href: '/liquidity'},
                        {label: 'Legal', key: 'legal', href: '/legal'},
                    ] },
                    { label: 'Contact',		key: 'contact',		href: '/contact' },
                ];

                locals.navProfileLinks = [
                    { label: req.user.name.first, key: 'log-in', class: 'profile main-menu-log-in user-first-name', subLinks: [
                        {label: 'Profile', key: 'profile', class: 'profile', href: '/profile'},
                        {label: 'My Assets', key: 'my-assets', class: 'my-assets', href: '/my-assets'},
                        {label: 'My Messages', key: 'messages', class: 'my-messages', href: '/messages'},
                        {label: 'Logout', key: 'log-out', class: 'log-out main-menu-sign-in', href: keystone.get('signout url') }
                    ] },
                ];
            } else {

                locals.navLinks = [
                    { label: 'How It Works', key: 'how-it-works', subLinks: [
                        {label: 'How It Works', key: 'how-it-works', href: '/how-it-works'},
                        {label: 'FAQ', key: 'faq', href: '/faq'},
                    ] },
                    { label: 'Company', key: 'who-we-are', class: '', subLinks: [
                        {label: 'About Us', key: 'profile', href: '/who-we-are'},
                        {label: 'Liquidity', key: 'my-assets', href: '/liquidity'},
                        {label: 'Legal', key: 'legal', href: '/legal'},
                    ] },
                    { label: 'Contact',		key: 'contact',		href: '/contact' },
                ];

                locals.navProfileLinks = [
                    { label: 'Login', key: 'log-in', class: 'main-menu-log-in', href: '/login' },
                    { label: 'Sign up', key: 'register', class: 'main-menu-sign-in', href: '/register' }
                ];
            }

            locals.user = req.user;
            callback(null);
        },
		function (callback) {
            if(req.user) {
                req.user.totalUnreadMessages(function(count) {
                    locals.totalUnreadMessages = count;
                    locals.totalNotifications += count;
					callback(null);
                });
            }
            else {
				callback(null);
			}
        },
		function(callback) {
            if(req.user) {
                notification.find(req.user, function(links) {
                    locals.notificationLinks = links;

                    for(var i = 0; i < links.length; ++i) {
                        locals.totalNotifications += links[i].count;
					}
					callback(null);
                });
            }
            else {
				callback(null);
			}
		}
	], function(err, results) {
    	next(err);
	});
};


/**
 Inits the error handler functions into `res`
 */
exports.initErrorHandlers = function(req, res, next) {

	res.err = function(err, title, message) {
		res.status(500).render('errors/500', {
			err: err,
			errorTitle: title,
			errorMsg: message
		});
	};

	res.notfound = function(title, message) {
		res.status(404).render('errors/404', {
			errorTitle: title,
			errorMsg: message
		});
	};

	next();
};

/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {
	
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};
	
	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length; }) ? flashMessages : false;
	
	next();
	
};


/**
	Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function(req, res, next) {
	if (!req.user) {
		req.session.redirectUrl = req.url;
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/login');
	} else {
		next();
	}
};

exports.requireFullUser = function(req, res, next) {
	if (!req.user) {
		req.session.redirectUrl = req.url;
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/login');
	}
	else if (!req.user.canAccessMarketplace) {
		req.session.redirectUrl = req.url;
		req.flash('error', 'Please fill your profile first.');
		res.redirect('/profile/edit');
	}
	else {
		next();
	}
};

exports.requireAdmin = function(req, res, next) {
	if (!req.user || !req.user.isAdmin) {
		req.flash('error', 'Please sign in as administrator to access this page.');
		res.redirect('/login');
	}
	else {
		next();
	}
};

exports.ndaFiles = function(req, res, next) {
	req.params.nda = true;
	
	next();
};

/**
 Prevents people from accessing pages when they're signed in
 */

exports.requireAnonymous = function(req, res, next) {

	if (req.user) {
		res.redirect('/');
	} else {
		next();
	}

};
