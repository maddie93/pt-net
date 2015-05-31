var joint = require('jointjs');
var Graph = joint.dia.Graph;
var Link = require('./common_link');
var Place = require('./common_place');
var Transition = require('./common_transition');

module.exports = Graph.extend({
    selectTransition: function (transition) {
        var previouslySelected = this.get('selected');
        if (this._isFireable(transition)) {
            if (previouslySelected) {
                previouslySelected.deselect();
            }
            transition.select();
            this.set('selected', transition);
        }
    },

    clearSelection: function () {
        var selected = this.get('selected');
        if (selected) {
            selected.deselect();
            this.set('selected', undefined);
        }
    },

    isTransitionSelectable: function (transition) {
        var activeTransitions = this.get('activeTransitions');
        return _.contains(activeTransitions, transition);
    },

    fireSelectedTransition: function (sendTokenHook) {
        var placesWithCountRemove = [];
        var placesWithCountAdd = [];
        var selectedTransition = this.get('selected');

        if (!selectedTransition) {
            return;
        }

        this.sendTokenHook = sendTokenHook;
        var placesToAddAndRemove = this.fireTransition(selectedTransition);

        if (placesToAddAndRemove) {
            if (placesToAddAndRemove['remove']) {
                placesWithCountRemove = placesWithCountRemove.concat(placesToAddAndRemove['remove']);
            }
            if (placesToAddAndRemove['add']) {
                placesWithCountAdd = placesWithCountAdd.concat(placesToAddAndRemove['add']);
            }
        }
        this.sendTokenHook = undefined;

        placesWithCountAdd = this.unique(placesWithCountAdd);
        placesWithCountRemove = this.unique(placesWithCountRemove);
    },

    fireTransition: function (transition) {
        var inbound = this.getConnectedLinks(transition, {inbound: true}),
            outbound = this.getConnectedLinks(transition, {outbound: true}),
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

    unique: function (list) {
        var result = [];
        $.each(list, function (i, e) {
            if ($.inArray(e, result) == -1) result.push(e);
        });
        return result;
    },

    _getPlacesWithTokenShift: function (links, linkEnd) {
        return _.map(links, function (link) {
            return {place: this.getCell(link.get(linkEnd).id), count: parseInt(link.getCount())};
        }, this);
    },

    _isFireable: function (t, inbound) {
        if (!inbound) {
            inbound = this.getConnectedLinks(t, {inbound: true});
        }

        var placesWithLinksBefore = _.map(inbound, function (link) {
            return {place: this.getCell(link.get('source').id), link: link};
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
                link,
                sendTokenHook = this.sendTokenHook;

            link = _.find(collection, function (link) {
                return link.get(linkEndType).id === place.id;
            });

            if (linkEndType === 'target') {
                if (sendTokenHook) {
                    sendTokenHook(link, function () {
                        place.addTokens(count);
                    });
                } else {
                    place.addTokens(count);
                }
            }
            else if (linkEndType === 'source') {
                if (sendTokenHook) {
                    sendTokenHook(link);
                }
                place.subtractTokens(count);
            }
        }, this);
    }
});