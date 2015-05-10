var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;

module.exports = joint.dia.Paper.extend({
    initialize: function (options) {
        _.bindAll(this, 'addTransition', 'addPlace', 'addLink', 'startSimulation', 'stopSimulation', '_fireTransition', 'simulate');
        this.model = new Graph({transitions: []});
        this._configure(options);
        joint.dia.Paper.prototype.initialize.call(this, options);
    },

    addPlace: function (x, y, text, tokens) {
        var place = new pn.Place({position: {x: x, y: y}, attrs: {'.label': {text: text}}, tokens: tokens});
        this.model.addCell(place);
        return place;
    },

    addTransition: function (x, y, text) {
        var transition = new pn.Transition({position: {x: x, y: y}, attrs: {'.label': {text: text}}});
        this.model.addCell(transition);
        return transition;
    },

    addLink: function (a, b) {
        var link = new pn.Link({
            source: {id: a.id, selector: '.root'},
            target: {id: b.id, selector: '.root'}
        });
        this.model.addCell(link);
        return link;
    },

    addUnconnectedLink: function (from, to) {
        var link = new pn.Link({
            source: from,
            target: to
        });
        this.model.addCell(link);
        return link;
    },

    startSimulation: function () {

    },

    stopSimulation: function (simulationId) {
        clearInterval(simulationId);
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
                _.defer(function () {
                    p.set('tokens', p.get('tokens') - 1);
                });
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
        var transitions = this.model.get('transitions');

        _.each(transitions, function (t) {
            if (Math.random() < 0.7) this._fireTransition(t, 1);
        }, this);

        return setInterval(function () {
            _.each(transitions, function (t) {
                if (Math.random() < 0.7) this._fireTransition(t, 1);
            }, this);
        }.bind(this), 2000);
    }
});