var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;
var Link = require('./common_link');
var Place = require('./common_place');
var Transition = require('./common_transition');

module.exports = joint.dia.Paper.extend({
    initialize: function (options) {
        _.bindAll(this, 'addTransition', 'addPlace', 'addLink', 'markActiveTransitions', 'resetSimulation', 'nextStep', 'clearGraph', '_fireTransition', 'simulate');
        this.model = new Graph({transitions: []});
        this._configure(options);
        joint.dia.Paper.prototype.initialize.call(this, options);

        this.model.on('change:source change:target', this._changeLink, this);
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

    selectTransition: function (transition) {
        transition.setSelected();
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

    _prepareIfEndpointIsNode: function (endpoint) {
        if (endpoint['id']) {
            endpoint = {id: endpoint.id, selector: '.root'};
        }
        return endpoint;
    },

    clearGraph: function () {
        this.model.clear();
    },

    startSimulation: function (count) {
        var simulationId = this.model.get('simulationId');
        if (!simulationId) {
            this.simulate(count);
        }
    },

    nextStep: function () {
        this.startSimulation(1);
    },

    simulate: function (count) {
        var simId = setInterval(function () {
            if(count--) {
                this._fireTransitions()
            } else {
                clearInterval(simId);
            }
        }.bind(this), 2000);
    },

    resetSimulation: function () {

    },

    unique: function (list) {
        var result = [];
        $.each(list, function (i, e) {
            if ($.inArray(e, result) == -1) result.push(e);
        });
        return result;
    },


    _fireTransitions: function () {
        var placesWithCountRemove = [];
        var placesWithCountAdd = [];
        var transitions = this.model.get('transitions');

        _.each(transitions, function (transition) {
            var placesToAddAndRemove = this._fireTransition(transition, 1);

            if (placesToAddAndRemove) {
                if (placesToAddAndRemove['remove']) {
                    placesWithCountRemove = placesWithCountRemove.concat(placesToAddAndRemove['remove']);
                }
                if (placesToAddAndRemove['add']) {
                    placesWithCountAdd = placesWithCountAdd.concat(placesToAddAndRemove['add']);
                }
            }

        }, this);

        placesWithCountAdd = this.unique(placesWithCountAdd);
        placesWithCountRemove = this.unique(placesWithCountRemove);
    },

    _fireTransition: function (transition, sec) {
        var inbound = this.model.getConnectedLinks(transition, {inbound: true}),
            outbound = this.model.getConnectedLinks(transition, {outbound: true}),
            placesWithCountBefore = this._getPlacesWithTokenShift(inbound, 'source'),
            placesWithCountAfter = this._getPlacesWithTokenShift(outbound, 'target');

        if (this._isFireable(transition, inbound)) {
            this._substractTokensFromPredecessors(placesWithCountBefore, inbound);
            this._addTokensToSuccessors(placesWithCountAfter, outbound);
            return {
                remove: _.pluck(placesWithCountBefore, 'place'),
                add: _.pluck(placesWithCountAfter, 'place')
            };
        }
    },

    _getPlacesWithTokenShift: function (links, linkEnd) {
        return _.map(links, function (link) {
            return {place: this.model.getCell(link.get(linkEnd).id), count: parseInt(link.getCount())};
        }, this);
    },

    _isFireable: function (t, inbound) {
        var placesWithLinksBefore = _.map(inbound, function (link) {
            return {place: this.model.getCell(link.get('source').id), link: link};
        }, this);

        var isFireable = true;
        _.each(placesWithLinksBefore, function (p) {
            var place = p.place,
                neededTokens = p.link.getCount();
            if (place.getTokens() < neededTokens) {
                isFireable = false;
            }
        });
        return isFireable;
    },

    _substractTokensFromPredecessors: function (placesWithCount, inbound) {
        this._moveTokensForCollection(placesWithCount, 'source', inbound);
    },

    _addTokensToSuccessors: function (placesWithCount, outbound) {
        this._moveTokensForCollection(placesWithCount, 'target', outbound);
    },

    _moveTokensForCollection: function (placesWithCount, linkEndType, collection) {
        _.each(placesWithCount, function (placeWithCount) {
            var place = placeWithCount.place,
                count = placeWithCount.count,
                link;

            link = _.find(collection, function (link) {
                return link.get(linkEndType).id === place.id;
            });

            if (linkEndType === 'target') {
                this._sendToken(link, function () {
                    place.addTokens(count);
                });
            }
            else if (linkEndType === 'source') {
                place.subtractTokens(count);
                this._sendToken(link);
            }

        }, this);
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

        _.each(transitions, function (t) {
            if (this._isFireable(t)) {
                t.setActive();
                activeTransitions.push(t);
            }

        }, this);
        this.model.set('activeTransitions', activeTransitions);
    },

    shouldSimulate: function () {
        return this.model.get('shouldSimulate');
    }
});