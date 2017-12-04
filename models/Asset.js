var keystone = require('keystone');
var moment = require('moment');
var crypto = require('crypto');
var Types = keystone.Field.Types;
var mongoose = keystone.mongoose;
var log = require('../lib/log');
var numeral = require('numeral');

var Asset = new keystone.List('Asset', {
	nocreate: true,
	track: {
		updatedAt: true
	},
	defaultSort: '-updatedAt',
	defaultColumns: 'title, user, createdAt, notional, currency, customCurrency'
});

Asset.requiredFields = ["title", "assetClass", "currency", "instrumentType", "notional", "debtor", "registrationAgent", "fiduciaryAgent"];

Asset.add({
	title: { type: Types.Text, required: false, label: 'Title', initial: true, noedit: true },//required: true
	pitch: { type: Types.Textarea, required: false, label: 'Pitch', initial: true, index: true, noedit: true },
	assetClass: { type: Types.Select, options: [
		{ value: 'performing', label: 'Performing Fixed Income', extendedBy: 'maturity' },
		{ value: 'nonPerforming', label: 'Non-Performing Fixed Income', extendedBy: ['dateOfArrears', 'chapter11'] },
		{ value: 'other', label: 'Other', extendedBy: 'customAssetClass' }
	], required: false, label: 'Asset class', initial: true, index: true, noedit: true },//required: true
	customAssetClass: { type: Types.Text, initial: true, dependsOn: {assetClass: 'other'}, label: 'Custom Asset Class', noedit: true},
	currency: { type: Types.Select, options: [
		{ value: 'BRL', label: 'BRL', extendedBy: '' },
		{ value: 'USD', label: 'USD', extendedBy: '' },
		{ value: 'other', label: 'Other', extendedBy: 'customCurrency' }
	], required: false, initial: true, label: 'Currency', index: true, noedit: true },//required: true
	customCurrency: { type: Types.Text, dependsOn: {currency: 'other'}, initial: true, label: 'Custom Currency', noedit: true},
	instrumentType: { type: Types.Select, options: [
		{ value: 'CCB', label: 'CCB' },
		{ value: 'debenture', label: 'Debenture' },
		{ value: 'other', label: 'Other', extendedBy: 'customInstrumentType' }
	], required: false, label: 'Instrument Type', initial: true, index: true, noedit: true },//required: true
	customInstrumentType: { type: Types.Text, required: false, dependsOn: {instrumentType: 'other'}, initial: true, label: 'Custom Instrument Type', noedit: true},
	notional: {
		type: Types.Text,
		required: false,//required: true
		initial: true,
		label: 'Notional',
		noedit: true,
		get: function(value) {
			var currency = this.currency == 'other' || this.customCurrency ? this.customCurrency : this.currency;
			if (!currency) {
				currency = '';
			}
			var prefix = currency == 'USD' ? '$' : '';
			var suffix = currency == 'USD' ? '' : ' ' + currency;
			return prefix + numeral(value).format('0,0') + suffix;
		},
		set: function(value) {
			return parseInt(numeral(value).value(), 10) || 0;
		}
	},
	industryRisk: { type: Types.Select, options: [
		{ value: 'agriculture', label: 'Agriculture' },
		{ value: 'construction', label: 'Construction' },
		{ value: 'energy', label: 'Energy' },
		{ value: 'industrial', label: 'Industrial' },
		{ value: 'financial', label: 'Financial' },
		{ value: 'other', label: 'Other', extendedBy: 'customIndustryRisk' }
	], required: false, label: 'Sector', initial: true, index: true, noedit: true },//required: true
	customIndustryRisk: { type: Types.Text, required: false, dependsOn: {industryRisk: 'other'}, initial: true, label: 'Custom Sector', noedit: true},
	maturity: { type: Types.Text, required: false, dependsOn: {assetClass: 'performing'}, initial: true, label: 'Maturity', noedit: true},
	dateOfArrears: { type: Types.Date, required: false, dependsOn: {assetClass: 'nonPerforming'}, initial: true, label: 'Date Of Arrears', noedit: true},
	chapter11: {
		type: Types.Select,
		options: [{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}],
		required: false,
		dependsOn: {assetClass: 'nonPerforming'},
		initial: true,
		label: 'Chapter 11',
		noedit: true
	},
	contractualForum: { type: Types.Select, options: [
		{ value: 'SP', label: 'SP' },
		{ value: 'RJ', label: 'RJ' },
		{ value: 'NY', label: 'NY' },
		{ value: 'other', label: 'Other', extendedBy: 'customContractualForum' }
	], required: false, initial: true, label: 'Contractual Forum', noedit: true },
	customContractualForum: { type: Types.Text, required: false, initial: true, dependsOn: {contractualForum: 'other'}, label: 'Custom Contractual Forum', noedit: true},
	coupon: { type: Types.Text, required: false, initial: true, label: 'Coupon', noedit: true},
	debtor: { type: Types.Text, required: false, initial: true, label: 'Debtor', noedit: true},//required: true
	collateral: { type: Types.Select, options: [
		{ value: 'Yes', label: 'Yes', extendedBy: ['collateralType', 'collateralRegistration'] },
		{ value: 'No', label: 'No' }
	], required: false, initial: true, label: 'Collateral', noedit: true },//required: true
	collateralType: { type: Types.Select, options: [
		{ value: 'real estate', label: 'Real Estate' },
		{ value: 'plant and equipment', label: 'Plant and Equipment' },
		{ value: 'natural reserves', label: 'Natural Reserves' },
		{ value: 'marketable securities', label: 'Marketable Securities' },
		{ value: 'inventory', label: 'Inventory' },
		{ value: 'receivables', label: 'Receivables' }
	], required: false, dependsOn: {collateral: 'Yes'}, initial: true, label: 'Collateral Type', noedit: true },
	customCollateralType: { type: Types.Text, dependsOn: {collateralType: 'other'}, dependsOnRequired: true, required: false, initial: true, label: 'Custom Collateral Type', noedit: true},
	collateralRegistration: { type: Types.Select, options: [
		{ value: 'Yes', label: 'Yes' },
		{ value: 'No', label: 'No' }
	], dependsOn: {collateral: 'Yes'}, dependsOnRequired: false, initial: true, label: 'Collateral Registration', noedit: true, required: false },
	fiduciaryAgent: { type: Types.Text, required: false, initial: true, label: 'Fiduciary Agent', noedit: true},//required: true
	registrationAgent: { type: Types.Text, required: false, initial: true, label: 'Registration Agent', noedit: true},//required: true
	priceTerms: { type: Types.Select, options: [
		{ value: 'clean', label: 'Clean' },
		{ value: 'dirty', label: 'Dirty' },
		{ value: 'swap', label: 'Swap' }
	], required: false, initial: true, label: 'Price Terms', noedit: true },
	negotiationTerms: { type: Types.Select, options: [
		{ value: 'online', label: 'Accept Offers' },
		{ value: 'offline', label: 'Only offline' }
	], required: false, initial: true, label: 'Negotiation Terms', noedit: true },
	preferredBuyers: { type: Types.Textarea, required: false, initial: true, label: 'Expected Preferred Buyers', noedit: true},
	similarDeals: { type: Types.Textarea, required: false, initial: true, label: 'Research Link by Asset Owner', noedit: true},
	researchBAMLink: { type: Types.Textarea, required: false, initial: true, label: 'Research Link by BAM'},
	askingPrice: {
		type: Types.Number,
		required: false,
		initial: true,
		label: 'Asking price',
		noedit: true
	},
	publishedPrice: {
		type: Types.Number,
		required: false,
		initial: true,
		label: 'Published price',
		noedit: true
	},
	minOffer: { type: Types.Number, required: false, default: 0, initial: true, label: 'Min Offer', noedit: true},
	createdAt: { type: Date, default: Date.now, noedit: true },
	updatedAt: { type: Date, default: Date.now, noedit: true },
	bamRank: { type: Types.Number, required: false, label: 'BAM Rank'},
	failed: { type: Types.Boolean, default: false, label: 'Failed to Communicate', noedit: true },
	failedPrice: {
		type: Types.Number,
		required: false,
		initial: true,
		label: 'Published price',
		noedit: true
	},
	notified: { type: Types.Boolean, default: false, noedit: true, hidden: true },
	privacy: { type: Types.Text, noedit: true, hidden: true, get: function(value) {
		return (value || '').split(',');
	} },
	
	user: { type: Types.Relationship, ref: 'User', index: true, label: 'Asset Owner', noedit: true }
}, 'Restrictions', {
	isActiveByUser: { type: Boolean, default: false, label: 'Is active By User', index: true, noedit: true },
	isActiveByBAM: { type: Boolean, default: true, label: 'Is active By BAM Admin', index: true }
});

