function BattleAction(){
	
}

var BattleActionConstants = {
	"QUEUE_CYCLE_COOLDOWN" : 2
};

var EnterFromLeftAction = {
	"onInit" : function(owner){
		this.targetX = owner.x;
		this.owner = owner;
		owner.x -= 100;

		//Entering from left? Facing right!
		this.owner.direction = 1;

		if(!!owner.sprite)
			owner.sprite.setAnimation(1);
	},
	"onUpdate" : function(dT){
		this.owner.x += dT * 150;

		if(this.owner.x >= this.targetX){
			this.owner.x = this.targetX;
			this.owner.sprite.setAnimation(0);
			return true;
		}
		return false;
	}
};

var EnterFromRightAction = {
	"onInit" : function(owner){
		this.targetX = owner.x;
		this.owner = owner;
		owner.x += 100;

		//Entering from right? Facing left!
		this.owner.direction = -1;

		if(!!owner.sprite)
			owner.sprite.setAnimation(1);
	},
	"onUpdate" : function(dT){
		//Returns true when complete
		//fnsole.log(this.owner);
		this.owner.x -= dT * 150;

		if(this.owner.x <= this.targetX){
			this.owner.x = this.targetX;
			if(!!this.owner.sprite)
				this.owner.sprite.setAnimation(0);
			return true;
		}
		return false;
	}
};

var NPCDeathAction = {
	"onInit" : function(owner){
		this.owner = owner;
		this.alpha = 1.0;

		this.erasureBars = [];
	},
	"onUpdate" : function(dT){
		return this.alpha <= 0.0;
	},
	"onRender" : function(renderingEngine, dT){
		var i;
		var img = renderingEngine.getImage(this.owner.img);
		var naturalHeight = img.naturalHeight,
			naturalWidth = img.naturalWidth;

		if(!this.ready){

			this.erasureBars = new Array(Math.floor(naturalHeight/2));

			for(i = 0; i < this.erasureBars.length; i++){
				this.erasureBars[i] = i;
			}
			for(i = 0; i < this.erasureBars.length; ++i){
				var j = Math.floor(Math.random() * i);
				var temp = this.erasureBars[i];
				this.erasureBars[i] = this.erasureBars[j];
				this.erasureBars[j] = temp;
			}			
			this.ready = true;
		}


		this.alpha -= 0.7 * dT;

		var alpha = this.alpha,
			alphaFlipped = 1.0 - alpha,
			x = this.owner.x,
			y = this.owner.y,
			erasureBars = this.erasureBars;

		renderingEngine.executeRoutine(function(){
			var w = this.frameWidth,
				h = this.frameHeight,
				frameBufferRC = this.frameBufferRC,
				frameBuffer = this.frameBuffer,
				rc = this.backBufferRC;

				frameBufferRC.save();
				frameBufferRC.clearRect(0,0,w,h);

				frameBufferRC.drawImage(img, 0, 0);

				frameBufferRC.fillStyle = '#F00';
				frameBufferRC.globalCompositeOperation = 'source-in';
				frameBufferRC.fillRect(0,0,w,h);

				frameBufferRC.globalAlpha = 0.5;
				frameBufferRC.globalCompositeOperation = 'source-atop';
				frameBufferRC.drawImage(img, 0, 0);

				frameBufferRC.globalAlpha = 1;
				frameBufferRC.globalCompositeOperation = 'destination-out';
				frameBufferRC.fillStyle = '#000';
				for(i = 0; i < Math.floor(alphaFlipped*erasureBars.length); ++i){
					frameBufferRC.fillRect(0,erasureBars[i]*2,w,2);	
				}

				frameBufferRC.restore();

				rc.save();
				rc.globalAlpha = 1;
				//rc.globalAlpha = alpha * 2;
				rc.translate(x, y);
				//rc.translate(x + alphaFlipped * naturalWidth, y);
				//rc.rotate(alphaFlipped);
				rc.globalCompositeOperation = 'source-over';
				//rc.globalCompositeOperation = 'overlay';
				rc.drawImage(frameBuffer, 0,0);
				//rc.drawImage(frameBuffer, 0,0);
				// rc.globalAlpha = 1;
				// rc.globalCompositeOperation = 'source-over';
				rc.restore();
		});
	}
};

