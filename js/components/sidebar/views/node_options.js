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
    },

    template: function() {
        return this.endingTemplate;
    },

    initialize: function () {
        this.listenTo(EventBus, "selected:place", this.newPlaceSelected);
        this.listenTo(EventBus, "selected:transition", this.newTransitionSelected);
    },

    newPlaceSelected: function (cell) {
        this.nodeView = new PlaceView({model: cell});
        this.render();
    },

    newTransitionSelected: function (cell) {
        this.nodeView = new TransitionView({model: cell});
        this.render();
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