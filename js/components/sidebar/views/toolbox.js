var GraphView = require('../../../views/common_view');

module.exports = GraphView.extend({
    initialize: function (options) {
        options.width = 150;
        options.height = 70;
        options.gridSize = 10;
        options.perpendicularLinks = true;

        //_.extend(this.events, GraphView.prototype.events);
        GraphView.prototype.initialize.call(this, options);

        this._setupToolbox();
    },

    _setupToolbox: function () {
        this.model.referentialPlace = this.addPlace(0, 20, 'place', 1);
        this.model.referentialTransition = this.addTransition(80, 20, 'transition');
        this.model.referentialLink = this.addLink({x: 120, y: 80}, {x: 150, y: 20}, "", "");
    },
    
    events: {
        'click .root, .connection-wrap': EventBus.propagateGlobalEvent('node:new')
    }
});