(function (window, undefined) {

	"use strict";

	var _ = {};
	
	extend(_, "util");
	
	/*
	 * Rect
	 */
	function Rect(x, y, w, h) {
		this.x = Math.round(x || 0);
		this.y = Math.round(y || 0);
		this.w = Math.round(w || 1);
		this.h = Math.round(h || 1);
	}

	/*
	 * Pos
	 */
	function Pos(x, y) {
		this.x = Math.round(x || 0);
		this.y = Math.round(y || 0);
	}
	
	/*
	 * Index
	 */
	function Index () {}
	Index.prototype = {
		map: {
		},
		index: 1,
		add: function (block) {
			var index = _.numToRGBString(this.index++);
			this.map[index] = block;
			
			return index;
		},
		get: function (rgb) {
			return this.map[_.arrayToRGBString(rgb)];
		}
	};
	
	/*
	 * Block
	 */
	function Block(stage) {
		this.initialize(stage);
	}
	Block.SIZE = 30;
	Block.COLOR_BORDER = "rgb(192, 192, 192)";
	Block.COLOR_BACKGROUND = "rgb(255, 255, 255)";
	Block.COLOR_SELECTED = "rgb(0, 255, 0)"; // lime
	Block.COLOR_HOVER = "rgb(255, 105, 0)";
	Block.SIZE_BORDER = 1;
	
	
	Block.prototype = {
		initialize: function (stage) {
			this.stage = stage;
			this.rect = new Rect(0, 0, Block.SIZE, Block.SIZE);
			this.index = "#000000";
			this.color = Block.COLOR_BACKGROUND;
			this.border = Block.COLOR_BORDER;
			this.image = null;
			this.selected = false;
			this.links = {};
		},
		draw: function () {
			var context = this.stage.context.block;
			
			context.beginPath();
			context.rect(this.rect.x - this.rect.w/2, this.rect.y -this.rect.h/2, this.rect.w, this.rect.h);
			context.closePath();
			
			context.fillStyle = this.color;
			context.fill();
			
			if(this.image) {
				context.drawImage(this.image, this.rect.x - this.rect.w/2, this.rect.y - this.rect.h/2, this.rect.w);
			}
		},
		drawSelect: function () {
			var context = this.stage.context.select;
			
			context.beginPath();
			context.rect(this.rect.x - this.rect.w/2, this.rect.y -this.rect.h/2, this.rect.w, this.rect.h);
			context.closePath();
			
			context.fillStyle = this.color;
			context.fill();
			
			if(this.image) {
				context.drawImage(this.image, this.rect.x - this.rect.w/2, this.rect.y - this.rect.h/2, this.rect.w);
			}
		},
		drawSelected: function () {
			var context = stage.context.selected;
			
			context.beginPath();
			context.rect(this.rect.x - this.rect.w/2, this.rect.y -this.rect.h/2, this.rect.w, this.rect.h);
			context.closePath();
			
			context.fillStyle = this.color;
			context.fill();
		},
		trace: function () {
			var context = stage.context.trace;
			
			context.fillStyle = this.index;
			context.fillRect(this.rect.x - this.rect.w/2, this.rect.y - this.rect.h/2, this.rect.w, this.rect.h);
		},
		select: function (ctrlKey) {
			if (!this.selected) {
				this.selected = true;
				this.stage.selectedBlocks.push(this);
			}
			else if(ctrlKey) {
				this.selected = false;
				this.stage.selectedBlocks.remove(this);
			}
		},
		hover: function () {
			var context = stage.context.mask;
			
			context.lineWidth = 3;
			context.strokeStyle = Block.COLOR_HOVER;
			context.strokeRect(this.rect.x - this.rect.w/2, this.rect.y - this.rect.h/2, this.rect.w, this.rect.h);
		}
	};
	
	/*
	 * BlockArray
	 */
	
	function BlockArray() {
		this.blocks = [];
		this.xIndex = [];
		this.yIndex = [];
	}
	
	BlockArray.prototype = {
		push: function (block) {
			this.blocks.push(block);
			
			var x = this.xSearch(block.rect.x);
			var y = this.ySearch(block.rect.y);
			
			this.xIndex.splice(x, 0, block);
			this.yIndex.splice(y, 0, block);
		},
		remove: function (block) {
			this.blocks.splice(this.blocks.indexOf(block), 1);
			this.xIndex.splice(this.xIndex.indexOf(block), 1);
			this.yIndex.splice(this.yIndex.indexOf(block), 1);
		},
		xSearch: function (x) {
			return _.search(this.xIndex, x, function(_block) {
				return _block.rect.x;
			});
		},
		ySearch: function (y) {
			return _.search(this.yIndex, y, function(_block) {
				return _block.rect.y;
			});
		},
		getBoundRect: function () {
			return new Rect(this.xIndex[0].rect.x - this.xIndex[0].rect.w/2, this.yIndex[0].rect.y - this.yIndex[0].rect.h/2,
				this.xIndex[this.xIndex.length - 1].rect.x + this.xIndex[this.xIndex.length - 1].rect.w/2,
				this.yIndex[this.yIndex.length - 1].rect.y + this.yIndex[this.yIndex.length - 1].rect.h/2);
		},
		getBlocksInRect: function (rect) {
			var array = new BlockArray(),
			low, high;
			
			low = this.xSearch(rect.x);
			high = this.xSearch(rect.w + rect.x);
			
			for(var i=low, blocks=this.xIndex; i<high; i++) {
				array.push(blocks[i]);
			}
			
			low = this.ySearch.call(array, rect.y);
			high = this.ySearch.call(array, rect.h + rect.y);
			
			return array.yIndex.slice(low, high);
		},
		get: function (index) {
			return this.blocks[index];
		},
		find: function (block) {
			return this.blocks.indexOf(block);
		},
		size: function () {
			return this.blocks.length;
		},
		clear: function () {
			for (var i=0, blocks=this.blocks, _i=blocks.length; i<_i; i++) {
				blocks[i].selected = false;
			}
			
			this.blocks = [];
			this.xIndex = [];
			this.yIndex = [];
		},
		raise: function (block) {
			this.blocks.splice(this.blocks.indexOf(block), 1);
			this.blocks.push(block);
		}
	};
	
	/*
	 * Stage
	 */
	function Stage (id) {
		this.initialize(id);
	}
	
	//Stage.RESOLUTION = [1189, 841];
	//Stage.RESOLUTION = [841, 594];
	Stage.RESOLUTION = [594, 420];
	//Stage.RESOLUTION = [420, 297];
	//Stage.RESOLUTION = [297, 210];
	
	Stage.COLOR_GUIDELINE = "rgb(192, 192, 192)"; // alpha silver
	Stage.COLOR_AREA = "rgb(105, 105, 105)"; // dim gray
	Stage.SIZE_AREA = 2;
	Stage.SIZE_GUIDELINE = 1;
	Stage.MODE_DEFAULT = 0;
	Stage.MODE_SELECT = 1 << 1;
	Stage.MODE_FULL = 1<< 2;
	
	Stage.prototype = {
		initialize: function (id){
			this.stage = document.getElementById(id);
			this.layer = {
				trace: document.createElement("canvas"),
				link: document.createElement("canvas"),
				block: document.createElement("canvas"),
				selected: document.createElement("canvas"),
				select: document.createElement("canvas"),
				mask : document.createElement("canvas")
			};
			this.context = {
				trace: this.layer.trace.getContext("2d"),
				link: this.layer.link.getContext("2d"),
				block: this.layer.block.getContext("2d"),
				selected: this.layer.selected.getContext("2d"),
				select: this.layer.select.getContext("2d"),
				mask: this.layer.mask.getContext("2d")
			};
			this.index = new Index();
			this.blocks = new BlockArray();
			this.selectedBlocks = new BlockArray();
			this.lastPos = new Pos();
			this.curPos = new Pos();
			this.selectable = null;
			this.mode = Stage.MODE_DEFAULT;
			this.dragged = false;
			this.isDragging = false;
			this.translate = new Pos();
			this.mouseDownPos = null;
			this.selectedImage = null;
			this.backupImage = null;
			
			document.documentElement.appendChild(this.stage);
			
			var stage = this.stage, layers = this.layer, mask = this.layer.mask;
			
			for (var key in layers) {
				layers[key].width = Stage.RESOLUTION[0];
				layers[key].height = Stage.RESOLUTION[1];
				if (key != "trace") {
					layers[key].style.position = "absolute";
					stage.appendChild(layers[key]);
				}
			}
			
			this.layer.mask.style.boxShadow = "5px 5px 10px gray";
				
			this.context.block.shadowBlur = 5;
			this.context.block.shadowColor = "gray";
			this.context.block.shadowOffsetX = 1;
			this.context.block.shadowOffsetY = 1;
			
			this.context.selected.shadowBlur = 5;
			this.context.selected.shadowColor = "blue";
			this.context.selected.shadowOffsetX = 1;
			this.context.selected.shadowOffsetY = 1;
			
			this.context.select.shadowBlur = 5;
			this.context.select.shadowColor = "black";
			this.context.select.shadowOffsetX = 1;
			this.context.select.shadowOffsetY = 1;
			
			var _this = this;
			window.addEventListener("resize", function (event) {
				event.preventDefault();
				
				_this.eventHandler.onWindowResize.call(_this, event);
			}, false);
			
			mask.onmousemove = function(event) {
				event.preventDefault();
				
				_this.eventHandler.onMouseMove.call(_this, event);
			};
			
			mask.onmousedown = function (event) {
				event.preventDefault();
				
				_this.eventHandler.onMouseDown.call(_this, event);
			};
			
			mask.onmouseup = mask.onmouseout = function (event) {
				event.preventDefault();
				
				_this.eventHandler.onMouseOut.call(_this, event);
			};
		},
		addBlock: function (x, y) {
			var block = new Block(this);
			
			block.index = this.index.add(block);
			block.rect.x = x;
			block.rect.y = y;
			
			this.blocks.push(block);
			
			return block;
		},
		invalidate: function () {console.log(this.layer.block.width);
			this.context.block.clearRect(0, 0, this.layer.block.width, this.layer.block.height);
			this.context.trace.clearRect(0, 0, this.layer.trace.width, this.layer.trace.height);
			
			for(var i=0, blocks=this.blocks, _i=blocks.size(), block; i<_i; i++) {
				block = blocks.get(i);
				block.draw();
				block.trace();
			}
		},
		getPos: function (event) {
			var stage = this.layer.mask,
			rect = stage.getBoundingClientRect();
			
			return new Pos(event.clientX - rect.left - stage.clientLeft, event.clientY - rect.top - stage.clientTop);
		},
		isMouseMoved: function (event) {
			var pos = this.getPos(event);
			
			if(pos.x == this.curPos.x && pos.y == this.curPos.y) {
				return false;
			}
			
			this.curPos = pos;
			
			return true;
		},
		drawGuideLine: function () {
			var context = this.context.mask,
			layer = this.layer.mask,
			pos = this.curPos;
			
			context.beginPath();
			context.moveTo(pos.x, 0);
			context.lineTo(pos.x, layer.height);
			context.moveTo(0, pos.y);
			context.lineTo(layer.width, pos.y);
			context.closePath();
			
			context.strokeStyle = Stage.COLOR_GUIDELINE;
			context.lineWidth = Stage.SIZE_GUIDELINE;
			context.stroke();
		},
		drawSelectingRect: function (rect) {
			var context = this.context.mask;
			
			context.clearRect(0, 0, stage.layer.mask.width, stage.layer.mask.height);
			
			if (rect) {
				context.save();
				
				context.strokeStyle = Stage.COLOR_AREA;
				context.lineWidth = Stage.SIZE_AREA;
				context.strokeRect(rect.x, rect.y, rect.w, rect.h);
				
				context.restore();
			}
			
		},
		drawSelectedBlocks: function () {
			this.context.selected.clearRect(0, 0, this.layer.selected.width, this.layer.selected.height);
			
			for(var i=0, blocks=this.selectedBlocks, _i=blocks.size(); i<_i; i++) {
				blocks.get(i).drawSelected();
			}
		},
		getSelectedRect: function () {
			var pos1 = this.mouseDownPos, pos2 = this.curPos;
			
			return new Rect(Math.min(pos1.x, pos2.x), Math.min(pos1.y, pos2.y), Math.abs(pos2.x - pos1.x), Math.abs(pos2.y - pos1.y));
		},
		reset: function (x, y) {
			this.context.block.translate(x, y);
			this.context.trace.translate(x, y);
		},
		fullScreen: function (on) {
			var _this = this,
			w = document.documentElement.clientWidth,
			h = document.documentElement.clientHeight;
			
			function fullScreen() {
				for (var key in _this.layer) {
					_this.layer[key].width = w;
					_this.layer[key].height = h;
				}
				
				_this.invalidate();
			}
			
			if (on) {
				window.addEventListener("resize", fullScreen, false);
				
				fullScreen(true);
			}
			else {
				window.removeEventListener("resize", fullScreen);
			}
		},
		dispatchEvent: function (event, block) {
			var eventHandler = this.eventHandler[event];
			
			if (eventHandler) {
				eventHandler (block);
			}
		},
		on: function (event, eventHandler) {
			this.eventHandler[event] = eventHandler;
		}
	};
	
	Stage.prototype.eventHandler = {
		onWindowResize: function (event) {
			
		},
		onMouseMove: function (event) {
			if(!this.isMouseMoved(event)) {
				return;
			}
			
			if (!this.isDragging && this.mouseDownPos && (Math.abs(this.curPos.x - this.mouseDownPos.x) > 5 || Math.abs(this.curPos.y - this.mouseDownPos.y) > 5)) {
				this.isDragging = true;
				
				if (this.selectable) { // Block 이동
					this.selectedImage = this.context.selected.getImageData(0, 0, this.layer.selected.width, this.layer.selected.height);
				}
				else {
					if (this.mode & Stage.SELECT) { // 영역 선택
						
					}
					else { // 화면 이동
						this.context.mask.clearRect(0, 0, this.layer.mask.width, this.layer.mask.height);
						for (var key in this.layer) {
							if (key != "trace" && key != "mask") {
								this.context.mask.drawImage(this.layer[key], 0, 0);
							}
							
							if (key != "mask") {
								this.context[key].clearRect(0, 0, this.layer[key].width, this.layer[key].height);
							}
						}
						this.backupImage = this.context.mask.getImageData(0, 0, this.layer.mask.width, this.layer.mask.height);
						
					}
				}
			}
			
			if (this.isDragging) {
				if (this.selectable) { // Block 이동
					var context = stage.context.selected;
					
					context.clearRect(0, 0, this.layer.mask.width, this.layer.mask.height); // mask 지워주고
					context.putImageData(this.selectedImage, this.curPos.x - this.mouseDownPos.x, this.curPos.y - this.mouseDownPos.y);
				}
				else {
					if (this.mode & Stage.SELECT) { // 영역 선택
						var rect = this.getSelectedRect(),
						blocks = this.blocks.getBlocksInRect(rect);
						
						this.context.select.clearRect(0, 0, this.layer.select.width, this.layer.select.height);
						
						for (var i=0, _i=blocks.length; i<_i; i++) {
							blocks[i].drawSelect();
						}
						
						this.drawSelectingRect(rect);
					}
					else { // 화면 이동
						var context = this.context.mask;
						
						context.clearRect(0, 0, this.layer.mask.width, this.layer.mask.height);
						context.putImageData(this.backupImage, this.curPos.x - this.mouseDownPos.x, this.curPos.y - this.mouseDownPos.y);
					}
				}
			}
			else { // 검사
				var block = this.index.get(this.context.trace.getImageData(this.curPos.x, this.curPos.y, 1, 1).data);
				
				if (block != this.selectable) {
					if (this.selectable) {
						this.dispatchEvent("leave", this.selectable);
					}
					if (block) {
						this.dispatchEvent("enter", block);
					}
				}
				
				this.selectable = block;
			}
		},
		onMouseDown: function (event) {			
			if(event.button != 0) { // left button (== 0) only
				return;
			}
			
			this.mouseDownPos = this.getPos(event);
			
			if (!(event.shiftKey || event.ctrlKey)) { // 단순 클릭이면 전체 선택 해제
				this.selectedBlocks.clear();
			}			
			
			var block = this.selectable;
			if(!block) {
			
			}
			else {
				block.select(event.ctrlKey && !event.shiftKey); // Ctrl 상태에서는 선택 반전 될것
			}
			
			this.drawSelectedBlocks();
		},
		onMouseOut: function (event) {			
			if (this.isDragging) {	
				this.isDragging = false;
				
				if (this.selectable) { // Block 이동
					
					this.context.block.clearRect(0, 0, this.layer.block.width, this.layer.block.height);
					this.context.selected.clearRect(0, 0, this.layer.selected.width, this.layer.selected.height);
					
					for (var i=0, blocks = this.selectedBlocks, _i=blocks.size(), block; i<_i; i++) {
						block = blocks.get(i);
						block.rect.x += (this.curPos.x - this.mouseDownPos.x);
						block.rect.y += (this.curPos.y - this.mouseDownPos.y);
						
						this.blocks.remove(block);
						this.blocks.push(block);
						
					}
					
					this.invalidate();
					
					this.selectedBlocks.clear();
				}
				else { // 선택
					if (this.mode & Stage.MODE_SELECT) {
						var rect = this.getSelectedRect(),
						blocks = this.blocks.getBlocksInRect(rect);
						
						this.context.select.clearRect(0, 0, this.layer.select.width, this.layer.select.height);
						
						for (var i=0, _i=blocks.length; i<_i; i++) {
							blocks[i].select();
						}
						
						this.drawSelectedBlocks();
						
						this.drawSelectingRect();
					}
					else { // 화면 이동
						var x = this.curPos.x - this.mouseDownPos.x,
						y = this.curPos.y - this.mouseDownPos.y;
						
						this.context.mask.clearRect(0, 0, this.layer.mask.width, this.layer.mask.height);
						
						for (var i=0, blocks=this.blocks, _i=blocks.size(); i<_i; i++) {
							blocks.get(i).rect.x += x;
							blocks.get(i).rect.y += y;
						}
						
						this.invalidate();
					}
				}
			}
			else {
			}
			
			this.mouseDownPos = null;
		}
	};
	
	window.Stage = Stage;

}) (window);
