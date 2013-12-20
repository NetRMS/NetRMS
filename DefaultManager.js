(function (window, undefined) {

	"use strict";

	var _ = extend("coord");
	
	/*
	 * DefaultManager
	 */
	
	function DefaultManager (stage) {
		this.initialize(stage);
	}
	
	/*
	 * Extand
	 */
	
	DefaultManager.prototype = new StageManager();
	
	
	/*
	 * Constructor
	 */
	
	DefaultManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this);
		this.stage = stage;
		
		stage.on("reset", this.onReset.bind(this), true);
		stage.on("select", this.onSelect.bind(this), true);
		stage.on("stagemovestart", this.onDragStart.bind(this));
		stage.on("stagemoveend", this.onStageMoveEnd.bind(this));
		stage.on("blockmovestart", this.onDragStart.bind(this), true);
		stage.on("blockmoveend", this.onBlockMoveEnd.bind(this), true);
		stage.on("areaselectstart", this.onDragStart.bind(this), true);
		stage.on("areaselectend", this.onAreaSelectEnd.bind(this), true);
	};
	
	/*
	 * Event handler
	 */
	
	DefaultManager.prototype.onReset = function (event) {
		this.reset(event.width, event.height, event.zoom);
	};
	DefaultManager.prototype.onDragStart = function (event) {
		this.pos = event.pos;
	};
	DefaultManager.prototype.onStageMoveEnd = function (event) {
		var distance = this.getZoomDistance(_.getDistance(this.pos, event.pos)),
		blocks = this.stage.blocks, x = distance.x, y = distance.y, block;
		
		for (var i=0, _i=blocks.size(); i<_i; i++) {
			block = blocks.get(i);
			block.rect.x += x;
			block.rect.y += y;
		}
	};
	DefaultManager.prototype.onBlockMoveEnd = function (event) {
		var distance = this.getZoomDistance(_.getDistance(this.pos, event.pos)),
		blocks = this.stage.selectedBlocks, x = distance.x, y = distance.y, block;
		
		for (var i=0, _i=blocks.size(); i<_i; i++) {
			block = blocks.get(i);
			block.rect.x += x;
			block.rect.y += y;
			
			this.stage.blocks.remove(block);
			this.stage.blocks.push(block);
		}
	};
	DefaultManager.prototype.onAreaSelectEnd = function (event) {
		var blocks = this.stage.blocks.getBlocksInRect(this.getZoomRect(_.getRect(this.pos, event.pos))),
		ctrlKey = event.ctrlKey && !event.shiftKey;

		for (var i=0, _i=blocks.length; i<_i; i++) {
			this.select(blocks[i], ctrlKey);
		}
	};
	DefaultManager.prototype.onSelect = function (event) {
		if (!(event.shiftKey || event.ctrlKey) && !(event.block && event.block.selected)) {
			this.stage.selectedBlocks.clear();
		}
		
		if (event.block) {
			this.select(event.block, event.ctrlKey && !event.shiftKey);
		}
	};
		
	/*
	 * Method
	 */
	
	DefaultManager.prototype.select = function (block, ctrlKey) {
		if (!block.selected) {
			this.stage.selectedBlocks.push(block);
			block.selected = true;
		}
		else if (ctrlKey){
			this.stage.selectedBlocks.remove(block);
			block.selected = false;
		}
	};
	
	window.DefaultManager = DefaultManager;
	
}) (window);
