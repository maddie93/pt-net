var ToolboxView = require('./toolbox');
var NodeOptionsView = require('./node_options');

module.exports = Backbone.View.extend({
    nodesPanel: '#nodes',
    nodeOptions: '#node-options',
    template: function () {
        return '<h1>Nodes Toolbox</h1>'
            +'<div id="nodes" class="toolbox"></div>'
            +'<div class="buttons"><ul>'
            +'<li><button id="nodeop">Node options</button></li>'
            +'<div id="node-options" class="toolbox"></div>'
            +'<li><button id="simulation">Simulation > </button></li>'
            +'<div id="simulation-options"><ul>'
            +'<li><button id="simulation-start">Start simulation</button></li>'
            +'<li><button id="simulation-stop">Stop simulation</button></li>'
            +'<li><button id="simulation-next-step">Next Step</button></li>'
            +'</ul></div>'
            +'<li><button id="simulation-clear">Clear view</button></li>'
            +'<li><button id="io">Import/Export > </button></li>'
            +'<div id="iomenu"><ul>'
            +'<li><button id="export">Export to file</button></li>'
            +'<li><input type="file" id="file-input" /></li>'
            +'<li><button id="import">Read from file</button></li>'
            +'</ul></div>'
            +'<li><button id="matrix">Matrix > </button></li>'
            +'</ul></div>';
    },

    initialize: function () {
        this.views = {};
    },

    events: {
        'click #simulation-start': EventBus.propagateGlobalEvent('simulation:start'),
        'click #simulation-stop': EventBus.propagateGlobalEvent('simulation:stop'),
        'click #simulation-next-step': EventBus.propagateGlobalEvent('simulation:next-step'),
        'click #simulation-clear': EventBus.propagateGlobalEvent('simulation:clear'),
        'click #export': EventBus.propagateGlobalEvent('io:export'),
        'click #import': EventBus.propagateGlobalEvent('io:import'),
        'click #matrix': EventBus.propagateGlobalEvent('matrix:showmatrix'),
        'click #io': 'showOptions',
        'click #nodeop': 'toggleNodeOptions',
        'click #simulation': 'toggleSimulationOptions',
        'click #closepopup' : 'closePopup'
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

        $('#iomenu').hide();
        $('#node-options').hide();
        $('#simulation-options').hide();

        return this;
    },
    showOptions: function(){
        $('#iomenu').toggle();
    },
    toggleNodeOptions: function(){
        $('#node-options').toggle();
    },
    toggleSimulationOptions : function(){
        $('#simulation-options').toggle();
    },
    closePopup : function(){
        $('.popup').remove();
    }
});
