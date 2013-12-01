(function (window, undefined) {

	"use strict";

	var _ = {};
	
	extend(_, "util");
	
	function Rect(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	function Pos(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	function Node(rect) {
		this.initialize(rect);
	}
	Node.COLOR_BORDER = "#c0c0c0";
	Node.prototype = {
		initialize: function (rect) {
			this.context;
			this._context;
			this.rect = rect;
			this.index;
			this.background = "#000000";
			this.image = null;
			this.handler = {};
			this.lines = [];
		},
		draw: function (shadow) {
			this.context.beginPath();
			this.context.rect(this.rect.x, this.rect.y , this.rect.w, this.rect.h);
			this.context.closePath();
			
			this.context.lineWidth = 1;
			this.context.strokeStyle = Node.COLOR_BORDER;
			this.context.stroke();
			
			if(this.image) {
				this.context.drawImage(this.image, this.rect.x, this.rect.y, this.rect.w);
			}
			else {
				this.context.fillStyle = this.background;
				this.context.fill();
			}
			
			if(shadow) {
				this.shadow();
			}
		},
		shadow: function () {
			this._context.beginPath();
			this._context.rect(this.rect.x, this.rect.y , this.rect.w, this.rect.h);
			this._context.closePath();
			
			this._context.fillStyle = this.index;
			this._context.fill();
		},
		border: function (width, color) {
			this.context.beginPath();
			this.context.rect(this.rect.x, this.rect.y , this.rect.w, this.rect.h);
			this.context.closePath();
			this.context.lineWidth = width || 1;
			this.context.strokeStyle = color || Node.COLOR_BORDER;
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

	function Stage(id, w, h) {
		this.initialize(id, w, h);
	}
	Stage.SIZE = 400;
	Stage.STROKE = "silver";
	Stage.MODE_MOVE = 1;
	Stage.MODE_LINE = 1 << 1;
	Stage.COLOR_SELECTED = "#FF4500"; // orange red
	Stage.COLOR_SELECTABLE = "#C0C0C0"; // silver
	Stage.prototype = {
		initialize: function (size) {
			var _this = this;
			
			this.canvas = document.createElement("canvas");
			this._canvas = document.createElement("canvas");
			this.context = this.canvas.getContext("2d");
			this._context = this._canvas.getContext("2d");
			this.nodes = [];
			this.copy = null;
			this.index = new Index();
			this.mouse = new Pos();
			this.selectable = null;
			this.selected = null;
			this.offset = new Pos();
			this.handler = {};
			this.size = this._size = size || Stage.SIZE;
			this.ratio = 1;
			this.mode = Stage.MODE_MOVE;
			
			this.context.lineJoin = this._context.lineJoin = "round";
			
			document.documentElement.appendChild(this.canvas);
			document.documentElement.appendChild(this._canvas);
			
			window.addEventListener("resize", function (event) {
				_this.align();
			}, false);			
			
			this.canvas.onmousemove = function(event) {
				_this.onMouseMove.call(_this, event);
			};
			
			this.canvas.onmousedown = function (event) {
				_this.onMouseDown.call(_this, event);
			};
			
			this.canvas.onmouseup = this.canvas.onmouseout = function (event) {
				_this.onMouseUp.call(_this, event);
			};
			
			this.resize();
		},
		drawGuide: function (pos) {
			this.context.strokeStyle = Stage.STROKE;
			this.context.lineWidth = 0.5;
			this.context.moveTo(pos.x + 0.5, 0);
			this.context.lineTo(pos.x + 0.5, this.size/Math.sqrt(2));
			this.context.moveTo(0, pos.y + 0.5);
			this.context.lineTo(this.size, pos.y + 0.5);
			this.context.stroke();
		},
		drag: function () {
			var pos = new Pos(this.mouse.x/this.ratio - this.offset.x, this.mouse.y/this.ratio - this.offset.y);
			
			this.selected.move(pos);
			this.selected.draw();
			
			this.drawGuide(pos);
		},
		line: function () {
			this.context.beginPath();
			this.context.lineWidth = 1;
			this.context.strokeStyle = "gold";
			this.context.moveTo(this.selected.rect.x + this.selected.rect.w/2, this.selected.rect.y + this.selected.rect.h/2);
			this.context.lineTo(this.mouse.x/this.ratio, this.mouse.y/this.ratio);
			this.context.stroke();
			this.context.closePath();
		},
		onMouseMove: function (event) {
			event.preventDefault();
			
			if(!this.isMouseMoved(event)) {
				return;
			}
			
			this.context.putImageData(this.copy, 0, 0);
			
			if(this.selected) {	
				if(this.mode == Stage.MODE_MOVE) {
					this.drag();
				}
				else if(this.mode == Stage.MODE_LINE) {
					this.line();
				}
			}
			
			if(this.selectable) {
				this.selectable.border(3, Stage.COLOR_SELECTABLE);
			}
			
			this.mouseTest();
		},
		onMouseDown: function (event) {
			event.preventDefault();
			
			if(event.button != 0) {
				return;
			}
			
			if(this.selectable) {
				this.onSelect();
			}
		},
		onMouseUp: function (event) {
			event.preventDefault();
			
			if(this.selected) {
				this.onCancel();
			}
		},
		onSelect: function () {
			var node = this.selected = this.selectable;
			
			this.offset = new Pos(this.mouse.x/this.ratio - this.selected.rect.x, this.mouse.y/this.ratio - this.selected.rect.y);
			
			this.nodes.splice(this.nodes.indexOf(this.selected), 1); // 최상위로 다시 그려주기 위해 임시 제거
			
			if(this.mode == Stage.MODE_MOVE) {
				this.invalidate();
				
				this.selected.draw();
			}
			else if(this.mode == Stage.MODE_LINE) {
				this.nodes.push(this.selected); // 최상위로 다시 그려줌
				
				this.invalidate();
			}
			
			this.dispatchEvent("select", node);
		},
		onCancel: function () {
			var node = this.selected;
			
			this.selected = null;
			
			this.context.putImageData(this.copy, 0, 0);
			
			if(!this.selectable) {
				return;
			}
			
			if(this.mode == Stage.MODE_MOVE) {
				this.nodes.push(node);
				node.draw(true);
			}
			else if(this.mode == Stage.MODE_LINE) {
				if(node != this.selectable) { // 자기 자신을 선택한 경우 제외
					console.log("line created!");
				}
			}
			
			this.copy = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
			
			this.selectable.border(3, this.COLOR_SELECTABLE);
			
			this.dispatchEvent("cancel", node);
		},
		onEnter: function () {
			var node = this.selectable;
			
			node.border(3, Stage.COLOR_SELECTABLE);
			
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
		},
		onLeave: function () {			
			var node = this.selectable;
			
			switch(this.mode) {
			case Stage.MODE_MOVE:
				
				break;
			default:
			}
			
			this.context.putImageData(this.copy, 0, 0);
			
			this.canvas.style.cursor = "default";
			
			this.dispatchEvent("leave", node);
		},
		isMouseMoved: function (event) {
			var pos = this.getPos(event);
			
			if(pos.x == this.mouse.x && pos.y == this.mouse.y) {
				return false;
			}
			
			this.mouse = pos;
			
			return true;
		},
		mouseTest: function () {
			var data = this._context.getImageData(this.mouse.x, this.mouse.y, 1, 1).data, node;
			
			if(this.mode == Stage.MODE_MOVE && this.selected) {
				return;
			}
			
			if(node = this.index.get(data)) {
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
		},
		addNode: function () {
			var node = new Node(new Rect(Math.floor(Math.random() * this.size), Math.floor(Math.random() * this.size/Math.sqrt(2)), 30, 30));
			
			node.background = "#000080"; // navy
			node.index = this.index.add(node);
			node.context = this.context;
			node._context = this._context;			
			
			this.nodes.push(node);
		},
		invalidate: function () {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

			for(var i=0, nodes=this.nodes, j=nodes.length; i<j; i++) {
				nodes[i].draw(true);
			}
			
			this.copy = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
		},
		getPos: function (event) {
			var rect = this.canvas.getBoundingClientRect();
			
			return new Pos(event.clientX - rect.left - this.canvas.clientLeft, event.clientY - rect.top - this.canvas.clientTop);
		},
		on: function (event, handler) {
			this.handler[event] = handler;
		},
		dispatchEvent: function (event, node) {
			if(this.handler[event]) {
				this.handler[event](node);
			}
		},
		zoom: function (ratio) {
			this.ratio = ratio;
			
			this.reset();
		},
		resize: function (size) {
			if(size) {
				this.size = size;
			}
		
			this.reset();
		},
		reset: function () {
			this.canvas.width = this._canvas.width = this.size * this.ratio;
			this.canvas.height = this._canvas.height = this.size/Math.sqrt(2) * this.ratio;
			
			this.context.scale(this.ratio, this.ratio);
			this._context.scale(this.ratio, this.ratio);

			this.align();
		},
		adjust: function () {
			var min = new Pos(this.size, this.size),
			max = new Pos(0, 0);
			
			for(var i=0, _i=this.nodes.length, nodes=this.nodes; i<_i; i++) {
				min.x = Math.min(min.x, nodes[i].rect.x);
				min.y = Math.min(min.y, nodes[i].rect.y);
				max.x = Math.max(max.x, nodes[i].rect.x + nodes[i].rect.w);
				max.y = Math.max(max.y, nodes[i].rect.y + nodes[i].rect.h);
			}
			
			this.shift(-min.x, -min.y);
			this.resize(Math.max(max.x - min.x, (max.y - min.y)*Math.sqrt(2)));
			
			this.invalidate();
		},
		onMove: function (node) {
		},
		shift: function (x, y) {
			var pos = new Pos(x, y);
			
			for(var i=0, _i=this.nodes.length; i<_i; i++) {
				this.nodes[i].shift(pos);
			}
			
			this.invalidate();
		},
		expand: function () {
			this.resize(this.size + 100);
			this.shift(50, 50/Math.sqrt(2));
			
			this.invalidate();
		},
		align: function () {
			this.canvas.style.left = ((document.documentElement.clientWidth - this.canvas.width) / 2) +"px";
			this.canvas.style.top = ((document.documentElement.clientHeight - this.canvas.height) / 2) +"px";
			
			this.invalidate();
		}
	};
	
	window.Stage = Stage;

}) (window);
