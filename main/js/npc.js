/*
	Includes everything related to dialogues and non-player characters
*/
function Exchange(text = '', type = 0, options = null){
	this.text = text;
	this.type = type;
	this.options = options;
}
function Dialogue(startingExchange = null, position = 0){
	this.position = position;

	if(typeof startingExchange === 'string')
		startingExchange = new Exchange(startingExchange);

	this.startingExchange = this.currentExchange = startingExchange;
	this.writerLength = 1;
}
Dialogue.prototype = {
	"onKeydown" : function(keycode, ev){
		if(this.writerLength < this.currentExchange.text.length)
			this.writerLength = this.currentExchange.text.length;
		else
			this.currentExchange = null;
	},
	"setExchange" : function(exchange = null){
		this.currentExchange = exchange;
		this.writerLength = 1;
	},
	"onUpdate" : function(dT){
		if(this.currentExchange === null){
			this.setExchange(this.startingExchange);
			return true;
		}

		if(this.writerLength < this.currentExchange.text.length)
			this.writerLength = Math.min(this.writerLength + dT * 20, this.currentExchange.text.length);

		return false;
	},
	"onRender" : function(renderingEngine, dT){
		var y = 0;
		renderingEngine.renderWindow(0, y, renderingEngine.frameWidth, 100);
		renderingEngine.renderText(this.currentExchange.text.substr(0, Math.floor(this.writerLength)), 16, y + 16, 'l', renderingEngine.frameWidth - 32);
	}
};

/*
	NPC have limited animation - 
	0 LEFT
	1 RIGHT
	2 DOWN
	3 UP
*/
function NonPlayerCharacter(img = '', defaultDialogue = null, x = 0, y = 0, direction = 0){
	this.img = img;
	this.dialogue = defaultDialogue;
	this.x = x;
	this.y = y;
	this.direction = 0;
	this.boundingBox = {
		"left" : x - 12,
		"right" : x + 12,
		"top" : y + 24,
		"bottom" : y + 12
	};
}
NonPlayerCharacter.prototype = {
	"onEngage" : function(callerX, callerY){
		var dot = FoofMath.dot(	{ "x" : callerX - this.x, "y" : callerY - this.y}, 
								{ "x" : 0,	"y" : 1.0 });
		if(Math.abs(dot) < 12){
			if(callerX > this.x)
				this.direction = 0;
			else
				this.direction = 1;
		}else if(dot < 0){
			this.direction = 3;
		}else{
			this.direction = 2;
		}

		if(!!this.dialogue)
			EventDispatcher.dispatchDialogueStart(this.dialogue);
	},
	"onRender" : function(renderingEngine, dT){
		var x = Math.floor(this.x),
			y = Math.floor(this.y),
			direction = this.direction,
			img = this.img;
		renderingEngine.executeRoutine(function(){
			var rc = this.backBufferRC;
			img = this.getImage(img);
			rc.drawImage(this.getImage('dropshadow.png'), x - 14, y + 8);
			rc.drawImage(img, direction * 24, 0, 24, 48, x - 12, y - 24, 24, 48);
		});
	}
};