var V = require('vectorizer').V;
var GraphView = require('../../../views/common_view');
var GraphLoader = require('../models/graph_loader');
var MatrixAlgoritms = require('../models/matrix_algorithms');
var GraphAlgoritms = require('../models/graph_alghoritms');
var joint = require('jointjs');
var g = joint.geometry;

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
        'dblclick .Transition': 'nextStep',
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
        this.listenTo(EventBus, 'graph:showReachabilityGraph', this.showReachabilityGraph);
        this.listenTo(EventBus, 'graph:showfeatures', this.showFeatures);

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

            _.each(jsonstring.cells, function (c) {
                if (c.type === 'link') {
                    if (c.source['id'] && c.source.id === cell.id) {
                        c.source.id = newCell.id;
                    } else if (c.target['id'] && c.target.id === cell.id) {
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

            if (link.vertices) {
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
            graph.addCells(cells);
            var myAdjustVertices = _.partial(adjustVertices, graph);

// adjust vertices when a cell is removed or its source/target was changed
            graph.on('add remove change:source change:target', myAdjustVertices);

// also when an user stops interacting with an element.
            paper.on('cell:pointerup', myAdjustVertices);
            $('button#coveritygraph').html('Generate Coverity Graph < ');
        }
    },

    showReachabilityGraph: function () {
        if ($('#reachabilitygraphpaper').length) {
            $('#reachabilitygraphpaper').remove();
            $('button#reachabilitygraph').html('Generate Reachability Graph > ');
        } else {
            $('#content').prepend('<div id="reachabilitygraphpaper" class="popup"></div>');
            var toGraph = this.graphAlgorithms.createReachabilityGraph(this.model, 20);
            var cells = this.graphAlgorithms.convertToGraph(toGraph);
            var graph = new joint.dia.Graph;

            var paper = new joint.dia.Paper({
                el: $('#reachabilitygraphpaper'),
                width: 1500,
                height: 800,
                gridSize: 1,
                model: graph,
                perpendicularLinks: true
            });
            graph.addCells(cells);
            var myAdjustVertices = _.partial(adjustVertices, graph);

            graph.on('add remove change:source change:target', myAdjustVertices);

            paper.on('cell:pointerup', myAdjustVertices);
            $('button#reachabilitygraph').html('Generate Reachability Graph < ');
        }
    },

    showFeatures: function () {
        if ($('#netFeatures-popup').length) {
            $('#netFeatures-popup').remove();
            $('button#features').html('Features > ');
        } else {
            var states = this.graphAlgorithms.createCoverityTree(this.model);

            var isDeadlockFree = this.graphAlgorithms.isDeadlockFree(states);
            var isSafe = this.graphAlgorithms.isSafe(states);
            var isConservative = this.graphAlgorithms.isConservative(states);
            var upperBound = this.graphAlgorithms.getUpperBound(states);
            var placesBounds = this.graphAlgorithms.getPlacesBounds(states, this.model);
            var isReversible = this.graphAlgorithms.isReversible(states);
            var liveTransitions = this.graphAlgorithms.liveTransitions(states, this.model);
            var isNetLive = this.graphAlgorithms.isNetLive(states, this.model);

            var isConservativeVectorHTML = '<div id="conservativevector" class="netFeatures"><h3>Conservative with respect to weight vector</h3>'
                                           + '<input id="vector" class="netFeatures">'
                                           + '<button id="checkbutton" class="netFeatures">Check</button></div>'
            var isDeadlockFreeHTML = '<div id="deadlockfree" class="netFeatures"><h3>Deadlock free</h3>' + isDeadlockFree + '</div>';
            var isSafeHTML = '<div id="safe" class="netFeatures"><h3>Safe</h3>' + isSafe + '</div>';
            var isConservativeHTML = '<div id="conservative" class="netFeatures"><h3>Conservative</h3>' + isConservative + '</div>';
            var upperBoundHTML = '<div id="upperbound" class="netFeatures"><h3>Petri net upper bound</h3>' + upperBound + '</div>';
            var placesBoundsHTML = '<div id="placesbounds" class="netFeatures"><h3>Places upper bounds</h3><table>' + this.pretty2dMatrix(placesBounds) + '</table></div>';
            var isReversibleHTML = '<div id="reversible" class="netFeatures"><h3>Reversible</h3>' + isReversible + '</div>';
            var liveTransitionsHTML = '<div id="livetransitions" class="netFeatures"><h3>Live transitions</h3><table>' + this.pretty2dMatrix(liveTransitions) + '</table></div>';
            var isNetLiveHTML = '<div id="live" class="netFeatures"><h3>Live</h3>' + isNetLive + '</div>';

            $('#content').prepend('<div id="netFeatures-popup" class="popup">' + isDeadlockFreeHTML + isSafeHTML + isConservativeHTML + upperBoundHTML + placesBoundsHTML + isReversibleHTML + liveTransitionsHTML + isNetLiveHTML + isConservativeVectorHTML + '</div>');
            $('button#features').html('Features < ');
            $('button#checkbutton').click(function() {
                var json = $('input#vector').val();
                var vector = [];
                var data = JSON.parse(json);
                for (var prop in data) {
                    vector.push(data[prop]);
                }
                var isConservative = this.graphAlgorithms.isConservativeVector(states, vector);
                $('div#conservativevector').append(isConservative);
            });
        }
    }

});
function adjustVertices(graph, cell) {

    // If the cell is a view, find its model.
    cell = cell.model || cell;

    if (cell instanceof joint.dia.Element) {

        _.chain(graph.getConnectedLinks(cell)).groupBy(function (link) {
            // the key of the group is the model id of the link's source or target, but not our cell id.
            return _.omit([link.get('source').id, link.get('target').id], cell.id)[0];
        }).each(function (group, key) {
            // If the member of the group has both source and target model adjust vertices.
            if (key !== 'undefined') adjustVertices(graph, _.first(group));
        });

        return;
    }

    // The cell is a link. Let's find its source and target models.
    var srcId = cell.get('source').id || cell.previous('source').id;
    var trgId = cell.get('target').id || cell.previous('target').id;

    // If one of the ends is not a model, the link has no siblings.
    if (!srcId || !trgId) return;

    var siblings = _.filter(graph.getLinks(), function (sibling) {

        var _srcId = sibling.get('source').id;
        var _trgId = sibling.get('target').id;

        return (_srcId === srcId && _trgId === trgId) || (_srcId === trgId && _trgId === srcId);
    });

    switch (siblings.length) {

        case 0:
            // The link was removed and had no siblings.
            break;

        case 1:
            // There is only one link between the source and target. No vertices needed.
            cell.unset('vertices');
            break;

        default:

            // There is more than one siblings. We need to create vertices.

            // First of all we'll find the middle point of the link.
            var srcCenter = graph.getCell(srcId).getBBox().center();
            var trgCenter = graph.getCell(trgId).getBBox().center();
            var midPoint = g.line(srcCenter, trgCenter).midpoint();

            // Then find the angle it forms.
            var theta = srcCenter.theta(trgCenter);

            // This is the maximum distance between links
            var gap = 20;

            _.each(siblings, function (sibling, index) {

                // We want the offset values to be calculated as follows 0, 20, 20, 40, 40, 60, 60 ..
                var offset = gap * Math.ceil(index / 2);

                // Now we need the vertices to be placed at points which are 'offset' pixels distant
                // from the first link and forms a perpendicular angle to it. And as index goes up
                // alternate left and right.
                //
                //  ^  odd indexes
                //  |
                //  |---->  index 0 line (straight line between a source center and a target center.
                //  |
                //  v  even indexes
                var sign = index % 2 ? 1 : -1;
                var angle = g.toRad(theta + sign * 90);

                // We found the vertex.
                var vertex = g.point.fromPolar(offset, angle, midPoint);

                sibling.set('vertices', [{x: vertex.x, y: vertex.y}]);
            });
    }
}