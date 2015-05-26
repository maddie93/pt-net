var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;

module.exports = pn.Transition.extend({
    initialize: function (options) {
        _.extend(this.events, pn.Transition.prototype.events);
        pn.Transition.prototype.initialize.call(this, options);
    },

    setActive: function () {
        if (!this.inactiveAttrs) {
            this._initializeInactiveParameters();
        }
        this._setColors('green', 'red');
    },

    _initializeInactiveParameters: function () {
        var attributes = this.get('attrs');
        this.inactiveAttrs = {
            fill: attributes['rect']['fill'],
            stroke: attributes['rect']['stroke']
        }
    },

    _setColors: function (fillColor, strokeColor) {
        attributes['rect']['fill'] = fillColor;
        attributes['rect']['stroke'] = strokeColor;
        this.unset('attrs', {silent: true});
        this.set('attrs', attributes);
    },

    setInactive: function () {
        if (this.inactiveAttrs) {
            this._setColors(inactiveAttrs.fill, inactiveAttrs.stroke);
        }
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
    }
});