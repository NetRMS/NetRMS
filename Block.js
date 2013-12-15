(function (window, undefined) {

	"use strict";

	//var _ = extend("util");
	
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
	 * Block
	 */
	function Block() {
	}
	Block.SIZE = 30;
	
	Block.prototype = {
		initialize: function () {
			this.rect = new Rect(0, 0, Block.SIZE, Block.SIZE);
			this.index = "#000000";
			this.image = null;
			this.selected = false;
			this.links = {};
		},
		path: function (context) {
			context.beginPath();
			context.rect(this.rect.x - this.rect.w/2, this.rect.y -this.rect.h/2, this.rect.w, this.rect.h);
			context.closePath();
		},
		select: function (reverse) {
			if (!this.selected) {
				this.selected = true;
			}
			else if(reverse) {
				this.selected = false;
			}
			
			return this.selected;
		},
	};

	window.Pos = Pos;
	window.Rect = Rect;
	window.Block = Block;
	
}) (window);