Asset.schema.virtual('isActive').get(function() {
	return this.isActiveByUser && this.isActiveByBAM;
});

Asset.schema.virtual('successfullPrices').get(function() {
	return this.prices.filter(function(price) {
		return price.successfull;
	});
});

var AssetUserRanks = new mongoose.Schema({
	createdAt : {
		type : Types.Date,
		default : Date.now
	},
	updatedAt : {
		type : Types.Date,
		default : Date.now
	},
	value : {
		type : Types.Number,
		index: true,
		initial: true
	},
	user : {
		type : keystone.mongoose.Schema.Types.ObjectId
	}
});

var AssetPrices = new mongoose.Schema({
	createdAt : {
		type : Types.Date,
		default : Date.now
	},
	updatedAt : {
		type : Types.Date,
		default : Date.now
	},
	value : {
		type: Types.Number
	},
	user : {
		type : keystone.mongoose.Schema.Types.ObjectId
	},
	acknowledged: {
		type: Types.Boolean,
		default: false
	},
	published: {
		type: Types.Boolean,
		default: false
	},
	successfull: {
		type: Types.Boolean
	}
});

var Nicknames = new mongoose.Schema({
	ownerNickname : {
		type: 'string'
	},
	otherNickname : {
		type: 'string'
	},
	otherUser : {
		type : keystone.mongoose.Schema.Types.ObjectId
	}
});

