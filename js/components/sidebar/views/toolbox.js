//var V = require('vectorizer').V;
//var joint = require('jointjs');
//var Graph = joint.dia.Graph;
//var pn = joint.shapes.pn;
var GraphView = require('../../../views/common_graph');

module.exports = GraphView.extend({
    initialize: function (options) {
        options.width = 150;
        options.height = 120;
        options.gridSize = 10;
        options.perpendicularLinks = true;

        GraphView.prototype.initialize.call(this, options);
    }
});