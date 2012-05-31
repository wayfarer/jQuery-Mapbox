/**
 * Mapbox, the jQuery Map
 * jQuery Map Plugin
 * Version 0.6.0 beta
 * Author Abel Mohler
 * Released with the MIT License: http://www.opensource.org/licenses/mit-license.php
 */
(function($) {// jQuery.noConflict compliant
    $.fn.mapbox = function(o, callback) {
        var defaults = {
            zoom: true, // does map zoom?
            pan: true, // does map move side to side and up to down?
            defaultLayer: 0, // starting at 0, which layer shows up first
            layerSplit: 4, // how many times to split each layer as a zoom level
            mapContent: ".mapcontent", // the name of the class on the content inner layer
            defaultX: null, // default positioning on X-axis
            defaultY: null, // default positioning on Y-axis
            zoomToCursor: true, // if true, position on the map where the cursor is set will stay the same relative distance from the edge when zooming
            doubleClickZoom: false, // if true, double clicking zooms to mouse position
            clickZoom: false, // if true, clicking zooms to mouse position
            doubleClickZoomOut: false, // if true, double clicking zooms out to mouse position
            clickZoomOut: false, // if true, clicking zooms out to mouse position
            doubleClickMove: false, // if true, double clicking moves the map to the cursor position
            clickMove: false, // if true, clicking moves the map to the cursor position
            doubleClickDistance: 1, // number of positions (determined by layerSplit) to move on a double-click zoom event
            clickDistance: 1, // number of positions (determined by layerSplit) to move on a click zoom event
            callBefore: function(layer, xcoord, ycoord, viewport) {}, // this callback happens before dragging of map starts
            callAfter: function(layer, xcoord, ycoord, viewport) {}, // this callback happens at end of drag after map is released "mouseup"
            beforeZoom: function(layer, xcoord, ycoord, viewport) {}, // callback before a zoom happens
            afterZoom: function(layer, xcoord, ycoord, viewport) {}, // callback after zoom has completed
            mousewheel: false // requires mousewheel event plugin: http://plugins.jquery.com/project/mousewheel
        }

        if(typeof callback == "function") {
            o.callAfter = callback;
        }
        var command, arg = arguments;
        if(typeof o == "string") {
            command = o;//command passes "methods" such as "zoom", "left", etc.
        }

        o = $.extend(defaults, o || {});//inherit properties

        $(this).css({
            overflow: "hidden",
            position: "relative"
        });

        function _zoom(distance) {
            if(!o.zoom) return false;

            if(distance === 0) distance = 0;
                else distance = distance || 1;

            var layers = $(this).find(">div"), limit = layers.length - 1, current = $(this).find(".current-map-layer");
            if(typeof o.beforeZoom == "function") {
                o.beforeZoom(current[0], this.xPos, this.yPos, this);
            }

            var move = this.visible, eq = move;
            move += (distance / o.layerSplit);
            if(move < 0) move = 0;
            if(move > limit) move = limit;
            eq = Math.ceil(move);
            var movement = (this.visible == move) ? false : true;
            this.visible = move;

            var oldWidth = current.width(), oldHeight = current.height();
            var xPercent = (($(this).width() / 2) + this.xPos) / oldWidth,
            yPercent = (($(this).height() / 2) + this.yPos) / oldHeight;

            if ((o.layerSplit > 1 && eq > 0)) {
                var percent = move - (eq -1), thisX = layers.eq(eq)[0].defaultWidth, thisY = layers.eq(eq)[0].defaultHeight, lastX = layers.eq(eq - 1).width(), lastY = layers.eq(eq - 1).height();
                var differenceX = thisX - lastX, differenceY = thisY - lastY, totalWidth = lastX + (differenceX * percent), totalHeight = lastY + (differenceY * percent);
            }
            if(o.layerSplit > 1 && eq > 0) {
                layers.eq(eq).width(totalWidth).find(".map-layer-mask").width(totalWidth).height(totalHeight);
                layers.eq(eq).height(totalHeight).find(o.mapContent).width(totalWidth).height(totalHeight);
            }

            //left and top adjustment for new zoom level
            var newLeft = (layers.eq(eq).width() * xPercent) - ($(this).width() / 2),
            newTop = (layers.eq(eq).height() * yPercent) - ($(this).height() / 2);

            newLeft = 0 - newLeft;
            newTop = 0 - newTop;

            var limitX = $(this).width() - layers.eq(eq).width(),
            limitY = $(this).height() - layers.eq(eq).height();

            if(newLeft > 0) newLeft = 0;
            if(newTop > 0) newTop = 0;
            if(newLeft < limitX) newLeft = limitX;
            if(newTop < limitY) newTop = limitY;

            this.xPos = 0 - newLeft;
            this.yPos = 0 - newTop;

            function doCallback() {
                if(typeof o.afterZoom == "function") {
                    o.afterZoom(layers.eq(eq)[0], this.xPos, this.yPos, this);
                }
            }

            layers.removeClass("current-map-layer").hide();
            layers.eq(eq).css({
                left: newLeft + "px",
                top: newTop + "px",
                display: "block"
            }).addClass("current-map-layer");
            doCallback();
            
            return movement;
        }

        function _move(x, y, node) {
            node = node || $(this).find(".current-map-layer");
            var limitX = 0, limitY = 0, mapWidth = $(this).width(), mapHeight = $(this).height(),
            nodeWidth = $(node).width(), nodeHeight = $(node).height();

            if(mapWidth < nodeWidth) limitX = mapWidth - nodeWidth;
            if(mapHeight < nodeHeight) limitY = mapHeight - nodeHeight;

            var left = 0 - (this.xPos + x), top = 0 - (this.yPos + y);

            left = (left > 0) ? 0 : left;
            left = (left < limitX) ? limitX : left;
            top = (top > 0) ? 0 : top;
            top = (top < limitY) ? limitY : top;

            this.xPos = 0 - left;
            this.yPos = 0 - top;

            $(node).css({
                left: left + "px",
                top: top + "px"
            });
        }

        function _position(x, y, node) {
            node = node || $(this).find(".current-map-layer");

            x = 0 - x;
            y = 0 - y;

            var limitX = 0 - ($(node).width() - $(this).width());
            var limitY = 0 - ($(node).height() - $(this).height());

            if(x > 0) x = 0;
            if(y > 0) y = 0;
            if(x < limitX) x = limitX;
            if(y < limitY) y = limitY;

            this.xPos = 0 - x;
            this.yPos = 0 - y;

            $(node).css({
                left: x + "px",
                top: y + "px"
            });
        }

        function _makeCoords(s) {
            s = s.replace(/px/, "");
            s = 0 - s;
            return s;
        }

        var method = {//public methods
            zoom: function(distance) {
                distance = distance || 1;
                _zoom.call(this, distance);
            },
            back: function(distance) {
                distance = distance || 1;
                _zoom.call(this, 0 - distance);
            },
            left: function(amount) {
                amount = amount || 10;
                _move.call(this, 0 - amount, 0);
            },
            right: function(amount) {
                amount = amount || 10;
                _move.call(this, amount, 0);
            },
            up: function(amount) {
                amount = amount || 10;
                _move.call(this, 0, 0 - amount);
            },
            down: function(amount) {
                amount = amount || 10;
                _move.call(this, 0, amount);
            },
            center: function(coords) {
                coords = coords || {
                    x: $(this).find(".current-map-layer").width() / 2,
                    y: $(this).find(".current-map-layer").height() / 2
                }
                var node = $(this).find(".current-map-layer");
                var newX = coords.x - ($(this).width() / 2), newY = coords.y - ($(this).height() / 2);
                _position.call(this, newX, newY, node[0]);
            },
            zoomTo: function(level) {
                var distance = Math.round((level - this.visible) / (1 / this.layerSplit));
                _zoom.call(this, distance);
            }
        }

        return this.each(function() {
            if(typeof command == "string") {//execute public methods if called
                var execute = method[command];
                o.layerSplit = this.layerSplit || o.layerSplit;
                execute.call(this, callback);
            }
            else {
                this.visible = o.defaultLayer, this.layerSplit = o.layerSplit;//magic
                var viewport = this, layers = $(this).find(">div"), mapHeight = $(this).height(), mapWidth = $(this).width(), mapmove = false, first = true;
                layers.css({
                    position: "absolute"
                }).eq(o.defaultLayer).css({
                    display: "block",
                    left: "",
                    top: ""
                }).addClass("current-map-layer").find(o.mapContent).css({
                    position: "absolute",
                    left: "0",
                    top: "0",
                    height: mapHeight + "px",
                    width: "100%"
                });

                layers.each(function() {
                    this.defaultWidth = $(this).width();
                    this.defaultHeight = $(this).height();
                    $(this).find(o.mapContent).css({
                        position: "absolute",
                        top: "0",
                        left: "0"
                    });
                    if($(this).find(o.mapContent).length > 0) $(this).find(">img").css({
                        width: "100%",
                        position: "absolute",
                        left: "0",
                        top: "0"
                    }).after('<div class="map-layer-mask"></div>')
                });

                $(this).find(".map-layer-mask").css({
                    position: "absolute",
                    left: "0",
                    top: "0",
                    background: "white",// omg, horrible hack,
                    opacity: "0",// but only way IE will not freak out when
                    filter: "alpha(opacity=0)"// mouseup over IMG tag occurs after mousemove event
                });

                if (o.defaultLayer > 0) {
                    layers.eq(o.defaultLayer).find(".map-layer-mask").width(layers.eq(o.defaultLayer).width()).height(layers.eq(o.defaultLayer).height());
                    layers.eq(o.defaultLayer).find(o.mapContent).width(layers.eq(o.defaultLayer).width()).height(layers.eq(o.defaultLayer).height());
                }

                $(this).find(">div:not(.current-map-layer)").hide();
                if(o.defaultX == null) {
                    o.defaultX = Math.floor((mapWidth / 2) - ($(this).find(".current-map-layer").width() / 2));
                    if(o.defaultX > 0) o.defaultX = 0;
                }
                if(o.defaultY == null) {
                    o.defaultY = Math.floor((mapHeight / 2) - ($(this).find(".current-map-layer").height() / 2));
                    if(o.defaultY > 0) o.defaultY = 0;
                }

                this.xPos = 0 - o.defaultX;
                this.yPos = 0 - o.defaultY;
                this.layerSplit = o.layerSplit;

                var mapStartX = o.defaultX;
                var mapStartY = o.defaultY;
                var clientStartX;
                var clientStartY;

                $(this).find(".current-map-layer").css({
                    left: o.defaultX + "px",
                    top: o.defaultY + "px"
                });

                /**
                 * Event Handling and Callbacks
                 */

                var weveMoved = false;

                $(this).mousedown(function() {
                    var layer = $(this).find(".current-map-layer");
                    var x = layer[0].style.left, y = layer[0].style.top;
                    x = _makeCoords(x);
                    y = _makeCoords(y);
                    o.callBefore(layer, x, y, viewport);
                    mapmove = true;
                    first = true;
                    return false;//otherwise dragging on IMG elements etc inside the map will cause problems
                });

                $(document).mouseup(function() {
                    var layer = $(viewport).find(".current-map-layer");
                    var x = layer[0].style.left, y = layer[0].style.top;
                    x = _makeCoords(x);
                    y = _makeCoords(y);
                    o.callAfter(layer, x, y, viewport);
                    mapmove = false;
                    if(weveMoved) {
                        clickDefault = false;
                    }
                    weveMoved = false;
                    return false;
                });

                $(document).mousemove(function(e) {
                    var layer = $(viewport).find(".current-map-layer");
                    if(mapmove && o.pan) {
                        if(first) {
                            clientStartX = e.clientX;
                            clientStartY = e.clientY;
                            mapStartX = layer[0].style.left.replace(/px/, "");
                            mapStartY = layer[0].style.top.replace(/px/, "");
                            first = false;
                        }
                        else {
                            weveMoved = true;
                        }
                        var limitX = 0, limitY = 0;
                        if(mapWidth < layer.width()) limitX = mapWidth - layer.width();
                        if(mapHeight < layer.height()) limitY = mapHeight - layer.height();
                        var mapX = mapStartX - (clientStartX - e.clientX);
                        mapX = (mapX > 0) ? 0 : mapX;
                        mapX = (mapX < limitX) ? limitX : mapX;
                        var mapY = mapStartY - (clientStartY - e.clientY);
                        mapY = (mapY > 0) ? 0 : mapY;
                        mapY = (mapY < limitY) ? limitY : mapY;
                        layer.css({
                            left: mapX + "px",
                            top: mapY + "px"
                        });
                        viewport.xPos = _makeCoords(layer[0].style.left);
                        viewport.yPos = _makeCoords(layer[0].style.top);
                    }
                });

                if(o.mousewheel && typeof $.fn.mousewheel != "undefined") {
                    $(viewport).mousewheel(function(e, distance) {
                        if(o.zoomToCursor) {
                            //should probably DRY this.
                            var layer = $(this).find('.current-map-layer'),
                            positionTop = e.pageY - layer.offset().top,//jQuery normalizes pageX and pageY for us.
                            positionLeft = e.pageX - layer.offset().left,
                            //recalculate this position on current layer as a percentage
                            relativeTop = e.pageY - $(this).offset().top,
                            relativeLeft = e.pageX - $(this).offset().left,
                            percentTop = positionTop / layer.height(),
                            percentLeft = positionLeft / layer.width();
                        }
                        if(_zoom.call(this, distance) && o.zoomToCursor/* && distance > 0*/) {
                            //only center when zooming in, since it feels weird on out.  Don't center if we've reached the floor
                            //convert percentage to pixels on new layer
                            layer = $(this).find('.current-map-layer');
                            var x = layer.width() * percentLeft,
                            y = layer.height() * percentTop;
                            //and set position
                            _position.call(this, x - relativeLeft, y - relativeTop, layer[0]);
                        }
                        return false;//don't scroll the window
                    });
                }

                var clickTimeoutId = setTimeout(function(){},0), clickDefault = true;

                if(o.doubleClickZoom || o.doubleClickZoomOut || o.doubleClickMove) {
                    $(viewport).dblclick(function(e) {
                        //TODO: DRY this
                        //prevent single-click default
                        clearTimeout(clickTimeoutId);
                        clickDefault = false;
                        var layer = $(this).find('.current-map-layer'),
                        positionTop = e.pageY - layer.offset().top,//jQuery normalizes pageX and pageY for us.
                        positionLeft = e.pageX - layer.offset().left,
                        //recalculate this position on current layer as a percentage
                        percentTop = positionTop / layer.height(),
                        percentLeft = positionLeft / layer.width();
                        if(o.doubleClickZoom) {
                            distance = o.doubleClickDistance;
                        }
                        else if (o.doubleClickZoomOut) {
                            distance = 0 - o.doubleClickDistance;
                        }
                        else {
                            distance = 0;
                        }
                        _zoom.call(this, distance);
                        //convert percentage to pixels on new layer
                        layer = $(this).find('.current-map-layer');
                        var x = layer.width() * percentLeft,
                        y = layer.height() * percentTop;
                        //and center
                        method.center.call(this,{x: x, y: y});
                        return false;
                    });
                }

                if(o.clickZoom || o.clickZoomOut || o.clickMove) {
                    $(viewport).click(function(e) {
                        function clickAction() {
                            if(clickDefault) {
                                //TODO: DRY this
                                var layer = $(this).find('.current-map-layer'),
                                positionTop = e.pageY - layer.offset().top,//jQuery normalizes pageX and pageY for us.
                                positionLeft = e.pageX - layer.offset().left,
                                //recalculate this position on current layer as a percentage
                                percentTop = positionTop / layer.height(),
                                percentLeft = positionLeft / layer.width();
                                var distance;
                                if(o.clickZoom) {
                                    distance = o.clickDistance;
                                }
                                else if (o.clickZoomOut) {
                                    distance = 0 - o.clickDistance;
                                }
                                else {
                                    distance = 0;
                                }
                                _zoom.call(this, distance);
                                //convert percentage to pixels on new layer
                                layer = $(this).find('.current-map-layer');
                                var x = layer.width() * percentLeft,
                                y = layer.height() * percentTop;
                                //and center
                                method.center.call(this,{x: x, y: y});
                            }
                            clickDefault = true;
                        }
                        if(o.doubleClickZoom || o.doubleClickZoomOut || o.doubleClickMove) {
                            //if either of these are registered we need to set the clickAction
                            //into a timeout so that a double click clears it
                            clickTimeoutId = setTimeout(function(){clickAction.call(viewport)}, 400);
                        }
                        else {
                            clickAction.call(this);
                        }
                    });
                }

                /**
                 *  End Event Handling and Callbacks
                 */

                //deferred, load images in hidden layers
                $(window).load(function() {
                    layers.each(function() {
                        var img = $(this).find("img")[0];
                        if(typeof img == "object") $("<img>").attr("src", img.src);
                    });
                });
            }
        });
    }
})(jQuery);