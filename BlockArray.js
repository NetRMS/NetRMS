(function (window, undefined) {

	"use strict";

	var _ = extend("util");
	
	/*
	 * BlockArray
	 */
	
	function BlockArray(blocks) {
		this.initialize(blocks);
	}
	
	BlockArray.prototype = {
		initialize: function (blocks) {
			this.blocks = [];
			this.xIndex = [];
			this.yIndex = [];
			
			if (blocks) {
				for (var i=0, _i=blocks.length; i<_i; i++) {
					this.push(blocks[i]);
				}
			}
		},
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

	window.BlockArray = BlockArray;
	
}) (window);
