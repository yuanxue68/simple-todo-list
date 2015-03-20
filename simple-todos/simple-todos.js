Tasks=new Mongo.Collection("tasks");

if (Meteor.isClient) {
    Meteor.subscribe("tasks");
    Template.body.helpers({
	  	tasks:function(){
        if(Session.get("hideCompleted")){
          return Tasks.find({checked:{$ne:true}},{sort:{createdAt:-1}});
        } else{
          return Tasks.find({}, {sort:{createdAt: -1}});
        }
	  	},
      hideCompleted: function(){
        return Session.get("hideCompleted");
      },
      incompleteCount: function(){
        return Tasks.find({checked:{$ne:true}}).count();
      },
  	});

  	Template.body.events({
  		"submit .new-task": function(event){
  			console.log(event);
  			var text=event.target.text.value;
  			Meteor.call("addTask",text);

  			event.target.text.value="";
  			return false;
  		},
      "change .hide-completed input": function(event){
        Session.set("hideCompleted", event.target.checked);
      }
  	});

    Template.task.helpers({
      isOwner: function(){
        console.log("Meteor.userId() is "+Meteor.userId());
        console.log("this.owner is "+this.owner);
        return this.owner === Meteor.userId();
      }
    });

  	Template.task.events({
  		"click .toggle-checked": function(){
        Meteor.call("setChecked",this._id, ! this.checked);
  		},

  		"click .delete": function(){
  			Meteor.call("deleteTask",this._id);
  		},

      "click .toggle-private":function () {
        Meteor.call("setPrivate",this._id,!this.private);
      }
  	});

    Accounts.ui.config({
      passwordSignupFields:"USERNAME_ONLY"
    });
}

Meteor.methods({
  addTask: function(text){
    if(!Meteor.userId()){
      throw new Meteor.Error("not-authorized");
    }
    console.log("adding task for "+Meteor.userId);
    Tasks.insert({
      text:text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },

  deleteTask: function(taskId){
    Tasks.remove(taskId);
  },

  setChecked: function(taskId,setChecked){
    Tasks.update(taskId,{$set: {checked:setChecked}});
  },

  setPrivate: function(taskId,setToPrivate){
    var task=Tasks.findOne(taskId);
    if(task.owner!==Meteor.userId())
    {
      throw new Meteor.Error("not authorized");
    }
    Tasks.update(taskId,{$set:{private:setToPrivate}});
  }

});

if (Meteor.isServer) {
  	Meteor.startup(function () {
    // code to run on server at startup
  	});

    Meteor.publish("tasks",function(){
      return Tasks.find({
        $or:[
            {private:{$ne:true}},
            {owner:this.userId}
          ]
      });
    });
}
