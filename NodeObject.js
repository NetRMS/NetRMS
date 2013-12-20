(function (window, undefined) {

	"use strict";

	/*
	 * NodeObject
	 */
	function NodeObject() {
		this.initialize();
	}
	NodeObject.SIZE = 30;
	
	NodeObject.prototype = new BlockObject();
	NodeObject.prototype.initialize = function () {
		this.rect = {
			"x": 0,
			"y": 0,
			"w": NodeObject.SIZE,
			"h": NodeObject.SIZE
		};
		this.index = "#000000";
		this.image = null;
		this.selected = false;
		this.links = {};
	};
	NodeObject.prototype.path = function (context) {
		context.beginPath();
		context.rect(this.rect.x - this.rect.w/2, this.rect.y -this.rect.h/2, this.rect.w, this.rect.h);
		context.closePath();
	};

	window.NodeObject = NodeObject;
	
}) (window);
