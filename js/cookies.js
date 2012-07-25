/*------------------------------------------------------------------------------
This file is part of the BT cookie solution.

The BT cookie solution is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The BT cookie solution is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with the BT cookie solution.  If not, see <http://www.gnu.org/licenses/>.

Copyright BT plc 2012
---------------------------------------------------------------------------------*/
/*
 * jQuery BTui 1.5.1
 *
 * Copyright (c) 2008 Paul Bakaus (ui.jquery.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI
 */
(function(jQuery) {

jQuery.BTui = {
	
	plugin: {
		add: function(module, option, set) {
			var proto = jQuery.BTui[module].prototype;
			for(var i in set) {
				proto.plugins[i] = proto.plugins[i] || [];
				proto.plugins[i].push([option, set[i]]);
			}
		},
		call: function(instance, name, args) {
			var set = instance.plugins[name];
			if(!set) { return; }
			
			for (var i = 0; i < set.length; i++) {
				if (instance.options[set[i][0]]) {
					set[i][1].apply(instance.element, args);
				}
			}
		}	
	},
	
	cssCache: {},
	css: function(name) {
		if (jQuery.BTui.cssCache[name]) { return jQuery.BTui.cssCache[name]; }
		var tmp = jQuery('<div class="BTui-gen">').addClass(name).css({position:'absolute', top:'-5000px', left:'-5000px', display:'block'}).appendTo('body');
		
		//if (!jQuery.browser.safari)
			//tmp.appendTo('body'); 
		
		//Opera and Safari set width and height to 0px instead of auto
		//Safari returns rgba(0,0,0,0) when bgcolor is not set
		jQuery.BTui.cssCache[name] = !!(
			(!(/auto|default/).test(tmp.css('cursor')) || (/^[1-9]/).test(tmp.css('height')) || (/^[1-9]/).test(tmp.css('width')) || 
			!(/none/).test(tmp.css('backgroundImage')) || !(/transparent|rgba\(0, 0, 0, 0\)/).test(tmp.css('backgroundColor')))
		);
		try { jQuery('body').get(0).removeChild(tmp.get(0));	} catch(e){}
		return jQuery.BTui.cssCache[name];
	},
	disableSelection: function(e) {
		e.unselectable = "on";
		e.onselectstart = function() { return false; };
		if (e.style) { e.style.MozUserSelect = "none"; }
	},
	enableSelection: function(e) {
		e.unselectable = "off";
		e.onselectstart = function() { return true; };
		if (e.style) { e.style.MozUserSelect = ""; }
	},
	hasScroll: function(e, a) {
		var scroll = /top/.test(a||"top") ? 'scrollTop' : 'scrollLeft', has = false;
		if (e[scroll] > 0) return true; e[scroll] = 1;
		has = e[scroll] > 0 ? true : false; e[scroll] = 0;
		return has;
	}
};


/** jQuery core modifications and additions **/

var _remove = jQuery.fn.remove;
jQuery.fn.remove = function() {
	jQuery("*", this).add(this).trigger("remove");
	return _remove.apply(this, arguments );
};

// jQuery.BTwidget is a factory to create jQuery plugins
// taking some boilerplate code out of the plugin code
// created by Scott Gonz‡lez and Jšrn Zaefferer
function getter(namespace, plugin, method) {
	var methods = jQuery[namespace][plugin].getter || [];
	methods = (typeof methods == "string" ? methods.split(/,?\s+/) : methods);
	return (jQuery.inArray(method, methods) != -1);
}

jQuery.BTwidget = function(name, prototype) {
	var namespace = name.split(".")[0];
	name = name.split(".")[1];
	
	// create plugin method
	jQuery.fn[name] = function(options) {
		var isMethodCall = (typeof options == 'string'),
			args = Array.prototype.slice.call(arguments, 1);
		
		if (isMethodCall && getter(namespace, name, options)) {
			var instance = jQuery.data(this[0], name);
			return (instance ? instance[options].apply(instance, args)
				: undefined);
		}
		
		return this.each(function() {
			var instance = jQuery.data(this, name);
			if (isMethodCall && instance && jQuery.isFunction(instance[options])) {
				instance[options].apply(instance, args);
			} else if (!isMethodCall) {
				jQuery.data(this, name, new jQuery[namespace][name](this, options));
			}
		});
	};
	
	// create BTwidget constructor
	jQuery[namespace][name] = function(element, options) {
		var self = this;
		
		this.BTwidgetName = name;
		this.BTwidgetBaseClass = namespace + '-' + name;
		
		this.options = jQuery.extend({}, jQuery.BTwidget.defaults, jQuery[namespace][name].defaults, options);
		this.element = jQuery(element)
			.bind('setData.' + name, function(e, key, value) {
				return self.setData(key, value);
			})
			.bind('getData.' + name, function(e, key) {

				return self.getData(key);
			})
			.bind('remove', function() {
				return self.destroy();
			});
		this.init();
	};
	
	// add BTwidget prototype
	jQuery[namespace][name].prototype = jQuery.extend({}, jQuery.BTwidget.prototype, prototype);
};

jQuery.BTwidget.prototype = {
	init: function() {},
	destroy: function() {
		this.element.removeData(this.BTwidgetName);
	},
	
	getData: function(key) {
		return this.options[key];
	},
	setData: function(key, value) {
		this.options[key] = value;
		
		if (key == 'disabled') {
			this.element[value ? 'addClass' : 'removeClass'](
				this.BTwidgetBaseClass + '-disabled');
		}
	},
	
	enable: function() {
		this.setData('disabled', false);
	},
	disable: function() {
		this.setData('disabled', true);
	}
};

jQuery.BTwidget.defaults = {
	disabled: false
};


/** Mouse Interaction Plugin **/

jQuery.BTui.mouse = {
	mouseInit: function() {
		var self = this;

		this.element.bind('mousedown.'+this.BTwidgetName, function(e) {
			return self.mouseDown(e);
		});
		
		// Prevent text selection in IE
		if (jQuery.browser.msie) {
			this._mouseUnselectable = this.element.attr('unselectable');
			this.element.attr('unselectable', 'on');
		}
		
		this.started = false;
	},
	
	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	mouseDestroy: function() {
		this.element.unbind('.'+this.BTwidgetName);
		
		// Restore text selection in IE
		(jQuery.browser.msie
			&& this.element.attr('unselectable', this._mouseUnselectable));
	},
	
	mouseDown: function(e) {
		// we may have missed mouseup (out of window)
		(this._mouseStarted && this.mouseUp(e));
		
		this._mouseDownEvent = e;
		
		var self = this,
			btnIsLeft = (e.which == 1),
			elIsCancel = (typeof this.options.cancel == "string" ? jQuery(e.target).is(this.options.cancel) : false);
		if (!btnIsLeft || elIsCancel || !this.mouseCapture(e)) {
			return true;
		}
		
		this._mouseDelayMet = !this.options.delay;
		if (!this._mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				self._mouseDelayMet = true;
			}, this.options.delay);
		}
		
		if (this.mouseDistanceMet(e) && this.mouseDelayMet(e)) {
			this._mouseStarted = (this.mouseStart(e) !== false);
			if (!this._mouseStarted) {
				e.preventDefault();
				return true;
			}
		}
		
		// these delegates are required to keep context
		this._mouseMoveDelegate = function(e) {
			return self.mouseMove(e);
		};
		this._mouseUpDelegate = function(e) {
			return self.mouseUp(e);
		};
		jQuery(document)
			.bind('mousemove.'+this.BTwidgetName, this._mouseMoveDelegate)
			.bind('mouseup.'+this.BTwidgetName, this._mouseUpDelegate);
			
		return false;
	},
	
	mouseMove: function(e) {
		// IE mouseup check - mouseup happened when mouse was out of window
		if (jQuery.browser.msie && !(document.documentMode >= 9) && !e.button) {
			return this.mouseUp(e);
		}
		
		if (this._mouseStarted) {
			this.mouseDrag(e);
			return false;
		}
		
		if (this.mouseDistanceMet(e) && this.mouseDelayMet(e)) {
			this._mouseStarted =
				(this.mouseStart(this._mouseDownEvent, e) !== false);
			(this._mouseStarted ? this.mouseDrag(e) : this.mouseUp(e));
		}
		
		return !this._mouseStarted;
	},
	
	mouseUp: function(e) {
		
		jQuery(document)
			.unbind('mousemove.'+this.BTwidgetName, this._mouseMoveDelegate)
			.unbind('mouseup.'+this.BTwidgetName, this._mouseUpDelegate);

			if (this._mouseStarted) {
				this._mouseStarted = false;
				this.mouseStop(e);
			}
		
		return false;
	},
	
	mouseDistanceMet: function(e) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - e.pageX),
				Math.abs(this._mouseDownEvent.pageY - e.pageY)
			) >= this.options.distance
		);
	},
	
	mouseDelayMet: function(e) {
		return this._mouseDelayMet;
	},
	
	// These are placeholder methods, to be overriden by extending plugin
	mouseStart: function(e) {},
	mouseDrag: function(e) {},
	mouseStop: function(e) {},
	mouseCapture: function(e) { return true; }
};

