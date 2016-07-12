/*
	RenderingEngine - handles most of the direct calls to the canvas
	This contains all the frame buffers and exposes methods
	for drawing shapes, animated/static sprites, text,
	and also passing custom rendering routines as for attack effects.

	Additionally, RenderingEngine owns a map(string, image) for sprite resources
*/
function RenderingEngine(canvas){
	this.imageMap = {};
	this.onInitCallbacks = [];
	this.rc = canvas.getContext('2d');
	this.frameWidth = +canvas.getAttribute('width');
	this.frameHeight = +canvas.getAttribute('height');

	this.halfWidth = this.frameWidth / 2;
	this.halfHeight = this.frameHeight / 2;

	this.backBuffer = document.createElement('canvas');
	this.backBuffer.setAttribute('width', ''+this.frameWidth);
	this.backBuffer.setAttribute('height', ''+this.frameHeight);

	this.backBufferRC = this.backBuffer.getContext('2d');

	this.elapsedTime = 0;

	this.flickerFast = this.flickerSlow = false;

	//For compositing and other effects
	this.frameBuffer = document.createElement('canvas');
	this.frameBuffer.setAttribute('width', this.frameWidth);
	this.frameBuffer.setAttribute('height', this.frameHeight);

	this.frameBufferRC = this.frameBuffer.getContext('2d');
}
RenderingEngine.IMAGE_ROOT = './imgs/'
RenderingEngine.prototype = {
	/*
		The engine is initialized with an array of image file paths.
		Once all of the images load (or 404) then the engine is considered in
		a ready state
	*/
	"initialize" : function(images){
		images = images || [];
		var initializationStack = [];

		for(var i = 0; i < images.length; ++i){
			var img = this.imageMap[images[i]] = new Image();
			img.src = RenderingEngine.IMAGE_ROOT + images[i];
			initializationStack.push(img);

			//404 Error will automatically go into the console
			img.onerror = img.onload = (function(){
				initializationStack.pop();
				if(initializationStack.length === 0){
					this.onInitializationComplete();
				}
			}).bind(this);
		}
	},

	"onTick" : function(dT){
		this.elapsedTime += dT;
		this.flickerFast = Math.sin(this.elapsedTime * 20) > 0.0;
		this.flickerSlow = Math.sin(this.elapsedTime * 12) > 0.0;
	},
	"attachInitializationCallback" : function(callback){
		this.onInitCallbacks.push(callback);
	},

	"onInitializationComplete" : function(){
		this.fontImage = this.imageMap['font.png'];
		for(var i = 0; i < this.onInitCallbacks.length; ++i){
			this.onInitCallbacks[i].call(this);
		}
	},
	"renderAlert" : function(text, yOffset = 16){
		this.renderWindow(0, 0, this.frameWidth, 36);
		this.renderText(text, this.halfWidth, yOffset, 'c');
	},
	"renderProgress" : function(x,y,width,height,progress,innercolor,outercolor){
		this.backBufferRC.fillStyle = innercolor;
		this.backBufferRC.strokeStyle = outercolor;
		this.backBufferRC.lineWidth = 2;

		this.backBufferRC.fillRect(x,y,Math.round(width*progress),height);
		this.backBufferRC.strokeRect(x,y,width,height);
	},
	"renderWindow" : function(x, y, width, height, fill = '#8822A9', stroke = '#EEE'){
		this.fillRect(x, y, width, height, fill);
		this.strokeRect(x + 4, y + 4, width - 8, height, 8, stroke);
	},
	"fillRect" : function(x,y,width,height,color){
		this.backBufferRC.fillStyle = color;
		this.backBufferRC.fillRect(x,y,width,height);
	},
	"strokeRect" : function (x, y, width, height, lineWidth, color){
		this.backBufferRC.strokeStyle = color;
		this.backBufferRC.lineWidth = lineWidth;
		this.backBufferRC.strokeRect(x, y, width, height);
	},
	"getImage" : function(img){
		return this.imageMap[img];
	},
	"renderStaticSprite" : function(sprite, x, y){
		var img;
		if(!(img = this.imageMap[sprite]))
			return;
		this.backBufferRC.drawImage(img, x, y);
	},
	"renderStaticSpriteToFrameBuffer" : function(sprite, x, y){
		var img;
		if(!(img = this.imageMap[sprite]))
			return;
		this.frameBufferRC.drawImage(img, x, y);
	},
	"renderAnimatedSprite" : function(sprite, x, y, width, height){
		var img;
		if(!(img = this.imageMap[sprite.img]))
			return;					

		var w = sprite.width,
			h = sprite.height;

		this.backBufferRC.drawImage(img, Math.floor(sprite.currentFrame) * w, 0, w, h, Math.round(x), Math.round(y), w, h);
	},
	"renderAnimatedSpriteToFrameBuffer" : function(sprite, x, y, width, height){
		var img;
		if(!(img = this.imageMap[sprite.img]))
			return;					

		var w = sprite.width,
			h = sprite.height;

		this.frameBufferRC.drawImage(img, Math.floor(sprite.currentFrame) * w, 0, w, h, Math.round(x), Math.round(y), w, h);		
	},

	/*
		renderText supports text wrapping and text scale if the parameters are passed
	*/
	"renderText" : function(text, x, y, alignment, maxwidth = 0, scale = 1){
		var img; 
		if(!(img = this.fontImage))
			return;

		var charWidth = 9,
			charHeight = 14,
			leading = 18;

		x = Math.round(x);
		y = Math.round(y);
		
		if(!!alignment){
			switch(alignment){
				case 'c':
					x -= text.length*5;
					break;
				case 'r':
					x -= text.length*10
				default: break;
			}
		}
		text = text.toUpperCase();

		var i;
		if(maxwidth > 0){
			var maxCharacters = Math.ceil(maxwidth / charWidth);
			//Split into lines, breaking on words
			var lines = [];
			if(text.length > maxCharacters){
				var words = text.split(' ');
				var line = '';

				for(i = 0; i < words.length; ++i){
					if(line === ''){
						line = words[i];
						continue;
					}
					if(line.length + words[i].length < maxCharacters){
						line += ' ' + words[i];
					}else{
						lines.push(line);
						line = words[i];
						continue;
					}
				}

				if(line !== '')
					lines.push(line);

			}else{
				lines.push(text);
			}
			for(i = 0; i < lines.length; ++i){
				(function(text, x, y){
					for(var j = 0; j < text.length; ++j){			
						if(j > 0 && text[j-1] === ' ')
							x -= 5 * scale;

						this.backBufferRC.drawImage(img, (text.charCodeAt(j)-32) * charWidth, 0, charWidth, charHeight, x, y, charWidth * scale, charHeight * scale);
						x += 10 * scale;
					}
				}.bind(this))(lines[i], x, y + i * leading * scale)
			}
			return;
		}

		for(i = 0; i < text.length; ++i){			
			if(i > 0 && text[i-1] === ' ')
				x -= 5 * scale;

			this.backBufferRC.drawImage(img, (text.charCodeAt(i)-32) * charWidth, 0, charWidth, charHeight, x, y, charWidth * scale, charHeight * scale);
			x += 10 * scale;
		}
	},

	"clearScreen" : function(){
		this.backBufferRC.fillStyle= '#000';
		this.backBufferRC.fillRect(0,0,width,height);
	},

	/*
		TODO : Flesh this out alongside a scene graph
		At this time, most objects already implement an "onRender" callback
		instead.
	*/
	"render" : function(scene){
		this.clearScreen();
		var objects = scene.objects;

		for(var i = objects.length - 1; i >= 0; --i){
			var object = objects[i];
			switch(object.type){
				case 1:   //TEXT
					this.renderText(object.content, object.x, object.y, object.alignment);
					break;
				default:
					break;
			}
		}
	},
	"executeRoutine" : function(fn){
		fn.call(this);
	},
	"swapBuffers" : function(){
		this.rc.drawImage(this.backBuffer,0,0);
	},
};