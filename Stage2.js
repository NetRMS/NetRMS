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
	
	Stage.COLOR_GUIDE = "rgb(192, 192, 192)"; // silver
	Stage.COLOR_AREA = "rgb(105, 105, 105)"; // dim gray
	Stage.SIZE_AREA = 2;
	Stage.SIZE_GUIDELINE = 1;
	Stage.ZOOM_DEFAULT = 1;
	Stage.ZOOM_MAX = 3;
	Stage.MODE_DEFAULT = 0;
	Stage.MODE_MOVE = 1 << 1;
	Stage.MODE_FULL = 1<< 2;
	Stage.AREA_STYLE = "1px solid red";
	
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
			this.stageImage = null;
			this.zoomValue = Stage.ZOOM_DEFAULT;
			this.documentOverflow = "";
			
			var stage = this.stage, layers = this.layer, mask = this.layer.mask,
			body = document.documentElement;
			
			body.appendChild(this.stage);
			
			this.documentOverflow = body.style.overflow;
			
			for (var k in layers) {
				if (k != "trace") {
					layers[k].style.position = "absolute";
					stage.appendChild(layers[k]);
				}
			}
			this.layer.trace.style.left = "600px";
			this.layer.trace.style.border = "1px solid red";
			this.layer.mask.style.boxShadow = "5px 5px 10px gray";
				
			this.reset(Stage.RESOLUTION[0], Stage.RESOLUTION[1]);
			
			window.addEventListener("resize", this.eventHandler.onWindowResize.bind(this), false);
			mask.addEventListener("mousemove", this.eventHandler.onMouseMove.bind(this), false);
			mask.addEventListener("mousedown", this.eventHandler.onMouseDown.bind(this), false);
			mask.addEventListener("mouseup", this.eventHandler.onMouseOut.bind(this), false);
			mask.addEventListener("mouseout", this.eventHandler.onMouseOut.bind(this), false);
		},
		addBlock: function (x, y) {
			var block = new Block(this);
			
			block.index = this.index.add(block);
			block.rect.x = x;
			block.rect.y = y;
			
			this.blocks.push(block);
			
			return block;
		},
		invalidate: function () {
			this.clear("block");
			this.clear("trace");
			
			for(var i=0, blocks=this.blocks, _i=blocks.size(), block; i<_i; i++) {
				block = blocks.get(i);
				block.draw();
				block.trace();
			}
		},
		getPos: function (event) {
			var stage = this.layer.mask,
			rect = stage.getBoundingClientRect();
			
			return new Pos((event.clientX - rect.left), (event.clientY - rect.top));
		},
		getBlock: function () {
			var pos = this.curPos;
			
			return this.index.get(this.context.trace.getImageData(pos.x, pos.y, 1, 1).data);
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
		clear: function (key) {
			var contexts = this.context, layers = this.layer;
			
			contexts[key].clearRect(0, 0, layers[key].width, layers[key].height);
			
			return contexts[key];
		},
		getImage: function (key) {
			var layers = this.layer;
			
			return this.context[key].getImageData(0, 0, layers[key].width, layers[key].height);
		},
		shiftSelectedBlocksImage: function () {
			var distance = this.getDistance(false), x = distance.x, y = distance.y;
			
			this.clear("selected").putImageData(this.selectedImage, x, y);
		},
		shiftSelectedBlocks: function () {
			var distance = this.getDistance(true), x = distance.x, y = distance.y;
			
			this.clear("block");
			this.clear("selected");
			
			for (var i=0, blocks = this.selectedBlocks, _i=blocks.size(), block; i<_i; i++) {
				block = blocks.get(i);
				block.rect.x += x;
				block.rect.y += y;
				
				this.blocks.remove(block);
				this.blocks.push(block);
			}
			
			this.selectedBlocks.clear();
			
			this.invalidate();
		},
		copyStageImage: function () {
			var layers = this.layer, ct = this.clear("mask");
			
			for (var k in layers) {
				if (k != "mask") {
					this.clear(k);
					if(k != "trace") {
						ct.drawImage(layers[k], 0, 0);
					}
				}
			}
			
			this.stageImage = this.getImage("mask");
		},
		shiftStageImage: function () {
			var distance = this.getDistance(false), x = distance.x, y = distance.y,
			ct = this.clear("mask");
			
			ct.putImageData(this.stageImage, x, y);
		},
		shiftAllBlocks: function () {
			var distance = this.getDistance(true), x = distance.x, y = distance.y;
			
			this.clear("mask");
			
			for (var i=0, blocks=this.blocks, _i=blocks.size(); i<_i; i++) {
				blocks.get(i).rect.x += x;
				blocks.get(i).rect.y += y;
			}
			
			this.invalidate();
		},
		drawSelectingArea: function () {
			var rect = this.getSelectingRect(),
			blocks = this.blocks.getBlocksInRect(rect),
			ct = this.clear("mask");
			
			ct.strokeRect(rect.x, rect.y, rect.w, rect.h);
			
			this.clear("select");
			
			for (var i=0, _i=blocks.length; i<_i; i++) {
				blocks[i].drawSelect();
			}
		},
		drawSelectedBlocks: function () {
			this.clear("selected");
			
			for(var i=0, blocks=this.selectedBlocks, _i=blocks.size(); i<_i; i++) {
				blocks.get(i).drawSelected();
			}
		},
		addSelectedBlocks: function () {
			var rect = this.getSelectingRect(),
			blocks = this.blocks.getBlocksInRect(rect);
			
			this.clear("mask");
			this.clear("select");
			
			for (var i=0, _i=blocks.length; i<_i; i++) {
				blocks[i].select();
			}
			
			this.drawSelectedBlocks();
		},
		getBlocksInSelectingRect: function () {
			var p1 = this.mouseDownPos, p2 = this.curPos, z = this.zoomValue;
			
			return this.blocks.getBlocksInRect(new Rect(Math.min(p1.x, p2.x) / z, Math.min(p1.y, p2.y) / z, Math.abs(p1.x - p2.x) / z, Math.abs(p1.y - p2.y) / z));
		},
		getSelectingRect: function () {
			var p1 = this.mouseDownPos, p2 = this.curPos, z = this.zoomValue;
			
			return new Rect(Math.min(p1.x, p2.x) / z, Math.min(p1.y, p2.y) / z, Math.abs(p1.x - p2.x) / z, Math.abs(p1.y - p2.y) / z);
		},
		initContext: function () {
			var ct = this.context;
			
			ct.block.shadowBlur = 5;
			ct.block.shadowColor = "gray";
			ct.block.shadowOffsetX = 1;
			ct.block.shadowOffsetY = 1;
			
			ct.selected.shadowBlur = 5;
			ct.selected.shadowColor = "blue";
			ct.selected.shadowOffsetX = 1;
			ct.selected.shadowOffsetY = 1;
			
			ct.select.shadowBlur = 5;
			ct.select.shadowColor = "black";
			ct.select.shadowOffsetX = 1;
			ct.select.shadowOffsetY = 1;
			
			ct.mask.strokeStyle = Stage.COLOR_GUIDE;
			ct.mask.lineWidth = 1;
		},
		reset: function (w, h) {
			var contexts = this.context, layers = this.layer, v = this.zoomValue;
			
			for (var k in layers) {
				layers[k].width = w || layers[k].width;
				layers[k].height = h || layers[k].height;
				contexts[k].scale(v, v);
			}
			
			this.initContext();
			this.invalidate();
		},
		set: function (mode, on) {
			if (on) {
				this.mode |= mode;
			}
			else {
				this.mode ^= mode;
			}
		},
		getDistance: function (zoom) {
			var p1 = this.mouseDownPos, p2 = this.curPos, z = this.zoomValue;
			if (p1) {
				if (zoom) {
					return new Pos(Math.floor((p2.x - p1.x) / z), Math.floor((p2.y - p1.y) / z));
				}
				else {
					return new Pos(p2.x - p1.x, p2.y - p1.y);
				}
			}
			
			return new Pos(0, 0);
		},
		fullScreen: function () {
			this.eventHandler.onWindowResize.call(this);
		},
		dispatchEvent: function (event, block) {
			var eventHandler = this.eventHandler[event];
			
			if (eventHandler) {
				eventHandler (block);
			}
		},
		zoomIn: function () {
			if (this.zoomValue < Stage.ZOOM_MAX) {
				this.zoomValue += 0.1;
				
				this.reset();
				
				return true;
			}
			
			return false;
		},
		zoomOut: function () {
			if (this.zoomValue > 0) {
				this.zoomValue -= 0.1;
				
				this.reset();
				
				return true;
			}
			
			return false;
		},
		on: function (event, eventHandler) {
			this.eventHandler[event] = eventHandler;
		}
	};
	
	Stage.prototype.eventHandler = {
		onWindowResize: function (event) {
			var body = document.documentElement;
			
			if (this.mode & Stage.MODE_FULL) {
				body.style.overflow = "hidden";
				
				this.reset(body.clientWidth, body.clientHeight);
			}
			else {
				body.style.overflow = this.documentOverflow;
				
				this.reset(Stage.RESOLUTION[0], Stage.RESOLUTION[1]);
			}
		},
		onMouseMove: function (event) {
			if(!this.isMouseMoved(event)) {
				return;
			}
			
			var distance = this.getDistance(false), x = distance.x, y = distance.y;
			if (!this.isDragging && this.mouseDownPos && (Math.abs(x) > 5 || Math.abs(y) > 5)) {
				this.isDragging = true;
				
				/*
				 * Drag 준비
				 */
				
				if (this.selectable) { // Block 이동
					this.selectedImage = this.getImage("selected");
				}
				else {
					if (this.mode & Stage.MODE_MOVE) { // Stage 이동
						this.copyStageImage();
					}
					else { // 선택
						
					}
				}
			}
			
			if (this.isDragging) {
				
				/*
				 * Drag !!!
				 */
				
				if (this.selectable) { // Block 이동
					this.shiftSelectedBlocksImage();
				}
				else {
					if (this.mode & Stage.MODE_MOVE) { // Stage 이동
						this.shiftStageImage();
					}
					else { // Area 선택
						this.drawSelectingArea();
					}
				}
			}
			else { // 검사
				
				/*
				 * Over
				 */
				
				var block = this.getBlock();
				
				if (block != this.selectable) {
					if (this.selectable) {
						this.dispatchEvent("leave", this.selectable);
						
						this.layer.mask.style.cursor = "default";
					}
					if (block) {
						this.dispatchEvent("enter", block);
						
						this.layer.mask.style.cursor = "pointer";
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
			
			var block = this.selectable;
			if(!block) {
				if (!(event.shiftKey || event.ctrlKey)) { // 단순 클릭이면 전체 선택 해제
					this.selectedBlocks.clear();
				}
			}
			else {
				if (!(event.shiftKey || event.ctrlKey) && !block.selected) { // 단순 클릭이고 선택된 Block을 클릭한것이 아니면 선택 해제
					this.selectedBlocks.clear();
				}
				
				block.select(event.ctrlKey && !event.shiftKey); // Ctrl 상태에서는 선택 반전 될것
			}
			
			this.drawSelectedBlocks();
		},
		onMouseOut: function (event) {
			if (this.isDragging) {	
				this.isDragging = false;
				
				if (this.selectable) { // Block 이동
					this.shiftSelectedBlocks();
				}
				else { // 화면 이동
					if (this.mode & Stage.MODE_MOVE) {
						this.shiftAllBlocks();
					}
					else { // 영역 선택
						this.addSelectedBlocks();
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