Asset.schema.add({
	userRanks: [AssetUserRanks],
	prices: [AssetPrices],
	nicknames: [Nicknames]
});

Asset.relationship({ ref: 'Document', path: 'document', refPath: 'asset' });
Asset.relationship({ ref: 'Nda', path: 'nda', refPath: 'asset' });

Asset.schema.pre('validate', function(next) {
	if (this.askingPrice && (this.askingPrice < 1 /*|| this.askingPrice > 100*/)) {
		next(Error('Asking price should be greater than 1'));
	}
	else {
		next();
	}
});

Asset.schema.pre('validate', function(next) {
	if (this.minOffer && (this.minOffer < 1 || this.minOffer > 100)) {
		next(Error('Min offer should be between 1 and 100'));
	}
	else {
		next();
	}
});

Asset.schema.pre('save', function(next) {
	this.wasNew = this.isNew;
	this.modified = !this.isNew &&
		this.isModified() &&
		!this.isModified('isActiveByBAM') &&
		!this.isModified('isActiveByUser') &&
		!this.isModified('failed') &&
		!this.isModified('prices') &&
		!this.isModified('nicknames') &&
		!this.isModified('userRanks') &&
		!this.isModified('bamRank');
	this.activatedByUser = !this.new && this.isModified('isActiveByUser') && this.isActiveByUser;
	this.activatedByBAM = !this.new && this.isModified('isActiveByBAM') && this.isActiveByBAM;
	this.deactivatedByUser = !this.new && this.isModified('isActiveByUser') && !this.isActiveByUser;
	this.deactivatedByBAM = !this.new && this.isModified('isActiveByBAM') && !this.isActiveByBAM;
	this.rankedByBAM = !this.new && this.isModified('bamRank');
	next();
});

Asset.schema.post('save', function(asset) {
	var that = this;
	asset.populate('user', function(err, asset) {
		if (that.wasNew) {
			log.audit('ASSET_NEW', {asset: asset});
		}
		if (that.modified) {
			log.audit('ASSET_EDIT', {asset: asset});
		}
		if (that.activatedByUser) {
			log.audit('ASSET_ACTIVATION_USER', {asset: asset});
		}
		if (that.activatedByBAM) {
			log.audit('ASSET_ACTIVATION_BAM', {asset: asset});
		}
		if (that.deactivatedByUser) {
			log.audit('ASSET_DEACTIVATION_USER', {asset: asset});
		}
		if (that.deactivatedByBAM) {
			log.audit('ASSET_DEACTIVATION_BAM', {asset: asset});
			new keystone.Email('asset-deactivation').send({
				to: asset.user.email,
				subject: 'BAM: Administrator has deactivated your asset',
				asset: asset
			});
		}
		if (that.rankedByBAM) {
			log.audit('ASSET_RANK_BAM', {asset: asset, rank: asset.bamRank});
		}
	});
});

Asset.schema.post('remove', function(asset) {
	log.audit('ASSET_DELETE', {asset: asset});
});

Asset.schema.methods.userPrices = function(user) {
	return this.prices.filter(function(item) {
		return item.user == user.id && item.successfull;
	});
};

