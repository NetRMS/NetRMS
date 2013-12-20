(function (window, undefined) {

	"use strict";

	var _ = extend("coord");

	/*
	 * BlockManager
	 */
	
	function BlockManager (stage) {
		this.initialize(stage);
	}
	/*
	 * Extend
	 */
	BlockManager.prototype = new StageManager();
	
	/*
	 * Override
	 */
	
	BlockManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this);
		
		stage.on("block", this.onAddBlock.bind(this));
		stage.on("invalidate", this.invalidate.bind(this));		
		stage.on("stagemovestart", this.onStageMoveStart.bind(this));
		stage.on("stagemove", this.onStageMove.bind(this));
		stage.on("stagemoveend", this.onStageMoveEnd.bind(this));
		stage.on("reset", this.onReset.bind(this));
	};
	BlockManager.prototype.set = function () {
		this.context.shadowBlur = 5;
		this.context.shadowColor = "black";
		this.context.shadowOffsetX = 1;
		this.context.shadowOffsetY = 1;
	};
	BlockManager.prototype.drawItem = function (item) {
		item.path(this.context);
		
		this.context.stroke();
		
		if(item.image) {
			this.context.drawImage(item.image, item.rect.x - item.rect.w/2, item.rect.y - item.rect.h/2, item.rect.w);
		}
	};
	
	/*
	 * Event handler
	 */
	
	BlockManager.prototype.onAddBlock = function (event) {
		this.drawItem(event.block);
	};
	BlockManager.prototype.onStageMoveStart = function (event) {
		this.pos = event.pos;
		
		this.copy();
	};
	BlockManager.prototype.onStageMove = function (event) {
		this.clear();
		
		var distance = _.getDistance(this.pos, event.pos);
		
		this.load(distance.x, distance.y);
	};
	BlockManager.prototype.onStageMoveEnd = function (event) {
		this.invalidate();
	};
	BlockManager.prototype.onReset = function (event) {
		this.reset(event.width, event.height, event.zoom);
	};
	/*
	 * Method
	 */
	
	window.BlockManager = BlockManager;

}) (window);
