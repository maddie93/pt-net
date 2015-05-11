var Toolbox = require('./toolbox');

module.exports = Backbone.View.extend({
    nodesPanel: '#nodes',
    additionalPanel: '#additional',
    template: function () {
        return '<h1>Nodes Toolbox</h1><div id="nodes" class="toolbox"></div><h1>Node Options</h1><div id="additional" class="toolbox"></div><div class="buttons"><ul><li><button id="simulation-start">Start simulation</button></li><li><button id="simulation-stop">Stop simulation</button></li><li><button id="simulation-clear">Clear view</button></li></ul></div>';
    },

    initialize: function () {
        this.views = {};
    },

    events: {
        'click #simulation-start': 'propagateStartSimulation',
        'click #simulation-stop': 'propagateStopSimulation',
        'click #simulation-clear': 'propagateClearSimulationModel'
    },

    propagateStartSimulation: function(event) {
        EventBus.trigger('simulation:start', event);
    },

    propagateStopSimulation: function(event) {
        EventBus.trigger('simulation:stop', event);
    },

    propagateClearSimulationModel: function(event) {
        EventBus.trigger('simulation:clear', event);

    },

    render: function () {
        this.$el.html(this.template());
        this.views = {
            nodesPanel: new Toolbox({el: '#nodes'})
            //additionalPanel: new Toolbox({el: '#additional'})
        };

        _.each(this.views, function (view) {
            view.render();
        });

        return this;
    }
});
