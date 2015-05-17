var OptionsBaseView = require('./options_base');

module.exports = OptionsBaseView.extend({
    templateHTML:
      '<h3>Transition</h3>'
    + '<li><label for="title">title: </label><input id="title" type="text" name="title" value="{{title}}"></li>',

    events: {
        'keyup input#title': 'onTitleChange'
    },

    onTitleChange: function (e) {
        var attributes = this.model.get('attrs');
        var val = $(e.currentTarget).val();
        attributes['.label'].text = val;
        this.model.unset('attrs', {silent: true});
        this.model.set('attrs', attributes);
    },

    prepareModel: function () {
        var model = this.model,
            attributes = model.get('attrs');

        var preparedModel = {
            tokens: model.get('tokens'),
            title: attributes['.label'].text
        };
        return preparedModel;
    }
});