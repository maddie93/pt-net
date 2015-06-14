var ToolboxView = require('./toolbox');
var NodeOptionsView = require('./node_options');

module.exports = Backbone.View.extend({
    nodesPanel: '#nodes',
    nodeOptions: '#node-options',
    template: function () {
        return '<h1>Nodes Toolbox</h1>'
            + '<div id="nodes" class="toolbox"></div>'
            + '<div class="buttons"><ul>'
            + '<li><div id="scaling">Scale: <input type="text" id="scale"/><button id="scale-up">+</button><button id="scale-down">-</button></div></li>'
            + '<li><button id="nodeop">Node options</button></li>'
            + '<div id="node-options" class="toolbox"></div>'
            + '<li><button id="simulation">Simulation > </button></li>'
            + '<div id="simulation-options"><ul>'
            + '<li><button id="simulation-mark-active-transitions">Mark active T\'s</button></li>'
            + '<li><button id="simulation-reset-markers">Reset markers</button></li>'
            + '<li><button id="simulation-next-step">Next Step</button></li>'
            + '</ul></div>'
            + '<li><button id="simulation-clear">Clear view</button></li>'
            + '<li><button id="io">Import/Export > </button></li>'
            + '<div id="iomenu"><ul>'
            + '<li><button id="export">Export to file</button></li>'
            + '<li><input type="file" id="file-input" /></li>'
            + '<li><button id="import">Read from file</button></li>'
            + '</ul></div>'
            + '<li><button id="matrix">Matrix > </button></li>'
            + '<li><button id="graph">Graph > </button></li>'
            + '<div id="graphmenu"><ul>'
            + '<li><button id="coveritytree">Generate Coverity Tree ></button></li>'
            + '<li><button id="coveritygraph">Generate Coverity Graph ></button></li>'
            + '<li><button id="reachabilitygraph">Generate Reachability Graph ></button></li>'
            + '</ul></div>'
            + '<li><button id="features">Features > </button></li>'
            + '</ul></div>';
    },

    initialize: function () {
        this.views = {};
    },

    events: {
        'click #scale-up': 'scaleUp',
        'click #scale-down': 'scaleDown',
        'click #simulation-mark-active-transitions': EventBus.propagateGlobalEvent('simulation:mark-active-transitions'),
        'click #simulation-reset-markers': EventBus.propagateGlobalEvent('simulation:reset-markers'),
        'click #simulation-next-step': EventBus.propagateGlobalEvent('simulation:next-step'),
        'click #simulation-clear': EventBus.propagateGlobalEvent('simulation:clear'),
        'click #export': EventBus.propagateGlobalEvent('io:export'),
        'click #import': EventBus.propagateGlobalEvent('io:import'),
        'click #matrix': EventBus.propagateGlobalEvent('matrix:showmatrix'),
        'click #features': EventBus.propagateGlobalEvent('graph:showfeatures'),
        'click #coveritytree': EventBus.propagateGlobalEvent('graph:showCoverityTree'),
        'click #coveritygraph': EventBus.propagateGlobalEvent('graph:showCoverityGraph'),
        'click #reachabilitygraph': EventBus.propagateGlobalEvent('graph:showReachabilityGraph'),
        'click #graph': 'toggleGraphOptions',
        'click #io': 'showOptions',
        'click #nodeop': 'toggleNodeOptions',
        'click #simulation': 'toggleSimulationOptions',
        'click #closepopup': 'closePopup'
    },

    scaleUp: function (e) {
        var currentScale, newScale,
            scaleField = $('#scale');

        currentScale = parseInt(scaleField.val());

        if (!currentScale || currentScale <= 0) {
            newScale = 1;
        } else {
            newScale = this._determineScaleChange(currentScale);
        }

        scaleField.val(newScale);

        console.log(e);
    },

    _determineScaleChange: function (currentScale) {
        var scaleChange;
        if (currentScale < 1) {
            scaleChange = -currentScale
        }
    },

    scaleDown: function (e) {
        console.log(e);
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
        $('#graphmenu').hide();

        return this;
    },
    showOptions: function () {
        $('#iomenu').toggle();
    },
    toggleNodeOptions: function () {
        $('#node-options').toggle();
    },
    toggleSimulationOptions: function () {
        $('#simulation-options').toggle();
    },
    toggleGraphOptions: function () {
        $('#graphmenu').toggle();
    },
    closePopup: function () {
        $('.popup').remove();
    }
});
