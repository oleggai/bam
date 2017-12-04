var keystone = require('keystone');
var Types = keystone.Field.Types;
var log = require('../lib/log');

var Document = new keystone.List('Document', {
	nocreate: true,
	noedit: true,
	track: {
		updatedAt: true
	},
	defaultSort: '-createdAt',
	defaultColumns: 'name, title, isPrivate, isNDA, createdAt'
});

Document.add({
	name: { type: Types.Text, required: true, initial: true },
	label: { type: Types.Text, required: false },
	size: { type: Types.Number, required: true, default: 0 },
	url:  { type: Types.Text, required: false },
	path: { type: Types.Text, required: true },
	isPrivate: { type: Types.Boolean, required: false, index: true },
	isNDA: { type: Types.Boolean, required: false, index: true },
	createdAt: { type: Date, default: Date.now },

	asset: { type: Types.Relationship, ref: 'Asset', index: true },
	user: { type: Types.Relationship, ref: 'User', index: true }
});


Document.schema.pre('save', function(next) {
	this.wasNew = this.isNew;
	this.labelUpdated = !this.isNew && this.isModified() && this.isModified('label');
	next();
});

Document.schema.post('save', function(document) {
	var that = this;
	document.populate('asset', function(err, document) {

        if(err) {
            throw err;
        }

		if(document.asset === undefined) {
			return;
		}

		if (that.wasNew && !that.isPrivate && !that.isNDA) {
			log.audit('DOCUMENT_PUBLIC_NEW', {document: document});
		}
		if (that.labelUpdated && !that.isPrivate && !that.isNDA) {
			log.audit('DOCUMENT_PUBLIC_LABEL_UPDATE', {document: document});
		}
		if (that.wasNew && that.isPrivate && !that.isNDA) {
			log.audit('DOCUMENT_PRIVATE_NEW', {document: document});
		}
		if (that.labelUpdated && that.isPrivate && !that.isNDA) {
			log.audit('DOCUMENT_PRIVATE_LABEL_UPDATE', {document: document});
		}
		if (that.wasNew && that.isNDA) {
			log.audit('NDA_UNSIGNED_NEW', {document: document});
		}
	});
});

Document.schema.post('remove', function(document) {
	var that = this;
	document.populate('asset', function(err, document) {
		if (!that.isPrivate && !that.isNDA) {
			log.audit('DOCUMENT_PUBLIC_REMOVE', {document: document});
		}
		if (that.isPrivate && !that.isNDA) {
			log.audit('DOCUMENT_PRIVATE_REMOVE', {document: document});
		}
		if (that.isNDA) {
			log.audit('NDA_UNSIGNED_REMOVE', {document: document});
		}
	});
});

Document.register();
