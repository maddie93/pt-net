var OptionsBaseView = require('./options_base');

module.exports = OptionsBaseView.extend({
    templateHTML:
      '<h3>Transition</h3>'
    + '<li><label for="title">title: </label><input id="title" type="text" name="title" value="{{title}}"></li>',

    events: {
        'keyup input#title': 'onTitleChange'
    },

    onTitleChange: function (e) {
        var val = $(e.currentTarget).val();
        this.model.setLabel(val);
    },

    prepareModel: function () {
        var labelValue = this.model.getLabel();
        var preparedModel = {
            title: labelValue
        };
        return preparedModel;
    }
});