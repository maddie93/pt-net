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

    addLink: function (src, dst, labelSrc, labelDst) {
        labelSrc = labelSrc != undefined ? labelSrc : '1';
        labelDst = labelDst != undefined ? labelDst : '1';

        if (src['id']) {
            src = {id: src.id, selector: '.root'};
        }
        if (dst['id']) {
            dst = {id: dst.id, selector: '.root'};
        }

        var link = new Link({
            source: src,
            target: dst
        });

        this._addLabelToLink(link, 0, 0.1, labelSrc);
        this._addLabelToLink(link, 1, 0.9, labelDst);
        this.model.addCell(link);
        return link;
    },

    _addLabelToLink: function (link, index, position, text) {
        link.label(index, {
            position: position,
            attrs: {
                text: {text: text}
            }
        });
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
        var placesRemove = [];
        var placesAdd = [];
        var transitions = this.model.get('transitions');

        _.each(transitions, function (t) {
            var temp = this._fireTransition(t, 1);
            if (temp !== undefined) {
                if (temp['remove'] !== undefined) {
                    placesRemove = placesRemove.concat(temp['remove']);
                }
                if (temp['add'] !== undefined) {
                    placesAdd = placesAdd.concat(temp['add']);
                }
            }

        }, this);

        placesAdd = this.unique(placesAdd);
        placesRemove = this.unique(placesRemove);
        console.log('add');
        console.log(placesAdd);
        console.log('remove');
        console.log(placesRemove);

        setTimeout(function () {
            _.each(placesRemove, function (p) {
                p.set('tokens', p.get('tokens') - 1);
            }, this);
        }, 1000);
        setTimeout(function () {
            _.each(placesAdd, function (p) {
                p.set('tokens', p.get('tokens') + 1);
            }, this);
        }, 1000);
    },

    _fireTransition: function (t, sec) {
        var inbound = this.model.getConnectedLinks(t, {inbound: true});
        var outbound = this.model.getConnectedLinks(t, {outbound: true});


        var placesBefore = _.map(inbound, function (link) {
            return this.model.getCell(link.get('source').id);
        }, this);


        var placesAfter = _.map(outbound, function (link) {
            return this.model.getCell(link.get('target').id);
        }, this);

        var isFirable = true;
        _.each(placesBefore, function (p) {
            if (p.get('tokens') == 0) isFirable = false;
        });
        var placesToRemoveTokens = [];
        var placesToAddTokens = [];

        if (isFirable) {

            _.each(placesBefore, function (p) {
                placesToRemoveTokens.push(p);
                var link = _.find(inbound, function (l) {
                    return l.get('source').id === p.id;
                });
                this.findViewByModel(link).sendToken(V('circle', {r: 5, fill: 'red'}).node, sec * 1000);

            }, this);

            _.each(placesAfter, function (p) {
                var link = _.find(outbound, function (l) {
                    return l.get('target').id === p.id;
                });
                this.findViewByModel(link).sendToken(V('circle', {
                    r: 5,
                    fill: 'red'
                }).node, sec * 1000);
                placesToAddTokens.push(p);
            }, this);
            var returnPlaces = {};
            returnPlaces['remove'] = placesToRemoveTokens;
            returnPlaces['add'] = placesToAddTokens;
            console.log(returnPlaces);
            return returnPlaces;

        }
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