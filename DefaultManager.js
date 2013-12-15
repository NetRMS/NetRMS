(function (window, undefined) {

	"use strict";

	//var _ = extend("util");
	
	/*
	 * DefaultManager
	 */
	
	function DefaultManager (stage) {
		this.initialize(stage);
	}
	DefaultManager.prototype = {
		initialize: function (stage) {
			this.stage = stage;
			
			stage.on("enter", this.onEnter);
			stage.on("leave", this.onLeave);
		},
		onLeave: function (data) {
			stage.cursor("default");
		},
		onEnter: function (data) {
			stage.cursor("pointer");
		}
	};
	
	window.DefaultManager = DefaultManager;
	
}) (window);
