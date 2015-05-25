module.exports = Backbone.Model.extend({
   createCoverityTree: function(model){
        this.getActiveTransitions(model);

   },
   getActiveTransitions: function(model){
       var transitions = model.get('transitions');
       var activeTransactions = [];
       this.setInLinksForAllTransitions(transitions,model);
       for(var transition in transitions){
           if(this.isTransitionActive(transition,model)){
               activeTransactions.push(transition);
           }
       }

   },
    setInLinksForAllTransitions: function(transitions,model){
        for (var entry in transitions){
            this.setInLinks(entry,model)
        }
    },
    setInLinks: function(transition, model){
        var inLinks = [];
        var allLinks = model.getLinks;
        for(var entry in allLinks){
            if(this.isPointingToTransition(entry,transition)){
                inLinks.push(entry);
            }
        }
        transition.inLinks = inLinks;
    },
    isPointingToTransition: function(entry,transition){
        return entry.attributes.target.id == transition.id
    },
    isTransitionActive: function(transition,model){
        var active = true;
        for(var link in transition.inLinks){
            var place = model.getCell(link.attributes.source.id);
            if(place.attributes.tokens<link.getSourceCount){
                active = false;
                break;
            }
        }
        return active;
    }
});