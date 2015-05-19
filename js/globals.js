window._ = require('underscore');
window.$ = require('jquery');
window.Backbone = require('backbone');
window.Backbone.$ = $;
window.EventBus = _.extend({}, Backbone.Events, {
    propagateGlobalEvent: function (eventType, eventArgs) {
        return function (event) {
            if(eventArgs) {
                for(var propertyName in eventArgs){
                    var propertyValue = eventArgs[propertyName];
                    if (_.isFunction(propertyValue)) {
                        var returnedValue = propertyValue(event);
                        event[propertyName] = returnedValue;
                    } else if(_.isObject(propertyValue)) {
                        event[propertyName] = propertyValue;
                    }
                }
            }

            EventBus.trigger(eventType, event);
        }
    }
});
window.Handlebars = require('handlebars');