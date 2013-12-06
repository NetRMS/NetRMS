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
		this.stage = stage;
		this.rect = new Rect(0, 0, Block.SIZE, Block.SIZE);
		this.index = "#000000";
		this.color = Block.COLOR_BACKGROUND;
		this.border = Block.COLOR_BORDER;
		this.image = null;
		this.links = {};
	}
	Block.SIZE = 30;
	Block.COLOR_BORDER = "rgb(192, 192, 192)";
	Block.COLOR_BACKGROUND = "rgb(255, 255, 255)";
	Block.COLOR_SELECTED = "rgb(0, 255, 0)"; // lime
	Block.COLOR_HOVER = "rgb(255, 105, 0)";
	Block.SIZE_BORDER = 1;
	
	
	Block.prototype = {
		draw: function () {
			var context = stage.blockLayer.getContext("2d");
			
			context.beginPath();
			context.rect(this.rect.x, this.rect.y , this.rect.w, this.rect.h);
			context.closePath();
			
			if(this.image) {
				context.drawImage(this.image, this.rect.x, this.rect.y, this.rect.w);
			}
			else {
				context.fillStyle = this.color;
				context.fill();
				context.lineWidth = Block.SIZE_BORDER;
				context.strokeStyle = this.border;
				context.stroke();
			}
		},
		shadow: function () {
			var context = stage.shadowLayer.getContext("2d");
			
			context.fillStyle = this.index;
			context.fillRect(this.rect.x, this.rect.y , this.rect.w, this.rect.h);
		},
		select: function () {
			var context = stage.maskLayer.getContext("2d");
			
			context.lineWidth = 3;
			context.strokeStyle = Block.COLOR_SELECTED;
			context.strokeRect(this.rect.x, this.rect.y , this.rect.w, this.rect.h);
		},
		hover: function () {
			var context = stage.maskLayer.getContext("2d");
			
			context.lineWidth = 3;
			context.strokeStyle = Block.COLOR_HOVER;
			context.strokeRect(this.rect.x, this.rect.y , this.rect.w, this.rect.h);
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
			
			this.xIndex.splice(this.xSearch(block.rect.x), 0, block);
			this.yIndex.splice(this.ySearch(block.rect.y), 0, block);
		},
		xSearch: function (x) {
			return _.search(this.xIndex, x, function(_block) {
				return _block.rect.x + _block.rect.w/2;
			});
		},
		ySearch: function (y) {
			return _.search(this.yIndex, y, function(_block) {
				return _block.rect.y + _block.rect.h/2;
			});
		},
		remove: function (block) {
			this.blocks.splice(this.blocks.indexOf(block), 1);
			this.xIndex.splice(this.xIndex.indexOf(block), 1);
			this.yIndex.splice(this.yIndex.indexOf(block), 1);
		},
		getBoundRect: function () {
			return new Rect(this.xIndex[0].rect.x, this.yIndex[0].rect.y,
				this.xIndex[this.xIndex.length - 1].rect.x + this.xIndex[this.xIndex.length - 1].rect.w,
				this.yIndex[this.yIndex.length - 1].rect.y + this.yIndex[this.yIndex.length - 1].rect.h);
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
			this.blocks = [];
			this.xIndex = [];
			this.yIndex = [];
		}
	};
	
	/*
	 * Stage
	 */
	function Stage2 () {
		this.stage = document.createElement("div");
		this.maskLayer = document.createElement("canvas");
		this.shadowLayer = document.createElement("canvas");
		this.blockLayer = document.createElement("canvas");
		this.link = document.createElement("canvas");
		this.index = new Index();
		this.blocks = new BlockArray();
		this.selectedBlocks = new BlockArray();
		this.lastPos = new Pos();
		this.curPos = new Pos();
		this.selectable = null;
		//this.mouseDown = false;
		this.mode = Stage2.MODE_OFF;
		this.dragged = false;
		this.isDragging = false;
		this.dragStartPos = null;
		this.selectedImage = null;
		
		this.maskLayer.width = this.shadowLayer.width = this.blockLayer.width = this.link.width = Stage2.RESOLUTION[0];
		this.maskLayer.height = this.shadowLayer.height = this.blockLayer.height = this.link.height = Stage2.RESOLUTION[1];
		
		this.stage.style.position = this.maskLayer.style.position = this.shadowLayer.style.position = this.blockLayer.style.position = this.link.style.position = "absolute";
		
		document.documentElement.appendChild(this.stage);
		//this.stage.appendChild(this.shadowLayer);
		this.stage.appendChild(this.link);
		this.stage.appendChild(this.blockLayer);
		this.stage.appendChild(this.maskLayer);
		
		this.maskLayer.style.boxShadow = Stage2.CANVAS_STYLE;
		//this.blockLayer.style.left = "200px";
		//this.shadowLayer.style.left = "400px";
		
		
		var _this = this;
		window.addEventListener("resize", function (event) {
			event.preventDefault();
			
			_this.eventHandler.onWindowResize.call(_this, event);
		}, false);
		
		this.maskLayer.onmousemove = function(event) {
			event.preventDefault();
			
			_this.eventHandler.onMouseMove.call(_this, event);
		};
		
		this.maskLayer.onmousedown = function (event) {
			event.preventDefault();
			
			_this.eventHandler.onMouseDown.call(_this, event);
		};
		
		this.maskLayer.onmouseup = function (event) {
			event.preventDefault();
			
			_this.eventHandler.onMouseUp.call(_this, event);
		};
		
		this.maskLayer.onmouseout = function (event) {
			event.preventDefault();
			
			_this.eventHandler.onMouseOut.call(_this, event);
		};
	}
	
	//Stage2.RESOLUTION = [1189, 841];
	Stage2.RESOLUTION = [841, 594];
	//Stage2.RESOLUTION = [594, 420];
	//Stage2.RESOLUTION = [420, 297];
	//Stage2.RESOLUTION = [297, 210];
	
	Stage2.CANVAS_STYLE = "rgba(0, 0, 0, 0.5) 10px 10px 10px";
	Stage2.COLOR_GUIDELINE = "rgba(192, 192, 192, 0.5"; // alpha silver
	Stage2.COLOR_AREA = "rgba(105, 105, 105, 1"; // dim gray
	Stage2.SIZE_AREA = 3;
	Stage2.SIZE_GUIDELINE = 1;
	Stage2.MODE_OFF = 0;
	Stage2.MODE_MOVE = 1 << 1;
	Stage2.MODE_AREA = 1 << 2;
	Stage2.MODE_CTRL = 1 << 3;
	Stage2.MODE_SHIFT = 1 << 4;
	
	Stage2.prototype = {
		addBlock: function (x, y) {
			var block = new Block(this);
			
			block.index = this.index.add(block);
			block.rect.x = x;
			block.rect.y = y;
			
			this.blocks.push(block);
			
			return block;
		},
		drawBlock: function (block) {
			block.draw();
			block.shadow();
		},
		invalidate: function () {
			for(var i=0, blocks=this.blocks, _i=blocks.size(); i<_i; i++) {
				this.drawBlock(blocks.get(i));
			}
		},
		getPos: function (event) {
			var rect = this.maskLayer.getBoundingClientRect(),
			canvas = this.maskLayer;
			
			return new Pos(event.clientX - rect.left - canvas.clientLeft, event.clientY - rect.top - canvas.clientTop);
		},
		isMouseMoved: function (event) {
			var pos = this.getPos(event);
			
			if(pos.x == this.curPos.x && pos.y == this.curPos.y) {
				return false;
			}
			
			this.curPos = pos;
			
			return true;
		},
		mouseTest: function (event) { // 선택 된 것 있으면 다시 그려주고, 선택 가능한 것 있으면 다시 그려줌
			/*
			 * 다시 그리는 순서
			 * 1. 선택된것 (selectedBlocks) highlight
			 * 2. hover 있는 경우 highlight
			 */
			this.maskLayer.getContext("2d").clearRect(0, 0, this.maskLayer.width, this.maskLayer.height); // 초기화
			
			for(var i=0, blocks=this.selectedBlocks, _i=blocks.size(); i<_i; i++) {
				blocks.get(i).select();
			}
			
			var block = this.index.get(this.shadowLayer.getContext("2d").getImageData(this.curPos.x, this.curPos.y, 1, 1).data);
			if(block) {
				if(this.selectedBlocks.find(block) == -1) { // 선택되어 있는 경우는 hover 하지 말도록
					block.hover();
				}
				
				if(block != this.selectable) {
					if(this.selectable) {
						//this.onLeave(this.selectable);
					}
					
					//this.onEnter(block);
				}
			}
			else if(this.selectable){
				//this.onLeave(this.selectable);
			}

			this.selectable = block;
		},
		dragStart: function () {
			this.isDragging = true;
			
			if(this.mode & Stage2.MODE_MOVE) {
				var rect = this.BlockArray.getBoundRect();
				this.selectedImage = this.maskLayer.getContext("2d").getImageData(rect.x, rect.y, rect.w, rect.h);
			}
		},
		dragEnd: function () {
			var layer = this.maskLayer,
			context = layer.getContext("2d");
			
			context.clearRect(0, 0, layer.width, layer.height); // 초기화
			
			if(this.mode & Stage2.MODE_AREA) {
				for(var i=0, blocks=this.selectedBlocks, _i=blocks.size(); i<_i; i++) {
					blocks.get(i).select();
				}
			}
		},
		drag: function () {
			if(this.mode & Stage2.MODE_AREA) {
				var pos1 = this.dragStartPos, pos2 = this.curPos;
				
				this.drawSelectArea(pos1, pos2);
			
				var blocks = this.blocks.getBlocksInRect(new Rect(Math.min(pos1.x, pos2.x), Math.min(pos1.y, pos2.y), Math.abs(pos2.x - pos1.x), Math.abs(pos2.y - pos1.y)));
				
				for(var i=0, _i=blocks.length; i<_i; i++) {
					blocks[i].select();
				}
				
				// rect = this.selectedBlocks.getBoundRect()
				/*
				for(var i=0, blocks=this.blocks, _i=blocks.size(); i<_i; i++) {
					var rect = blocks.get(i).rect;
					
					if(_.isPointInRect(new Pos(rect.x + rect.w/2, rect.y + rect.h/2), pos1, pos2)) {
						blocks.get(i).select();
					}
				}*/
			}
			else if(this.mode & Stage2.MODE_MOVE) {
				var pos = new Pos(this.dragStartPos.x - this.curPos.x, this.dragStartPos.y - this.curPos.y);
				
				this.maskLayer.getContext("2d").drawImage(pos.x, pos.y, this.selectedImage);				
			}
		},
		drawGuideLine: function () {
			var context = this.maskLayer.getContext("2d"),
			pos = this.curPos;
			
			context.beginPath();
			context.moveTo(pos.x, 0);
			context.lineTo(pos.x, layer.height);
			context.moveTo(0, pos.y);
			context.lineTo(layer.width, pos.y);
			context.closePath();
			
			context.strokeStyle = Stage2.COLOR_GUIDELINE;
			context.lineWidth = Stage2.SIZE_GUIDELINE;
			context.stroke();
		},
		drawSelectArea: function (pos1, pos2) {
			var context = this.maskLayer.getContext("2d");
			
			context.strokeStyle = Stage2.COLOR_AREA;
			context.lineWidth = Stage2.SIZE_AREA;
			context.strokeRect(pos1.x, pos1.y, pos2.x - pos1.x, pos2.y - pos1.y);
		},
		test1: function () {
			var layer = this.maskLayer,
			context = layer.getContext("2d");
			
			context.font = "16px bold";
			for(var i=0; i<this.blocks.xIndex.length; i++) {
				context.fillStyle = "red";
				context.fillText(i, this.blocks.xIndex[i].rect.x+5, this.blocks.xIndex[i].rect.y);
			}
		}
	};
	
	Stage2.prototype.eventHandler = {
		onWindowResize: function (event) {
			
		},
		onMouseMove: function (event) {
			if(!this.isMouseMoved(event)) {
				return;
			}
			
			this.mouseTest();
			
			if(this.dragStartPos && (Math.abs(this.curPos.x - this.dragStartPos.x) > 5 || Math.abs(this.curPos.y - this.dragStartPos.y) > 5)) {
				if(!this.isDragging) {
					this.dragStart();
				}
				
				this.drag();
			}
		},
		onMouseDown: function (event) {			
			if(event.button != 0) { // left button (== 0) only
				return;
			}
			
			this.dragStartPos = this.getPos(event);
			
			this.maskLayer.getContext("2d").clearRect(0, 0, this.maskLayer.width, this.maskLayer.height); // mask 새로 그릴 준비
			
			this.mode = Stage2.MODE_OFF;
				
			if(event.ctrlKey) {
				this.mode |= Stage2.MODE_CTRL; 
			}
			if(event.shiftKey) {
				this.mode |= Stage2.MODE_SHIFT;
			}
			
			if(!(this.mode & Stage2.MODE_CTRL || this.mode & Stage2.MODE_SHIFT)) {
				this.selectedBlocks.clear();
			}
			
			var block = this.selectable;
			if(!block) { // 빈 공간 click 시 영역선택
				this.mode |= Stage2.MODE_AREA;
				
				return;
			}
			else {
				this.mode |= Stage2.MODE_MOVE;
				
				var index = this.selectedBlocks.find(block);
				
				if(index == -1) {
					this.selectedBlocks.push(block);
				}
				
				if(this.mode & Stage2.MODE_CTRL && index > -1) {
					this.selectedBlocks.splice(index, 1);
				}
			}
			
			//this.offset = new Pos(this.curPos.x/this.ratio - block.rect.x, this.curPos.y/this.ratio - block.rect.y);
			
			for(var i=0, blocks=this.selectedBlocks, _i=blocks.size(); i<_i; i++) { // 마스크 새로 그리기
				blocks.get(i).select();
			}
		},
		onMouseUp: function (event) {
			this.dragStartPos = null;
			
			if(this.isDragging) {
				this.isDragging = false;
				
				this.dragEnd();
			}
			else {
				//
			}
			
			/*
			var index = this.selectedBlocks.indexOf(block);
			if(index > -1) {
				this.selectedBlocks.splice(index, 1); // 선택취소
				
				block.hover();
			}
			else {
				this.selectedBlocks.push(block); // 선택
			}*/
		},
		onMouseOut: function (event) {
			this.dragStartPos = null;
			this.isDragging = false;
		}
	};
	
	window.Stage = Stage2;

}) (window);
