var GraphView = require('../../../views/common_view');
var GraphLoader = require('../models/graph_loader');
var MatrixAlgoritms = require('../models/matrix_algorithms');
var GraphAlgoritms = require('../models/graph_alghoritms');

module.exports = GraphView.extend({
    graphLoader: new GraphLoader,
    matrixAlgorithms: new MatrixAlgoritms,
    graphAlgorithms: new GraphAlgoritms,
    initialize: function (options) {
        _.extend(this.events, GraphView.prototype.events);
        options.width = 2000;
        options.height = 1500;
        options.gridSize = 10;
        options.perpendicularLinks = false;
        GraphView.prototype.initialize.call(this, options);
        this.registerListeners();
        this.initTest();
    },

    events: {
        'click .Place': 'propagateSelectedPlace',
        'click .Transition': 'propagateSelectedTransition',
        'click .link': 'propagateSelectedLink',
        'click svg': 'clearSelection'
    },

    propagateSelectedPlace: function (event) {
        this._triggerSelectionEvent('selected:place', event);
    },

    propagateSelectedTransition: function (event) {
        var selectedTransition = this._triggerSelectionEvent('selected:transition', event);
        this.selectTransition(selectedTransition);
    },

    propagateSelectedLink: function (event) {
        this._triggerSelectionEvent('selected:link', event);
    },

    _triggerSelectionEvent: function (eventName, event) {
        var cell = this.model.getCell(event.currentTarget.getAttribute('model-id'));
        EventBus.trigger(eventName, cell);
        return cell;
    },

    registerListeners: function () {
        this.listenTo(EventBus, 'node:new', this.newNode);
        this.listenTo(EventBus, 'node:remove', this.removeNode);
        this.listenTo(EventBus, 'simulation:mark-active-transitions', this.markActiveTransitions);
        this.listenTo(EventBus, 'simulation:reset-markers', this.clearActiveMarkers);
        this.listenTo(EventBus, 'simulation:next-step', this.nextStep);
        this.listenTo(EventBus, 'simulation:clear', this.clearGraph);
        this.listenTo(EventBus, 'io:export', this.exportToFile);
        this.listenTo(EventBus, 'io:import', this.importFromFile);
        this.listenTo(EventBus, 'matrix:showmatrix', this.showMatrix);
        this.listenTo(EventBus, 'graph:showgraph', this.showGraph);
    },

    newNode: function (event) {
        var startX = 10, startY = 10,
            connectionWidth = 50,
            connectionHeight = 100;
        var nodeName = event.target.localName;

        switch (nodeName) {
            case 'circle':
                this.addPlace(startX, startY, 'place', 0);
                break;
            case 'rect':
                this.addTransition(startX, startY, 'transition');
                break;
            case 'path':
                var from = {x: startX, y: startY + connectionHeight};
                var to = {x: startX + connectionWidth, y: startY};
                this.addLink(from, to);
                break;
        }
    },

    removeNode: function (node) {
        this.model.get('cells').remove(node);
    },

    initTest: function () {
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
    },

    exportToFile: function () {
        this.graphLoader.exportToFile(this.model);
    },

    importFromFile: function () {
        this.graphLoader.importFromFile(function (e) {
            read = e.target.result;
            console.log("file read");
            this.createGraphFromJSON(JSON.parse(read));
        }.bind(this));
    },

    createGraphFromJSON: function (jsonstring) {
        this.clearGraph();
        this.model.fromJSON(jsonstring);
    },


    pretty2dMatrix: function (matrix) {
        return JSON.stringify(matrix).replace(/\[\[/g, '<tr><td>').replace(/\]\]/g, '</td></tr>').replace(/\],\[/g, '</td></tr><tr><td>').replace(/,/g, '</td><td>');
    },

    showMatrix: function () {
        if ($('#matrix-popup').length) {
            $('#matrix-popup').remove();
            $('button#matrix').html('Matrix > ');
        } else {
            var outMatrix = this.matrixAlgorithms.createDOutputMatrix(this.model);
            var inMatrix = this.matrixAlgorithms.createDInputMatrix(this.model);
            var dMatrix = this.matrixAlgorithms.createDMatrix(this.model);

            var inMatrixHTML = '<div id="inmatrix" class="matrix"><h3>Input Matrix</h3><table>' + this.pretty2dMatrix(inMatrix) + '</table></div>';
            var outMatrixHTML = '<div id="outmatrix" class="matrix"><h3>Output Matrix</h3><table>' + this.pretty2dMatrix(outMatrix) + '</table></div>';
            var dMatrixHTML = '<div id="dmatrix" class="matrix"><h3>Incidence Matrix</h3><table>' + this.pretty2dMatrix(dMatrix) + '</table></div>';
            $('#content').prepend('<div id="matrix-popup" class="popup">' + inMatrixHTML + outMatrixHTML + dMatrixHTML + '</div>');
            $('button#matrix').html('Matrix < ');
        }

    },

    showGraph: function(){
        console.log(this.graphAlgorithms.createCoverityTree(this.model));
    }
});