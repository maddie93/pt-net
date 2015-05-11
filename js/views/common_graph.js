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

    clearGraph: function () {
        //this.model.clear();
        this.model.clear();
    },

    startSimulation: function () {
        var simulationId = this.model.get('simulationId');
        if(!simulationId) {
            simulationId = this.simulate();
            this.model.set('simulationId', simulationId);
        }
    },

    stopSimulation: function () {
        var simulationId = this.model.get('simulationId');
        clearInterval(simulationId);
        this.model.set('simulationId', null);
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
        this._fireTransitions();

        return setInterval(function () {
            this._fireTransitions()
        }.bind(this), 2000);
    },

    shouldSimulate: function () {
        return this.model.get('shouldSimulate');
    }
});