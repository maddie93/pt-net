var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;

module.exports = pn.Link.extend({
    initialize: function (options) {
        _.extend(this.events, pn.Link.prototype.events);
        pn.Link.prototype.initialize.call(this, options);
        this.on('remove', this.handleRemove);
    },

    setSourceCount: function (count) {
        this._setLabelValue(0, count);
    },

    getSourceCount: function () {
        return this._getLabelValue(0);
    },

    setDestinationCount: function (count) {
        this._setLabelValue(1, count);
    },

    getDestinationCount: function () {
        return this._getLabelValue(1);
    },

    _setLabelValue: function(index, value) {
        var labels = this.get('labels');
        var label = labels[index];
        label.attrs.text.text = value;
        this.unset('labels', {silent: true});
        this.set('labels', labels);
    },

    _getLabelValue: function (index) {
        var labels = this.get('labels');
        return labels[index].attrs.text.text;
    }
});