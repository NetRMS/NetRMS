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
		path: function (context) {
			context.beginPath();
			context.rect(this.rect.x - this.rect.w/2, this.rect.y -this.rect.h/2, this.rect.w, this.rect.h);
			context.closePath();
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
	Stage.MODE_SELECT = 1 << 3;
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
			this.mode = Stage.MODE_SELECT;
			this.dragged = false;
			this.isDragging = false;
			this.translate = new Pos();
			this.mouseDownPos = null;
			this.selectedImage = null;
			this.stageImage = null;
			this.zoomValue = Stage.ZOOM_DEFAULT;
			this.documentOverflow = "";
			this.eventHandler = {};
			
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
			
			window.addEventListener("resize", Stage.eventHandler.onWindowResize.bind(this), false);
			mask.addEventListener("mousemove", Stage.eventHandler.onMouseMove.bind(this), false);
			mask.addEventListener("mousedown", Stage.eventHandler.onMouseDown.bind(this), false);
			mask.addEventListener("mouseup", Stage.eventHandler.onMouseOut.bind(this), false);
			mask.addEventListener("mouseout", Stage.eventHandler.onMouseOut.bind(this), false);
		},
		addLayer: function (layer) {
			var canvas = layer.canvas;
			
			//this.stage.appendChild(canvas);
			this.stage.insertBefore(canvas, this.layer.mask);
			
			canvas.width = this.layer.mask.width;
			canvas.height = this.layer.mask.height;
			canvas.style.position = "absolute";
			
			layer.set();
		},
		cursor: function (style) {
			this.layer.mask.style.cursor = style;
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
			var contexts = this.context, layers = this.layer, z = this.zoomValue;
			
			contexts[key].clearRect(0, 0, layers[key].width / z, layers[key].height / z);
			
			return contexts[key];
		},
		getImage: function (key) {
			var layers = this.layer;
			
			return this.context[key].getImageData(0, 0, layers[key].width, layers[key].height);
		},
		shiftSelectedBlocksImage: function () { // canvas에 그릴때는 false
			var distance = this.getDistance(false), x = distance.x, y = distance.y;
			
			this.clear("selected").putImageData(this.selectedImage, x, y);
		},
		shiftSelectedBlocks: function () { // 좌표 다룰때는 true
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
					if(k != "trace") {
						ct.drawImage(layers[k], 0, 0);
					}
					
					this.clear(k);
				}
			}
			
			this.stageImage = this.getImage("mask"); 
		},
		shiftStageImage: function () { // 그릴때는 false
			var distance = this.getDistance(false), x = distance.x, y = distance.y,
			ct = this.clear("mask");
			
			ct.putImageData(this.stageImage, x, y);
		},
		shiftAllBlocks: function () { // 좌표는 true
			var distance = this.getDistance(true), x = distance.x, y = distance.y;
			
			this.clear("mask");
			
			for (var i=0, blocks=this.blocks, _i=blocks.size(); i<_i; i++) {
				blocks.get(i).rect.x += x;
				blocks.get(i).rect.y += y;
			}
			
			this.invalidate();
		},/*
		drawSelectingArea: function () {
			var rect = this.getSelectingRect(),
			blocks = this.blocks.getBlocksInRect(rect);

			this.clear("select");
			
			for (var i=0, _i=blocks.length; i<_i; i++) {
				blocks[i].drawSelect();
			}
		},*/
		drawSelectedBlocks: function () {
			this.clear("selected");
			
			for(var i=0, blocks=this.selectedBlocks, _i=blocks.size(); i<_i; i++) {
				blocks.get(i).drawSelected();
			}
		},
		getBlocksInSelectingRect: function () {
			var p1 = this.mouseDownPos, p2 = this.curPos, z = this.zoomValue;
			
			return this.blocks.getBlocksInRect(new Rect(Math.min(p1.x, p2.x) / z, Math.min(p1.y, p2.y) / z, Math.abs(p1.x - p2.x) / z, Math.abs(p1.y - p2.y) / z));
		},
		getDragRect: function () {
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
			Stage.eventHandler.onWindowResize.call(this);
		},
		zoomIn: function () {
			if (this.zoomValue < Stage.ZOOM_MAX) {
				this.zoomValue += 0.1;
				
				this.reset();
			}
		},
		zoomOut: function () {
			if (this.zoomValue > 0) {
				this.zoomValue -= 0.1;
				
				this.reset();
			}
		},
		fire: function (type, event) {
			var handler = this.eventHandler[type];
			
			if (handler) {
				for (var i=0, _i=handler.length; i<_i; i++) {
					handler[i](event);
				}
			}
		},
		on: function (type, handler) {
			var tmp = this.eventHandler[type] || [];
			
			tmp.push(handler);
			
			this.eventHandler[type] = tmp;
		}
	};
	
	Stage.eventHandler = {
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
				
				this.fire("dragstart", {
					"type": "dragstart",
					"block": this.selectable
				});
			}
			
			if (this.isDragging) {
				if (this.selectable) { // Block 이동
					this.shiftSelectedBlocksImage();
				}
				else {
					if (this.mode & Stage.MODE_MOVE) { // Stage 이동
						this.shiftStageImage();
					}
					else { // Area 선택
						//this.drawSelectingArea();
					}
				}
				
				this.fire("drag", {
					"type": "drag",
					"x": x,
					"y": y,
					"block": this.selectable,
					"rect": this.getDragRect()
				});
			}
			else { // 검사
				
				/*
				 * Over
				 */
				
				var block = this.getBlock();
				
				if (block != this.selectable) {
					if (this.selectable) {
						this.fire("leave", {
							"type": "leave",
							"block": this.selectable
						});
					}
					if (block) {
						this.fire("enter", {
							"type": "enter",
							"block": block
						});
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
			
			if (!(event.shiftKey || event.ctrlKey) && !(this.selectable && this.selectable.selected)) {
				this.fire("cancel", {
					"type": "cancel"
				});
			}
			
			if (this.selectable) {
				this.selectable.select(event.ctrlKey && !event.shiftKey);
				this.fire("select", {
					"type": "select"
				});
			}
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
						var rect = this.getDragRect(),
						blocks = this.blocks.getBlocksInRect(rect);
						
						for (var i=0, _i=blocks.length; i<_i; i++) {
							blocks[i].select();
						}
					}
				}
				
				this.fire("dragend", {
					"type": "dragend"
				});
			}
			else {
			}
			
			this.mouseDownPos = null;
		}
	};
	
	function BlockManager (stage) {
		this.initialize(stage);
	}
	BlockManager.prototype = {
		initialize: function (stage) {
			this.stage = stage;
			
			//stage.on()
		}
	};
	
	function DefaultManager (stage) {
		this.initialize(stage);
	}
	DefaultManager.prototype = {
		initialize: function (stage) {
			this.stage = stage;
			
			stage.on("enter", this.onEnter);
			stage.on("leave", this.onLeave);
		},
		onLeave: function (data) {
			stage.cursor("default");
		},
		onEnter: function (data) {
			stage.cursor("pointer");
		}
	};
	
	function StageManager () {
	}
	StageManager.prototype = {
		initialize: function (stage) {
			this.stage = stage;
			this.canvas = document.createElement("canvas");
			this.context = this.canvas.getContext("2d");
		},
		clear: function () {
			this.context.clearRect(0, 0, this.canvas.width / this.stage.zoomValue, this.canvas.height / this.stage.zoomValue);
		},
		copy: function () {
			this.image = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
		},
		load: function () {
			this.context.putImageData();
		}
	};
	
	/*
	function XxxManager (stage) {
		this.initialize(stage);
	}
	XxxManager.prototype = new StageManager();
	
	XxxManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this,stage);
	};
	XxxManager.prototype.onDragStart = function (data) {
	};
	XxxManager.prototype.onDrag = function (data) {
	};
	XxxManager.prototype.onDragEnd = function (data) {
	};
	XxxManager.prototype.set = function () {	
	};
	*/
	
	function SelectManager (stage) {
		this.initialize(stage);
	}
	SelectManager.prototype = new StageManager();
	
	SelectManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this,stage);
		
		stage.on("cancel", this.reDraw.bind(this));
		stage.on("select", this.reDraw.bind(this));
		stage.on("dragstart", this.ready.bind(this));
		stage.on("drag", this.drag.bind(this));
		stage.on("dragend", this.reDraw.bind(this));
	};
	SelectManager.prototype.reDraw = function (event) {
		this.clear();
		
		if (event.type == "cancel") {
			this.stage.selectedBlocks.clear();
		}
		else {
			var context = this.context,
			blocks = this.stage.selectedBlocks,
			block;
			
			for (var i=0, _i=blocks.size(); i<_i; i++) {
				block = blocks.get(i);
				block.path(context);
				context.stroke();
			}
		}
	};
	SelectManager.prototype.ready = function (event) {
		this.copy();
	};
	SelectManager.prototype.drag = function (event) {
		this.clear();
		
		this.context.putImageData(this.image, event.x, event.y);
	};
	SelectManager.prototype.set = function () {
		this.context.shadowBlur = 5;
		this.context.shadowColor = "blue";
		this.context.shadowOffsetX = 1;
		this.context.shadowOffsetY = 1;
	};
	
	function AreaManager (stage) {
		this.initialize(stage);
	}
	AreaManager.prototype = new StageManager();
	AreaManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this,stage);
		
		stage.on("dragstart", this.onDragStart.bind(this));
		stage.on("drag", this.onDrag.bind(this));
		stage.on("dragend", this.onDragEnd.bind(this));
	};
	AreaManager.prototype.set = function () {
		this.context.strokeStyle = "rgb(105, 105, 105)";
		this.context.lineWidth = 1;
		this.context.fillStyle = "rgba(105, 105, 105, 0.2)";
	};
	AreaManager.prototype.onDragStart = function (data) {
		if (data.block) {
			return;
		}
		
		stage.cursor("crosshair");
	};
	AreaManager.prototype.onDrag = function (data) {
		if (data.block) {
			return;
		}
		
		var rect = data.rect;
		
		this.clear();

		this.context.beginPath();
		this.context.rect(rect.x, rect.y, rect.w, rect.h);
		this.context.closePath();
		
		this.context.stroke();
		this.context.fill();
	};
	AreaManager.prototype.onDragEnd = function (data) {
		if (data.block) {
			return;
		}
		
		this.clear();
		
		stage.cursor("default");
	};
	window.Stage = Stage;
	window.DefaultManager = DefaultManager;
	window.AreaManager = AreaManager;
	window.SelectManager = SelectManager;
}) (window);
