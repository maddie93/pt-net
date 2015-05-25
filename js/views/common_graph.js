var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;
var Link = require('./common_link');

module.exports = joint.dia.Paper.extend({
    initialize: function (options) {
        _.bindAll(this, 'addTransition', 'addPlace', 'addLink', 'startSimulation', 'stopSimulation', 'nextStep', '_fireTransition', 'simulate');
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
        var place = new pn.Place({position: {x: x, y: y}, attrs: {'.label': {text: text}}, tokens: tokens});
        this.model.addCell(place);
        return place;
    },

    addTransition: function (x, y, text) {
        var transition = new pn.Transition({position: {x: x, y: y}, attrs: {'.label': {text: text}}});
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

    _prepareIfEndpointIsNode: function (endpoint) {
        if (endpoint['id']) {
            endpoint = {id: endpoint.id, selector: '.root'};
        }
        return endpoint;
    },

    clearGraph: function () {
        this.model.clear();
    },

    startSimulation: function () {
        var simulationId = this.model.get('simulationId');
        if (!simulationId) {
            simulationId = this.simulate();
            this.model.set('simulationId', simulationId);
        }
    },

    stopSimulation: function () {
        var simulationId = this.model.get('simulationId');
        clearInterval(simulationId);
        this.model.set('simulationId', null);
    },

    nextStep: function () {
        this.startSimulation();
        this.stopSimulation();
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

        _.each(transitions, function (t) {
            var temp = this._fireTransition(t, 1);
            if (temp !== undefined) {
                if (temp['remove'] !== undefined) {
                    placesWithCountRemove = placesWithCountRemove.concat(temp['remove']);
                }
                if (temp['add'] !== undefined) {
                    placesWithCountAdd = placesWithCountAdd.concat(temp['add']);
                }
            }

        }, this);

        placesWithCountAdd = this.unique(placesWithCountAdd);
        placesWithCountRemove = this.unique(placesWithCountRemove);
        console.log('add');
        console.log(placesWithCountAdd);
        console.log('remove');
        console.log(placesWithCountRemove);
    },


    _fireTransition: function (t, sec) {
        var inbound = this.model.getConnectedLinks(t, {inbound: true}),
            outbound = this.model.getConnectedLinks(t, {outbound: true}),
            placesWithCountBefore = this._getPlacesWithTokenShift(inbound, 'source'),
            placesWithCountAfter = this._getPlacesWithTokenShift(outbound, 'target');

        if (this._isFireable(t, inbound)) {
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
            if (place.get('tokens') < neededTokens) {
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
                link,
                numberToMove;

            link = _.find(collection, function (link) {
                return link.get(linkEndType).id === place.id;
            });

            if (linkEndType === 'target') {
                numberToMove = count;
                this._sendToken(link, function(){
                    place.set('tokens', place.get('tokens') + numberToMove)
                });
            }
            else if (linkEndType === 'source') {
                numberToMove = - count;
                place.set('tokens', place.get('tokens') + numberToMove);
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

    _showActiveTransitions: function () {
        var transitions = this.model.get('transitions');
        var activeTransitions = [];
        _.each(transitions, function (t) {
            if (this._isFireable(t)) {
                activeTransitions.push(t);
            }

        }, this);


        console.log(activeTransitions);

        _.each(activeTransitions, function (t) {
            //t.setAttribute('fill', 'blue');

            var attributes = t.get('attrs');
            attributes['rect']['fill'] = 'green';
            attributes['rect']['stroke'] = 'red';
            t.unset('attrs');
            t.set('attrs', attributes);
            var id = t.get('id');

            console.log(id);
        }, this);

    },

    simulate: function () {
        this._fireTransitions();

        return setInterval(function () {
            this._fireTransitions()
        }.bind(this), 2000);
    },

    shouldSimulate: function () {
        return this.model.get('shouldSimulate');
    }
});