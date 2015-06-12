var V = require('vectorizer').V;
var GraphView = require('../../../views/common_view');
var GraphLoader = require('../models/graph_loader');
var MatrixAlgoritms = require('../models/matrix_algorithms');
var GraphAlgoritms = require('../models/graph_alghoritms');
var joint = require('jointjs');
var directedGraph = require('dagre');


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
        this.listenTo(EventBus, 'graph:showCoverityTree', this.showCoverityTree);
        this.listenTo(EventBus, 'graph:showCoverityGraph', this.showCoverityGraph);
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
        this.model.get('transitions').remove(node);
    },

    initTest: function () {
        var pReady = this.addPlace(140, 50, 'ready', 1);
        var pIdle = this.addPlace(140, 260, 'idle', 0);
        var pBuffer = this.addPlace(350, 160, 'buffer', 0);
        var cAccepted = this.addPlace(350, 50, 'accepted', 0);
        var cReady = this.addPlace(560, 260, 'ready', 1);

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
            var parsed = JSON.parse(read);
            this.createGraphFromJSON(parsed);
        }.bind(this));
    },

    createGraphFromJSON: function (jsonstring) {
        var x, y, text, newCell;

        this.clearGraph();
        var links = [];
        _.each(jsonstring.cells, function (cell) {
            if (cell.type !== 'link') {
                x = cell.position.x;
                y = cell.position.y;
                text = cell.attrs['.label'].text;
            } else {
                links.push(cell);
                return;
            }

            if (cell.type === 'pn.Transition') {
                newCell = this.addTransition(x, y, text);
            } else if (cell.type === 'pn.Place') {
                var tokens = cell.tokens;
                newCell = this.addPlace(x, y, text, tokens);
            }

            _.each(jsonstring.cells, function(c) {
                if (c.type === 'link') {
                    if (c.source['id'] && c.source.id === cell.id) {
                        c.source.id = newCell.id;
                    }  else if (c.target['id'] && c.target.id === cell.id) {
                        c.target.id = newCell.id;
                    }
                }
            });
        }.bind(this));

        _.each(links, function (link) {
            x = this._prepareIfEndpointIsNode(link.source);
            y = this._prepareIfEndpointIsNode(link.target);

            text = link.labels[0].attrs.text.text;
            newCell = this.addLink(x, y, text);

            if(link.vertices) {
                newCell.set('vertices', link.vertices);
            }
        }.bind(this));
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

    showCoverityTree: function () {
        if ($('#coveritytreepaper').length) {
            $('#coveritytreepaper').remove();
            $('button#coveritytree').html('Generate Coverity Tree > ');
        } else {
            $('#content').prepend('<div id="coveritytreepaper" class="popup"></div>');
            var states = this.graphAlgorithms.createCoverityTree(this.model);
            var cells = this.graphAlgorithms.convertToGraph(states);
            var graph = new joint.dia.Graph;

            var paper = new joint.dia.Paper({
                el: $('#coveritytreepaper'),
                width: 1500,
                height: 800,
                gridSize: 1,
                model: graph,
                perpendicularLinks: true
            });
             graph.addCells(cells);
            joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
            $('button#coveritytree').html('Generate Coverity Tree < ');
        }
    },
    showCoverityGraph: function () {
        if ($('#coveritygraphpaper').length) {
            $('#coveritygraphpaper').remove();
            $('button#coveritygraph').html('Generate Coverity Graph > ');
        } else {
            $('#content').prepend('<div id="coveritygraphpaper" class="popup"></div>');
            var toGraph = this.graphAlgorithms.createCoverityGraph(this.model);
            var cells = this.graphAlgorithms.convertToGraph(toGraph);
            var graph = new joint.dia.Graph;

            var paper = new joint.dia.Paper({
                el: $('#coveritygraphpaper'),
                width: 1500,
                height: 800,
                gridSize: 1,
                model: graph,
                perpendicularLinks: true
            });
            graph.resetCells(cells);
            joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
            $('button#coveritygraph').html('Generate Coverity Graph < ');
        }
    }
});