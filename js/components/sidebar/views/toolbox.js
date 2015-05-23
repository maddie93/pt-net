var GraphView = require('../../../views/common_graph');

module.exports = GraphView.extend({
    initialize: function (options) {
        options.width = 150;
        options.height = 120;
        options.gridSize = 10;
        options.perpendicularLinks = true;

        GraphView.prototype.initialize.call(this, options);

        this._setupToolbox();
    },

    _setupToolbox: function () {
        this.model.referentialPlace = this.addPlace(0, 30, 'place', 1);
        this.model.referentialTransition = this.addTransition(80, 30, 'transition');
        this.model.referentialLink = this.addLink({x: 120, y: 80}, {x: 150, y: 30}, "", "");
    },
    
    events: {
        'click .root, .connection-wrap': EventBus.propagateGlobalEvent('node:new')
    }
});