var CombatAction = (function(){
	var combatMovementDistance = 50,
		combatMovementSpeed = 120;

	this.onInit = function(owner, ability, targets){
		this.owner = owner;
		this.targetX = owner.x;
		this.life = 0;
		this.ability = ability;
		this.targets = targets;
		if(!!this.ability){
			this.ability.targets = targets;
			this.ability.owner = owner;
		}
		this.phase = 0;

		if(!!owner.sprite)
			owner.sprite.setAnimation(1);		
	};

	this.onAnnounce = function(){
		if(!this.announced){
			EventDispatcher.dispatchAlertMessage(this.ability.name, 2);				
			this.announced = true;
		}
	},

	this.onPreAction = function(dT){
		if(this.owner.direction > 0){
			//FACING RIGHT
			this.owner.x += combatMovementSpeed * dT;
			if(this.owner.x >= this.targetX + combatMovementDistance){
				this.owner.x = this.targetX + combatMovementDistance;
				this.phase = 1;
				this.life = 0;
			}
		}else{
			//FACING LEFT
			this.owner.x -= combatMovementSpeed * dT;
			if(this.owner.x <= this.targetX - combatMovementDistance){
				this.owner.x = this.targetX - combatMovementDistance;
				this.phase = 1;
				this.life = 0;
			}
		}
	};

	this.onPostAction = function(dT){
		if(this.owner.x !== this.targetX){
			this.owner.x -= dT * combatMovementSpeed * this.owner.direction;
			if(this.owner.direction > 0){
				if(this.owner.x <= this.targetX){
					this.owner.x = this.targetX;
				}
			}else{
				if(this.owner.x >= this.targetX){
					this.owner.x = this.targetX;
				}					
			}
		}

		if( (this.life += dT) >= BattleActionConstants.QUEUE_CYCLE_COOLDOWN)
			return true;
	};

	return this;
})();

var CastSpellAction = {
	"onInit" : function(owner, ability, targets){
		CombatAction.onInit.call(this, owner, ability, targets);
	},
	"onUpdate" : function(dT){		
		switch(this.phase){
			//Beginning to cast spell - step forward
			case 0:
				CombatAction.onAnnounce.call(this);
				CombatAction.onPreAction.call(this, dT);
				break;

			//DEAL SOME DAMAGE!!!
			case 2:
				for(var i = 0; i < this.targets.length; ++i){
					var target = this.targets[i];
					target.takeDamage(this.owner, this.ability.baseDamage, this.ability.type, (this.owner.x > target.x ? -1 : 1));
				}
				this.phase = 3;
				break;
			//Done casting spell - retreat to position!
			case 3: 
				return CombatAction.onPostAction.call(this, dT);
			default:
				break;
		}

		return false;
	},
	"onRender" : function(renderingEngine, dT){
		switch(this.phase){
			case 1:
				if(!this.ability.onRender || this.ability.onRender(renderingEngine, dT)){
					this.phase = 2;
				}
				break;
			default:
				break;
		}
	}
};

var BasicAttackAction = {
	"onInit" : function(owner, ability, targets){
		CombatAction.onInit.call(this, owner, ability, targets);
	},
	"onUpdate" : function(dT){
		this.life += dT;
		switch(this.phase){
			//Beginning to cast spell - step forward
			case 0:
				CombatAction.onPreAction.call(this, dT);
				break;			
			//DEAL SOME DAMAGE!!!
			case 1:
			case 2:
				for(var i = 0; i < this.targets.length; ++i){
					var target = this.targets[i];
					target.takeDamage(this.owner, (this.attack || this.owner.strength), 'physical', (this.owner.x > target.x ? -1 : 1));
				}
				this.phase = 3;
				break;
			//Done casting spell - retreat to position!
			case 3: 
				return CombatAction.onPostAction.call(this, dT);
			default:
				break;
		}

		return false;
	},
	"onRender" : function(renderingEngine, dT){
		
	}
};