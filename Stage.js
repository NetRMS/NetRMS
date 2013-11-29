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

	function Node(context, rect, stroke, fill, line) {
		this.initialize(context, rect, stroke, fill, line);
	}
	Node.WIDTH = 30;
	Node.HEIGHT = 30;
	Node.FILL = "rgba(255, 69, 0, 1)";
	Node.STROKE = "rgba(0, 0, 230, 1)";
	Node.LINE = 1;
	Node.prototype = {
		initialize: function (context, _context, stroke, fill, line) {
			this.context = context;
			this._context = _context;
			this.rect = new Rect(0, 0, Node.WIDTH, Node.HEIGHT);
			this.stroke = stroke || Node.STROKE;
			this.fill = fill || Node.FILL;
			this.line = line || Node.LINE;
			this.index;
			this.handler = {};
		},
		path: function (context) {
			context.beginPath();
			context.rect(this.rect.x, this.rect.y , this.rect.w, this.rect.h);
			context.closePath();
		},
		draw: function (selected) {
			this.path(this.context);
			this.path(this._context);
			
			//this.context.save();
			this.context.fillStyle = this.fill;
			this.context.fill();
			
			if(selected) {
				this.context.lineWidth = 5/*this.line*/;
				this.context.strokeStyle = this.stroke;
				this.context.lineJoin = "round";
				this.context.stroke();
			}
			
			this._context.fillStyle = this.index;
			this._context.fill();
			//this.context.restore();
		},
		move: function(pos) {
			this.rect.x = pos.x;
			this.rect.y = pos.y;
			
			this.dispatchEvent("move");
		},
		shift: function(pos) {
			this.rect.x += pos.x;
			this.rect.y += pos.y;
			
			this.dispatchEvent("move");
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
			this.lastSelected = null;
			this.offset = new Pos();
			this.handler = {};
			this.size = this._size = size || Stage.SIZE;
			this.ratio = 1;
			this.min = new Pos(this.size, this.size/Math.sqrt(2));
			this.max = new Pos(0, 0);
			
			document.documentElement.appendChild(this.canvas);
			//document.documentElement.appendChild(this._canvas);
			
			window.addEventListener("resize", function (event) {
				_this.align();
			}, false);			
			
			this.canvas.onmousemove = function (event) {
				event.preventDefault();
				
				var pos = _this.getPos(event);
				if(pos.x == _this.mouse.x && pos.y == _this.mouse.y) { // 움직임 없는 이벤트 방지
					return;
				}
				
				_this.mouse = pos;
				
				if(_this.selected) { // drag 
					_this.drag();
					
					return;
				}
				
				var data = _this._context.getImageData(_this.mouse.x, _this.mouse.y, 1, 1).data, node;
				if(node = _this.index.get(data)) { // 노드 감지
					if(node != _this.selectable) { // enter 이벤트 발생
						_this.dispatchEvent("enter", node);
					}
					else {
						return; // 노드 변화가 없는 이벤트 방지
					}
				}
				else if(_this.selectable){
					_this.dispatchEvent("leave", _this.selectable);
				}
				
				_this.selectable = node;
			};
			
			this.canvas.onmousedown = function (event) {
				event.preventDefault();
				
				if(event.button != 0) {
					return;
				}
				
				if(_this.selectable) {
					_this.onSelect();
				}
			};
			
			this.canvas.onmouseup = this.canvas.onmouseout = function (event) {
				event.preventDefault();
				
				if(_this.selected) {
					_this.onCancel();
				}
			};
			
			this.resize();
		},
		drawGuide: function (pos) {
			//this.context.save();
			this.context.beginPath();
			this.context.strokeStyle = Stage.STROKE;
			this.context.lineWidth = 0.5;
			this.context.moveTo(pos.x + 0.5, 0);
			this.context.lineTo(pos.x + 0.5, this.size/Math.sqrt(2));
			this.context.moveTo(0, pos.y + 0.5);
			this.context.lineTo(this.size, pos.y + 0.5);
			this.context.stroke();
			//this.context.restore();
		},
		onSelect: function () {
			this.dispatchEvent("select", this.lastSelected = this.selected = this.selectable);
			
			this.offset = new Pos(this.mouse.x/this.ratio - this.selected.rect.x, this.mouse.y/this.ratio - this.selected.rect.y);
			this.nodes.splice(this.nodes.indexOf(this.selected), 1);
			this.copy = this.invalidate();
			this.selected.draw(true);
		},
		onCancel: function () {
			this.dispatchEvent("cancel", this.selected);
			
			this.invalidate(); // 여기서 부터 순서 조심
			this.nodes.push(this.selected);
			this.selected = null;
			
			this.lastSelected.draw(true);
		},
		drag: function () {
			this.context.putImageData(this.copy, 0, 0);
			
			var pos = new Pos(this.mouse.x/this.ratio - this.offset.x, this.mouse.y/this.ratio - this.offset.y);
			this.selected.move(pos);
			this.selected.draw(true);
			this.drawGuide(pos);
		},
		addNode: function () {
			var _this = this,
			node = new Node(this.context, this._context);
			
			this.nodes.push(node);
			node.on("move", function(node){
				_this.onMove(node);
			});
			
			node.index = this.index.add(node);
			node.move(new Pos(Math.floor(Math.random() * this.size), Math.floor(Math.random() * this.size/Math.sqrt(2))));
			node.draw();
		},
		invalidate: function () {
			this.context.clearRect(0, 0, this.size, this.size/Math.sqrt(2));
			this._context.clearRect(0, 0, this.size, this.size/Math.sqrt(2));

			for(var i=0, nodes=this.nodes, j=nodes.length; i<j; i++) {
				nodes[i].draw();
			}
			
			return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
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

}) ( window );
