function MenuBase(id, options){
	this.id = id;
	this.options = options.slice();
	this.selection = 0;
}
MenuBase.lineHeight = 14;
MenuBase.prototype = {
	"getSelectedOption" : function(){
		return this.options[this.selection] || null;
	}
};
function SingleDirectionMenu(id, owner, options, x, y, height){
	MenuBase.call(this, id, options);
	this.owner = owner;
	this.x = x;
	this.y = y;
	this.height = height;
}
SingleDirectionMenu.prototype = {
	"onSelectChange" : function(keycode){
		var sel = this.selection;
		if(keycode === 0){
			if(sel === 0)
				sel = this.options.length - 1;
			else
				sel--;
		}else if(keycode == 2){
			if(sel === this.options.length - 1)
				sel = 0;
			else
				sel++;
		}
		this.selection = sel;
	},
	"getSelectedOption" : function(){ return MenuBase.prototype.getSelectedOption.call(this) },

	/*
		Render the simple menu with labels. Height is an optional property
		that clips and allows scrolling
	*/
	"onRender" : function(renderingEngine, dT){
		var options = this.options,
			textX = this.x + 12;
		for(var i = 0; i < options.length; ++i){
			if(i === this.selection)
				renderingEngine.renderStaticSprite('cursor.png', this.x, this.y + i*MenuBase.lineHeight);

			renderingEngine.renderText(options[i].name || options[i], textX, this.y + i*MenuBase.lineHeight);
		}	
	}
};

function MultiDirectionMenu(id, owner, options, width){
	MenuBase.call(this, id, options);
	this.owner = owner;
	this.width = width;
}
MultiDirectionMenu.prototype = {
	"onSelectChange" : function(keycode){
		var sel = this.selection;

		switch(keycode){
			case 0:
				if((sel -= this.width) < 0)
					sel = 0;						
				break;
			case 1:
				if(++sel >= this.options.length)
					sel = this.options.length - 1;				
				break;
			case 2:
				if((sel += this.width) >= this.options.length)
					sel = this.options.length - 1;
				break;
			case 3:
				if(--sel < 0)
					sel = 0;			
				break;
			default:
				break;
		}

		this.selection = sel;
	},
	"getSelectedOption" : function(){ return MenuBase.prototype.getSelectedOption.call(this) },
};

/*===========================
	BATTLE SPECIFIC MENUS
=============================*/
/*	
	TARGET SELECTION MENU
	Allows selection of party and enemies
*/
function TargetSelectionMenu(party, enemies, defaultToParty, multiSelect){
	this.id = 10;
	this.party = party;
	this.enemies = enemies;

	if((this.multiSelect = !!multiSelect)){
		this.selection = !!defaultToParty ? 0 : 1;
	}else{
		this.selection = !!defaultToParty ? 0 : party.length;
	}
}
TargetSelectionMenu.prototype = {
	"onSelectChange" : function(keycode){
		var sel = this.selection;

		//If we are currently selecting party members,
		//use up/down to select between them. Scrolling
		//right changes to enemy selection
		if(sel < this.party.length){
			switch(keycode){
				case 0:
					if(--sel < 0)
						sel = 0;
					break;
				case 1:
					sel = this.party.length;
					break;
				case 2:
					if(++sel >= this.party.length)
						sel = this.party.length - 1;
					break;
				default:
					break;
			}
		}else{
			//If we are selecting monsters then only really consider moving left or right
			if(keycode === 3)
				sel--;
			else if(keycode === 1){
				var max = this.party.length + this.enemies.length;
				if(++sel >= max)
					sel = max-1;
			}
		}

		this.selection = sel;
	},
	"onRender" : function(renderingEngine, dT){
		if((this.multiSelect && this.selection === 0) || this.selection < this.party.length){
			var y = 30 + this.selection*14;			
			var x = 20;

			if(renderingEngine.flickerFast)
				renderingEngine.renderStaticSprite('cursordown.png', x, y);

			renderingEngine.renderText(this.party[this.selection].name, x + 7, y - 15, 'c');
		}else{
			var i = this.multiSelect ? 0 : this.selection - this.party.length;

			do{
				var currentTarget = this.enemies[i];
				var currentTargetCenter = (function(){
					var img = renderingEngine.getImage(currentTarget.img);
					return img.naturalWidth/2 + currentTarget.x || currentTarget.x;
				})();

				if(renderingEngine.flickerFast)
					renderingEngine.renderStaticSprite('cursordown.png', currentTargetCenter - 7, currentTarget.y - 10);

				renderingEngine.renderText(currentTarget.name, currentTargetCenter, currentTarget.y - 25, 'c');
			}while(this.multiSelect && ++i < this.enemies.length)			
		}
	},
	"getSelectedOption" : function(){
		if(this.multiSelect){
			return this.enemies.slice();
		}else{
			if(this.selection < this.party.length){
				return this.party[this.selection];
			}else{
				return [this.enemies[this.selection - this.party.length]];
			}
		}
	}
};

/*
	MAGIC SELECTION MENU
*/
function BattleMagicMenu(owner, options){
	MultiDirectionMenu.call(this, 1, owner, options, 2);
}
BattleMagicMenu.prototype = {
	"onSelectChange" : function(keycode){ return MultiDirectionMenu.prototype.onSelectChange.call(this, keycode);},
	"onRender" : function(renderingEngine, dT){

		renderingEngine.renderWindow(0, 380, renderingEngine.frameWidth, 92);
		renderingEngine.renderWindow(500, 380, 140, 92);	
		var magic = this.options;

		var rows = Math.ceil(magic.length / 2);

		var j = 0;
		for(var i = 0; i < rows; i++){
			var y = 394 + i * 16;
			var k = 0;
			while(j < magic.length && k < 2){
				var spell = MagicList[magic[j]];
				var x = 28 + (k++ * 125);

				renderingEngine.renderText(spell.name, x, y);
				if(j++ === this.selection){
					renderingEngine.renderStaticSprite('cursor.png', x - 10, y);			

					//Render Mana Cost
					renderingEngine.renderText('Cost:', 516, 394);
					renderingEngine.renderText(spell.cost + '/' + this.owner.mp + 'mp',516, 412);

					//Render description
					renderingEngine.renderWindow(0, 344, renderingEngine.frameWidth, 36);
					renderingEngine.renderText(spell.desc, renderingEngine.halfWidth, 360, 'c');
				}
			}
		}
	},
	"getSelectedOption" : function(){
		return MagicList[this.owner.magic[this.selection]];
	}
};

/*
	Basic Alert Prompt is for situations like something happened in the world and the user has to respond to it before we move on
	eg. Battle Over exp breakdown
*/

function BasicAlertPrompt(text){
	this.text = text;
}
BasicAlertPrompt.prototype = {
	"onRender" : function(renderingEngine, dT){
		renderingEngine.renderAlert(this.text);	
	}
};