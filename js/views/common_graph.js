var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;

module.exports = joint.dia.Paper.extend({
    initialize: function (options) {
        _.bindAll(this, 'addTransition', 'addPlace', 'addLink', 'startSimulation', 'stopSimulation', 'nextStep', '_fireTransition', 'simulate');
        this.model = new Graph({transitions: []});
        this._configure(options);
        joint.dia.Paper.prototype.initialize.call(this, options);

        this.model.on('change:source change:target', this._changeLink, this);
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

    addLink: function (a, b, labelSrc, labelDst) {
        labelSrc = labelSrc || '1';
        labelDst = labelDst || '1';
        if (a['id']) {
            a = {id: a.id, selector: '.root'};
        }
        if (b['id']) {
            b = {id: b.id, selector: '.root'};
        }
        var link = new pn.Link({
            source: a,
            target: b
        });
        link.label(0, {
            position: 0.1,
            attrs: {
                text: {text: labelSrc}
            }
        });
        link.label(1, {
            position: 0.9,
            attrs: {
                text: {text: labelSrc}
            }
        });
        this.model.addCell(link);
        return link;
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

    _fireTransitions: function () {
        var transitions = this.model.get('transitions');

        _.each(transitions, function (t) {
            this._fireTransition(t, 1);
        }, this);
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

        if (isFirable) {

            _.each(placesBefore, function (p) {
                // Let the execution finish before adjusting the value of tokens. So that we can loop over all transitions
                // and call fireTransition() on the original number of tokens.
                //_.defer(function () {
                    p.set('tokens', p.get('tokens') - 1);
                //});
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
                }).node, sec * 1000, function () {
                    p.set('tokens', p.get('tokens') + 1);
                });

            }, this);
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