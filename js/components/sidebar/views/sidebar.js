var ToolboxView = require('./toolbox');
var NodeOptionsView = require('./node_options');

module.exports = Backbone.View.extend({
    nodesPanel: '#nodes',
    nodeOptions: '#node-options',
    template: function () {
        return '<h1>Nodes Toolbox</h1>'
            +'<div id="nodes" class="toolbox"></div>'
            +'<h1>Node Options</h1>'
            +'<div id="node-options" class="toolbox"></div>'
            +'<div class="buttons"><ul>'
            +'<li><button id="simulation-start">Start simulation</button></li>'
            +'<li><button id="simulation-stop">Stop simulation</button></li>'
            +'<li><button id="simulation-next-step">Next Step</button></li>'
            +'<li><button id="simulation-clear">Clear view</button></li>'
            +'<li><button id="export">Export to file</button></li>'
            +'<li><input type="file" id="file-input" />'
            +'<button id="import">Read from file</button></li>'
            +'</ul></div>';
    },

    initialize: function () {
        this.views = {};
    },

    events: {
        'click #simulation-start': 'propagateStartSimulation',
        'click #simulation-stop': 'propagateStopSimulation',
        'click #simulation-next-step': 'propagateNextStep',
        'click #simulation-clear': 'propagateClearSimulationModel',
        'click #export': 'propagateExportToFile',
        'click #import': 'propagateImportFromFile'
    },

    propagateStartSimulation: function(event) {
        EventBus.trigger('simulation:start', event);
    },

    propagateStopSimulation: function(event) {
        EventBus.trigger('simulation:stop', event);
    },

    propagateNextStep: function(event) {
        EventBus.trigger('simulation:next-step', event);
    },

    propagateClearSimulationModel: function(event) {
        EventBus.trigger('simulation:clear', event);

    },

    propagateExportToFile: function(event) {
        EventBus.trigger('io:export', event);
    },

    propagateImportFromFile: function(event) {
        EventBus.trigger('io:import', event);
    },

    render: function () {
        this.$el.html(this.template());
        this.views = {
            nodesPanel: new ToolboxView({el: '#nodes'}),
            nodeOptions: new NodeOptionsView({el: '#node-options'})
        };

        _.each(this.views, function (view) {
            view.render();
        });

        return this;
    }
});
