var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;

module.exports = pn.Place.extend({
    initialize: function (options) {
        _.extend(this.events, pn.Place.prototype.events);
        pn.Place.prototype.initialize.call(this, options);
    },

    getLabel: function () {
        var attributes = this.get('attrs');
        return attributes['.label'].text;
    },

    setLabel: function (val) {
        var attributes = this.get('attrs');
        attributes['.label'].text = val;
        this.unset('attrs');
        this.set('attrs', attributes);
    },

    getTokens: function () {
        return this.get('tokens');
    },

    setTokens: function (value) {
        return this.set('tokens', value);
    },

    addTokens: function (count) {
        this.setTokens(this.getTokens() + count);
    },

    subtractTokens: function (count) {
        this.addTokens(-count);
    },

    getCount: function () {
        return parseInt(this._getLabelValue());
    },

    _setLabelValue: function(value) {
        this.label(0, {
            position: 0.5,
            attrs: {
                text: {text: value}
            }
        });
    },

    _getLabelValue: function () {
        var labels = this.get('labels');
        return labels[0].attrs.text.text;
    }
});