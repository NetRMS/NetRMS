(function (window, undefined) {

	"use strict";

	var _ = {};
	
	extend(_, "util");
	
	var COLOR_MBLUE = "#191970"; // midnight blue
	/*
	 * Rect
	 */
	function Rect(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	/*
	 * Pos
	 */
	function Pos(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	/*
	 * Node
	 */
	function Node(rect) {
		this.initialize(rect);
	}
	Node.COLOR_BORDER = "#c0c0c0"; // silver
	Node.COLOR_BACKGROUND = "#000080"; // navy
	Node.prototype = {
		initialize: function (rect) {
			this.context;
			this._context;
			this.rect = rect;
			this.index;
			this.background = "#000000";
			this.image = null;
			this.handler = {};
			this.lines = {};
		},
		line: function(node) {
			var num = this.lines[node],
			offset = num%2 > 0? -1: 1;
			
			if(offset < 0) {
				offset = (num + offset) * offset;
			}
			
			this.context.beginPath();
			this.context.moveTo(this.rect.x + this.rect.w/2 + offset, this.rect.y + this.rect.h/2 + offset);
			this.context.lineTo(node.rect.x + node.rect.w/2 + offset, node.rect.y + node.rect.h/2 + offset);
			this.context.closePath();
			this.context.stroke();
		},
		move: function(pos) {
			this.rect.x = pos.x;
			this.rect.y = pos.y;
		},
		shift: function(pos) {
			this.rect.x += pos.x;
			this.rect.y += pos.y;
		},
		dispatchEvent: function (event) {
			if(this.handler[event]) {
				this.handler[event](this);
			}
		},
		on: function (event, handler) {
			this.handler[event] = handler;
		}
	};

	/*
	 * Index
	 */
	function Index() {
		this.initialize();
	}
	Index.prototype = {
		initialize: function () {
			this.map = {};
			this.index = 0;
		},
		add: function (node) {
			var index = _.numToRGBString(++this.index);
			
			this.map[index] = node;
			
			return index;
		},
		get: function (rgb) {
			return this.map[_.numToRGBString(_.arrayToRGBNumber(rgb))];
		}
	};

	/*
	 * StageObject
	 */
	function StageObject () {
		this.initialize();
	}
	StageObject.STEP = 100;
	
	StageObject.prototype = {
		initialize: function () {
			this.canvas = document.createElement("canvas");
			this.context = this.canvas.getContext("2d");
			this.copy = null;
			this.nodes = [];
			this.ratio = 1;
			this.size;
			
			this.context.lineJoin = "round";
		},
		drawNode: function (node) {
			
		},
		drawGuide: function (pos) {
			this.context.beginPath();
			this.context.moveTo(pos.x + 0.5, 0);
			this.context.lineTo(pos.x + 0.5, this.canvas.height);
			this.context.moveTo(0, pos.y + 0.5);
			this.context.lineTo(this.canvas.width, pos.y + 0.5);
			this.context.closePath();
			
			this.context.strokeStyle = Stage.COLOR_GUIDELINE;
			this.context.lineWidth = 0.5;
			this.context.stroke();
		},
		drawLine: function (from, to, multiple) {
			multiple = true;
			this.context.beginPath();
			this.context.moveTo(from.x, from.y);
			this.context.lineTo(to.x, to.y);
			this.context.closePath();
			
			this.context.strokeStyle = COLOR_MBLUE;
			if(multiple) {
				this.context.lineWidth = 5;
				this.context.stroke();
				this.context.globalCompositeOperation="destination-out";
				this.context.lineWidth = 3;
			}
			else {
				this.context.lineWidth = 1;
			}
			
			this.context.stroke();
		},
		invalidate: function () {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

			for(var i=0, _i=this.nodes.length, nodes=this.nodes; i<_i; i++) {
				this.drawNode(nodes[i]);
			}
			
			this.copy = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
		},
		zoom: function (ratio) {
			this.ratio = ratio;
			
			this.reset();
		},
		resize: function (size) {
			this.size = size;
		
			this.reset();
		},
		reset: function () {
			this.canvas.width = this.size * this.ratio;
			this.canvas.height = this.size/Math.sqrt(2) * this.ratio;
			
			this.context.scale(this.ratio, this.ratio);
			
			this.invalidate();
		},
		expand: function () {
			this.shift(StageObject.STEP/2, StageObject.STEP/2/Math.sqrt(2));
			this.resize(this.size + StageObject.STEP);
		},
		shift: function (x, y) {
			
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			
			for(var i=0, _i=this.nodes.length, nodes=this.nodes; i<_i; i++) {
				nodes[i].rect.x += x;
				nodes[i].rect.y += y;
			}
		},
		adjust: function () {
			var min = new Pos(this.canvas.width, this.canvas.height),
			max = new Pos(0, 0);
			
			for(var i=0, _i=this.nodes.length, nodes=this.nodes; i<_i; i++) {
				min.x = Math.min(min.x, nodes[i].rect.x);
				min.y = Math.min(min.y, nodes[i].rect.y);
				max.x = Math.max(max.x, nodes[i].rect.x + nodes[i].rect.w);
				max.y = Math.max(max.y, nodes[i].rect.y + nodes[i].rect.h);
			}
			
			this.shift(-min.x, -min.y);
			this.resize(Math.max(max.x - min.x, (max.y - min.y)*Math.sqrt(2)));
		},
		clear: function () {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		},
		set: function (stage) {
			this.canvas.width = stage.canvas.width; // canvas 의 크기가 변경되면 image가 초기화 된다
			this.canvas.height = stage.canvas.height;
			this.ratio = stage.ratio;
			
			this.context.scale(this.ratio, this.ratio);
		}
	};
	
	/*
	 * Stage
	 */
	function Stage(size) {
		this.initialize(size);
	}
	
	Stage.SIZE = 400;
	Stage.MODE_MOVE = 1;
	Stage.MODE_LINE = 1 << 1;
	Stage.COLOR_SELECTED = "#FF4500"; // orange red
	Stage.COLOR_SELECTABLE = "#C0C0C0"; // silver
	Stage.COLOR_GUIDELINE = "#C0C0C0"; // silver
	Stage.COLOR_BOUND = "#C0C0C0"; // silver
	
	Stage.prototype = new StageObject();
	
	/*
	 * Override
	 */
	Stage.prototype.initialize = function (size) {			
		StageObject.prototype.initialize.call(this);
		
		var _this = this;
		
		this.stage = document.createElement("div");
		this.shadow = new ShadowStage(size);
		this.mask = new StageObject();
		
		this.nodes = [];
		this.mouse = new Pos();
		this.selectable = null;
		this.selected = null;
		this.offset = new Pos();
		this.handler = {};
		this.ratio = 1;
		this.mode = Stage.MODE_MOVE;
		
		this.stage.style.position = "absolute";
		this.canvas.style.position = "absolute";;
		this.canvas.style.zIndex = 0;
		this.mask.canvas.style.position = "absolute";
		this.mask.canvas.style.zIndex = 1;
		
		this.resize(size);
		this.mask.set(this);
		this.shadow.set(this);
		
		document.documentElement.appendChild(this.stage);
		
		this.stage.appendChild(this.canvas);
		this.stage.appendChild(this.mask.canvas);
		
		document.documentElement.appendChild(this.shadow.canvas);
		
		window.addEventListener("resize", function (event) {
			_this.align();
		}, false);			
		
		this.mask.canvas.onmousemove = function(event) {
			_this.onMouseMove.call(_this, event);
		};
		
		this.mask.canvas.onmousedown = function (event) {
			_this.onMouseDown.call(_this, event);
		};
		
		this.mask.canvas.onmouseup = this.mask.canvas.onmouseout = function (event) {
			_this.onMouseOut.call(_this, event);
		};
	};
	Stage.prototype.drawNode = function (node) {
		this.context.beginPath();
		this.context.rect(node.rect.x, node.rect.y , node.rect.w, node.rect.h);
		this.context.closePath();
		
		this.context.lineWidth = 1;
		this.context.strokeStyle = Node.COLOR_BORDER;
		this.context.stroke();
		
		if(node.image) {
			this.context.drawImage(node.image, node.rect.x, node.rect.y, node.rect.w);
		}
		else {
			this.context.fillStyle = Node.COLOR_BACKGROUND;
			this.context.fill();
		}
	};
	Stage.prototype.invalidate = function () {
		StageObject.prototype.invalidate.call(this);
		
		this.shadow.invalidate();
	};
	Stage.prototype.drawBound = function (node) {
		this.context.beginPath();
		this.context.rect(node.rect.x, node.rect.y , node.rect.w, node.rect.h);
		this.context.closePath();
		
		this.context.lineWidth = 3;
		this.context.strokeStyle = Node.COLOR_BORDER;
		this.context.stroke();
	};
	Stage.prototype.onMouseMove= function (event) {
		event.preventDefault();
		
		if(!this.isMouseMoved(event)) {
			return;
		}
		
		this.mouseTest();
		
		if(this.selected) {
			var node = this.selected;
			
			if(this.mode == Stage.MODE_MOVE) {
				var pos = new Pos(this.mouse.x/this.ratio - this.offset.x, this.mouse.y/this.ratio - this.offset.y);
				
				node.rect.x = pos.x;
				node.rect.y = pos.y;
				
				this.mask.drawGuide(pos);
				this.drawNode.call(this.mask, node);
			}
			else if(this.mode == Stage.MODE_LINE) {
				this.mask.drawLine(new Pos(this.selected.rect.x + this.selected.rect.w/2, this.selected.rect.y + this.selected.rect.h/2), new Pos(this.mouse.x/this.ratio, this.mouse.y/this.ratio));
			}
		}
	};
	Stage.prototype.onMouseDown = function (event) {
		event.preventDefault();
		
		if(event.button != 0) { // left button (== 0) only
			return;
		}
		
		if(!this.selectable) { // 빈 공간 event
			return
		}
		
		var node = this.selected = this.selectable;
		
		this.offset = new Pos(this.mouse.x/this.ratio - this.selected.rect.x, this.mouse.y/this.ratio - this.selected.rect.y);
		
		this.nodes.splice(this.nodes.indexOf(node), 1); // 최상위로 다시 그려주기 위해 임시 제거
		this.drawNode.call(this.mask, node); // 제거한 node mask 에 그려주기
		this.invalidate(); // 새로 그리기
		
		this.mask.set(this); // mask 초기화
		
		if(this.mode == Stage.MODE_MOVE) {
			this.shadow.clear(); // event 막기 위해 shadow clear
		}
		else if(this.mode == Stage.MODE_LINE) {
			this.shadow.nodes = this.nodes; // event 막기 위해 shadow에서 노드 제거
			this.shadow.invalidate();
		}
		
		this.dispatchEvent("select", node);
	};
	Stage.prototype.onMouseOut = function (event) {
		event.preventDefault();
		
		if(!this.selected) { // 빈 공간 event
			return;
		}
		
		var node = this.selected;
		
		this.selected = null;
		
		this.nodes.push(node);
		this.drawNode(node); // 최상위로 다시 그려줌
		
		if(this.mode == Stage.MODE_MOVE) {			
			this.shadow.nodes = this.nodes;
			this.shadow.invalidate(); // shadow 새로 그리기
		}
		else if(this.mode == Stage.MODE_LINE) {
			this.shadow.drawNode(node); // shadow에 다시 그려줌
			
			if(node != this.selectable) { // 자기 자신을 선택한 경우 제외
				this.onLine(node, this.selectable);
			}
		}
		
		this.mouseTest();
		
		this.dispatchEvent("cancel", node);
	};
	
	Stage.prototype.onEnter = function () {
		var node = this.selectable;
		
		if(this.mode == Stage.MODE_MOVE) {
			this.canvas.style.cursor = "move";
		}
		else if(this.mode == Stage.MODE_LINE) {
			this.canvas.style.cursor = "crosshair";
		}
		else {
			this.canvas.style.cursor = "pointer";
		}
		
		this.dispatchEvent("enter", node);
	};
	Stage.prototype.onLeave = function () {			
		var node = this.selectable;
		
		this.canvas.style.cursor = "default";
		
		this.dispatchEvent("leave", node);
	};
	Stage.prototype.onLine = function (from, to) {
		if(from[to]) {
			from[to] = ++to[from];
		}
		else {
			from[to] = to[from] = 1;
		}
		
		this.context.strokeStyle = "red";
		this.lineWidth = 10;
		
		from.line(to);
	};
	Stage.prototype.isMouseMoved = function (event) {
		var pos = this.getPos(event);
		
		if(pos.x == this.mouse.x && pos.y == this.mouse.y) {
			return false;
		}
		
		this.mouse = pos;
		
		return true;
	};
	Stage.prototype.mouseTest = function () {
		this.mask.clear();
		
		var node = this.shadow.getNode(this.mouse.x, this.mouse.y);
		if(node) {
			this.drawBound.call(this.mask, node);
			
			if(node != this.selectable) {
				if(this.selectable) {
					this.onLeave();
				}
				
				this.selectable = node;
				
				this.onEnter();
			}
		}
		else if(this.selectable){
			this.onLeave();
			this.selectable = null;
		}
	};
	Stage.prototype.addNode = function (x, y) {
		var node = new Node(new Rect(x, y, 30, 30));
		
		node.index = this.shadow.index.add(node);
		
		this.nodes.push(node);
		this.shadow.nodes.push(node);
		
		return node;
	};
	Stage.prototype.getPos = function (event) {
		var rect = this.canvas.getBoundingClientRect();
		
		return new Pos(event.clientX - rect.left - this.canvas.clientLeft, event.clientY - rect.top - this.canvas.clientTop);
	};
	Stage.prototype.align = function () {
		this.stage.style.left = ((document.documentElement.clientWidth - this.canvas.width) / 2) +"px";
		this.stage.style.top = ((document.documentElement.clientHeight - this.canvas.height) / 2) +"px";
	},
	Stage.prototype.on = function (event, handler) {
		this.handler[event] = handler;
	};
	Stage.prototype.dispatchEvent = function (event, node) {
		if(this.handler[event]) {
			this.handler[event](node);
		}
	};
	
	/*
	 * ShadowStage
	 */
	function ShadowStage(size) {
		this.initialize(size);
	}
	ShadowStage.prototype = new StageObject();
	ShadowStage.prototype.initialize = function (size) {
		StageObject.prototype.initialize.call(this, size);
		
		this.index = new Index();
	};
	ShadowStage.prototype.drawNode =function (node) {
		this.context.beginPath();
		this.context.rect(node.rect.x, node.rect.y , node.rect.w, node.rect.h);
		this.context.closePath();
		
		this.context.fillStyle = node.index;
		this.context.fill();
	};
	ShadowStage.prototype.getNode = function (x, y) {		
		return this.index.get(this.context.getImageData(x, y, 1, 1).data);
	};
	
	
	/*
	 * LineStage
	 */
	function LineStage(size) {
		this.initialize(size);
	}
	LineStage.prototype = new StageObject();
	LineStage.prototype.x = function () {
		
	};
	
	window.Stage = Stage;

}) (window);
