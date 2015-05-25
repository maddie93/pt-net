module.exports = Backbone.Model.extend({
   createCoverityTree: function(model){
        this.getActiveTransitions(model);

   },

   getActiveTransitions: function(model){
       var transitions = model.get('transitions');
       var activeTransactions = [];
       this.setInLinksForAllTransitions(transitions,model);
       _.each(transitions,function(entry){
           if(this.isTransitionActive(entry,model)){
               activeTransactions.push(entry);
           }
       },this);
   },

    setInLinksForAllTransitions: function(transitions,model){
        _.each(transitions,function(entry){
            this.setInLinks(entry,model)
        },this);
    },

    setInLinks: function(transition, model){
        var inLinks = [];
        var allLinks = model.getLinks();
        _.each(allLinks,function(entry){
            if(this.isPointingToTransition(entry,transition)){
                inLinks.push(entry);
            }
        },this);
        transition.inLinks = inLinks;
    },

    isPointingToTransition: function(entry,transition){
        return entry.attributes.target.id == transition.id
    },

    isTransitionActive: function(transition,model){
        var active = true;
        _.each(transition.inLinks,function(link){
            var place = model.getCell(link.attributes.source.id);
            if(place.attributes.tokens<link.getCount){
                active = false;
            }
        });
        return active;
    }
});