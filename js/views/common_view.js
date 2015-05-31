var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = require('./common_petrigraph');
var pn = joint.shapes.pn;
var Link = require('./common_link');
var Place = require('./common_place');
var Transition = require('./common_transition');

module.exports = joint.dia.Paper.extend({
    initialize: function (options) {
        _.bindAll(this, 'addTransition', 'addPlace', 'addLink', 'markActiveTransitions', 'clearActiveMarkers', 'nextStep', 'clearGraph', '_simulate', '_sendToken');
        this.model = new Graph({transitions: []});
        this._configure(options);
        joint.dia.Paper.prototype.initialize.call(this, options);

        this.model.on('change:source change:target', this._changeLink, this);
    },

    addPlace: function (x, y, text, tokens) {
        var place = new Place({position: {x: x, y: y}, attrs: {'.label': {text: text}}, tokens: tokens});
        this.model.addCell(place);
        return place;
    },

    addTransition: function (x, y, text) {
        var transition = new Transition({position: {x: x, y: y}, attrs: {'.label': {text: text}}});
        this.model.addCell(transition);
        this.model.get('transitions').push(transition);
        return transition;
    },

    addLink: function (src, dst, label) {
        label = label != undefined ? label : '1';

        src = this._prepareIfEndpointIsNode(src);
        dst = this._prepareIfEndpointIsNode(dst);

        var link = new Link({
            source: src,
            target: dst
        });

        link.setCount(label);
        this.model.addCell(link);
        return link;
    },

    selectTransition: function (transition) {
        this.model.selectTransition(transition);
    },

    clearSelection: function (event) {
        if (event.target.nodeName === 'svg') {
            this.model.clearSelection();
        }
    },

    _prepareIfEndpointIsNode: function (endpoint) {
        if (endpoint['id']) {
            endpoint = {id: endpoint.id, selector: '.root'};
        }
        return endpoint;
    },

    clearGraph: function () {
        this.model.clear();
    },

    nextStep: function () {
        this.startSimulation(1);
    },

    startSimulation: function (count) {
        var simulationId = this.model.get('simulationId');
        if (!simulationId) {
            this._simulate(count, 2000);
        }
    },

    _simulate: function (count) {
        count > 0 && this.model.fireSelectedTransition(this._sendToken);

        var simId = setInterval(function () {
            if (--count) {
                this.model.fireSelectedTransition(this._sendToken)
            } else {
                clearInterval(simId);
            }
        }.bind(this), 2 * 2000);
    },

    _sendToken: function (link, callback) {
        this.findViewByModel(link).sendToken(V('circle', {
            r: 5,
            fill: 'red'
        }).node, 1 * 1000, callback);
    },

    markActiveTransitions: function () {
        var transitions = this.model.get('transitions'),
            activeTransitions = [];

        this.clearActiveMarkers();

        _.each(transitions, function (t) {
            if (this.model._isFireable(t)) {
                t.setActive();
                activeTransitions.push(t);
            }

        }, this);
        this.model.set('activeTransitions', activeTransitions);
    },

    clearActiveMarkers: function () {
        _.each(this.model.get('activeTransitions'), function (activeTransition) {
            activeTransition.clear();
        });
    },

    _changeLink: function (link) {
        var changed = link.changed,
            previousAttributes = link._previousAttributes,
            shouldProhibitChange,
            otherType,
            otherCell,
            other,
            changedCell,
            changedType,
            unchangedEnd,
            changedEnd;

        if (!link['prevCords']) {
            link.prevCords = {source: previousAttributes.source, target: previousAttributes.target};
        }

        if (changed['source'] && changed.source['id']) {
            unchangedEnd = 'target';
            changedEnd = 'source';
        } else if (changed['target'] && changed.target['id']) {
            unchangedEnd = 'source';
            changedEnd = 'target';
        } else {
            return;
        }

        other = link.attributes[unchangedEnd];
        otherCell = this.model.getCell(other.id);
        otherType = otherCell ? otherCell.get('type') : undefined;

        changedCell = this.model.getCell(changed[changedEnd].id);
        changedType = changedCell.get('type');

        shouldProhibitChange = otherType === changedType;

        if (shouldProhibitChange) {
            var src = link.prevCords.source;
            var tgt = link.prevCords.target;
            link.remove();
            this.addLink(src, tgt);
        } else {
            link.prevCords = {source: link.attributes.source, target: link.attributes.target};
        }

    }
});