/*
	The modules and individual state machines all interact with the main game controller
	via events, similar to a standard Win32 application "message pump" 
	eg. (pseudo code)
	while(msg != WM_QUIT){
		respondToMessage();
	}

	Credit goes where credit is due: The polyfill for CustomEvent is taken from the internet.
*/
var EventDispatcher = (function(d){
	/*
		CustomEvent polyfill
	*/
	(function (w) {
	  if ( typeof w.CustomEvent === "function" ) return false;

	  function CustomEvent ( event, params ) {
	    params = params || { bubbles: false, cancelable: false, detail: undefined };
	    var evt = document.createEvent( 'CustomEvent' );
	    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
	    return evt;
	   }

	  CustomEvent.prototype = w.Event.prototype;

	  w.CustomEvent = CustomEvent;
	})(window);

	var dispatchEvent = function(event, detail){
		d.dispatchEvent(new CustomEvent(event, {"detail":detail}));
	};

	this.dispatchAlertMessage = function(message, duration){
		dispatchEvent('alertmsg', {"message" : message, "duration" : duration});
	};

	this.dispatchDialogueStart = function(dialogue){
		dispatchEvent("gameplayevent", {"type" : 'dialoguestart', "dialogue" : dialogue});
	};
	this.dispatchNPCDeathEvent = function(npc){
		dispatchEvent("gameplayevent", {"type" : 'npcdeath', "npc" : npc});
	};

	this.dispatchBattleStart = function(battle){
		dispatchEvent("gameplayevent", {"type" : 'battlestart', "battle" : battle});
	};
	this.dispatchStateCompleteEvent = function(){
		dispatchEvent("gameplayevent", {"type" : 'gamestatecomplete'});	
	};
	this.dispatchStatePushEvent = function(stateMachine, args){
		dispatchEvent("gameplayevent", {"type" : 'gamestatepush', "stateMachine" : stateMachine, "args" : args});
	};

	//ALL purpose events
	this.dispatchGameplayEvent = function(type){
		dispatchEvent("gameplayevent", {"type" : type});		
	};

	return this;
})(document);