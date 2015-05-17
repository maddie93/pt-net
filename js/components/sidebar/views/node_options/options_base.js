module.exports = Backbone.View.extend({
    templateHTML: 'base',

    initialize: function () {
        this.template = Handlebars.compile(this.templateHTML);
        this.listenTo(EventBus, "node_options:selected", this.render);
    },

    render: function () {
        var preparedModel = this.prepareModel();
        var html = this.template(preparedModel);
        this.setElement($(html));
        return this;
    },

    prepareModel: function () {}
});