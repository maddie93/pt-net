var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;

module.exports = joint.dia.Paper.extend({
    initialize: function (options) {
        _.bindAll(this, 'addTransition', 'addPlace', 'addLink', 'startSimulation', 'stopSimulation', '_fireTransition', 'simulate');

        this.el = options.el;
        this.width = options.width;
        this.height = options.height;
        this.gridSize = options.gridSize;
        this.perpendicularLinks = options.perpendicularLinks;
        this.model = new Graph({transitions: []});

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

    startSimulation: function () {
        var pReady = this.addPlace(140, 50, 'ready', 1);
        var pIdle = this.addPlace(140, 260, 'idle', 2);
        var pBuffer = this.addPlace(350, 160, 'buffer', 12);
        var cAccepted = this.addPlace(350, 50, 'accepted', 1);
        var cReady = this.addPlace(560, 260, 'ready', 3);

        var pProduce = this.addTransition(50, 160, 'produce');
        var pSend = this.addTransition(270, 160, 'send');
        var cAccept = this.addTransition(470, 160, 'accept');
        var cConsume = this.addTransition(680, 160, 'consume');

        this.addLink(pProduce, pReady);
        this.addLink(pReady, pSend);
        this.addLink(pSend, pIdle);
        this.addLink(pIdle, pProduce);
        this.addLink(pSend, pBuffer);
        this.addLink(pBuffer, cAccept);
        this.addLink(cAccept, cAccepted);
        this.addLink(cAccepted, cConsume);
        this.addLink(cConsume, cReady);
        this.addLink(cReady, cAccept);

        this.model.get('transitions').push(pProduce, pSend, cAccept, cConsume);

        var simulationId = this.simulate();

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