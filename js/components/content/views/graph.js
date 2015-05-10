var V = require('vectorizer').V;
var joint = require('jointjs');
var Graph = joint.dia.Graph;
var pn = joint.shapes.pn;
var GraphView = require('../../../views/common_graph');

module.exports = GraphView.extend({
    initialize: function (options) {
        options.width = 800;
        options.height = 600;
        options.gridSize = 10;
        options.perpendicularLinks = true;

        GraphView.prototype.initialize.call(this, options);
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

    }
});