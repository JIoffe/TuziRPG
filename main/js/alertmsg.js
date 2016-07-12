/*
	These are for the alert messages that show at the top of the screen,
	like the name of a spell being cast
*/
var AlertMessageQueue = (function(){
	var alertMessages = [],
		defaultDuration = 1;

	function AlertMessage(message, duration){
		this.message = message;
		this.duration = duration || defaultDuration;
	}
	AlertMessage.prototype = {
		"onUpdate" : function(dT){
			return (this.duration -= dT) <= 0;
		}
	};

	this.add = function(message, duration){
		alertMessages.push( new AlertMessage(message, duration) );
	}
	this.onRender = function(renderingEngine, dT){
		if(alertMessages.length === 0)
			return;

		renderingEngine.renderAlert(alertMessages[0].message);		

		if(alertMessages[0].onUpdate(dT)){
			alertMessages.splice(0, 1);
		}
	}

	return this;
})();