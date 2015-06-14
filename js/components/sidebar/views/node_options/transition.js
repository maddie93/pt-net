var OptionsBaseView = require('./options_base');

module.exports = OptionsBaseView.extend({
    templateHTML:
      '<h3>Transition</h3>'
    + '<li><label for="title">title: </label><input id="title" type="text" name="title" value="{{title}}"></li>' +
      '<li><label for="priority">priority: </label><input id="priority" type="text" name="priority" value="{{priority}}"></li>',

    events: {
        'keyup input#title': 'onTitleChange',
        'keyup input#priority': 'onPriorityChange'
    },

    onTitleChange: function (e) {
        var val = $(e.currentTarget).val();
        this.model.setLabel(val);
    },

    onPriorityChange: function (e) {
        var val = $(e.currentTarget).val();
        this.model.setPriority(val);
    },

    prepareModel: function () {
        var labelValue = this.model.getLabelWithoutPriority(),
            priority = this.model.getPriority();
        var preparedModel = {
            title: labelValue,
            priority: priority
        };
        return preparedModel;
    }
});