jQuery.BTui.mouse.defaults = {
	cancel: null,
	distance: 1,
	delay: 0
};

})(jQuery);



/*
 * jQuery UI Draggable
 *
 * Copyright (c) 2008 Paul Bakaus
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 * http://docs.jquery.com/UI/Draggables
 *
 * Depends:
 *	BTui.core.js
 */
(function(jQuery) {

jQuery.BTwidget("BTui.BTdraggable", jQuery.extend(jQuery.BTui.mouse, {
	
	init: function() {
		//Initialize needed constants
		var o = this.options;

		//Position the node
		if (o.helper == 'original' && !(/(relative|absolute|fixed)/).test(this.element.css('position')))
			this.element.css('position', 'relative');

		this.element.addClass('BTui-BTdraggable');
		(o.disabled && this.element.addClass('BTui-BTdraggable-disabled'));
		
		this.mouseInit();
		
		// HACK
		this.mask = jQuery("div.mask");
		this.sliderImg = jQuery(".sliderImage");
		// /HACK
		
	},
	mouseStart: function(e) {
		var o = this.options;
		
		if (this.helper || o.disabled || jQuery(e.target).is('.BTui-resizable-handle')) return false;
		
		var handle = !this.options.handle || !jQuery(this.options.handle, this.element).length ? true : false;
		
	
		jQuery(this.options.handle, this.element).find("*").andSelf().each(function() {
			if(this == e.target) handle = true;
		});
		if (!handle) return false;
		
		if(jQuery.BTui.ddmanager) jQuery.BTui.ddmanager.current = this;
		
		//Create and append the visible helper
		this.helper = jQuery.isFunction(o.helper) ? jQuery(o.helper.apply(this.element[0], [e])) : (o.helper == 'clone' ? this.element.clone() : this.element);
		if(!this.helper.parents('body').length) this.helper.appendTo((o.appendTo == 'parent' ? this.element[0].parentNode : o.appendTo));
		if(this.helper[0] != this.element[0] && !(/(fixed|absolute)/).test(this.helper.css("position"))) this.helper.css("position", "absolute");
		
		/*
		 * - Position generation -
		 * This block generates everything position related - it's the core of BTdraggables.
		 */
		
		this.margins = {																				//Cache the margins
			left: (parseInt(this.element.css("marginLeft"),10) || 0),
			top: (parseInt(this.element.css("marginTop"),10) || 0)
		};		
		
		this.cssPosition = this.helper.css("position");													//Store the helper's css position
		this.offset = this.element.offset();															//The element's absolute position on the page
		this.offset = {																					//Substract the margins from the element's absolute offset
			top: this.offset.top - this.margins.top,
			left: this.offset.left - this.margins.left
		};
		
		this.offset.click = {																			//Where the click happened, relative to the element
			left: e.pageX - this.offset.left,
			top: e.pageY - this.offset.top
		};
		
		this.offsetParent = this.helper.offsetParent(); var po = this.offsetParent.offset();			//Get the offsetParent and cache its position
		if(this.offsetParent[0] == document.body && jQuery.browser.mozilla) po = { top: 0, left: 0 };		//Ugly FF3 fix
		this.offset.parent = {																			//Store its position plus border
			top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"),10) || 0),
			left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"),10) || 0)
		};
		
		var p = this.element.position();																//This is a relative to absolute position minus the actual position calculation - only used for relative positioned helpers
		this.offset.relative = this.cssPosition == "relative" ? {
			top: p.top - (parseInt(this.helper.css("top"),10) || 0) + this.offsetParent[0].scrollTop,
			left: p.left - (parseInt(this.helper.css("left"),10) || 0) + this.offsetParent[0].scrollLeft
		} : { top: 0, left: 0 };
		
		this.originalPosition = this.generatePosition(e);												//Generate the original position
		this.helperProportions = { width: this.helper.outerWidth(), height: this.helper.outerHeight() };//Cache the helper size
		
		if(o.cursorAt) {
			if(o.cursorAt.left != undefined) this.offset.click.left = o.cursorAt.left + this.margins.left;
			if(o.cursorAt.right != undefined) this.offset.click.left = this.helperProportions.width - o.cursorAt.right + this.margins.left;
			if(o.cursorAt.top != undefined) this.offset.click.top = o.cursorAt.top + this.margins.top;
			if(o.cursorAt.bottom != undefined) this.offset.click.top = this.helperProportions.height - o.cursorAt.bottom + this.margins.top;
		}
		
		
		/*
		 * - Position constraining -
		 * Here we prepare position constraining like grid and containment.
		 */	
		
		if(o.containment) {
			if(o.containment == 'parent') o.containment = this.helper[0].parentNode;
			if(o.containment == 'document' || o.containment == 'window') this.containment = [
				0 - this.offset.relative.left - this.offset.parent.left,
				0 - this.offset.relative.top - this.offset.parent.top,
				jQuery(o.containment == 'document' ? document : window).width() - this.offset.relative.left - this.offset.parent.left - this.helperProportions.width - this.margins.left - (parseInt(this.element.css("marginRight"),10) || 0),
				(jQuery(o.containment == 'document' ? document : window).height() || document.body.parentNode.scrollHeight) - this.offset.relative.top - this.offset.parent.top - this.helperProportions.height - this.margins.top - (parseInt(this.element.css("marginBottom"),10) || 0)
			];
			
			if(!(/^(document|window|parent)$/).test(o.containment)) {
				var ce = jQuery(o.containment)[0];
				var co = jQuery(o.containment).offset();
				
				this.containment = [
					co.left + (parseInt(jQuery(ce).css("borderLeftWidth"),10) || 0) - this.offset.relative.left - this.offset.parent.left,
					co.top + (parseInt(jQuery(ce).css("borderTopWidth"),10) || 0) - this.offset.relative.top - this.offset.parent.top,
					co.left+Math.max(ce.scrollWidth,ce.offsetWidth) - (parseInt(jQuery(ce).css("borderLeftWidth"),10) || 0) - this.offset.relative.left - this.offset.parent.left - this.helperProportions.width - this.margins.left - (parseInt(this.element.css("marginRight"),10) || 0),
					co.top+Math.max(ce.scrollHeight,ce.offsetHeight) - (parseInt(jQuery(ce).css("borderTopWidth"),10) || 0) - this.offset.relative.top - this.offset.parent.top - this.helperProportions.height - this.margins.top - (parseInt(this.element.css("marginBottom"),10) || 0)
				];
			}
		}
		
		//Call plugins and callbacks
		this.propagate("start", e);
		
		this.helperProportions = { width: this.helper.outerWidth(), height: this.helper.outerHeight() };//Recache the helper size
		if (jQuery.BTui.ddmanager && !o.dropBehaviour) jQuery.BTui.ddmanager.prepareOffsets(this, e);
		
		this.helper.addClass("BTui-BTdraggable-dragging");
		this.mouseDrag(e); //Execute the drag once - this causes the helper not to be visible before getting its correct position
		return true;
	},
	convertPositionTo: function(d, pos) {
		if(!pos) pos = this.position;
		var mod = d == "absolute" ? 1 : -1;
		return {
			top: (
				pos.top																	// the calculated relative position
				+ this.offset.relative.top	* mod										// Only for relative positioned nodes: Relative offset from element to offset parent
				+ this.offset.parent.top * mod											// The offsetParent's offset without borders (offset + border)
				- (this.cssPosition == "fixed" || (this.cssPosition == "absolute" && this.offsetParent[0] == document.body) ? 0 : this.offsetParent[0].scrollTop) * mod	// The offsetParent's scroll position, not if the element is fixed
				+ (this.cssPosition == "fixed" ? jQuery(document).scrollTop() : 0) * mod
				+ this.margins.top * mod												//Add the margin (you don't want the margin counting in intersection methods)
			),
			left: (
				pos.left																// the calculated relative position
				+ this.offset.relative.left	* mod										// Only for relative positioned nodes: Relative offset from element to offset parent
				+ this.offset.parent.left * mod											// The offsetParent's offset without borders (offset + border)
				- (this.cssPosition == "fixed" || (this.cssPosition == "absolute" && this.offsetParent[0] == document.body) ? 0 : this.offsetParent[0].scrollLeft) * mod	// The offsetParent's scroll position, not if the element is fixed
				+ (this.cssPosition == "fixed" ? jQuery(document).scrollLeft() : 0) * mod
				+ this.margins.left * mod												//Add the margin (you don't want the margin counting in intersection methods)
			)
		};
	},
	generatePosition: function(e) {
		
		var o = this.options;
		var position = {
			top: (
				e.pageY																	// The absolute mouse position
				- this.offset.click.top													// Click offset (relative to the element)
				- this.offset.relative.top												// Only for relative positioned nodes: Relative offset from element to offset parent
				- this.offset.parent.top												// The offsetParent's offset without borders (offset + border)
				+ (this.cssPosition == "fixed" || (this.cssPosition == "absolute" && this.offsetParent[0] == document.body) ? 0 : this.offsetParent[0].scrollTop)	// The offsetParent's scroll position, not if the element is fixed
				- (this.cssPosition == "fixed" ? jQuery(document).scrollTop() : 0)
			),
			left: (
				e.pageX																	// The absolute mouse position
				- this.offset.click.left												// Click offset (relative to the element)
				- this.offset.relative.left												// Only for relative positioned nodes: Relative offset from element to offset parent
				- this.offset.parent.left												// The offsetParent's offset without borders (offset + border)
				+ (this.cssPosition == "fixed" || (this.cssPosition == "absolute" && this.offsetParent[0] == document.body) ? 0 : this.offsetParent[0].scrollLeft)	// The offsetParent's scroll position, not if the element is fixed
				- (this.cssPosition == "fixed" ? jQuery(document).scrollLeft() : 0)
			)
		};
		
		if(!this.originalPosition) return position;										//If we are not dragging yet, we won't check for options
		
		/*
		 * - Position constraining -
		 * Constrain the position to a mix of grid, containment.
		 */
		if(this.containment) {
			if(position.left < this.containment[0]) position.left = this.containment[0];
			if(position.top < this.containment[1]) position.top = this.containment[1];
			if(position.left > this.containment[2]) position.left = this.containment[2];
			if(position.top > this.containment[3]) position.top = this.containment[3];
		}
		
		if(o.grid) {
			var top = this.originalPosition.top + Math.round((position.top - this.originalPosition.top) / o.grid[1]) * o.grid[1];
			position.top = this.containment ? (!(top < this.containment[1] || top > this.containment[3]) ? top : (!(top < this.containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;
			
			var left = this.originalPosition.left + Math.round((position.left - this.originalPosition.left) / o.grid[0]) * o.grid[0];
			position.left = this.containment ? (!(left < this.containment[0] || left > this.containment[2]) ? left : (!(left < this.containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
		}
		
		return position;
	},
	mouseDrag: function(e) {
		// HACK - needs to use callback specified via options instead
		if(this.mask && this.sliderImg) {
                        var maskWidth = this.sliderImg.css('left'),
                                valueOf = parseInt(maskWidth, 10);
                        this.mask.css('width', valueOf +15)
		}      
		// /HACK
		
		//Compute the helpers position
		this.position = this.generatePosition(e);
		
		
		// HACK: hardcoding x-axis drag limits - needs to be handled by containment code
		if(this.position.left > 0 && this.position.left <= 408) {
		
		    this.positionAbs = this.convertPositionTo("absolute");
		
		    //Call plugins and callbacks and use the resulting position if something is returned		
		    this.position = this.propagate("drag", e) || this.position;
		
		    if(!this.options.axis || this.options.axis != "y") this.helper[0].style.left = this.position.left+'px';
		    if(!this.options.axis || this.options.axis != "x") this.helper[0].style.top = this.position.top+'px';
		    if(jQuery.BTui.ddmanager) jQuery.BTui.ddmanager.drag(this, e);
		
		}
		
		return false;
	},
	mouseStop: function(e) {
		
		// HACK		
		if(this.mask) {
		        if (this.mask.width() <= '113' && this.mask.width() >= '0') {
                                jQuery('.cookieNecessaryPerformance label').click();
                        } else if (this.mask.width() <= '315' && this.mask.width() >= '114') {
                                jQuery('.cookieFunctional label').click();
                        } else if (this.mask.width() <= '430' && this.mask.width() >= '316') {
                                jQuery('.cookieSharing label').click();
                        }
		}  
		// /HACK
		
		//If we are using droppables, inform the manager about the drop
		if (jQuery.BTui.ddmanager && !this.options.dropBehaviour)
			jQuery.BTui.ddmanager.drop(this, e);
			
		if(this.options.revert) {
			var self = this;
			jQuery(this.helper).animate(this.originalPosition, parseInt(this.options.revert, 10) || 500, function() {
				self.propagate("stop", e);
				self.clear();
			});
		} else {
			this.propagate("stop", e);
			this.clear();
		}
		
		return false;
	},
	clear: function() {
		this.helper.removeClass("BTui-BTdraggable-dragging");
		if(this.options.helper != 'original' && !this.cancelHelperRemoval) this.helper.remove();
		//if(jQuery.BTui.ddmanager) jQuery.BTui.ddmanager.current = null;
		this.helper = null;
		this.cancelHelperRemoval = false;
	},
	
	// From now on bulk stuff - mainly helpers
	plugins: {},
	BTuiHash: function(e) {
		return {
			helper: this.helper,
			position: this.position,
			absolutePosition: this.positionAbs,
			options: this.options			
		};
	},
	propagate: function(n,e) {
		jQuery.BTui.plugin.call(this, n, [e, this.BTuiHash()]);
		return this.element.triggerHandler(n == "drag" ? n : "drag"+n, [e, this.BTuiHash()], this.options[n]);
	},
	destroy: function() {
		if(!this.element.data('BTdraggable')) return;
		this.element.removeData("BTdraggable").unbind(".BTdraggable").removeClass('BTui-BTdraggable');
		this.mouseDestroy();
	}
}));

jQuery.extend(jQuery.BTui.BTdraggable, {
	defaults: {
		appendTo: "parent",
		axis: false,
		cancel: ":input",
		delay: 0,
		distance: 1,
		helper: "original"
	}
});

jQuery.BTui.plugin.add("BTdraggable", "cursor", {
	start: function(e, BTui) {
		var t = jQuery('body');
		if (t.css("cursor")) BTui.options._cursor = t.css("cursor");
		t.css("cursor", BTui.options.cursor);
	},
	stop: function(e, BTui) {
		if (BTui.options._cursor) jQuery('body').css("cursor", BTui.options._cursor);
	}
});

jQuery.BTui.plugin.add("BTdraggable", "zIndex", {
	start: function(e, BTui) {
		var t = jQuery(BTui.helper);
		if(t.css("zIndex")) BTui.options._zIndex = t.css("zIndex");
		t.css('zIndex', BTui.options.zIndex);
	},
	stop: function(e, BTui) {
		if(BTui.options._zIndex) jQuery(BTui.helper).css('zIndex', BTui.options._zIndex);
	}
});

jQuery.BTui.plugin.add("BTdraggable", "opacity", {
	start: function(e, BTui) {
		var t = jQuery(BTui.helper);
		if(t.css("opacity")) BTui.options._opacity = t.css("opacity");
		t.css('opacity', BTui.options.opacity);
	},
	stop: function(e, BTui) {
		if(BTui.options._opacity) jQuery(BTui.helper).css('opacity', BTui.options._opacity);
	}
});

jQuery.BTui.plugin.add("BTdraggable", "iframeFix", {
	start: function(e, BTui) {
		jQuery(BTui.options.iframeFix === true ? "iframe" : BTui.options.iframeFix).each(function() {					
			jQuery('<div class="BTui-BTdraggable-iframeFix" style="background: #fff;"></div>')
			.css({
				width: this.offsetWidth+"px", height: this.offsetHeight+"px",
				position: "absolute", opacity: "0.001", zIndex: 1000
			})
			.css(jQuery(this).offset())
			.appendTo("body");
		});
	},
	stop: function(e, BTui) {
		jQuery("div.DragDropIframeFix").each(function() { this.parentNode.removeChild(this); }); //Remove frame helpers	
	}
});

jQuery.BTui.plugin.add("BTdraggable", "scroll", {
	start: function(e, BTui) {
		var o = BTui.options;
		var i = jQuery(this).data("BTdraggable");
		o.scrollSensitivity	= o.scrollSensitivity || 20;
		o.scrollSpeed		= o.scrollSpeed || 20;
		
		i.overflowY = function(el) {
			do { if(/auto|scroll/.test(el.css('overflow')) || (/auto|scroll/).test(el.css('overflow-y'))) return el; el = el.parent(); } while (el[0].parentNode);
			return jQuery(document);
		}(this);
		i.overflowX = function(el) {
			do { if(/auto|scroll/.test(el.css('overflow')) || (/auto|scroll/).test(el.css('overflow-x'))) return el; el = el.parent(); } while (el[0].parentNode);
			return jQuery(document);
		}(this);
		
		if(i.overflowY[0] != document && i.overflowY[0].tagName != 'HTML') i.overflowYOffset = i.overflowY.offset();
		if(i.overflowX[0] != document && i.overflowX[0].tagName != 'HTML') i.overflowXOffset = i.overflowX.offset();
		
	},
	drag: function(e, BTui) {
		
		var o = BTui.options;
		var i = jQuery(this).data("BTdraggable");
		
		if(i.overflowY[0] != document && i.overflowY[0].tagName != 'HTML') {
			if((i.overflowYOffset.top + i.overflowY[0].offsetHeight) - e.pageY < o.scrollSensitivity)
				i.overflowY[0].scrollTop = i.overflowY[0].scrollTop + o.scrollSpeed;
			if(e.pageY - i.overflowYOffset.top < o.scrollSensitivity)
				i.overflowY[0].scrollTop = i.overflowY[0].scrollTop - o.scrollSpeed;
							
		} else {
			if(e.pageY - jQuery(document).scrollTop() < o.scrollSensitivity)
				jQuery(document).scrollTop(jQuery(document).scrollTop() - o.scrollSpeed);
			if(jQuery(window).height() - (e.pageY - jQuery(document).scrollTop()) < o.scrollSensitivity)
				jQuery(document).scrollTop(jQuery(document).scrollTop() + o.scrollSpeed);
		}
		
		if(i.overflowX[0] != document && i.overflowX[0].tagName != 'HTML') {
			if((i.overflowXOffset.left + i.overflowX[0].offsetWidth) - e.pageX < o.scrollSensitivity)
				i.overflowX[0].scrollLeft = i.overflowX[0].scrollLeft + o.scrollSpeed;
			if(e.pageX - i.overflowXOffset.left < o.scrollSensitivity)
				i.overflowX[0].scrollLeft = i.overflowX[0].scrollLeft - o.scrollSpeed;
		} else {
			if(e.pageX - jQuery(document).scrollLeft() < o.scrollSensitivity)
				jQuery(document).scrollLeft(jQuery(document).scrollLeft() - o.scrollSpeed);
			if(jQuery(window).width() - (e.pageX - jQuery(document).scrollLeft()) < o.scrollSensitivity)
				jQuery(document).scrollLeft(jQuery(document).scrollLeft() + o.scrollSpeed);
		}
		
	}
});

jQuery.BTui.plugin.add("BTdraggable", "snap", {
	start: function(e, BTui) {
		
		var inst = jQuery(this).data("BTdraggable");
		inst.snapElements = [];
		jQuery(BTui.options.snap === true ? '.BTui-BTdraggable' : BTui.options.snap).each(function() {
			var jq_t = jQuery(this); var jq_o = jq_t.offset();
			if(this != inst.element[0]) inst.snapElements.push({
				item: this,
				width: jq_t.outerWidth(), height: jq_t.outerHeight(),
				top: jq_o.top, left: jq_o.left
			});
		});
		
	},
	drag: function(e, BTui) {
		
		var inst = jQuery(this).data("BTdraggable");
		var d = BTui.options.snapTolerance || 20;
		var x1 = BTui.absolutePosition.left, x2 = x1 + inst.helperProportions.width,
			y1 = BTui.absolutePosition.top, y2 = y1 + inst.helperProportions.height;
		
		for (var i = inst.snapElements.length - 1; i >= 0; i--){
			
			var l = inst.snapElements[i].left, r = l + inst.snapElements[i].width, 
				t = inst.snapElements[i].top, b = t + inst.snapElements[i].height;
			
			//Yes, I know, this is insane ;)
			if(!((l-d < x1 && x1 < r+d && t-d < y1 && y1 < b+d) || (l-d < x1 && x1 < r+d && t-d < y2 && y2 < b+d) || (l-d < x2 && x2 < r+d && t-d < y1 && y1 < b+d) || (l-d < x2 && x2 < r+d && t-d < y2 && y2 < b+d))) continue;
			
			if(BTui.options.snapMode != 'inner') {
				var ts = Math.abs(t - y2) <= 20;
				var bs = Math.abs(b - y1) <= 20;
				var ls = Math.abs(l - x2) <= 20;
				var rs = Math.abs(r - x1) <= 20;
				if(ts) BTui.position.top = inst.convertPositionTo("relative", { top: t - inst.helperProportions.height, left: 0 }).top;
				if(bs) BTui.position.top = inst.convertPositionTo("relative", { top: b, left: 0 }).top;
				if(ls) BTui.position.left = inst.convertPositionTo("relative", { top: 0, left: l - inst.helperProportions.width }).left;
				if(rs) BTui.position.left = inst.convertPositionTo("relative", { top: 0, left: r }).left;
			}
			
			if(BTui.options.snapMode != 'outer') {
				var ts = Math.abs(t - y1) <= 20;
				var bs = Math.abs(b - y2) <= 20;
				var ls = Math.abs(l - x1) <= 20;
				var rs = Math.abs(r - x2) <= 20;
				if(ts) BTui.position.top = inst.convertPositionTo("relative", { top: t, left: 0 }).top;
				if(bs) BTui.position.top = inst.convertPositionTo("relative", { top: b - inst.helperProportions.height, left: 0 }).top;
				if(ls) BTui.position.left = inst.convertPositionTo("relative", { top: 0, left: l }).left;
				if(rs) BTui.position.left = inst.convertPositionTo("relative", { top: 0, left: r - inst.helperProportions.width }).left;
			}
			
		};
	}
});

jQuery.BTui.plugin.add("BTdraggable", "connectToSortable", {
	start: function(e,BTui) {
	
		var inst = jQuery(this).data("BTdraggable");
		inst.sortables = [];
		jQuery(BTui.options.connectToSortable).each(function() {
			if(jQuery.data(this, 'sortable')) {
				var sortable = jQuery.data(this, 'sortable');
				inst.sortables.push({
					instance: sortable,
					shouldRevert: sortable.options.revert
				});
				sortable.refreshItems();	//Do a one-time refresh at start to refresh the containerCache	
				sortable.propagate("activate", e, inst);
			}
		});

	},
	stop: function(e,BTui) {
		
		//If we are still over the sortable, we fake the stop event of the sortable, but also remove helper
		var inst = jQuery(this).data("BTdraggable");
		
		jQuery.each(inst.sortables, function() {
			if(this.instance.isOver) {
				this.instance.isOver = 0;
				inst.cancelHelperRemoval = true; //Don't remove the helper in the BTdraggable instance
				this.instance.cancelHelperRemoval = false; //Remove it in the sortable instance (so sortable plugins like revert still work)
				if(this.shouldRevert) this.instance.options.revert = true; //revert here
				this.instance.mouseStop(e);
				
				//Also propagate receive event, since the sortable is actually receiving a element
				this.instance.element.triggerHandler("sortreceive", [e, jQuery.extend(this.instance.BTui(), { sender: inst.element })], this.instance.options["receive"]);

				this.instance.options.helper = this.instance.options._helper;
			} else {
				this.instance.propagate("deactivate", e, inst);
			}

		});
		
	},
	drag: function(e,BTui) {

		var inst = jQuery(this).data("BTdraggable"), self = this;
		
		var checkPos = function(o) {
				
			var l = o.left, r = l + o.width,
				t = o.top, b = t + o.height;

			return (l < (this.positionAbs.left + this.offset.click.left) && (this.positionAbs.left + this.offset.click.left) < r
					&& t < (this.positionAbs.top + this.offset.click.top) && (this.positionAbs.top + this.offset.click.top) < b);				
		};
		
		jQuery.each(inst.sortables, function(i) {

			if(checkPos.call(inst, this.instance.containerCache)) {

				//If it intersects, we use a little isOver variable and set it once, so our move-in stuff gets fired only once
				if(!this.instance.isOver) {
					this.instance.isOver = 1;

					//Now we fake the start of dragging for the sortable instance,
					//by cloning the list group item, appending it to the sortable and using it as inst.currentItem
					//We can then fire the start event of the sortable with our passed browser event, and our own helper (so it doesn't create a new one)
					this.instance.currentItem = jQuery(self).clone().appendTo(this.instance.element).data("sortable-item", true);
					this.instance.options._helper = this.instance.options.helper; //Store helper option to later restore it
					this.instance.options.helper = function() { return BTui.helper[0]; };
				
					e.target = this.instance.currentItem[0];
					this.instance.mouseCapture(e, true);
					this.instance.mouseStart(e, true, true);

					//Because the browser event is way off the new appended portlet, we modify a couple of variables to reflect the changes
					this.instance.offset.click.top = inst.offset.click.top;
					this.instance.offset.click.left = inst.offset.click.left;
					this.instance.offset.parent.left -= inst.offset.parent.left - this.instance.offset.parent.left;
					this.instance.offset.parent.top -= inst.offset.parent.top - this.instance.offset.parent.top;
					
					inst.propagate("toSortable", e);
				
				}
				
				//Provided we did all the previous steps, we can fire the drag event of the sortable on every BTdraggable drag, when it intersects with the sortable
				if(this.instance.currentItem) this.instance.mouseDrag(e);
				
			} else {
				
				//If it doesn't intersect with the sortable, and it intersected before,
				//we fake the drag stop of the sortable, but make sure it doesn't remove the helper by using cancelHelperRemoval
				if(this.instance.isOver) {
					this.instance.isOver = 0;
					this.instance.cancelHelperRemoval = true;
					this.instance.options.revert = false; //No revert here
					this.instance.mouseStop(e, true);
					this.instance.options.helper = this.instance.options._helper;
					
					//Now we remove our currentItem, the list group clone again, and the placeholder, and animate the helper back to it's original size
					this.instance.currentItem.remove();
					if(this.instance.placeholder) this.instance.placeholder.remove();
					
					inst.propagate("fromSortable", e);
				}
				
			};

		});

	}
});

jQuery.BTui.plugin.add("BTdraggable", "stack", {
	start: function(e,BTui) {
		var group = jQuery.makeArray(jQuery(BTui.options.stack.group)).sort(function(a,b) {
			return (parseInt(jQuery(a).css("zIndex"),10) || BTui.options.stack.min) - (parseInt(jQuery(b).css("zIndex"),10) || BTui.options.stack.min);
		});
		
		jQuery(group).each(function(i) {
			this.style.zIndex = BTui.options.stack.min + i;
		});
		
		this[0].style.zIndex = BTui.options.stack.min + group.length;
	}
});

})(jQuery);


/**
* Cookies JS
*
* @version	1.0
* @author	LBi
* @require	jquery 1.4+, jquery UI 1.4+, jquery cookie plugin, cookies.css
* @license	GPL v3
**/

/*jslint eqeqeq: true, undef: true */
/*global jQuery, document, window, Image, swfobject, DD_belatedPNG */


var btCookies = btCookies || {};

jQuery.expr[':'].focus = function( elem ) {
  return elem === document.activeElement && ( elem.type || elem.href );
};

/**
 * jQuery Cookie plugin
 *
 * Copyright (c) 2010 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
jQuery.cookie = function (key, value, options) {

    // key and at least value given, set cookie...
    if (arguments.length > 1 && String(value) !== "[object Object]") {
        options = jQuery.extend({}, options);

        if (value === null || value === undefined) {
            options.expires = -1;
        }

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
        }

        value = String(value);

        return (document.cookie = [
            encodeURIComponent(key), '=',
            options.raw ? value : encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path ? '; path=' + options.path : '',
            options.domain ? '; domain=' + options.domain : '',
            options.secure ? '; secure' : ''
        ].join(''));
    }

    // key and possibly options given, get cookie...
    options = value || {};
    var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
};


btCookies = function () {
	
	// Sets cookie to the page. Please use your domian name
	function setCookie(newLevel) {
		jQuery.cookie("cookie_level", newLevel, { domain: 'mydomain.com', path: '/',expires: 365 });
	}
	
	// Returns cookie value
	function getCookie() {
		return jQuery.cookie("cookie_level");
	}

	function initLevel() {
		var currentLevel = getCookie();

		// Switches the cookie level on load
		switch(currentLevel) {
			//In the event the level is one or two set click
			case '1' : case '2' : jQuery('.cookieNecessaryPerformance label').click();
			break;
			//In the event the level is three set click
			case '3': jQuery('.cookieFunctional label').click();
			break;
			//In the event the level is four or five set click
			case '4': case '5' : jQuery('.cookieSharing label').click();
			break;
		}
	}
	
	//This function handles the creation of the cookie level selection popup. 
	function cookieSelection() {
		//Creates the mask and slider handle.
		var mask = jQuery('<div class="mask" />"'),
			sliderImg = jQuery('<span class="sliderImage" aria-hidden="true"><span>handle</span></span>'),
			sliderImgTouch = jQuery('<span class="sliderImage sliderImageTouch"><span>handle</span></span>'),
			duration = 250,
			currentLevel = getCookie();
	
		// Adds mask, clones slider
		jQuery(mask).insertAfter('.cookieSlider');
		
		jQuery('.cookieSlider')
			.clone()
			.appendTo(mask)
			.addClass('cookieSliderActive')
			.removeClass('cookieSlider');

		jQuery('.cookieSlider')
			.find('span.labelFocus')
			.attr('tabIndex', '0');
			
			jQuery('.cookieSlider input').attr('disabled', 'disabled');
		
		// Renames cloned id's
		var cloneInputs = jQuery('.cookieSliderActive li input');
		
		//Iterates through all the Clone inputs and sets the attribute values to the variables jq_input and input
		for (var i = 0; i < cloneInputs.length; i++) {
			var jq_input = jQuery(cloneInputs[i]);
			var input = jq_input.get(0);// To work around IE 7 clone bug - see http://bugs.jquery.com/ticket/9777
			
			input.id = jq_input.attr('id') + 'Clone';
			input.name = jq_input.attr('name') + 'Clone';
		}
		
		var cloneLabels = jQuery('.cookieSliderActive li label');
		
		for (var j = 0; j < cloneLabels.length; j++) {
			var jq_label = jQuery(cloneLabels[j]);
			jq_label.attr('for', jq_label.attr('for') + 'Clone');
		}
		
		// Amends image and copy for touch devices
		if ('ontouchstart' in document.documentElement) {
			jQuery(sliderImgTouch).appendTo('.maskContainer');
			jQuery('.cookieContainer h2').text('Select an icon to change your cookie settings');
		} else {
			// Adds slider
			jQuery(sliderImg).appendTo('.maskContainer');
		}
		
		// Click functions for selecting cookie levels - animates mask and draggable and sets the form levels
		jQuery('.cookieNecessaryPerformance span.labelFocus').bind('click keypress', function (e) {
			if (e.type === 'click' || e.keyCode === 13) {
				e.preventDefault();
				jQuery(sliderImg).animate({left: '0'}, {duration: duration});
				jQuery(sliderImgTouch).animate({left: '0'}, {duration: duration});
				jQuery(mask).animate({width: '0'}, {duration: duration});
				jQuery('#details div').hide();
				jQuery('#details .neccesaryPerformanceList').show().children().show();
				jQuery('#functionalClone').attr('checked', false);
				jQuery('#sharingTargetingClone').attr('checked', false);
			}
		});
		jQuery('.cookieFunctional span.labelFocus').bind('click keypress', function (e) {
			if (e.type === 'click' || e.keyCode === 13) {
				e.preventDefault();
				jQuery(sliderImg).animate({left: '198'}, {duration: duration});
				jQuery(sliderImgTouch).animate({left: '198'}, {duration: duration});
				jQuery(mask).animate({width: '214'}, {duration: duration});
				jQuery('#details div').hide();
				jQuery('#details .functionalList').show().children().show();
				jQuery('#functionalClone').attr('checked', true);
				jQuery('#sharingTargetingClone').attr('checked', false);
			}
		});
		jQuery('.cookieSharing span.labelFocus').bind('click keypress', function (e) {
			if (e.type === 'click' || e.keyCode === 13) {
				e.preventDefault();
				jQuery(sliderImg).animate({left: '414'}, {duration: duration});
				jQuery(sliderImgTouch).animate({left: '414'}, {duration: duration});
				jQuery(mask).animate({width: '429'}, {duration: duration});
				jQuery('#details div').hide();
				jQuery('#details .sharingList').show().children().show();
				jQuery('#functionalClone').attr('checked', true);
				jQuery('#sharingTargetingClone').attr('checked', true);
			}
		});
		
		
		// Draggable init
		// jQuery(sliderImg).jqDraggable();
		jQuery(sliderImg).BTdraggable({ axis: 'x' },
                        { containment: 'parent' });

		// Show/hide cookie details
		jQuery('#details div').hide();
				
		switch(currentLevel){
			//In the event the level is one or two set show
			case '1': case '2': jQuery('#details .neccesaryPerformanceList').show().children().show();
			break;
			//In the event the level is three set show
			case '3': jQuery('#details .functionalList').show().children().show();
			break;
			//In the event the level is four or five set show
			case '4': case '5': jQuery('#details .sharingList').show().children().show();
			break;
			//No level set - interaction on toolbar before interacting with the notification popup
			default: jQuery('#details .sharingList').show().children().show();
			break;
		}
		
		// Hover classes to submit button
		jQuery('.cookieSubmit .cookieButton').hover(function() {
			jQuery(this).addClass('buttonSelectedHover');
		}, function () {
			jQuery(this).removeClass('buttonSelectedHover');
		});
		
		// Cancel button
		jQuery('.cookieSubmit p a').click(function(e) {
			e.preventDefault();
			jQuery('#cboxClose').click();
		});
		
		// Submit cookie form 
		jQuery('.submitCookie').click(function(e) {
			var levelBefore = getCookie();			
			e.preventDefault();
			jQuery('#yourCookieSettings #close').click();
			currentLevel = (jQuery('.cookieSliderActive input:checked').length + 2).toString();
			setCookie(currentLevel);
			setCookieLevel(currentLevel);
			// Reload the page fi the selected level and the current level differ. 
			if (levelBefore != currentLevel) {
				location.reload();
			}			
		});
		
	}
	
	// Setting active levels for toolbar
	function setCookieLevel(currentLevel) {
		
		jQuery('#cookiesToolbar ul li a').removeClass('active').each(function (){
			var jq_this = jQuery(this);
			jq_this.text(jq_this.text().replace('are enabled', 'are not enabled'));
		});
		
		function enableText(){
			var jq_this = jQuery(this);
			jq_this.text(jq_this.text().replace('are not enabled', 'are enabled'));
		}
		
		//Sets cookie icons to active if the level is accepted. 
		switch(currentLevel){
			case '1' : jQuery('.iconNeccesary a, .iconPerformance a').addClass('active').each(enableText);
			break;
			case '2' : jQuery('.iconNeccesary a, .iconPerformance a').addClass('active').each(enableText);
			break;
			case '3' : jQuery('#cookiesToolbar ul li a').not(':last').addClass('active').each(enableText);
			break;
			case '4' : jQuery('#cookiesToolbar ul li a').addClass('active').each(enableText);
			break;
			case '5' : jQuery('#cookiesToolbar ul li a').addClass('active').each(enableText);
			break;
		}
	}
	
	// Cookie notification on first visit
	function cookieNotif() {
		var jq_popup = jQuery('#cookieNotification'),
			currentLevel = getCookie();

		if (currentLevel !== null) {
			jq_popup.hide();
		} else {	
			jq_popup.attr('aria-hidden', 'false');

			cookieNotifTimer();
		}
		//If the change settings button is selected on the notification, this launches the lightbox
		jQuery('#cookieNotification .changeNow').bind('click', function(e){
			e.preventDefault();
			jQuery('#cookieNotification').unbind('mouseleave');
			jq_popup.hide();
			jq_popup.attr('aria-hidden', 'true');
			currentLevel = 4;
			setCookie(currentLevel);
			jQuery('.cookieLightbox').click();
		});
		//If the No thanks button is selected, this hides the notification. 
		jQuery('#cookieNotification .lastButton').bind('click', function(e){
			e.preventDefault();
			jQuery('#cookieNotification').unbind('mouseleave');
			jq_popup.hide();
			jq_popup.attr('aria-hidden', 'true');
			currentLevel = 4;
			setCookie(currentLevel);
		});
	}
	
	// Cookie notification timeout. This function hides the cookie notification if it isn't clicked
	function cookieNotifTimer() {
		var jq_popup = jQuery('#cookieNotification'),
			onTimeOut = function() {
				jq_popup.hide();
				jq_popup.attr('aria-hidden', 'true');
				currentLevel = 5;
				setCookie(currentLevel);
				jQuery('.cookieLightbox').one('click', function(e) {
					e.preventDefault();
					currentLevel = 4;
					setCookie(currentLevel);
				});
			},
			timer = setTimeout(onTimeOut, 7000);
		jq_popup.bind('mouseenter', function() {
			clearTimeout(timer);
		}).bind('mouseleave', function() {
			timer = setTimeout(onTimeOut, 7000);
		});
	}
	
	// Open/close lightbox functions
	function openLightbox() {
		// Variable to store the user's original scroll position, in case we need to change it to bring the lightbox into view.
		var originalScrollPos;
		// And another one to store the element that has focus when the lightbox opens, so we can return focus there when the lightbox closes.
		var focusBeforeLightboxOpened = null;
	
		jQuery('.cookieLightbox').bind('click', function(e) {
		    
			//If the height of the window is less than 1000px then set the height to 1000px.
			if(jQuery(document).height() < 1000)
			{
				adjustedHeight = "1000px";
			}
			//Else just use the the document height. 
			else
			{
				adjustedHeight = jQuery(document).height();
			}
			
			//set the vars for light box 
			var jq_window = jQuery(window),
				scrollPos = jq_window.scrollTop(),
				windowHeight = jq_window.height(),
				jq_docHeight = adjustedHeight,
				jq_docWidth = "100%",
				lightboxTop = 50;

			e.preventDefault();

			// If the browser supports document.activeElement, store the currently focused element, so that we can return the focus there when the lightbox closes
			if (document.activeElement && document.activeElement !== document.getElementsByTagName('body')[0]){
				focusBeforeLightboxOpened = document.activeElement;
			}

			// Sometimes (i.e. when the viewport is tall than the lightbox), the top of the lightbox may be positioned above the user's scroll position. If so, scroll to where the lightbox is, and store the original scroll position so that the close function can scroll back to it.
			if (scrollPos > lightboxTop){
				originalScrollPos = scrollPos;
			
				jQuery('html, body').animate({
					scrollTop: (lightboxTop - 25)
				});
			}

			if (jQuery('#cookieWrapper .mask').length < 1) {
				cookieSelection();
			}

			initLevel();
			
			// show the lightbox
			jQuery('#yourCookieSettings').fadeIn().css({
				top: lightboxTop
			});
			jQuery('#yourCookieSettings').attr('aria-hidden', 'false');

			// Focus the first option, for easier keyboard access
			jQuery('.cookieNecessaryPerformance .labelFocus').get(0).focus();

			// If this is IE 6, put an iframe behind the overlay to hide any <select> elements
			if(jQuery.browser.msie && parseInt(jQuery.browser.version) == 6) {
				jQuery('#cookieOverlay').before(
					jQuery('<iframe id="cookieOverlayIE6Fix"></iframe>').css({
						width: jq_docWidth,
						height: jq_docHeight
					})
				);
			}
			
			// set the overlay dimensions
			// show the overlay
			jQuery('#cookieOverlay').css({
				width: jq_docWidth,
				height: jq_docHeight
			}).fadeIn(function() {
			    
			    var jq_mask = jQuery("div.mask");
			    var jq_maskContainer = jq_mask.parent();
			    var jq_sliderImage = jQuery(".sliderImage");
			    
			    var maskWidth = jq_mask.width();
			    var sliderOffset = jq_sliderImage.position().left;
			    
			    if(!btCookies.dimensions) {
				btCookies.dimensions = {};
			    }
			    
			    if(!btCookies.dimensions.maskWidth) {
				btCookies.dimensions.maskWidth = maskWidth;
			    }
			    
			    if(!btCookies.dimensions.sliderOffset) {
				btCookies.dimensions.sliderOffset = sliderOffset;
			    } 
			    
			    btCookies.dimensions.maskOffset = jq_mask.offset().left;
			    btCookies.dimensions.maskContainerOffset = jq_maskContainer.offset().left;

			});
			
			jQuery('#cookieOverlay').bind('click', function(){
				jQuery('#yourCookieSettings').find('#close').click();
			});
			
			if (jQuery('#yourCookieSettings:visible')) {
				jQuery(document).bind('keydown', function(e) {
					if (e.which == 27) {
						jQuery('#yourCookieSettings').find('#close').click();
					}
				});
			}

		});

		// bind the closing link functionality
		jQuery('#yourCookieSettings').find('#close').bind('click', function(e) {
			e.preventDefault();
			// hide the lightbox
			jQuery('#yourCookieSettings').fadeOut();
			jQuery('#yourCookieSettings').attr({
				'aria-hidden': 'true'
			});
			// hide the overlay, and get rid of its iframe
			jQuery('#cookieOverlay').fadeOut();
			jQuery('iframe#cookieOverlayIE6Fix').remove();

			
			// If we stored the element that was focused before the lightbox opened, get ready to return focus there.
			
			function returnFocus() {
				if (focusBeforeLightboxOpened){
					focusBeforeLightboxOpened.focus();
					focusBeforeLightboxOpened = null;
				}
			}

			// If we changed the scroll position of the page when the lightbox opened, change it back, then return focus.
			if (!(originalScrollPos === undefined)){
				jQuery('html, body').animate({
					scrollTop: originalScrollPos
				}, returnFocus);
				
				originalScrollPos = undefined;
			}
			// Otherwise, just return focus
			else {
				returnFocus();
			}
		});

		jQuery('#yourCookieSettings').find('.cookieSubmit a').bind('click', function(e) {
			e.preventDefault();
			// click the close button
			jQuery('#yourCookieSettings').find('#close').click();
		});

	}
	
	//Add the toolbar to display the cookie level icons and link to change settings, and append it to the body
	function addToolbar() {
		var toolbarHtml = "<div id=\"cookiesToolbar\"><div id=\"cookiesToolbarContainer\"><ul>" +
			"<li class=\"iconNeccesary\"><a class=\"cookieTip\" href=\"#strictlyNeccesaryTooltip\" aria-live=\"polite\">Strictly necessary cookies are enabled</a></li>" +
			"<li class=\"iconPerformance\"><a class=\"cookieTip\" href=\"#performanceTooltip\" aria-live=\"polite\">Performance cookies are enabled</a></li>" +
			"<li class=\"iconFunctional\"><a class=\"cookieTip active\" href=\"#functionalTooltip\" aria-live=\"polite\">Functional cookies are enabled</a></li>" +
			"<li class=\"iconSharing\"><a class=\"cookieTip active\" href=\"#sharingTooltip\" aria-live=\"polite\">Sharing &amp; Targeting cookies are enabled</a></li></ul>" +
			"<p><a href=\"#\" class=\"cookieLightbox\" aria-controls=\"yourCookieSettings\">Change cookie settings</a></p>" +
			"<span id=\"cookiesHelp\"><a class=\"cookieTip\" href=\"#cookieHelpTooltip\">Help</a></span></div></div>";

		jQuery('body').append(toolbarHtml);
	}
	
	//Creathe the notification popup, and append it to the body
	function addNotification() {
		var notifHtml = "<div id=\"cookieNotification\" aria-role=\"alert\" aria-live=\"assertive\" aria-hidden=\"true\" aria-describedby=\"cookieNotification_message\">" +
			"<p id=\"cookieNotification_message\">The cookie settings on this website are set to 'allow all cookies' to give you the very best experience. If you continue without changing these settings, you consent to this - but if you want, you can change your settings at any time at the bottom of this page.</p>" +
			"<div id=\"cookieActions\"><a class=\"cookieButton changeNow\" href=\"#\" aria-controls=\"yourCookieSettings\">Change settings</a><a class=\"cookieButton lastButton\" href=\"#\" aria-controls=\"cookieNotification\">No, thanks</a></div>" +
			"<p><a class=\"arrow\" href=\"#\" rel=\"cookiePopup\">Find out more about Cookies</a></p></div>";
		
		jQuery('body').append(notifHtml);
	}

	//Create the tooltips for hover on the cookie icons. 
	function initTooltips() {
		var strictlyNeccesaryTooltip = '<div class="cookieTooltip" id="strictlyNeccesaryTooltip"><div class="inner">' +
			'<p><strong>Strictly necessary cookies</strong></p>' +
			'<p>These cookies enable services you have asked for. This information is not used for advertising on other sites.</p></div></div>',
			performanceTooltip = jQuery('<div class="cookieTooltip" id="performanceTooltip"><div class="inner">' +
				'<p><strong>Performance cookies</strong></p>' +
				'<p>These cookies collect anonymous information on the pages visited. This information is not used for advertising on other sites.</p></div></div>'),
			functionalTooltip = jQuery('<div class="cookieTooltip" id="functionalTooltip"><div class="inner">' +
				'<p><strong>Functional cookies</strong></p>' +
				'<p>These cookies remember choices you make to improve your experience. This information is not used for advertising on other sites.</p></div></div>'),
			sharingTooltip = jQuery('<div class="cookieTooltip" id="sharingTooltip"><div class="inner">' +
				'<p><strong>Targeting cookies</strong></p>' +
				'<p>These cookies share information about your browsing habits with 3rd parties to help make advertising relevant to you and your interests.</p></div></div>'),
			cookieHelpTooltip = jQuery('<div class="cookieTooltip" id="cookieHelpTooltip"><div class="inner">' +
				'<p>Privacy settings allow you to enable or disable cookies. We use cookies to improve your experience on our website.</p></div></div>');

		// Add tooltips to the page
		jQuery('body').append(strictlyNeccesaryTooltip, performanceTooltip, functionalTooltip, sharingTooltip, cookieHelpTooltip);

		// Kill the click on the link
		// Add the mouseenbter and mouseleave event to the link to show the tip
		jQuery('#cookiesToolbar').find('.cookieTip').bind('click', function(e) {
			e.preventDefault();
		}).bind('mouseenter', function(e) {
			var jq_tooltip = jQuery('#' + jQuery(this).attr('href').split('#')[1]),
				topOffset = 0,
				leftOffset = 0,
				jq_windowWidth = jQuery(window).width();

			jQuery(document).bind('mousemove.tooltipPos', function(e) {
				// set the top offset
				topOffset = e.pageY - jq_tooltip.height() - 30;

				// set the left offset
				if (e.pageX > jq_windowWidth - 275) {
					// tooltip will appear off the edge of the screen to shift it left
					leftOffset = e.pageX - 260;
					// add a class for the reversed tip to move the pointer
					jq_tooltip.addClass('leftTip');
				} else {
					// tooltip will display in the screen correctly
					leftOffset = e.pageX - 20;
					// remove the class for the reversed tip
					jq_tooltip.removeClass('leftTip');
				}

				// make sure the tip doesn't go passed the edge of the screen
				if (leftOffset > jq_windowWidth - 300) {
					leftOffset = jq_windowWidth - 300;
				}

				// position the tooltip
				jq_tooltip.css({
					top: topOffset,
					left: leftOffset
				});
			});
		}).bind('mouseout', function() {
			var jq_tooltip = jQuery('#' + jQuery(this).attr('href').split('#')[1]);

			// hide the tooltip off the screen
			jq_tooltip.css('left', '-999em');

			// unbind the mouse event when the tip isn't showing
			jQuery(document).unbind('mousemove.tooltipPos');
		});
		jQuery('a[rel=cookiePopup]').bind('click', function(e) {
			window.open(this.href, "moreAbout", "scrollbars=1, width=830, height=600");
			return false;
		});
	}
	
	// Add the details for the cookies desctiptions. 
	function addDetails() {
		
		var detailsContainer = "<div id=\"detailsContainer\"><div id=\"details\">",
			neccesaryPerformance = "<div id=\"neccesaryPerformance_description\" class=\"neccesaryPerformanceList clearfix\"><div class=\"detailsColumnWill\">" +
			"<h3 class=\"will\">This website will:</h3><ul class=\"willList\"><li>Remember what is in your shopping basket</li><li>Remember how far you are through an order</li></ul>" +
			"</div><div class=\"detailsColumnWillNot\"><h3 class=\"willNot\">This website will not:</h3>" +
			"<ul class=\"willNotList\"><li>Allow you to share pages with social networks like Facebook</li><li>Allow you to comment on blogs</li>" +
			"<li>Send information to other websites so that advertising is more relevant to you</li><li>Remember your log-in details</li><li>Improve overall performance of the website</li>" +
			"<li>Provide you with live, online chat support</li></ul></div></div>",
			functional = "<div id=\"functional_description\" class=\"functionalList clearfix\"><div class=\"detailsColumnWill\"><h3 class=\"will\">This website will:</h3><ul class=\"willList\">" +
			"<li>Remember what is in your shopping basket</li><li>Remember how far you are through an order</li><li>Remember your log-in details</li>" +
			"<li>Make sure you're secure when logged in to the website</li><li>Make sure the website looks consistent</li><li>Offer live chat support</li>" +
			"</ul></div><div class=\"detailsColumnWillNot\"><h3 class=\"willNot\">This website will not:</h3><ul class=\"willNotList\">" +
			"<li>Allow you to share pages with social networks like Facebook</li><li>Allow you to comment on blogs</li>" +
			"<li>Send information to other websites so that advertising is more relevant to you</li></ul></div></div>",
			sharing = "<div id=\"sharing_description\" class=\"sharingList clearfix\"><div class=\"detailsColumnWill\"><h3 class=\"will\">This website will:</h3><ul class=\"willList\">" +
			"<li>Remember what is in your shopping basket</li><li>Remember how far you are through an order</li><li>Remember your log-in details</li>" +
			"<li>Make sure your logged in areas are secure</li><li>Offer live chat support</li><li>Make sure the website looks consistent</li>" +
			"<li>Allow you to share pages with social networks like Facebook</li><li>Allow you to comment on blogs</li><li>Send information to other websites so that advertising is more relevant to you</li>"+
			"</ul></div><div class=\"detailsColumnWillNot\"><h3 class=\"willNot\">This website will not:</h3></div></div></div></div>",
			detailsHtml = detailsContainer + neccesaryPerformance + functional + sharing;
		
		jQuery('#cookieWrapper').append(detailsHtml);
		
	}
	
	//Add the intro description and layout for cookie sections.
	function addContainer() {
		
		var cookieOverlay = "<div id=\"cookieOverlay\">&#160;</div>",
			cookieSettings = "<div id=\"yourCookieSettings\" aria-role=\"dialog\" aria-hidden=\"true\" aria-live=\"assertive\" aria-labelledby=\"yourCookieSettings_label\" aria-describedby=\"yourCookieSettings_description\"><a href=\"#\" id=\"close\" title=\"Close this dialog\" aria-controls=\"yourCookieSettings\">Close</a><h2 id=\"yourCookieSettings_label\">Your cookie settings</h2>" +
			"<form method=\"post\" action=\"#\">" +
			"<div id=\"yourCookieSettings_description\"><p>Cookies are very small text files that are stored on your computer when you visit some websites.</p>" +
			"<p>We use cookies to make our website easier for you to use. You can remove any cookies already stored on your computer, but these may prevent you from using parts of our website.</p>" +
			"<p>Use the slider below to see the different types of cookies you can choose to allow.</p></div><div id=\"cookieWrapper\" class=\"clearfix\">" +
			"<div class=\"cookieContainer clearfix\"><h2>Drag the slider across to change your cookie settings</h2><div class=\"cookieNecessaryPerformance\">" +
			"<input id=\"necessaryPerformance\" type=\"checkbox\" checked=\"true\" name=\"necessaryPerformance\" aria-describedby=\"neccesaryPerformance_description\">" +
			"<span class=\"labelFocus\" tabindex=\"0\"><label for=\"necessaryPerformance\">Strictly necessary &amp; Performance</label></span></div><div class=\"maskContainer\">" +
			"<ul class=\"cookieSlider\"><li class=\"cookieFunctional\"><input id=\"functional\" type=\"checkbox\" checked=\"true\" name=\"functional\" aria-describedby=\"functional_description\">" +
			"<span class=\"labelFocus\"><label for=\"functional\">Functional</label></span></li><li class=\"cookieSharing\"><input id=\"sharingTargeting\" type=\"checkbox\" checked=\"true\" name=\"sharingTargeting\" aria-describedby=\"sharing_description\">" +
			"<span class=\"labelFocus\"><label for=\"sharingTargeting\">Targeting</label></span></li></ul></div></div></div>",
			cookieFooter = "<div id=\"cookieFooter\"><p><a class=\"arrow\" href=\"#\" rel=\"cookiePopup\">Find out more about Cookies</a></p><div class=\"cookieSubmit\">" +
			"<p><a href=\"#\" aria-controls=\"yourCookieSettings\">Cancel</a></p><div class=\"cookieButton cookieButtonBlue buttonSelected\"><input class=\"submitCookie\" type=\"submit\" value=\"Save and close\">" +
			"</div></div><div class=\"subNote\">For your new settings to take effect, this page will automatically refresh when you click 'Save and close'.</div></div></form></div>",
			containerHtml = cookieOverlay + cookieSettings + cookieFooter;
			
			jQuery('body').append(containerHtml);
	}
	
	//Adds and removes class focused on the cookie slider. 
	function focusClicks() {
		
		jQuery('#cookieWrapper').find('span.labelFocus').bind('focus', function() {
			var this_for = jQuery(this).find('label').attr('for');			
			jQuery('.cookieSliderActive').find('[for="' + this_for + 'Clone"]').parents('.labelFocus').addClass('focused');
			
		}).bind('blur', function(){
			var this_for = jQuery(this).find('label').attr('for');
			jQuery('.cookieSliderActive').find('[for="' + this_for + 'Clone"]').parents('.labelFocus').removeClass('focused');
		});
		
	}
	
	//Returns the object supportedCookies setting levels 1 through 4
	return {
		cookies: (function () {
			var supportedCookies = {
				'necessary': 1,
				'performance': 2,
				'functional': 3,
				'sharing': 4,
				'targeting': 4
			};
		}()),
	
		//Calls functions
		initCookies: function() {
			addToolbar();
			currentLevel = getCookie();
			if (currentLevel) {
				setCookieLevel(currentLevel);
			}
			addContainer();
			addDetails();
			addNotification();
			cookieNotif();
			openLightbox();
			initTooltips();
			focusClicks();
		}
	};
}();

jQuery(function () {
	btCookies.initCookies();
});