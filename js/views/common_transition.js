var V = require('vectorizer').V;
var joint = require('jointjs');
var pn = joint.shapes.pn;

module.exports = pn.Transition.extend({
    initialize: function (options) {
        _.extend(this.events, pn.Transition.prototype.events);
        pn.Transition.prototype.initialize.call(this, options);
    },

    select: function () {
        if (!this.preselectedAttrs) {
            this._initializePreselectedParameters();
        }
        this._setColors('blue', 'yellow');
    },

    _initializePreselectedParameters: function () {
        this._copyAttributesTo('preselectedAttrs');
    },

    _copyAttributesTo: function (attributesName) {
        var attributes = this.get('attrs');
        this[attributesName] = {
            fill: attributes['rect']['fill'],
            stroke: attributes['rect']['stroke'],
        }
    },

    _setColors: function (fillColor, strokeColor) {
        var attributes = this.get('attrs');
        attributes['rect']['fill'] = fillColor;
        attributes['rect']['stroke'] = strokeColor;
        this.unset('attrs', {silent: true});
        this.set('attrs', attributes);
    },

    deselect: function () {
        if (this.preselectedAttrs) {
            this._setColors(this.preselectedAttrs.fill, this.preselectedAttrs.stroke);
        }
    },

    setActive: function () {
        if (!this.inactiveAttrs) {
            this._initializeInactiveParameters();
        }
        this._setColors('green', 'red');
    },

    _initializeInactiveParameters: function () {
        this._copyAttributesTo('inactiveAttrs');
    },

    setInactive: function () {
        if (this.inactiveAttrs) {
            this._setColors(this.inactiveAttrs.fill, this.inactiveAttrs.stroke);
        }
    },

    clear: function () {
        this.deselect();
        this.setInactive();
    },

    getLabel: function () {
        var attributes, label;
        attributes = this.get('attrs');
        label = attributes['.label'].text;
        return label;
    },

    getLabelWithoutPriority: function () {
        var label, labelWithoutPriority;
        label = this.getLabel();
        labelWithoutPriority = this._extractTitleFromLabel(label);

        return labelWithoutPriority;
    },

    _extractTitleFromLabel: function (label) {
        var title = label.match(/.*(?=\/)/);
        return title || label;
    },

    setLabel: function (val) {
        var priority = this.getPriority();
        var newLabelWithPriority = val + '/' + priority;
        this.setLabelValue(newLabelWithPriority);
    },

    setLabelValue: function (val) {
        var attributes = this.get('attrs');
        attributes['.label'].text = val;
        this.unset('attrs');
        this.set('attrs', attributes);
    },

    getPriority: function () {
        return this.get('attrs')['priority'];
    },

    setPriority: function (priority) {
        var labelWithoutPriority;

        var attributes = this.get('attrs');
        attributes['priority'] = priority;
        this.unset('attrs');
        this.set('attrs', attributes);

        labelWithoutPriority = this.getLabelWithoutPriority();
        this.setLabel(labelWithoutPriority);
    }
});