(function (window, undefined) {

	"use strict";

	function Stage (id, width, height, blocks) {
		this.initialize(id, width, height, blocks);
	}
	
	Stage.RESOLUTION = [594, 420]; // [1189, 841] [841, 594] [420, 297] [297, 210]	
	Stage.ZOOM_MAX = 3;
	Stage.DRAG_OFF = 0;
	Stage.DRAG_STAGE = 1 << 0;
	Stage.DRAG_NODE = 1 << 1;
	Stage.DRAG_SELECT = 1 << 2;
	Stage.DRAG_LINK = 1 << 3;
	Stage.DRAG_DELETE = 1 << 4;
	Stage.TYPE_BLOCK = 1 << 0;
	Stage.TYPE_LINK = 1 << 0;
	Stage.MOVE_STEP = 5;
	Stage.MODE_MOVE = 0;
	Stage.MODE_DRAW = ~0;
	
	Stage.STAGE_MOVE = 1 << 0;
	Stage.AREA_SELECT = 1 << 1;
	Stage.BLOCK_MOVE = 1 << 2;
	Stage.LINK_DRAW = 1 << 3;
	
	Stage.prototype = {
		initialize: function (id, width, height, blocks){
			
			/*
			 * Member
			 */
			
			this.parent = document.getElementById(id);
			this.stage = document.createElement("div");
			this.width = this.originWidth = width;
			this.height = this.originHeight = height;
			this.index = new IndexObject();
			this.blocks = new BlockArray(blocks);
			this.selectedBlocks = new BlockArray();
			this.links = [];
			this.curPos = {
				"x": 0,
				"y": 0
			};
			this.selectable = null;
			this.modeValue = Stage.MODE_SELECT;
			this.isDragging = false;
			this.mouseDownPos = null;
			this.zoomValue = 1;
			this.documentOverflow = "";
			this.eventHandler = {};
			this.fullScreenMode = false;
			this.traceManager = new TraceManager(this);
			this.defaultManager = new DefaultManager(this);
			this.backupElements = [];
			this.mode = {
				"block": Stage.DRAG_MOVE,
				"link": Stage.DRAG_MOVE,
				"stage": Stage.DRAG_MOVE
			};
			this.dragMode = "";
			this.lastSelectable = null;
			this.mode = Stage.BLOCK_MOVE | Stage.STAGE_MOVE;
			
			/*
			 * 초기화
			 */
			
			this.parent.appendChild(this.stage);
			
			this.addLayer(this.traceManager, false).blocks = this.blocks;
			this.addLayer(new LinkManager(this), true);
			this.addLayer(new BlockManager(this), true).blocks = this.blocks;
			this.addLayer(new SelectionManager(this), true).blocks = this.selectedBlocks;
			this.addLayer(new AreaManager(this), true);
			
			this.documentOverflow = document.documentElement.style.overflow;
			
			window.addEventListener("resize", this.onWindowResize.bind(this), false);
			this.stage.addEventListener("wheel", this.onWheel.bind(this), false);
			this.stage.addEventListener("mousemove", this.onMouseMove.bind(this), false);
			this.stage.addEventListener("mousedown", this.onMouseDown.bind(this), false);
			this.stage.addEventListener("mouseup", this.onMouseOut.bind(this), false);
			this.stage.addEventListener("mouseout", this.onMouseOut.bind(this), false);
		},
		addLayer: function (layer, show) {
			if (show) {
				this.stage.appendChild(layer.canvas);
			}
			layer.canvas.style.position = "absolute";
			
			layer.reset(this.width, this.height, this.zoomValue);
			
			return layer;
		},
		addBlock: function (block) {
			this.index.set(block);
			
			this.blocks.push(block);
			
			this.fire("block", {
				"type": "block",
				"block": block
			});
		},
		addLink: function (link) {
			this.index.set(link);
			
			this.links.push(link);
			
			this.fire("link", {
				"type": "link",
				"link": link
			});
		},
		invalidate: function () {
			this.fire("invalidate",{
				"type": "invalidate"
			});
		},
		getPos: function (event) {
			var rect = this.stage.getBoundingClientRect();
			
			return {
				"x": event.clientX - rect.left,
				"y": event.clientY - rect.top
			};
		},
		reset: function () {
			this.fire("reset", {
				"type": "reset",
				"width": this.width,
				"height": this.height,
				"zoom": this.zoomValue
			});
		},
		fullScreen: function (on) {
			var mode = this.fullScreenMode;
			
			this.fullScreenMode = on;
			
			if (mode && !on) { // normal
				document.documentElement.style.overflow = this.documentOverflow;
				
				this.width = this.originWidth;
				this.height = this.originHeight;
				
				this.stage.style.position = "static";
				
				this.reset();
			}
			else if (!mode && on) { // full screen
				document.documentElement.style.overflow = "hidden";
				
				this.stage.style.position = "fixed";
				this.stage.style.top = "0px";
				this.stage.style.left = "0px";
				
				this.onWindowResize.call(this);
			}
		},
		zoom: function (zoomIn) {
			if (zoomIn) {
				if (this.zoomValue < Stage.ZOOM_MAX) {
					this.zoomValue += 0.1;
				}
			}
			else {
				if (this.zoomValue > 0) {
					this.zoomValue -= 0.1;
				}
			}
			
			this.reset();
		},
		fire: function (type, event) {
			var handler = this.eventHandler[event.type = type];
			
			if (handler) {
				for (var i=0, _i=handler.length; i<_i; i++) {
					handler[i](event);
				}
			}
			
			if (event.cancel) {
				return;
			}
			
			if (event.type == "mousedown") {
				if (this.selectable) {
					event.block = this.selectable;
					
					this.fire("select", event);
				}
			}
			else if (event.type == "mousemove") {				
				if (this.mouseDownPos) {
					event.pos = this.curPos;
					event.block = this.selectable;
					
					this.fire("drag", event);
				}
				
				if (this.lastSelectable != this.selectable) {
					if (this.lastSelectable) {
						this.fire("leave", event);
					}
					if (this.selectable) {
						this.fire("enter", event);
					}
					this.lastSelectable = this.selectable;
				}
			}
			else if (event.type == "mouseout") {
				if (this.dragMode) {
					event.pos = this.curPos;
					event.block = this.selectable;
					
					this.fire("dragend", event);
					
					this.dragMode = "";
				}
			}
			else if (event.type == "drag") {
				if (!this.dragMode) {
					if (this.selectable) {
						this.dragMode = this.mode & Stage.BLOCK_MOVE? "blockmove": "linkdraw";
					}
					else {
						this.dragMode = this.mode & Stage.STAGE_MOVE? "stagemove": "areaselect";
					}
					
					this.fire("dragstart", event);
				}
				
				this.fire(this.dragMode, event);
			}
			else if (event.type == "dragstart") {
				//this.stage.style.cursor = this.dragMode == "blockmove" || this.dragMode =="stagemove"? "move": "crosshair";
				
				this.fire(this.dragMode +"start", event);
			}
			else if (event.type == "dragend") {
				//this.stage.style.cursor = "default";
				
				this.fire(this.dragMode +"end", event);
			}
			else if (event.type == "leave") {
				this.stage.style.cursor = this.mode & Stage.STAGE_MOVE? "move": "crosshair";
			}
			else if (event.type == "enter") {
				this.stage.style.cursor = this.mode & Stage.BLOCK_MOVE? "move": "crosshair";
			}
		},
		on: function (type, handler, first) {
			var tmp = this.eventHandler[type] || [];
			
			if (first) {
				tmp.unshift(handler);
			}
			else {
				tmp.push(handler);
			}
			
			this.eventHandler[type] = tmp;
		},
		
		/*
		 * Event Handler
		 */
		
		onWindowResize: function (event) {
			if (this.fullScreenMode) {
				this.width = document.documentElement.clientWidth;
				this.height = document.documentElement.clientHeight;
				
				this.reset();
			}
		},
		onWheel: function (event) {
			if (this.selectable) {
				if (this.mode & Stage.BLOCK_MOVE) {
					this.mode = this.mode ^ Stage.BLOCK_MOVE | Stage.LINK_DRAW;
					this.stage.style.cursor = "crosshair";
				}
				else {
					this.mode = this.mode ^ Stage.LINK_DRAW | Stage.BLOCK_MOVE;
					this.stage.style.cursor = "move";
				}
			}
			else {
				if (this.mode & Stage.STAGE_MOVE) {
					this.mode = this.mode ^ Stage.STAGE_MOVE | Stage.AREA_SELECT;
					this.stage.style.cursor = "crosshair";
				}
				else {
					this.mode = this.mode ^ Stage.AREA_SELECT | Stage.STAGE_MOVE;
					this.stage.style.cursor = "move";
				}
			}
		},
		onMouseMove: function (event) {
			var pos = this.curPos;
			
			this.curPos = this.getPos(event);
			
			if(pos.x == this.curPos.x && pos.y == this.curPos.y) { // if not moved
				return;
			}
			
			this.selectable = this.index.get(this.traceManager.getTrace(this.curPos));
			
			this.fire("mousemove", {
				"siftKey": event.siftKey,
				"ctrlKey": event.ctrlKey,
				"zoom": this.zoomValue
			});
		},
		onMouseDown: function (event) {
			if(event.button != 0) { // left button (== 0) only
				return;
			}
			
			this.mouseDownPos = this.getPos(event);
			
			this.fire("mousedown", {
				"siftKey": event.siftKey,
				"ctrlKey": event.ctrlKey,
				"zoom": this.zoomValue
			});
		},
		onMouseOut: function (event) {
			this.fire("mouseout", {
				"siftKey": event.siftKey,
				"ctrlKey": event.ctrlKey,
				"zoom": this.zoomValue,
			});
			
			this.mouseDownPos = null;
		}
	};
	
	window.Stage = Stage;
	
}) (window);
