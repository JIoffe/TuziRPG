/*
	Combatant is the base class for all in-battle combatants. 
	inherited functions include taking damage and flashing from receiving damage
	This .js also owns the battle damage display logic, for brevity
*/
function DamageDisplay(amount, direction, x, y){
	this.amount = amount;
	this.lifespan = 1.0;

	this.dX = 30 * direction;
	this.dY = -150;

	this.x = x;
	this.y = y;
}
DamageDisplay.prototype = {
	"onRender" : function(renderingEngine, dT){
		if( (this.lifespan -= dT) <= 0)
			return true;

		this.dY += dT * 400;
		this.x += this.dX * dT;
		this.y += this.dY * dT;

		renderingEngine.renderText(''+this.amount, this.x, this.y, 'c', 0, 2);
	}
};

function Combatant(){}
Combatant.DAMAGE_DISPLAYS = [];
Combatant.renderDamageDisplays = function(renderingEngine, dT){
	for(var i = Combatant.DAMAGE_DISPLAYS.length - 1; i >= 0; --i){
		if(Combatant.DAMAGE_DISPLAYS[i].onRender(renderingEngine, dT)){
			Combatant.DAMAGE_DISPLAYS.splice(i, 1);
		}
	}
}

Combatant.prototype = {
	"getImage" : function(){
		return this.img;
	},
	"takeDamage" : function(attacker, amount, type, direction){
		var defense;
		if(type === 'physical'){
			defense = this.def;
			amount += (attacker.strength || 0);
			amount = amount + (amount + attacker.level)/32 * (amount * attacker.level)/32;
		}else{
			//MAGIC ATTACKS
			defense = this.mdef;
			amount += (amount + attacker.level)/64 * (amount * attacker.magpower)/64;
		}	

		var damage = (amount * (255 - defense)/256) + 1;
		damage -= damage * Math.random() * 0.05; //Up to 5 percent variance

		damage = Math.floor(damage);

		Combatant.DAMAGE_DISPLAYS.push(new DamageDisplay(damage, direction, this.x + 32, this.y + 32));

		this.hp = Math.floor(Math.max(0, this.hp - damage));

		this.damageFlash = {"type" : type, "life" : 1.0};
	},

	"onRender" : function(renderingEngine, dT){
		/*
			Render flashing effect for damage
		*/
		var img = this.getImage();

		if(!!this.damageFlash){
			renderingEngine.executeRoutine(function(){
			var w = renderingEngine.frameWidth,
				h = renderingEngine.frameHeight,
				frameBufferRC = renderingEngine.frameBufferRC,
				frameBuffer = renderingEngine.frameBuffer,
				rc = renderingEngine.backBufferRC;

				frameBufferRC.save();
				frameBufferRC.clearRect(0,0,w,h);

				/*
					Determine overlay style... default is just to flash white
				*/
				var type = this.damageFlash.type,
					fillStyle,
					xOffset = ((this.damageFlash.life-1)*32) % 256;


				if(type === 'fire'){
					//Draw dancing flames in background				
					var flameDance = Math.sin(xOffset*1.2)*2;		

					frameBufferRC.globalAlpha = 0.3;
					frameBufferRC.translate(10, 8);
					renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);
					frameBufferRC.translate(flameDance*2, -4);
					renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);
					frameBufferRC.translate(-flameDance, -4);
					renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);						
					
					//Render fire to clear up framebuffer for second layer
					rc.drawImage(frameBuffer, this.x,this.y);
					frameBufferRC.restore();
					frameBufferRC.save();

					frameBufferRC.translate(10, 12);
					renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);					
					frameBufferRC.globalAlpha = 1.0;
					frameBufferRC.fillStyle = '#FC0';
					frameBufferRC.globalCompositeOperation = 'source-in';					
					frameBufferRC.fillRect(0,0,w,h);							

					rc.drawImage(frameBuffer, this.x,this.y);
					fillStyle = frameBufferRC.createPattern(renderingEngine.getImage('burning.png'), 'repeat');
					renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);
					frameBufferRC.fillStyle = fillStyle;

					frameBufferRC.translate(xOffset, 0);
					frameBufferRC.globalCompositeOperation = 'source-in';					
					frameBufferRC.fillRect(0,0,w,h);		
					frameBufferRC.globalCompositeOperation = 'color-burn source-over';
					frameBufferRC.fillRect(0,0,w,h);				

					frameBufferRC.translate(-xOffset + 2, xOffset);						
					frameBufferRC.globalCompositeOperation = 'source-in';					
					frameBufferRC.fillRect(0,0,w,h);		
					frameBufferRC.globalCompositeOperation = 'color-burn source-over';
					frameBufferRC.fillRect(0,0,w,h);							

					frameBufferRC.translate(-2, -xOffset);						

					frameBufferRC.globalAlpha = 0.6;
					frameBufferRC.globalCompositeOperation = 'darken';
					renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);
					frameBufferRC.globalCompositeOperation = 'overlay';
					renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);
				}else{
					//BASIC FLASH WHITE
					if(renderingEngine.flickerFast){
						renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);
						frameBufferRC.fillStyle = '#FEE';
						frameBufferRC.globalCompositeOperation = 'source-in';
						frameBufferRC.fillRect(0,0,w,h);

						frameBufferRC.globalAlpha = 0.2;
						frameBufferRC.globalCompositeOperation = 'source-over';
						renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);
					}else{					
						renderingEngine.renderStaticSpriteToFrameBuffer(img, 0, 0);
					}
				}					

				frameBufferRC.restore();

				rc.drawImage(frameBuffer, this.x,this.y);
			}.bind(this));

			//AI characters keep flashing until they are removed from battle
			if((this.damageFlash.life -= dT) <= 0 && (!this.ai || this.hp > 0) ){
				delete this.damageFlash;
				this.damageFlash = null;
			}
		}else{
			renderingEngine.renderStaticSprite(img, this.x, this.y);
		}
	}

}