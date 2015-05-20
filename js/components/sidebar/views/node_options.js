var PlaceView = require('./node_options/place');
var TransitionView = require('./node_options/transition');

module.exports = Backbone.View.extend({
    tagName: "ul",
    endingTemplate: '<li><button id="remove">Remove</button></li>',

    events: {
        'click button#remove': 'propagateRemoveNode'
    },

    propagateRemoveNode: function () {
        EventBus.trigger('node:remove', this.nodeView.model);
        this.nodeView = null;
        this.render();
        $('#node-options').hide();
    },

    template: function () {
        return this.endingTemplate;
    },

    initialize: function () {
        this.listenTo(EventBus, "selected:place selected:transition", this.newSelection);
    },

    newSelection: function (cell) {
        var cellType = cell.get('type');

        if (cellType === "pn.Place") {
            this.nodeView = new PlaceView({model: cell});
        } else if (cellType === "pn.Transition") {
            this.nodeView = new TransitionView({model: cell});
        } else {
            return;
        }

        this.render();
        $('#node-options').show();
    },

    render: function () {
        if (this.nodeView) {
            this.$el.html(this.nodeView.render().$el);
            //this.$el.append(this.nodeView.render().$el);
            this.$el.append(this.template());
        } else {
            this.$el.html("");
        }
        return this;
    }
});