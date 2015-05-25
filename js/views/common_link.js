var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;

module.exports = pn.Link.extend({
    initialize: function (options) {
        _.extend(this.events, pn.Link.prototype.events);
        pn.Link.prototype.initialize.call(this, options);
    },

    setCount: function (count) {
        this._setLabelValue(count);
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