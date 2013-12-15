(function (window, undefined) {

	"use strict";

	//var _ = extend("util");
		
	/*
	 * Drag 종류
	 * 1. Area 선택 (= dragselect)
	 * 2. Block 이동 (= dragblock)
	 * 3. Stage 이동 (= dragstage)
	 */
	function Stage (id, width, height, blocks) {
		this.initialize(id, width, height, blocks);
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
	Stage.MODE_MOVE = 1 << 0;
	Stage.MODE_SELECT = 1 << 1;
	Stage.MODE_LINK = 1 << 2;
	
	Stage.AREA_STYLE = "1px solid red";
	
	Stage.prototype = {
		initialize: function (id, width, height, blocks){
			this.parent = document.getElementById(id);
			this.canvas = document.createElement("canvas");
			this.context = this.canvas.getContext("2d");
			this.width = width;
			this.height = height;
			this.index = new Index();
			this.blocks = new BlockArray(blocks);
			this.selectedBlocks = new BlockArray();
			this.lastPos = new Pos();
			this.curPos = new Pos();
			this.selectable = null;
			this.mode = Stage.MODE_SELECT;
			this.dragged = false;
			this.isDragging = false;
			this.translate = new Pos();
			this.mouseDownPos = null;
			//this.selectedImage = null;
			this.stageImage = null;
			this.zoomValue = Stage.ZOOM_DEFAULT;
			this.documentOverflow = "";
			this.eventHandler = {};
			this.fullScreen = false;
			
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			
			this.parent.appendChild(this.canvas);
			
			new DefaultManager(this);
			//new TraceManager(this).blocks = this.blocks;
			this.addLayer(new TraceManager(this)).blocks = this.blocks;
			//this.addLayer(new LinkManager(this));
			this.addLayer(new BlockManager(this)).blocks = this.blocks;
			this.addLayer(new SelectionManager(this));
			this.addLayer(new AreaManager(this));
			
			var body = document.documentElement;
			this.documentOverflow = body.style.overflow;
			
			window.addEventListener("resize", Stage.eventHandler.onWindowResize.bind(this), false);
			body.addEventListener("mousemove", Stage.eventHandler.onMouseMove.bind(this), false);
			body.addEventListener("mousedown", Stage.eventHandler.onMouseDown.bind(this), false);
			body.addEventListener("mouseup", Stage.eventHandler.onMouseOut.bind(this), false);
			body.addEventListener("mouseout", Stage.eventHandler.onMouseOut.bind(this), false);
		},
		addLayer: function (layer) {
			var canvas = layer.canvas;
			
			this.parent.appendChild(canvas);
			
			canvas.width = this.width;
			canvas.height = this.height;
			canvas.style.position = "absolute";
			
			layer.set();
			
			return layer;
		},
		cursor: function (style) {
			this.layer.mask.style.cursor = style;
		},
		addBlock: function (block) {
			this.index.set(block);
			
			this.blocks.push(block);
			
			this.fire("add", {
				"type": "add",
				"block": block
			});
		},
		invalidate: function () {
			this.fire("invalidate",{
				"type": "invalidate"
			});
		},
		getPos: function (event) {
			var rect = this.canvas.getBoundingClientRect();
			
			return new Pos((event.clientX - rect.left), (event.clientY - rect.top));
		},
		getBlock: function () {
			var pos = this.curPos;
			
			return this.index.get(this.context.trace.getImageData(pos.x, pos.y, 1, 1).data);
		},
		isMouseMoved: function (event) {
			if(event.target.nodeName.toLowerCase() != "canvas") {
				return;
			}
			
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
		},/*
		shiftSelectedBlocksImage: function () { // canvas에 그릴때는 false
			var distance = this.getDistance(false), x = distance.x, y = distance.y;
			
			this.clear("selected").putImageData(this.selectedImage, x, y);
		},*/
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
		},
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
		reset: function (w, h) {
			var contexts = this.context, layers = this.layer, v = this.zoomValue;
			
			for (var k in layers) {
				layers[k].width = w || layers[k].width;
				layers[k].height = h || layers[k].height;
				contexts[k].scale(v, v);
			}
			
			this.invalidate();
		},
		setFullScreen: function (on) {
			this.fullScreen = on;
			
			Stage.eventHandler.onWindowResize.call(this);
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
			
			if (this.fullScreen) {
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
			
			var dragMode = this.mode == Stage.MODE_MOVE? "stage": this.selectable? "block": "select";
			
			if (!this.isDragging && this.mouseDownPos) {
				this.isDragging = true;
				
				this.fire("dragstart", {
					"type": "dragstart",
					"block": this.selectable,
					"drag": dragMode
				});
			}
			
			if (this.isDragging) {
				var distance = this.getDistance(false), x = distance.x, y = distance.y;
				
				this.fire("drag", {
					"type": "drag",
					"mode": this.mode,
					"x": x,
					"y": y,
					"block": this.selectable,
					"rect": this.getDragRect(),
					"drag": dragMode
				});
			}
			else if (this.mode != Stage.MODE_MOVE){ // 검사
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
			
			if (this.mode == Stage.MODE_MOVE) {
				return;
			}
			
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
					if (this.mode == Stage.MODE_MOVE) {
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
	
	window.Stage = Stage;
	
}) (window);
