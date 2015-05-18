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
        options.perpendicularLinks = false;

        this.registerListeners();

        GraphView.prototype.initialize.call(this, options);
        this.initTest();

        _.extend(this.events, GraphView.prototype.events);
    },

    events: {
        'click .Place': 'propagateSelectedPlace',
        'click .Transition': 'propagateSelectedTransition'
    },

    propagateSelectedPlace: function (event) {
        this._triggerSelectionEvent('place', event);
    },

    propagateSelectedTransition: function (event) {
        this._triggerSelectionEvent('transition', event);
    },

    _triggerSelectionEvent: function (nodeType, event) {
        var cell = this.model.getCell(event.currentTarget.getAttribute('model-id'));
        EventBus.trigger('selected:' + nodeType, cell);
    },

    registerListeners: function () {
        this.listenTo(EventBus, 'node:new', this.newNode);
        this.listenTo(EventBus, 'node:remove', this.removeNode);
        this.listenTo(EventBus, 'simulation:start', this.startSimulation);
        this.listenTo(EventBus, 'simulation:stop', this.stopSimulation);
        this.listenTo(EventBus, 'simulation:next-step', this.nextStep);
        this.listenTo(EventBus, 'simulation:clear', this.clearGraph);
        this.listenTo(EventBus, 'io:export', this.exportToFile);
        this.listenTo(EventBus, 'io:import', this.importFromFile);
        this.listenTo(EventBus, 'matrix:showmatrix', this.showMatrix);
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

        //this.model.get('transitions').push(pProduce, pSend, cAccept, cConsume);
    },

    exportToFile: function () {
        console.log(JSON.stringify(this.model));
        var jsonData = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.model));
        var a = document.createElement('a');
        a.href = jsonData;
        a.target = '_blank';
        a.download = 'pt.json';
        document.body.appendChild(a);
        a.click();
    },

    createGraphFromJSON: function (jsonstring) {
        this.clearGraph();
        this.model.fromJSON(jsonstring);
    },

    importFromFile: function () {
        try {
            var f = document.getElementById('file-input').files[0];
        } catch (err) {
            alert('Please choose a file first');
        }
        if (f) {
            var r = new FileReader();
            var read;
            var _this = this;
            r.onload = function (e) {
                read = e.target.result;
                console.log("file read");
                _this.createGraphFromJSON(JSON.parse(read));
            };
            r.readAsText(f);
        }

    },

    createDInputMatrix: function () {
        var inMatrix = [];
        var inbound;
        var placesBefore;
        var x = 0;
        var transitions = this.model.get('transitions');
        var cells = this.model.get('cells').models;
        var len = 0;

        cells.forEach(function (entry) {
            if (entry.attributes.type == "pn.Place") {
                len++;
            }
        });
        for (var i = 0; i < transitions.length; i++) {
            inMatrix[i] = [];
            for (var j = 0; j < len; j++) {
                inMatrix[i][j] = 0;
            }
        }
        for (var i = 0; i < transitions.length; i++) {
            inbound = this.model.getConnectedLinks(transitions[i], {inbound: true});
            placesBefore = _.map(inbound, function (link) {
                return this.model.getCell(link.get('source').id);
            }, this);
            for (var j = 0; j < placesBefore.length; j++) {
                inMatrix[x][placesBefore[j].attributes.z - 1] = 1;
            }
            x++;
        }
        return inMatrix;
    },

    createDOutputMatrix: function () {
        var outMatrix = [];
        var outbound;
        var placesAfter;
        var x = 0;
        var transitions = this.model.get('transitions');
        var cells = this.model.get('cells').models;
        var len = 0;

        cells.forEach(function (entry) {
            if (entry.attributes.type == "pn.Place") {
                len++;
            }
        });
        for (var i = 0; i < transitions.length; i++) {
            outMatrix[i] = [];
            for (var j = 0; j < len; j++) {
                outMatrix[i][j] = 0;
            }
        }
        for (var i = 0; i < transitions.length; i++) {
            outbound = this.model.getConnectedLinks(transitions[i], {outbound: true});
            placesAfter = _.map(outbound, function (link) {
                return this.model.getCell(link.get('target').id);
            }, this);
            for (var j = 0; j < placesAfter.length; j++) {
                outMatrix[x][placesAfter[j].attributes.z - 1] = 1;
            }
            x++;
        }
        return outMatrix;
    },

    createDMatrix: function () {
        var outMatrix = this.createDOutputMatrix();
        var inMatrix = this.createDInputMatrix();
        var dMatrix = [];

        for (var i = 0; i < outMatrix.length; i++) {
            dMatrix[i] = [];
            for (var j = 0; j < outMatrix[0].length; j++) {
                dMatrix[i][j] = outMatrix[i][j] - inMatrix[i][j];
            }
        }
        return dMatrix;
    },

    pretty2dMatrix: function(matrix){
        return JSON.stringify(matrix).replace(/\[|\]/g, '<br />').replace(/,/g, '&nbsp;&nbsp;');
    },

    showMatrix: function(){
        if ($('#matrix-popup').length){
            $('#matrix-popup').remove();
            $('button#matrix').html('Matrix > ');
        }else{
            var outMatrix = this.createDOutputMatrix();
            var inMatrix = this.createDInputMatrix();
            var dMatrix = this.createDMatrix();
            var inMatrixHTML = '<div id="inmatrix" class="matrix"><h3>Input Matrix</h3>'+this.pretty2dMatrix(inMatrix)+'</div>';
            var outMatrixHTML = '<div id="outmatrix" class="matrix"><h3>Output Matrix</h3>'+this.pretty2dMatrix(outMatrix)+'</div>';
            var dMatrixHTML = '<div id="dmatrix" class="matrix"><h3>Incidence Matrix</h3>'+this.pretty2dMatrix(dMatrix)+'</div>';
            $('#content').prepend('<div id="matrix-popup" class="popup">'+inMatrixHTML+outMatrixHTML+dMatrixHTML+'</div>');
            $('button#matrix').html('Matrix < ');
        }

    }

});