/*!
 * Mapbox, a jQuery Map Plugin
 * Version 0.7
 * Original author: Abel Mohler (wayfarerweb.com).
 * Further changes: Dennis Schenk (gridonic.ch).
 * Released with the MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Depends:
 *  - jquery 1.3+
 */
;(function ($, window, document, undefined) {
    //"use strict";

    $.fn.mapbox = function (options, callback) {

        if (typeof callback === "function") {
            options.afterDragging = callback;
        }
        var command,
            arg = arguments;

        if (typeof options === "string") {
            command = options; // command passes "methods" such as "zoom", "left", etc.
        }

        // Extending defaults options (see bottom of file).
        options = $.extend( {}, $.fn.mapbox.options, options );

        $(this).css({
            overflow: "hidden",
            position: "relative"
        });

        function _zoom(distance) {
            if ( !options.zoom ) { return false; }

            if (distance === 0) { distance = 0; }
            else { distance = distance || 1; }

            var layers = $(this).find(">.map-layer"),
                limit = layers.length - 1,
                current = $(this).find(".current-map-layer"),
                move = this.visible,
                eq = move;

            move += (distance / options.layerSplit);
            if (move < 0) { move = 0; }
            if (move > limit) { move = limit; }
            eq = Math.ceil(move);
            var movement = (this.visible == move) ? false : true;
            this.visible = move;

            if ( typeof options.beforeZoom === "function" ) {
              options.beforeZoom(eq, current[0], this.xPos, this.yPos, this);
            }

            var oldWidth = current.width(),
                oldHeight = current.height(),
                xPercent = (($(this).width() / 2) + this.xPos) / oldWidth,
                yPercent = (($(this).height() / 2) + this.yPos) / oldHeight;

            if ((options.layerSplit > 1 && eq > 0)) {
                var percent = move - (eq -1),
                    thisX = layers.eq(eq)[0].defaultWidth,
                    thisY = layers.eq(eq)[0].defaultHeight,
                    lastX = layers.eq(eq - 1).width(),
                    lastY = layers.eq(eq - 1).height(),
                    differenceX = thisX - lastX,
                    differenceY = thisY - lastY,
                    totalWidth = lastX + (differenceX * percent),
                    totalHeight = lastY + (differenceY * percent);
            }

            if (options.layerSplit > 1 && eq > 0) {
                layers.eq(eq).width(totalWidth).find(".map-layer-mask").width(totalWidth).height(totalHeight);
                layers.eq(eq).height(totalHeight).find(options.mapContent).width(totalWidth).height(totalHeight);
            }

            // left and top adjustment for new zoom level
            var newLeft = (layers.eq(eq).width() * xPercent) - ($(this).width() / 2),
                newTop = (layers.eq(eq).height() * yPercent) - ($(this).height() / 2);

            newLeft = 0 - newLeft;
            newTop = 0 - newTop;

            var limitX = $(this).width() - layers.eq(eq).width(),
                limitY = $(this).height() - layers.eq(eq).height();

            if (newLeft > 0) { newLeft = 0; }
            if (newTop > 0) { newTop = 0; }
            if (newLeft < limitX) { newLeft = limitX; }
            if (newTop < limitY) { newTop = limitY; }

            this.xPos = 0 - newLeft;
            this.yPos = 0 - newTop;

            layers.removeClass("current-map-layer").hide();

            var newLayer = layers.eq(eq).css({
                left: newLeft + "px",
                top: newTop + "px",
                display: "block"
            }).addClass("current-map-layer");

            if (typeof options.afterZoom === "function") {
              options.afterZoom(eq, layers.eq(eq)[0], this.xPos, this.yPos, this);
            }

            if (newLayer[0] !== current[0]) {
              if (typeof options.afterLayerChange === "function") {
                options.afterLayerChange(eq, layers.eq(eq)[0], this.xPos, this.yPos, this);
              }
            }

            return movement;
        }

        function _move(x, y, node) {
            node = node || $(this).find(".current-map-layer");
            var limitX = 0,
                limitY = 0,
                mapWidth = $(this).width(),
                mapHeight = $(this).height(),
                nodeWidth = $(node).width(),
                nodeHeight = $(node).height();

            if (mapWidth < nodeWidth) { limitX = mapWidth - nodeWidth; }
            if (mapHeight < nodeHeight) { limitY = mapHeight - nodeHeight; }

            var left = 0 - (this.xPos + x),
                top = 0 - (this.yPos + y);

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

            var limitX = 0 - ($(node).width() - $(this).width()),
                limitY = 0 - ($(node).height() - $(this).height());

            if (x > 0) { x = 0; }
            if (y > 0) { y = 0; }
            if (x < limitX) { x = limitX; }
            if (y < limitY) { y = limitY; }

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

        var method = { // public methods
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
                };
                var node = $(this).find(".current-map-layer"),
                    newX = coords.x - ($(this).width() / 2),
                    newY = coords.y - ($(this).height() / 2);

                _position.call(this, newX, newY, node[0]);
            },
            zoomTo: function(level) {
                var distance = Math.round((level - this.visible) / (1 / this.layerSplit));
                _zoom.call(this, distance);
            }
        };

        return this.each(function() {

            // Execute public methods if called.
            if (typeof command === "string") {
                var execute = method[command];
                options.layerSplit = this.layerSplit || options.layerSplit;
                execute.call(this, callback);
            }

            // Else setup the map.
            else {
                this.visible = options.defaultLayer, this.layerSplit = options.layerSplit; // magic

                var viewport = this,
                    layers = $(this).find(">.map-layer"),
                    mapHeight = $(this).height(),
                    mapWidth = $(this).width(),
                    mapmove = false,
                    first = true;

                layers.css({
                    position: "absolute"
                }).eq(options.defaultLayer).css({
                    display: "block",
                    left: "",
                    top: ""
                }).addClass("current-map-layer").find(options.mapContent).css({
                    position: "absolute",
                    left: "0",
                    top: "0",
                    height: mapHeight + "px",
                    width: "100%"
                });

                layers.each(function() {
                    this.defaultWidth = $(this).width();
                    this.defaultHeight = $(this).height();

                    $(this).find(options.mapContent).css({
                        position: "absolute",
                        top: "0",
                        left: "0"
                    });

                    if ($(this).find(options.mapContent).length > 0) {
                        $(this).find(">img").css({
                            width: "100%",
                            position: "absolute",
                            left: "0",
                            top: "0"
                        }).after('<div class="map-layer-mask"></div>');
                    }
                });

                $(this).find(".map-layer-mask").css({
                    position: "absolute",
                    left: "0",
                    top: "0",
                    background: "white", // Omg, horrible hack,
                    opacity: "0", // but only way IE will not freak out when
                    filter: "alpha(opacity=0)" // mouseup over IMG tag occurs after mousemove event
                });

                if (options.defaultLayer > 0) {
                    layers.eq(options.defaultLayer).find(".map-layer-mask").width(layers.eq(options.defaultLayer).width()).height(layers.eq(options.defaultLayer).height());
                    layers.eq(options.defaultLayer).find(options.mapContent).width(layers.eq(options.defaultLayer).width()).height(layers.eq(options.defaultLayer).height());
                }

                $(this).find(">.map-layer:not(.current-map-layer)").hide();

                if (options.defaultX == null) {
                    options.defaultX = Math.floor((mapWidth / 2) - ($(this).find(".current-map-layer").width() / 2));
                    if (options.defaultX > 0) { options.defaultX = 0; }
                }
                if (options.defaultY == null) {
                    options.defaultY = Math.floor((mapHeight / 2) - ($(this).find(".current-map-layer").height() / 2));
                    if (options.defaultY > 0) { options.defaultY = 0; }
                }

                this.xPos = 0 - options.defaultX;
                this.yPos = 0 - options.defaultY;
                this.layerSplit = options.layerSplit;

                var mapStartX = options.defaultX,
                    mapStartY = options.defaultY,
                    clientStartX,
                    clientStartY;

                $(this).find(".current-map-layer").css({
                    left: options.defaultX + "px",
                    top: options.defaultY + "px"
                });

                /**
                 * Event Handling and Callbacks
                 */
                var weveMoved = false;

                $(this).bind('mousedown.mapbox', function() {
                    var layer = $(this).find(".current-map-layer"),
                        x = layer[0].style.left,
                        y = layer[0].style.top;
                    x = _makeCoords(x);
                    y = _makeCoords(y);
                    options.beforeDragging(layer, x, y, viewport);
                    mapmove = true;
                    first = true;
                    return false; // otherwise dragging on IMG elements etc inside the map will cause problems
                });

                $(document).bind('mouseup.mapbox', function() {
                    var $viewport = $(viewport),
                        layer = $(this).find(".current-map-layer"),
                        x = layer[0].style.left,
                        y = layer[0].style.top;
                    x = _makeCoords(x);
                    y = _makeCoords(y);
                    options.afterDragging(layer, x, y, viewport); // TODO: this gets called for mouseup events on the whole doc, propably not want we want.
                    mapmove = false;
                    if (weveMoved) {
                        clickDefault = false;
                    }
                    weveMoved = false;
                    $viewport.removeClass('is-dragging');
                    return false;
                });

                $(document).bind('mousemove.mapbox', function(e) {
                    var $viewport = $(viewport),
                        layer = $viewport.find(".current-map-layer");
                    if (mapmove && options.pan) {
                        $viewport.addClass('is-dragging');
                        if (first) {
                            clientStartX = e.clientX;
                            clientStartY = e.clientY;
                            mapStartX = layer[0].style.left.replace(/px/, "");
                            mapStartY = layer[0].style.top.replace(/px/, "");
                            first = false;
                        }
                        else {
                            weveMoved = true;
                        }
                        var limitX = 0,
                            limitY = 0;

                        if (mapWidth < layer.width()) { limitX = mapWidth - layer.width(); }
                        if (mapHeight < layer.height()) { limitY = mapHeight - layer.height(); }
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

                //quick fix for IE
                //after some panning, the native drag event got fired
                $(document).bind('dragstart.mapbox', function(e) {
                    e.preventDefault();
                });

                if (options.mousewheel && typeof $.fn.mousewheel !== "undefined") {
                    $(viewport).mousewheel(function(e, distance) {
                        if (options.zoomToCursor) {
                            //TODO Should probably DRY this.
                            var layer = $(this).find('.current-map-layer'),
                                positionTop = e.pageY - layer.offset().top, // jQuery normalizes pageX and pageY for us.
                                positionLeft = e.pageX - layer.offset().left,
                            // Recalculate this position on current layer as a percentage
                                relativeTop = e.pageY - $(this).offset().top,
                                relativeLeft = e.pageX - $(this).offset().left,
                                percentTop = positionTop / layer.height(),
                                percentLeft = positionLeft / layer.width();
                        }
                        if (_zoom.call(this, distance) && options.zoomToCursor/* && distance > 0*/) {
                            // Only center when zooming in, since it feels weird on out. Don't center if we've reached the floor.
                            // Convert percentage to pixels on new layer
                            layer = $(this).find('.current-map-layer');
                            var x = layer.width() * percentLeft,
                                y = layer.height() * percentTop;
                            // And set position.
                            _position.call(this, x - relativeLeft, y - relativeTop, layer[0]);
                        }
                        return false; // Don't scroll the window
                    });
                }

                var clickTimeoutId = setTimeout(function(){},0), clickDefault = true;

                if (options.doubleClickZoom || options.doubleClickZoomOut || options.doubleClickMove) {
                    $(viewport).bind('dblclick.mapbox', function(e) {
                        // TODO: DRY this
                        // prevent single-click default
                        clearTimeout(clickTimeoutId);
                        clickDefault = false;
                        var layer = $(this).find('.current-map-layer'),
                            positionTop = e.pageY - layer.offset().top,//jQuery normalizes pageX and pageY for us.
                            positionLeft = e.pageX - layer.offset().left,
                        // Recalculate this position on current layer as a percentage
                            percentTop = positionTop / layer.height(),
                            percentLeft = positionLeft / layer.width();
                        if (options.doubleClickZoom) {
                            distance = options.doubleClickDistance;
                        }
                        else if (options.doubleClickZoomOut) {
                            distance = 0 - options.doubleClickDistance;
                        }
                        else {
                            distance = 0;
                        }
                        _zoom.call(this, distance);
                        // Convert percentage to pixels on new layer.
                        layer = $(this).find('.current-map-layer');
                        var x = layer.width() * percentLeft,
                        y = layer.height() * percentTop;
                        // And center.
                        method.center.call(this,{x: x, y: y});
                        return false;
                    });
                }

                if (options.clickZoom || options.clickZoomOut || options.clickMove) {
                    $(viewport).bind('click.mapbox', function(e) {
                        function clickAction() {
                            if (clickDefault) {
                                // TODO: DRY this
                                var layer = $(this).find('.current-map-layer'),
                                    positionTop = e.pageY - layer.offset().top,//jQuery normalizes pageX and pageY for us.
                                    positionLeft = e.pageX - layer.offset().left,
                                // Recalculate this position on current layer as a percentage
                                    percentTop = positionTop / layer.height(),
                                    percentLeft = positionLeft / layer.width(),
                                    distance;
                                if (options.clickZoom) {
                                    distance = options.clickDistance;
                                }
                                else if (options.clickZoomOut) {
                                    distance = 0 - options.clickDistance;
                                }
                                else {
                                    distance = 0;
                                }
                                _zoom.call(this, distance);
                                // Convert percentage to pixels on new layer.
                                layer = $(this).find('.current-map-layer');
                                var x = layer.width() * percentLeft,
                                    y = layer.height() * percentTop;
                                // And center.
                                method.center.call(this,{x: x, y: y});
                            }
                            clickDefault = true;
                        }
                        if (options.doubleClickZoom || options.doubleClickZoomOut || options.doubleClickMove) {
                            // If either of these are registered we need to set the clickAction
                            // into a timeout so that a double click clears it.
                            clickTimeoutId = setTimeout(function(){ clickAction.call(viewport); }, 400);
                        }
                        else {
                            clickAction.call(this);
                        }
                    });
                }
                /**
                 *  End Event Handling and Callbacks
                 */

                // Deferred, load images in hidden layers
                $(window).load(function() {
                    layers.each(function() {
                        var img = $(this).find("img")[0];
                        if (typeof img === "object") { $("<img>").attr("src", img.src); }
                    });
                });
            }
        });
    };

    // Default options
    $.fn.mapbox.options = {
        zoom: true, // Does map zoom?
        pan: true, // Does map move side to side and up to down?
        defaultLayer: 0, // Starting at 0, which layer shows up first
        layerSplit: 4, // How many times to split each layer as a zoom level
        mapContent: ".mapcontent", // The name of the class on the content inner layer
        defaultX: null, // Default positioning on X-axis
        defaultY: null, // Default positioning on Y-axis
        zoomToCursor: true, // If true, position on the map where the cursor is set will stay the same relative distance from the edge when zooming
        doubleClickZoom: false, // If true, double clicking zooms to mouse position
        clickZoom: false, // If true, clicking zooms to mouse position
        doubleClickZoomOut: false, // If true, double clicking zooms out to mouse position
        clickZoomOut: false, // If true, clicking zooms out to mouse position
        doubleClickMove: false, // If true, double clicking moves the map to the cursor position
        clickMove: false, // If true, clicking moves the map to the cursor position
        doubleClickDistance: 1, // Number of positions (determined by layerSplit) to move on a double-click zoom event
        clickDistance: 1, // Number of positions (determined by layerSplit) to move on a click zoom event
        beforeDragging: function(layer, xcoord, ycoord, viewport) {}, // This callback happens before dragging of map starts
        afterDragging: function(layer, xcoord, ycoord, viewport) {}, // This callback happens at end of dragging, after map is released on "mouseup"
        beforeZoom: function(level, layer, xcoord, ycoord, viewport) {}, // Callback before a zoom happens
        afterZoom: function(level, layer, xcoord, ycoord, viewport) {}, // Callback after zoom has completed
        afterLayerChange: function(level, layer, xcoord, ycoord, viewport) {}, // Callback after layer has been changed while zooming.
        mousewheel: false /* Requires mousewheel event plugin: http://plugins.jquery.com/project/mousewheel*/
    };

})( jQuery, window, document );