Asset.schema.methods.userLastPrice = function(user) {
	var prices = this.userPrices(user);
	return prices.length > 0 ? prices[prices.length - 1] : false;
};

Asset.schema.methods.userTodayPrices = function(user) {
	var now = new Date();
	return this.prices.filter(function(price) {
		return price.user == user.id && moment(now).isSame(price.createdAt, 'day'); 
	});
};


Asset.schema.methods.sendMessage = function (asset, messageParameters, callback) {
	var Message = keystone.list('Message');
	var dateformat = require('dateformat');
	var toSeller = messageParameters.toSeller;
	
	var message = new Message.model();
	message.asset = asset.id;
	message.sender = messageParameters.sender.id;
	message.receiver = messageParameters.receiver;
	message.text = messageParameters.text;
	message.save(function(err) {
		if (err) {
			callback({error: err}) ;
		}
		else {
			Message.model.update({
				sender: message.receiver,
				receiver: message.sender,
				reply: null
			}, {$set: {reply: message.id}}, {multi: true}, function(err) {
				if (err) {
					callback({error: err});
				}
				else {
					Message.model.findOne({
						_id: message.id
					}).populate('asset sender receiver').exec(function(err, message) {
						if (err) {
							callback({error: err});
						}
						else {
							log.audit('MESSAGE_SENT', {message: message});
							var nicknames = asset.assetNicknames(toSeller ? message.sender : message.receiver);
							var sender = toSeller ? nicknames.otherNickname : nicknames.ownerNickname;
							var receiver = toSeller ? nicknames.ownerNickname : nicknames.otherNickname;

							callback({
								id: message.id,
								asset: message.asset.id,
								sender: 'Me',
								receiver: receiver,
								text: message.text,
								createdAt: dateformat(message.createdAt, 'UTC:mm/dd/yyyy HH:MM') + ' GMT'
							});
							
							new keystone.Email('message-notification').send({
								to: message.receiver.email,
								subject: 'BAM: ' + sender + ' has sent you a new message regarding ' + message.asset.title,
								message: message,
								sender: sender
							});
						}
					});
				}
			});
		}
	});
}

Asset.schema.methods.assetNicknames = function(user) {
	var asset = this;
	var randomNumber = function() {
		var min = 1000, max = 9999;
		return min + Math.floor((max - min + 1) * Math.random());		
	};
	var generateSellerNickname = function() {
		if (asset.nicknames.length > 0) {
			return asset.nicknames[0].ownerNickname; 
		}
		return 'Seller' + randomNumber();
	};
	var generateBuyerNickname = function() {
		var exists = true;
		var candidate = '';
		while (exists) {
			candidate = 'Buyer' + randomNumber();
			exists = (function(name) {
				return asset.nicknames.find(function(item) {
					return asset.otherNickname == name;
				}); 
			})(candidate);
		}
		return candidate;
	};
	var item = asset.nicknames.find(function(item) {
		if (user instanceof mongoose.Types.ObjectId) {
			return item.otherUser == user.toString();
		}
		return item.otherUser == user.id;
	});
	if (!item) {
		item = {
			ownerNickname: generateSellerNickname(),
			otherNickname: generateBuyerNickname(),
			otherUser: user
		};
		asset.nicknames.push(item);
		asset.save();
	}
	return item;
};

Asset.schema.methods.timesAddedToFavorites = function(next) {
	var User = keystone.list('User');
	User.model.find({favoriteAssets: this.id}).exec(function(err, users) {
		next(users.length || 0);
	});
};

Asset.schema.methods.totalVisits = function(next) {
	var asset = this;
	var User = keystone.list('User');
	User.model.find({'assetVisits.asset': asset.id}).exec(function(err, users) {
		var total = 0;
		users.forEach(function(user) {
			total += user.assetVisits.filter(function(visit) {
				return visit.asset.toString() == asset.id; 
			}).map(function(visit) {
				return visit.count;
			}).reduce(function(a, b) {
				return a + b;
			}, 0);
		});
		next(total);
	});
};

Asset.schema.methods.accessible = function(field, user, approved) {
	var isUserAdmin = user.isAdmin;
	var isUserOwner = this.user.toString() == user.id;
	var isUserNDA = approved;
	var isFieldPublic = this.privacy.indexOf(field) == -1;

	if(field == 'minOffer') {
		return isUserOwner;
	}
	return isUserAdmin || isUserOwner || isUserNDA || isFieldPublic;
};

Asset.schema.methods.isPublic = function(field) {
	return this.privacy.indexOf(field) == -1;
};

Asset.register();
