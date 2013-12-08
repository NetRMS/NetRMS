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
		this.selected = false;
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
			context.rect(this.rect.x - this.rect.w/2, this.rect.y -this.rect.h/2, this.rect.w, this.rect.h);
			context.closePath();
			
			if(this.image) {
				context.drawImage(this.image, this.rect.x - this.rect.w/2, this.rect.y - this.rect.h/2, this.rect.w);
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
			context.fillRect(this.rect.x - this.rect.w/2, this.rect.y - this.rect.h/2, this.rect.w, this.rect.h);
		},
		setSelectionMark: function () {
			var context = stage.maskLayer.getContext("2d");
			
			context.lineWidth = 3;
			context.strokeStyle = Block.COLOR_SELECTED;
			context.strokeRect(this.rect.x - this.rect.w/2, this.rect.y - this.rect.h/2, this.rect.w, this.rect.h);
		},
		select: function () {
			if (!this.selected) {
				this.selected = true;
				this.stage.selectedBlocks.push(this);
			}
			else if(this.stage.mode & Stage.MODE_CTRL) {
				this.selected = false;
				this.stage.selectedBlocks.remove(this);
			}
		},
		hover: function () {
			var context = stage.maskLayer.getContext("2d");
			
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
		remove: function (block) {
			this.blocks.splice(this.blocks.indexOf(block), 1);
			this.xIndex.splice(this.xIndex.indexOf(block), 1);
			this.yIndex.splice(this.yIndex.indexOf(block), 1);
		},
		copy: function () {
			var blockArray = new BlockArray();
			
			blockArray.blocks = this.blocks.slice(0);
			blockArray.xIndex = this.xIndex.slice(0);
			blockArray.yIndex = this.yIndex.slice(0);
			
			return blockArray;
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
			for (var i=0, blocks=this.blocks, _i=blocks.length; i<_i; i++) {
				blocks[i].selected = false;
			}
			
			this.blocks = [];
			this.xIndex = [];
			this.yIndex = [];
		}
	};
	
	/*
	 * Stage
	 */
	function Stage () {
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
		this.mode = Stage.MODE_OFF;
		this.dragged = false;
		this.isDragging = false;
		this.mouseDownPos = null;
		this.selectedImage = null;
		
		this.maskLayer.width = this.shadowLayer.width = this.blockLayer.width = this.link.width = Stage.RESOLUTION[0];
		this.maskLayer.height = this.shadowLayer.height = this.blockLayer.height = this.link.height = Stage.RESOLUTION[1];
		
		this.stage.style.position = this.maskLayer.style.position = this.shadowLayer.style.position = this.blockLayer.style.position = this.link.style.position = "absolute";
		
		document.documentElement.appendChild(this.stage);
		//this.stage.appendChild(this.shadowLayer);
		this.stage.appendChild(this.link);
		this.stage.appendChild(this.blockLayer);
		this.stage.appendChild(this.maskLayer);
		
		this.maskLayer.style.boxShadow = Stage.CANVAS_STYLE;
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
	
	//Stage.RESOLUTION = [1189, 841];
	Stage.RESOLUTION = [841, 594];
	//Stage.RESOLUTION = [594, 420];
	//Stage.RESOLUTION = [420, 297];
	//Stage.RESOLUTION = [297, 210];
	
	Stage.CANVAS_STYLE = "rgba(0, 0, 0, 0.5) 10px 10px 10px";
	Stage.COLOR_GUIDELINE = "rgba(192, 192, 192, 0.5"; // alpha silver
	Stage.COLOR_AREA = "rgba(105, 105, 105, 1"; // dim gray
	Stage.SIZE_AREA = 3;
	Stage.SIZE_GUIDELINE = 1;
	Stage.MODE_OFF = 0;
	Stage.MODE_MOVE = 1 << 1;
	Stage.MODE_AREA = 1 << 2;
	Stage.MODE_CTRL = 1 << 3;
	Stage.MODE_SHIFT = 1 << 4;
	
	Stage.prototype = {
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
		dragEnd: function () {
			var layer = this.maskLayer,
			context = layer.getContext("2d");
			
			context.clearRect(0, 0, layer.width, layer.height); // 초기화
			
			if(this.mode & Stage.MODE_AREA) {
				this.drawSelectedBlocks();
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
			
			context.strokeStyle = Stage.COLOR_GUIDELINE;
			context.lineWidth = Stage.SIZE_GUIDELINE;
			context.stroke();
		},
		drawSelectArea: function (rect) {
			var context = this.maskLayer.getContext("2d");
			
			context.strokeStyle = Stage.COLOR_AREA;
			context.lineWidth = Stage.SIZE_AREA;
			context.strokeRect(rect.x, rect.y, rect.w, rect.h);
		},
		drawSelectedBlocks: function () {
			for(var i=0, blocks=this.selectedBlocks, _i=blocks.size(); i<_i; i++) {
				blocks.get(i).setSelectionMark();
			}
		},
		test1: function () {
			var layer = this.maskLayer,
			context = layer.getContext("2d");
			
			context.font = "16px bold";
			for(var i=0; i<this.blocks.xIndex.length; i++) {
				context.fillStyle = "red";
				context.fillText(i, this.blocks.xIndex[i].rect.x+5, this.blocks.xIndex[i].rect.y);
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
			}
			
			if (this.isDragging) { // 드래그
				var context = this.maskLayer.getContext("2d");
				
				context.clearRect(0, 0, this.maskLayer.width, this.maskLayer.height); // maskLayer 지워주고
				
				if (this.selectable) { // 이동
					var pos = new Pos(this.mouseDownPos.x - this.curPos.x, this.mouseDownPos.y - this.curPos.y);
					
					context.drawImage(pos.x, pos.y, this.selectedImage);				
				}
				else { // 선택
					var pos1 = this.mouseDownPos, pos2 = this.curPos,
					rect = new Rect(Math.min(pos1.x, pos2.x), Math.min(pos1.y, pos2.y), Math.abs(pos2.x - pos1.x), Math.abs(pos2.y - pos1.y)),
					tmpBlocks = this.blocks.getBlocksInRect(rect);
					
					for (var i=0, blocks=this.selectedBlocks, _i=blocks.size(); i<_i; i++) {
						var block = blocks.get(i);
						
						if(tmpBlocks.indexOf(block) > -1) {
							block.select();
						}
					}
					
					for (var i=0, _i=tmpBlocks.length; i<_i; i++) {
						tmpBlocks[i].setSelectionMark();
					}
					
					this.drawSelectedBlocks();
					
					this.drawSelectArea(rect);
				}
			}
			else { // 검사
				var block = this.index.get(this.shadowLayer.getContext("2d").getImageData(this.curPos.x, this.curPos.y, 1, 1).data);
				
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
			this.mode = Stage.MODE_OFF;
				
			if(event.ctrlKey && !event.shiftKey) {
				this.mode |= Stage.MODE_CTRL; 
			}
			if(event.shiftKey && !event.ctrlKey) {
				this.mode |= Stage.MODE_SHIFT;
			}
			
			if (!(event.shiftKey || event.ctrlKey)) { // 단순 클릭이면 전체 선택 해제
				this.selectedBlocks.clear();
				
				this.maskLayer.getContext("2d").clearRect(0, 0, this.maskLayer.width, this.maskLayer.height);
			}
			
			var block = this.selectable;
			if(!block) {
				return;
			}
			else {
				block.select(); // Ctrl 상태에서는 선택 반전 될것
				
				if(block.selected) { // Move 할 수 있으므로, 선택 이미지 copy
					var rect = this.selectedBlocks.getBoundRect();
					this.selectedImage = this.maskLayer.getContext("2d").getImageData(rect.x, rect.y, rect.w, rect.h);
				}
			}
			
			this.maskLayer.getContext("2d").clearRect(0, 0, this.maskLayer.width, this.maskLayer.height);
			
			this.drawSelectedBlocks();
		},
		onMouseUp: function (event) {			
			this.mouseDownPos = null;
			
			if (this.isDragging) {	
				this.isDragging = false;
				
				this.dragEnd();
			}
			else {
				/*
				this.drawSelectedBlocks();
				}*/
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
			this.mouseDownPos = null;
			this.isDragging = false;
		}
	};
	
	window.Stage = Stage;

}) (window);
