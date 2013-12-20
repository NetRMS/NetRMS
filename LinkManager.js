(function (window, undefined) {

	"use strict";

	var _ = extend("coord");
	
	/*
	 * LinkManager
	 */
	
	function LinkManager (stage) {
		this.initialize(stage);
	}
	LinkManager.prototype = new StageManager();
	
	/*
	 * Override
	 */
	
	LinkManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this);
		
		this.from = null;
		
		stage.on("link", this.onAddLink.bind(this));
		stage.on("select", this.onSelect.bind(this));
		stage.on("linkdrawstart", this.onDragStart.bind(this));
		stage.on("linkdraw", this.onLinkDraw.bind(this));
		stage.on("linkdrawend", this.onLinkDrawEnd.bind(this));
		stage.on("stagemovestart", this.onDragStart.bind(this));
		stage.on("reset", this.onReset.bind(this));
	};
	LinkManager.prototype.drawItem = function (item) {
		item.path(this.context);
		
		this.context.stroke();
	},
	LinkManager.prototype.set = function () {
		this.context.lineWidth = 3;
		this.context.strokeStyle = "rgba(0, 255, 0, 0.5)";
	};
	
	/*
	 * Event Handler
	 */
	
	LinkManager.prototype.onAddLink = function (event) {
		this.drawItem(event.link);
	};
	LinkManager.prototype.onDragStart = function (event) {
		this.block = event.block;
		this.pos = event.pos;
		this.copy();
	};
	LinkManager.prototype.onLinkDraw = function (event) {
		this.load(0, 0);
		
		this.context.beginPath();
		this.context.moveTo(this.block.rect.x, this.block.rect.y);
		if (event.block) {
			this.context.lineTo(event.block.rect.x / this.zoom, event.block.rect.y / this.zoom);
		}
		else {
			this.context.lineTo(event.pos.x / this.zoom, event.pos.y / this.zoom);
		}
		this.context.closePath();
		
		this.context.stroke();
	};
	LinkManager.prototype.onStageMove = function (event) {
		var distance = _.getDistance(this.pos, event.pos);
		
		this.clear();
		this.load(distance.x, distance.y);
	};
	LinkManager.prototype.onLinkDrawEnd = function (event) {			
		if (event.block && event.block != this.block) {
			console.log("link!!!");
		}
		else {
			this.load(0, 0);console.log(event.block+","+ this.block + ","+(event.block == this.block));
		}
	};
	LinkManager.prototype.onSelect = function (event) {
		//
	};
	LinkManager.prototype.onReset = function (event) {
		this.reset(event.width, event.height, event.zoom);
	};
	
	/*
	 * Method
	 */
	
	window.LinkManager = LinkManager;
	
}) (window);
