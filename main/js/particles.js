/*
	Simple particle with two potential states and constant speed
*/
function Particle(x, y, dX, dY, lifespan, liveImg, dieImg){
	this.liveImg = liveImg;
	this.dieImg = dieImg;
	this.lifespan = lifespan;
	this.x = x;
	this.y = y;
	this.dX  = dX;
	this.dY = dY;
}
Particle.prototype = {
	"onRender" : function(renderingEngine, dT){
		if( (this.lifespan -= dT) <= 0)
			return true;

		if(!!this.dieImg && this.lifespan < 0.3){
			renderingEngine.renderStaticSprite(this.dieImg, this.x, this.y);
			return false;
		}

		this.x += this.dX * dT;
		this.y += this.dY * dT;

		renderingEngine.renderStaticSprite(this.liveImg, this.x, this.y);
	}
};

/*
	Simple particle system that can either emit from a point or from a direction offscreen
*/
function ParticleSystem(x, y, info, minLife, maxLife, frequency, speed, limit, liveImg, dieImg){
	this.particles = [];
	this.tick = 0;
	this.frequency = frequency;
	this.x = x;
	this.y = y;
	this.minLife = minLife;
	this.maxLife = maxLife;
	this.liveImg = liveImg;
	this.dieImg = dieImg;
	this.info = info;
	this.speed = speed;
	this.limit = limit;
	this.count = 0;
}
ParticleSystem.prototype = {
	"onRender" : function(renderingEngine, dT){
		if( (this.limit === 0 || this.count < this.limit) && (this.tick += dT) >= this.frequency){
			this.tick = 0;
			var x, y, dX, dY, liveImg, dieImg, lifespan = this.maxLife - Math.random() * (this.maxLife - this.minLife);

			//Support lists of images or single images						
			if(!!this.liveImg.length && typeof this.liveImg !== 'string'){							
				liveImg = this.liveImg[Math.floor(Math.random() * this.liveImg.length)];
			}else{
				liveImg = this.liveImg;
			}

			if(!!this.dieImg && this.dieImg.length && typeof this.dieImg !== 'string'){
				dieImg = this.dieImg[Math.random() * this.dieImg.length];
			}else{
				dieImg = this.dieImg;
			}

			if(this.info.type === 'directional'){							
				x = Math.random() * 640 * 2 - 640;
				y = this.y;

				dX = this.speed * this.info.direction.x;
				dY = this.speed * this.info.direction.y;
			}else if(this.info.type === 'point'){
				x = this.x;
				y = this.y;
				var angle = Math.random() * Math.PI;
				dX = this.speed * Math.cos(angle);
				dY = this.speed * Math.sin(angle);
			}
			this.particles.push(new Particle(x, y, dX, dY, lifespan, liveImg, dieImg));
			this.count++;
		}
		if(this.particles.length > 0){
			for(var i = this.particles.length - 1; i >= 0; --i){
				if(this.particles[i].onRender(renderingEngine, dT)){
					this.particles.splice(i, 1);
				}
			}
		}else{
			return (this.limit > 0 && this.count >= this.limit);
		}

		return false;
	}
};