/*global window, ActiveXObject, init, console*/
/*jslint white: true, browser: true, evil: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2*/

var bevey = bevey || (function () {
  'use strict';

  /**
   * @author bevey.org
   * @fileoverview Bevey basic JS framework / toolkit.
   * @note This was developed for self-study.  Use YUI or JQuery if you want
   *        something decent.
   */
  return {
    version : '4.1.11',
    cssRoot : 'css/',
    debug   : true,

   /**
    * Insert the given element as the first child of the parent element passed.
    *
    * @param {Object} elm DOM element to be inserted.
    * @param {Object} parent DOM element that will become the parent to elm.
    */
    insertFirst : function (elm, parent) {
      parent.insertBefore(elm, parent.firstChild);
    },

   /**
    * Stops event bubbling further.
    *
    * @param {Event} e Event to prevent from bubbling further.
    */
    cancelBubble : function (e) {
      e = e || window.event;

      e.cancelBubble = true;

      if (e.stopPropagation) {
        e.stopPropagation();
      }
    },

   /**
    * Cancels a link or form submission default event.  If the element passed
    *  is not a form or anchor, all child anchors within the parent will have
    *  their events bubbled into a canceling event.
    *
    * @param {Object} elm DOM element to have the link event cancelled.
    * @return {Boolean} false.
    */
    cancelLink : function (elm) {
      var tagName = elm.nodeName.toLowerCase(),
          event;

      if (tagName === 'a') {
        event = 'click';
      }

      else if (tagName === 'form') {
        event = 'submit';
      }

      if (event) {
        bevey.event.add(elm, event, function (e) {
          if (e.preventDefault) {
            e.preventDefault();
          }

          return false;
        });
      }

      else {
        bevey.event.add(elm, 'click', function (e) {
          var elm = bevey.getTarget(e);

          if (elm.nodeName.toLowerCase() !== 'a') {
            elm = bevey.getTarget(e);
          }

          if (e.preventDefault) {
            e.preventDefault();
          }

          return false;
        });
      }
    },

   /**
    * Determines if an element is an ancestor to another element.
    *
    * @param {Object} child DOM element to check if it is an ancestor of the
    *         ancestor element passed.
    * @param {Object} ancestor DOM element of potential ancestor node to the
    *         child element passed.
    * @return {Boolean} true if the child is an ancestor of the ancestor
    *          element passed - false, otherwise.
    */
    isChildOf : function (child, ancestor) {
      if (ancestor === child) {
        return false;
      }

      while ((child) && (child !== ancestor) && (child !== document.body)) {
        child = child.parentNode;
      }

      return child === ancestor;
    },

    event : {
      list : [],

     /**
      * Handles event attachment via the best method availalbe.
      *
      * @param {Object} elm Element to have the event attached to.
      * @param {String} event Event to trigger.  Options include all standard
      *         events, minus the "on" prefix (ex: "click", "dblclick", etc).
      *         Additionally, "mouseenter" and "mouseleave" are supported.
      * @param {Function} action Function to be executed when the given event
      *         is triggered.
      * @param {Boolean} capture true if the event should be registered as a
      *         capturing listener.  Defaults to false.
      * @note All events are added to the bevey.event.list array for access
      *        outside this function.
      */
      add : function (elm, event, action, capture) {
        capture = capture || false;

        var mouseEnter = function (action) {
          return function (e) {
            var target = e.relatedTarget;

            if ((this === target) || (bevey.isChildOf(target, this))) {
              return;
            }

            action.call(this, event);
          };
        };

        if (elm.addEventListener) {
          if (event === 'mouseenter') {
            action = mouseEnter(action);
            elm.addEventListener('mouseover', action, capture);
            event = 'mouseover';
          }

          else if (event === 'mouseleave') {
            action = mouseEnter(action);
            elm.addEventListener('mouseout', action, capture);
            event = 'mouseout';
          }

          else {
            elm.addEventListener(event, action, capture);
          }
        }

        else if (elm.attachEvent) {
          elm.attachEvent('on' + event, action);
        }

        else {
          elm['on' + event] = action;
        }

        bevey.event.list.push([elm, event, action]);
      },

     /**
      * Removes events attached to a given element.
      *
      * @param {Object} elm Element to have the event removed from.
      * @param {String} event Event to trigger.  Options include all standard
      *         events, minus the "on" prefix (ex: "click", "dblclick", etc).
      * @param {Function} action Function to be removed from the given element
      *         and event.
      * @param {Boolean} capture true if the event was registered as a
      *         capturing listener.  Defaults to false.
      * @note Automatically removes the event from the bevey.event.list array.
      */
      remove : function (elm, event, action, capture) {
        capture = capture || false;

        var i = 0;

        if (event === 'mouseenter') {
          event = 'mouseover';
        }

        else if (event === 'mouseleave') {
          event = 'mouseout';
        }

        if (elm.removeEventListener) {
          elm.removeEventListener(event, action, capture);
        }

        else if (elm.detachEvent) {
          elm.detachEvent('on' + event, action);
        }

        else {
          elm['on' + event] = null;
        }

        for (i; i < bevey.event.list.length; i += 1) {
          if (bevey.event.list[i]) {
            if ((bevey.event.list[i]) &&
                (bevey.event.list[i][0] === elm) &&
                (bevey.event.list[i][1] === event) &&
                (bevey.event.list[i][2] === action)) {
              bevey.event.list.splice(i, 1);

              break;
            }
          }
        }
      },

     /**
      * Loops through all registered events (referencing the bevey.event.list
      *  array) and removes all events.  This should only be executed onunload
      *  to prevent documented IE6 memory leaks.
      */
      removeAll : function (elm) {
        elm = elm || document;

        var i = bevey.event.list.length - 1;

        for (i; i >= 0 ; i -= 1) {
          if (bevey.event.list[i]) {
            if ((bevey.event.list[i]) && ((bevey.event.list[i][0] === elm) || (elm === document))) {
              bevey.event.remove(bevey.event.list[i][0], bevey.event.list[i][1], bevey.event.list[i][2]);
            }
          }
        }
      }
    },

   /**
    * Shortcut function to tie an action to a given element, giving proper
    *  scope for closure.
    *
    * @param {Object} elm Element tied to the given action.
    * @param {Function} action Function to be executed against the given
    *         element.
    * @return {Function} Function with the variable scope to execute against
    *          the given element.
    */
    closure : function (elm, action) {
      return function (e) {
        action(elm);
      };
    },

   /**
    * Shortcut function used to quickly find the target of an event (used in
    *  event delegation).
    *
    * @param {Event} e Event to determine the target of.
    * @return {Object} Element that was the target of the specified event.
    */
    getTarget : function (e) {
      e = e || window.event;

      if (e.target) {
        return e.target;
      }

      else {
        return e.srcElement;
      }
    },

   /**
    * Looks for a given attribute with a specified value within the given
    *  element.
    *
    * @param {Object} elm Element to check for a given attribute.
    * @param {String} attribute Attribute being checked.
    * @param {String} value Value of the attribute specifically being checked.
    * @return {Boolean} true if the given attribute and value is found within
    *          the element.
    */
    hasAttribute : function (elm, attribute, value) {
      if (elm[attribute]) {
        return elm[attribute].match(new RegExp('(\\s|^)' + value + '(\\s|$)'));
      }
    },

   /**
    * Sugar function used to find if a given element has the 'className'
    *  attribute specified.
    *
    * @param {Object} elm Element to check for a given class name.
    * @param {String} className Class name being checked.
    */
    hasClass : function (elm, className) {
      return bevey.hasAttribute(elm, 'className', className);
    },

   /**
    * Add the specified class to the given element - but only if it does not
    *  already have the class.
    *
    * @param {Object} elm Element to apply the given class to.
    * @param {String} className Class name to be applied.
    */
    addClass : function (elm, className) {
      if (!bevey.hasClass(elm, className)) {
        elm.className = bevey.trim(elm.className + ' ' + className);
      }
    },

   /**
    * Removes the specified class from the given element.
    *
    * @param {Object} elm Element to remove the given class from.
    * @param {String} className Class name to be removed.
    */
    removeClass : function (elm, className) {
      if (bevey.hasClass(elm, className)) {
        elm.className = elm.className.replace(new RegExp('(\\s|^)' + className + '(\\s|$)'), ' ');
        elm.className = bevey.trim(elm.className);
      }
    },

   /**
    * Sugar function used to add or remove a class from a given element -
    *  depending on if it already has the class applied.
    *
    * @param {Object} elm Element to have the class toggled.
    * @param {String} className Class Name to be toggled.
    */
    toggleClass : function (elm, className) {
      if (!bevey.hasClass(elm, className)) {
        bevey.addClass(elm, className);
      }

      else {
        bevey.removeClass(elm, className);
      }
    },

   /**
    * Finds all elements with the given class name.  Optionally, a tag name can
    *  specified to further refine an element search.
    *
    * @param {String} className Class name to be searched for.
    * @param {Object} parent Parent element to begin the search from.  If no
    *         element is specified, the document root will be used.
    * @param {String} tag Optionally, you may specify a tag name to further
    *         filter.
    * @return {Array} Returns an array of elements matching the entered
    *          criteria.
    * @note Uses native getElementsByClassName if available.
    */
    getElementsByClassName : function (className, parent, tag) {
      var elementsWithClass = [],
          children = [],
          i = 0,
          j = 0;

      parent = parent || document;
      tag    = tag.toLowerCase() || '*';

      if ((tag === '*') && (document.getElementsByClassName)) {
        return parent.getElementsByClassName(className);
      }

      if (parent.getElementsByClassName) {
        children = parent.getElementsByClassName(className);

        if ((tag) && (children.length)) {
          for (i in children) {
            if ((children[i].tagName) && (children[i].tagName.toLowerCase() === tag)) {
              elementsWithClass[j] = children[i];
              j += 1;
            }
          }
        }

        else {
          elementsWithClass = children;
        }
      }

      else {
        children = parent.getElementsByTagName(tag);

        for (i in children) {
          if (bevey.hasClass(children[i], className)) {
            elementsWithClass[j] = children[i];
            j += 1;
          }
        }
      }

      return elementsWithClass;
    },

   /**
    * Removes all child elements from a given parent node.
    *
    * @param {Object} elm Parent element to delete all children from.
    * @note Automatically removes events that may be attached to any child node
    *        being removed.
    */
    removeChildren : function (elm) {
      if (elm.hasChildNodes()) {
        while (elm.childNodes.length > 0) {
          bevey.event.removeAll(elm.firstChild);

          elm.removeChild(elm.firstChild);
        }
      }
    },

   /**
    * Retrieves text from a given element, using the best method available.
    *
    * @param {Object} elm Element to have text retrieved from.
    */
    getText : function (elm) {
      if (elm.textContent) {
        return elm.textContent;
      }

      else if (elm.innerText) {
        return elm.innerText;
      }

      else if (elm.text) {
        return elm.text;
      }

      else {
        return elm.innerHTML;
      }
    },

   /**
    * Enters text into a given element, using the best method available.  If
    *  text already exists within the element, it will be overwritten.
    *
    * @param {Object} elm Element to have text entered into.
    * @param {String} text Text that will populate the element.
    */
    putText : function (elm, text) {
      if (elm.textContent) {
        elm.textContent = text;
      }

      else if (elm.innerText) {
        elm.innerText = text;
      }

      else if (elm.text) {
        elm.text = text;
      }

      else {
        elm.innerHTML = text;
      }
    },

   /**
    * Sugar function to remove units of measure from a given string.
    *
    * @param {String} property Measurement property to have it's units removed.
    * @return {Integer} Integer value of measurement entered - but without
    *          units of measure.
    */
    stripUnits : function (property) {
      if (typeof(property) === 'string') {
        return parseInt(property.replace(new RegExp('(%|px|em)'), ''), 10);
      }

      else {
        return property;
      }
    },

   /**
    * Removes extra whitespace at the beginning or end of a given string.
    *
    * @param {String} string String of text that may have leading or trailing
    *         whitespace.
    * @return {String} String of text with leading or trailing whitespace
    *          removed.
    */
    trim : function (string) {
      string = string || '';

      return string.toString().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    },

   /**
    * Returns the value for a given variable stored in a cookie.
    *
    * @param {String} variable Variable name of a value stored in a cookie.
    * @return {String} Value stored within that cookie variable.
    */
    readCookie : function (variable) {
      var values = document.cookie.split(';'),
          value  = '',
          i      = 0;

      for (i; i < values.length; i += 1) {
        value = values[i].split('=');

        if (bevey.trim(value[0]) === variable) {
          return bevey.trim(value[1]);
        }
      }
    },

   /**
    * Loads a given external CSS or Javascript asset.
    *
    * @param {Object} asset Object containing:
    *         {String} type Type of asset being requested ("css" or
    *          "javascript").
    *         {String} address URL of the asset to be loaded.
    *         {String} media If the asset type is CSS, you may specify a valid
    *          media type ("screen", "print", "handheld", etc).  Defaults to
    *          "all".
    *         {Function} onComplete Function to be executed when an asset is
    *          done loading.  Although an onComplete event can be associated to
    *          a CSS asset loading, it will fire before the request is
    *          complete.
    */
    loadAsset : function (asset) {
      asset.type       = asset.type       || 'css';
      asset.onComplete = asset.onComplete || function () {};

      if (asset.address) {
        var head = document.getElementsByTagName('head')[0],
            file;

        if (asset.type === 'css') {
          file       = document.createElement('link');
          file.type  = 'text/css';
          file.rel   = 'stylesheet';
          file.href  = asset.address;
          file.media = asset.media || 'all';
          head.appendChild(file);
          asset.onComplete();
        }

        else if (asset.type === 'js') {
          file      = document.createElement('script');
          bevey.event.add(file, 'load', function () {
            asset.onComplete();
          });
          file.type = 'text/javascript';
          file.src  = asset.address;
          head.appendChild(file);
        }
      }
    },

   /**
    * Logs the given text to console.log if it is available.  If bevey.debug is
    *  set to true, a console will be loaded to output the log message.
    *
    * @param {String} text Message to be logged.
    * @param {String} type Optionally, you may specify the log type ("warning"
    *         or "error") for highlighting within the rendered logger.
    * @note Uses eval to executed inputted JS commands.
    */
    log : function (text, type) {
      if (bevey.debug === true) {      
        var asset,
            wrapper,
            title,
            logger,
            message,
            input,
            inputBuffer = [],
            inputIndex  = 0,
            tempBuffer  = '',
            drag;

        if (!document.getElementById('logger-console')) {
          asset = {
            type: 'css',
            address: bevey.cssRoot + 'logger.css'
          };

          bevey.loadAsset(asset);

          wrapper = document.createElement('form');
          title   = document.createElement('h4');
          logger  = document.createElement('ol');
          input   = document.createElement('input');

          wrapper.id      = 'logger-console';
          bevey.putText(title, 'Log Console');
          input.type      = 'text';

          wrapper.appendChild(title);
          wrapper.appendChild(logger);
          wrapper.appendChild(input);
          document.body.appendChild(wrapper);

          bevey.event.add(input, 'keyup', function (e) {
            if (e.keyCode === 38) {
              if (inputIndex === inputBuffer.length) {
                tempBuffer = this.value;
              }

              if (inputIndex > 0) {
                inputIndex -= 1;
                this.value = inputBuffer[inputIndex];
              }
            }

            else if (e.keyCode === 40) {
              if (inputBuffer.length > inputIndex) {
                inputIndex += 1;
                if (inputBuffer[inputIndex]) {
                  this.value = inputBuffer[inputIndex];
                }

                else {
                  this.value = tempBuffer;
                }
              }
            }
          });

          bevey.event.add(wrapper, 'submit', function (e) {
            if (input.value === 'clear') {
              bevey.removeChildren(logger);
            }

            else if (input.value === 'exit') {
              this.style.display = 'none';
            }

            else {
              bevey.log(input.value);

              try {
                if (window.execScript) {
                  window.execScript(input.value);
                }

                else {
                  window.setTimeout(input.value, 0);
                }
              }

              catch (error) {
                bevey.log(error, 'error');
              }
            }

            inputIndex = inputBuffer.length + 1;
            inputBuffer.push(input.value);
            input.value = '';

            if (e.preventDefault) {
              e.preventDefault();
            }

            return false;
          });

          drag = {
            elm: wrapper,
            dragElm: title
          };

          bevey.clickDrag(drag);
        }

        else {
          logger = document.getElementById('logger-console');
          logger.style.display = 'block';
          logger = logger.getElementsByTagName('ol')[0];
        }

        message = document.createElement('li');

        if (type) {
          bevey.addClass(message, type);
        }

        if (text.tagName) {
          bevey.event.add(message, 'mouseenter', function () {
            if (typeof(text.style.outline) === 'string') {
              text.style.outline = '3px solid #FF0000';
            }

            else {
              text.style.border = '1px solid #FF0000';
            }
          });

          bevey.event.add(message, 'mouseleave', function () {
            if (typeof(text.style.outline) === 'string') {
              text.style.outline = 'none';
            }

            else {
              text.style.border = 'none';
            }
          });
        }

        bevey.putText(message, text);
        logger.appendChild(message);
        logger.scrollTop = logger.scrollHeight;
      }

      if (typeof(console) !== 'undefined') {
        console.log(text);
      }
    },

   /**
    * Accepts a standard string RGB value ("rgb(255,255,255)") and returns an
    *  array of stripped values.  If an array is passed, it is assumed that it
    *  is already formatted correctly.
    *
    * @param {String} rgb String representation of an RGB value:
    *         "rgb(255,255,255)".  If an array is passed, it will be assumed to
    *         be pre-formatted.
    * @return {Array} Array value of integer equivalents to the inputted string
    *          RGB: [255,255,255].
    */
    findRgb : function (rgb) {
      if (typeof(rgb) === 'string') {
        rgb = rgb.replace('rgb(', '').replace(')', '');
        rgb = rgb.split(',');

        for (var i = 0; i < rgb.length; i += 1) {
          rgb[i] = parseInt(bevey.trim(rgb[i]), 10);
        }
      }

      return rgb;
    },

   /**
    * Converts an RGB value into HEX color code.
    *
    * @param {String} rgb String representation of an RGB value.  If an array
    *         is passed, it will be assumed to be pre-formatted.
    * @return {String} String HEX equivalent to the RGB entered: "#FFFFFF".
    */
    rgbToHex : function (rgb) {
      rgb = bevey.findRgb(rgb);

      for (var i = 0; i < rgb.length; i += 1) {
        rgb[i] = '0123456789ABCDEF'.charAt((rgb[i] - rgb[i] % 16) / 16) + '0123456789ABCDEF'.charAt(rgb[i] % 16);
      }

      return ('#' + rgb[0] + rgb[1] + rgb[2]);
    },

   /**
    * Converts a HEX color code into RGB value.
    *
    * @param {String} hex Hex code to be converted.
    * @return {String} String RGB equivalent to the HEX entered:
    *          "rgb(255,255,255)".
    */
    hexToRgb : function (hex) {
      var hexStr = hex.replace('#', '');

      hex = [hexStr.substring(0, 2), hexStr.substring(2, 4), hexStr.substring(4, 6)];

      return 'rgb(' + parseInt(hex[0], 16) + ', ' + parseInt(hex[1], 16) + ', ' + parseInt(hex[2], 16) + ')';
    },

   /**
    * Finds the computed value of a given CSS property.
    *
    * @param {Object} elm Element containing a CSS property.
    * @param {String} property CSS property of the element to be found.
    * @return {String} Computed CSS property value of the given element and
    *          property type.
    */
    findStyle : function (elm, property) {
      var styleValue = '';

      if (elm.currentStyle) {
        property = property.replace(/-\w/g, function (match) {
          return match.charAt(1).toUpperCase();
        });

        if ((property === 'opacity') && (elm.filters)) {
          if (!elm.style.filter) {
            return 1;
          }

          return parseInt(elm.filters.item('alpha').opacity, 10) / 100;
        }

        styleValue = elm.currentStyle[property];
      }

      else if (window.getComputedStyle) {
        styleValue = document.defaultView.getComputedStyle(elm, null).getPropertyValue(property);
      }

      else {
        return 0;
      }

      if (styleValue) {
        if ((property.indexOf('color') !== -1) &&
            (styleValue.indexOf('rgb') !== -1)) {
          styleValue = bevey.rgbToHex(styleValue);
        }

        if ((styleValue.indexOf('px') !== -1) ||
            (styleValue.indexOf('em') !== -1) ||
            (styleValue.indexOf('%')  !== -1)) {
          styleValue = bevey.stripUnits(styleValue);
        }

        if (property === 'opacity') {
          styleValue = parseFloat(styleValue, 10);
        }
      }

      return styleValue;
    },

   /**
    * Finds where on the page the user has scrolled.
    *
    * @return {Object} Object containing:
    *          {Integer} Pixel offset from the top of the page to the top of
    *           the user's scrolled viewport.
    *          {Integer} Pixel offset from the left edge of the user's scrolled
    *           viewport.
    */
    findScroll : function () {
      if (typeof(window.pageYOffset) === 'number') {
        return {
          positionX: window.pageXOffset,
          positionY: window.pageYOffset
        };
      }

      else if ((document.body) && (document.body.scrollTop)) {
        return {
          positionX: document.body.scrollWidth,
          positionY: document.body.scrollTop
        };
      }

      else if ((document.documentElement) && (document.documentElement.scrollTop)) {
        return {
          positionX: document.documentElement.scrollWidth,
          positionY: document.documentElement.scrollTop
        };
      }

      return 0;
    },

   /**
    * Finds the height of the given document.
    *
    * @return {Integer} Pixel height of the document.
    */
    findDocumentHeight : function () {
      return Math.max(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
                      Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
                      Math.max(document.body.clientHeight, document.documentElement.clientHeight));
    },

   /**
    * Finds the pixel offset of a given element.  If the second parameter is
    *  set to true, the pixel offset will be relative to the next ancestor with
    *  binding positioning ("relative" or "absolute").
    *
    * @param {Object} elm Element to find the offset of.
    * @param {Boolean} relative Optionally, measure the pixel offset only to
    *         the first ancestor with a binding positition ("relative" or
    *         "absolute").
    * @return {Object} Object containing:
    *          {Integer} offsetX Pixel offset against the X-axis.
    *          {Integer} offsetY Pixel offset against the Y-axis.
    */
    totalOffset : function (elm, relative) {
      var offsetX = 0,
          offsetY = 0,
          parentPosition;

      if (elm.offsetParent) {
        offsetX = elm.offsetLeft;
        offsetY = elm.offsetTop;

        while (elm.offsetParent) {
          elm = elm.offsetParent;

          if (relative) {
            parentPosition = bevey.findStyle(elm, 'position');

            if ((parentPosition === 'absolute') || (parentPosition === 'relative')) {
              break;
            }
          }

          offsetX += elm.offsetLeft;
          offsetY += elm.offsetTop;
        }
      }

      return { 'offsetX' : offsetX, 'offsetY' : offsetY };
    },

   /**
    * Sets the given element's alpha transparency according to the opacity
    *  value passed.
    *
    * @param {Object} elm Element to set opacity.
    * @param {Float} opacity Opacity level - as measured in decimal percentage,
    *         ie: .5 will be 50% transparent.  .95 will be 5% transparent.
    * @note If no discoverable opacity method can be found, it will be made
    *        hidden or visible using the CSS "visibility" property.
    */
    setOpacity : function (elm, opacity) {
      if (typeof(elm.style.opacity) !== 'undefined') {
        elm.style.opacity = opacity;
      }

      else if (typeof(elm.style.MozOpacity) !== 'undefined') {
        elm.style.MozOpacity = opacity;
      }

      else if (typeof(elm.style.KhtmlOpacity) !== 'undefined') {
        elm.style.KhtmlOpacity = opacity;
      }

      else if (elm.style.filter !== 'undefined') {
        if (opacity === 1) {
          elm.style.filter = '';
        }

        else {
          elm.style.filter = 'alpha(opacity=' + Math.ceil(opacity * 100) + ')';
        }
      }

      else if (elm.style.visibility === 'hidden') {
        elm.style.visibility = 'visible';
      }

      else {
        elm.style.visibility = 'hidden';
      }
    },

   /**
    * Animates a given element from one property value to another.
    *
    * @param {Object} animation Object containing:
    *         {Object} elm Element to be animated.
    *         {Float} start Beginning style value of an animation.  If no start
    *          is defined, the current style value will be queries.
    *         {Float} end End style value of an animation.
    *         {Integer} duration Millisecond duration of the animation.
    *         {Integer} interval Time delay between animation steps.  The lower
    *          this number, the more frames are taken in animation (to the
    *          benefit of animation smoothness, but detriment of performance).
    *         {String} ease Name of the type of easing to be used.  Can be
    *          "linear", "ease-in", "ease-out" or "ease-in-out."  Any other
    *          easing function will be used for native CSS3 animations, but
    *          will default to "linear" for standard JS animations.
    *         {Function} onStart Function to be executed before an animation
    *           begins.
    *         {Function} onTween Function to be executed after each step in an
    *          animation.
    *         {Function} onComplete Function to be executed after an animation
    *          completes.
    *         {Boolean} noNative Do not use native CSS animations, no matter if
    *          the browser supports it or not.
    *         {Boolean} hideIfNeeded If an animation ends with the element's
    *          animated style property hiding it (such as height, width or
    *          opacity) the element will apply "display: none" automatically.
    *          Defaults to true.
    *         {Integer} steps Calculated number of steps in an animation.  This
    *          value set internally and should not be set.
    *         {Integer/Array} stepsDelta Calculated style difference between
    *          steps.  Data type of integer - except when animating color or
    *          background-color, in which case, it will be an array of integers.
    *          This value set internally and should not be set.
    *         {Integer} stepIndex Current step in the animation sequence.  This
    *          value set internally and should not be set.
    * @note For simple animations (those that do not use onTween functions),
    *        native CSS3 animations will be used if they are supported.
    */
    animate : function (animation) {
      var thisStep = 0,
          fauxStart,
          fauxEnd,
          deltas,
          findChange,
          callBack;

      findChange = function (start, step, totalSteps, delta, end, ease) {
        var change;

        switch (ease) {
        case 'ease-in' :
          change = parseFloat(start, 10) + (Math.pow(((1 / totalSteps) * step), 1.25) * (end - start));
          break;
        case 'ease-out' :
          change = parseFloat(start, 10) + (Math.pow(((1 / totalSteps) * step), 0.5) * (end - start));
          break;
        case 'ease-in-out' :
          if (step < (totalSteps / 2)) {
            change = parseFloat(start, 10) + (Math.pow(((1 / totalSteps) * step), 1.25) * (end - start));
          }

          else {
            change = parseFloat(start, 10) + (Math.pow(((1 / totalSteps) * step), 0.5) * (end - start));
          }
          break;
        default :
          change = parseFloat(start, 10) + (step * delta);
          break;
        }

        if (step !== totalSteps) {
          if (animation.property.indexOf('color') !== -1) {
            change = Math.max(0, change);
            change = Math.min(255, change);
            change = Math.round(change);
          }

          return change;
        }

        return end;
      };

      if (!animation.stepIndex) {
        fauxStart = animation.start;
        fauxEnd   = animation.end;

        if ((animation.start <= 1) && (animation.end <= 1)) {
          fauxStart = fauxStart * 100;
          fauxEnd   = fauxEnd   * 100;
        }

        if (bevey.hasClass(animation.elm, 'animating')) {
          return false;
        }

        if (animation.start === null) {
          animation.start = bevey.findStyle(animation.elm, animation.property);
        }

        animation.elm        = animation.elm        || this;
        animation.duration   = animation.duration   || 1000;
        animation.ease       = animation.ease       || 'linear';
        animation.noNative   = animation.noNative   || false;
        animation.interval   = animation.interval   || 50;
        animation.stepIndex  = 0;
        animation.onStart    = animation.onStart    || function () {};
        animation.onComplete = animation.onComplete || function () {};

        if (animation.hideIfNeeded !== false) {
          animation.hideIfNeeded = true;
        }

        if ((!animation.onTween) && (!animation.noNative)) {
          if ((typeof(animation.elm.style['-moz-transition'])    !== 'undefined') ||
              (typeof(animation.elm.style['-ms-transition'])     !== 'undefined') ||
              (typeof(animation.elm.style['-o-transition'])      !== 'undefined') ||
              (typeof(animation.elm.style['-webkit-transition']) !== 'undefined') ||
              (typeof(animation.elm.style.transition)            !== 'undefined')) {
            animation.elm.style['-moz-transition']    = animation.property + ' ' + (animation.duration / 1000) + 's ' + animation.ease;
            animation.elm.style['-ms-transition']     = animation.property + ' ' + (animation.duration / 1000) + 's ' + animation.ease;
            animation.elm.style['-o-transition']      = animation.property + ' ' + (animation.duration / 1000) + 's ' + animation.ease;
            animation.elm.style['-webkit-transition'] = animation.property + ' ' + (animation.duration / 1000) + 's ' + animation.ease;
            animation.elm.style.transition            = animation.property + ' ' + (animation.duration / 1000) + 's ' + animation.ease;

            bevey.addClass(animation.elm, 'animating');
            animation.onStart();

            if ((animation.elm.style.display === 'none') && (animation.end > 0)) {
              animation.elm.style.display = 'block';
            }

            callBack = function () {
              bevey.removeClass(animation.elm, 'animating');

              if ((animation.hideIfNeeded) &&
                  (animation.end <= 0) &&
                  (animation.property !== 'left') &&
                  (animation.property !== 'right') &&
                  (animation.property !== 'botom') &&
                  (animation.property !== 'top')) {
                animation.elm.style.display = 'none';
              }

              animation.onComplete();

              bevey.event.remove(animation.elm, 'mozTransitionEnd',    callBack);
              bevey.event.remove(animation.elm, 'webkitTransitionEnd', callBack);
              bevey.event.remove(animation.elm, 'transitionEnd',       callBack);
            };

            bevey.event.add(animation.elm, 'mozTransitionEnd',    callBack);
            bevey.event.add(animation.elm, 'webkitTransitionEnd', callBack);
            bevey.event.add(animation.elm, 'transitionEnd',       callBack);

            if (animation.property === 'opacity') {
              bevey.setOpacity(animation.elm, animation.end);
            }

            else if ((animation.property === 'background-color') ||
                     (animation.property === 'color')) {
              animation.elm.style[animation.property] = animation.end;
            }

            else {
              animation.elm.style[animation.property] = animation.end + 'px';
            }

            return;
          }
        }

        animation.onTween = animation.onTween || function () {};

        if ((animation.property.indexOf('color') !== -1)) {
          animation.start     = bevey.findRgb(bevey.hexToRgb(animation.start));
          animation.end       = bevey.findRgb(bevey.hexToRgb(animation.end));
          deltas              = [(animation.end[0] - animation.start[0]),
                                 (animation.end[1] - animation.start[1]),
                                 (animation.end[2] - animation.start[2])];
          animation.steps     = Math.abs(Math.floor(Math.min(Math.max(deltas[0], deltas[1], deltas[2]), Math.ceil(animation.duration / animation.interval))));
          animation.stepDelta = [Math.ceil(deltas[0] / animation.steps), Math.ceil(deltas[1] / animation.steps), Math.ceil(deltas[2] / animation.steps)];
        }

        else {
          animation.steps     = Math.floor(Math.min(Math.abs(fauxEnd - fauxStart), Math.ceil(animation.duration / animation.interval)));
          animation.stepDelta = (fauxEnd - fauxStart) / animation.steps;
        }

        if ((animation.start <= 1) && (animation.end <= 1)) {
          animation.stepDelta = animation.stepDelta / 100;
        }

        bevey.addClass(animation.elm, 'animating');

        animation.onStart();
      }

      animation.stepIndex += 1;

      thisStep = findChange(animation.start, animation.stepIndex, animation.steps, animation.stepDelta, animation.end, animation.ease);

      if (animation.stepIndex >= animation.steps) {
        animation.stepIndex = animation.steps;

        thisStep = animation.end;
      }

      if (animation.start > animation.end) {
        if (thisStep <= animation.end) {
          animation.stepIndex = animation.steps;

          thisStep = animation.end;
        }

        if ((animation.hideIfNeeded) &&
            (animation.start + (animation.stepIndex * animation.stepDelta) <= 0) &&
            (animation.property !== 'left') &&
            (animation.property !== 'right') &&
            (animation.property !== 'botom') &&
            (animation.property !== 'top') &&
            (animation.property.indexOf('background') === -1)) {
          animation.elm.style.display = 'none';
        }
      }

      else {
        if (thisStep >= animation.end) {
          animation.stepIndex = animation.steps;

          thisStep = animation.end;
        }

        if ((animation.elm.style.display === 'none') && (animation.end > 0)) {
          animation.elm.style.display = 'block';
        }
      }

      switch (animation.property) {
      case 'opacity' :
        bevey.setOpacity(animation.elm, thisStep);
        break;

      case 'background-color' :
        animation.elm.style.backgroundColor = bevey.rgbToHex([findChange(animation.start[0], animation.stepIndex, animation.steps, animation.stepDelta[0], animation.end[0], animation.ease),
                                                              findChange(animation.start[1], animation.stepIndex, animation.steps, animation.stepDelta[1], animation.end[1], animation.ease),
                                                              findChange(animation.start[2], animation.stepIndex, animation.steps, animation.stepDelta[2], animation.end[2], animation.ease)]);
        break;

      case 'color' :
        animation.elm.style.color = bevey.rgbToHex([findChange(animation.start[0], animation.stepIndex, animation.steps, animation.stepDelta[0], animation.end[0], animation.ease),
                                                    findChange(animation.start[1], animation.stepIndex, animation.steps, animation.stepDelta[1], animation.end[1], animation.ease),
                                                    findChange(animation.start[2], animation.stepIndex, animation.steps, animation.stepDelta[2], animation.end[2], animation.ease)]);
        break;

      default :
        animation.elm.style[animation.property] = thisStep + 'px';
        break;
      }

      if ((animation.steps > animation.stepIndex) && (bevey.hasClass(animation.elm, 'animating'))) {
        animation.onTween();

        setTimeout(function () {
          bevey.animate(animation);
        }, animation.interval);
      }

      else {
        if (animation.property.indexOf('color') !== -1) {
          animation.stepIndex = 0;
        }

        bevey.removeClass(animation.elm, 'animating');

        animation.onComplete();
      }

      return animation;
    },

    ajax : {
      cache : [],

     /**
      * Sends an AJAX request to the specified URL.  On receipt of a response,
      *  you may define a element to populate with the raw response or define
      *  an onComplete function to process the response.
      *
      * @param {Object} ajaxRequest Object containing:
      *         {String} method Method of request ("GET" or "POST").
      *         {String} param Additional parameters.
      *         {Boolean} cache true if responses should be cached locally,
      *          false if a fresh request should be made each time.
      *         {Function} onStart Function to be executed before an AJAX
      *          request begins.
      *         {Function/Object} onComplete Function to be executed after an
      *          AJAX request completes.  If a DOM object is passed instead of
      *          a function, the raw AJAX response will populate the element.
      */
      request : function (ajaxRequest) {
        ajaxRequest.method     = ajaxRequest.method     || 'GET';
        ajaxRequest.onStart    = ajaxRequest.onStart    || function () {};
        ajaxRequest.onComplete = ajaxRequest.onComplete || function () {};

        if (ajaxRequest.cache !== false) {
          ajaxRequest.cache = true;
        }

        var request,
            ajaxProcess;

        ajaxProcess = function () {
          ajaxRequest.onStart();

          switch (typeof(ajaxRequest.onComplete)) {
          case 'object' :
            if (ajaxRequest.onComplete.value) {
              ajaxRequest.onComplete.value = ajaxRequest.response;
            }

            else if (ajaxRequest.onComplete.childNodes[0]) {
              bevey.putText(ajaxRequest.onComplete, ajaxRequest.response);
            }
            break;

          case 'function' :
            ajaxRequest.onComplete();
            break;
          }
        };

        if ((bevey.ajax.cache[ajaxRequest.path + '?' + ajaxRequest.param + '?'] !== undefined) && (ajaxRequest.cache)) {
          ajaxRequest.response = bevey.ajax.cache[ajaxRequest.path + '?' + ajaxRequest.param + '?'];

          ajaxProcess();

          return true;
        }

        if (window.XMLHttpRequest) {
          request = new XMLHttpRequest();
        }

        else if (window.ActiveXObject) {
          request = new ActiveXObject('Microsoft.XMLHTTP');
        }

        else {
          return false;
        }

        if (ajaxRequest.method === 'GET') {
          ajaxRequest.path  = ajaxRequest.path + '?' + ajaxRequest.param;
          ajaxRequest.param = '';
        }

        request.open(ajaxRequest.method.toUpperCase(), ajaxRequest.path, true);

        if (ajaxRequest.method === 'POST') {
          request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }

        request.setRequestHeader('AJAX', 'true');

        bevey.event.add(request, 'readystatechange', function () {
          if (request.readyState === 4) {
            if (request.status === 200) {
              ajaxRequest.response = request.responseText;

              if (ajaxRequest.cache) {
                bevey.ajax.cache[ajaxRequest.path + '?' + ajaxRequest.param] = ajaxRequest.response;
              }

              ajaxProcess();
            }

            else {
              return false;
            }
          }
        });

        request.send(ajaxRequest.param);
      }
    },

   /**
    * Checks all links from a given element parent for the attribute
    *  "rel="external"" and adds the attribute "target="_blank"" - as to avoid
    *  validation errors.
    *
    * @param {Object} elm Element to be searched for anchors with the rel
    *         attribute of "external".  If no element is specified, the
    *         document root will be searched.
    */
    externalLinks : function (elm) {
      elm = elm || document;

      var links = elm.getElementsByTagName('a'),
          i     = 0;

      for (i; i < links.length; i += 1) {
        if (/(?:^|\s)external(?:\s|$)/.test(links[i].rel)) {
          links[i].target = '_blank';
        }
      }
    },

   /**
    * Finds the current mouse position.
    *
    * @param {Event} e Mouse event.
    * @return {Object} position Object containing:
    *          {Integer} positionX Mouse offset on X-axis.
    *          {Integer} positionY Mouse offset on Y-axis.
    */
    findMousePosition : function (e) {
      if (e.touches && e.touches.length) {
        return {
          positionX: e.touches[0].clientX,
          positionY: e.touches[0].clientY
        };
      }

      else if (window.event) {
        return {
          positionX: event.clientX,
          positionY: event.clientY
        };
      }

      else {
        return {
          positionX: e.clientX,
          positionY: e.clientY
        };
      }
    },

   /**
    * Creates a dragable element with optional drop points.
    *
    * @param {Object} drag Object containing:
    *         {Object} elm Element to be movable.
    *         {Object} dragElm Element that will act as the drag focus.  If
    *          none is specified, it will default to drag.elm.
    *         {Boolean} restrict true if the element should be restricted to
    *          movement only within it's direct parent.
    *         {Function} onStart Function to be executed when the element first
    *          gets clicked.
    *         {Function} onTween Function to be executed after each step in the
    *          element's movement.
    *         {Function} onComplete Function to be executed after the element
    *          is done moving (mouseup).
    *         {Function} onDrop Function to be executed after an element has
    *          been dropped into a specified drop area.
    *         {Array} dropElm Array of elements that are drop areas for the
    *          dragable element.
    */
    clickDrag : function (drag) {
      drag.dragElm    = drag.dragElm    || drag.elm;
      drag.restrict   = drag.restrict   || false;
      drag.onStart    = drag.onStart    || function () {};
      drag.onTween    = drag.onTween    || function () {};
      drag.onComplete = drag.onComplete || function () {};
      drag.onDrop     = drag.onDrop     || function () {};

      var mover,
          dropper,
          dropable,
          start = (typeof(document.body.ontouchstart) === 'undefined') ? 'mousedown' : 'touchstart',
          move  = (typeof(document.body.ontouchmove)  === 'undefined') ? 'mousemove' : 'touchmove',
          end   = (typeof(document.body.ontouchend)   === 'undefined') ? 'mouseup'   : 'touchend',
          wrapperBorderOffsetX = bevey.findStyle(drag.elm.parentNode, 'border-left-width') + bevey.findStyle(drag.elm.parentNode, 'border-right-width'),
          wrapperBorderOffsetY = bevey.findStyle(drag.elm.parentNode, 'border-top-width')  + bevey.findStyle(drag.elm.parentNode, 'border-bottom-width');

     /**
      * @private
      */
      mover = function (e) {
        if (bevey.hasClass(drag.elm, 'active')) {
          bevey.cancelBubble(e);

          if (e.preventDefault) {
            e.preventDefault();
          }

          var position  = bevey.findMousePosition(e),
              positionX = position.positionX,
              positionY = position.positionY,
              width     = drag.dragElm.offsetWidth,
              height    = drag.dragElm.offsetHeight,
              endX,
              endY;

          drag.newX = positionX - drag.clickOffsetX + drag.startOffsetX - (drag.startWidth  - bevey.findScroll().positionX);
          drag.newY = positionY - drag.clickOffsetY + drag.startOffsetY - (drag.startHeight - bevey.findScroll().positionY);

          if (drag.restrict) {
            endX = drag.elm.parentNode.offsetWidth  - width  - wrapperBorderOffsetX;
            endY = drag.elm.parentNode.offsetHeight - height - wrapperBorderOffsetY;

            if (drag.newX > endX) {
              drag.newX = endX;
            }

            if (drag.newX < 0) {
              drag.newX = 0;
            }

            if (drag.newY > endY) {
              drag.newY = endY;
            }

            if (drag.newY < 0) {
              drag.newY = 0;
            }
          }

          if (drag.dropElm) {
            dropable(drag);
          }

          drag.elm.style.margin = 0;
          drag.elm.style.left   = drag.newX + 'px';
          drag.elm.style.top    = drag.newY + 'px';

          drag.onTween();

          return false;
        }
      };

     /**
      * @private
      */
      dropper = function (e) {
        if (bevey.hasClass(drag.elm, 'active')) {
          bevey.removeClass(drag.elm, 'active');

          if (drag.dropElm) {
            dropable(drag, true);
          }

          bevey.event.remove(document, 'mousemove', mover);
          bevey.event.remove(document, 'mouseup',   dropper);

          drag.onComplete();
        }
      };

     /**
      * @private
      */
      dropable = function (drag, drop) {
        var i = 0,
            temp,
            dropBox,
            offset,
            dropX,
            dropY,
            dragWidth,
            dragHeight,
            dropWidth,
            dropHeight,
            canDrop = false;

        if (drag.dropElm.length === undefined) {
          temp            = drag.dropElm;
          drag.dropElm    = [];
          drag.dropElm[0] = temp;

          temp = drag.onDrop;
          drag.onDrop    = [];
          drag.onDrop[0] = temp;
        }

        for (i; i < drag.dropElm.length; i += 1) {
          dropBox = drag.dropElm[i];
          offset  = bevey.totalOffset(dropBox, true);
          dropX   = offset.offsetX;
          dropY   = offset.offsetY;

          dragWidth  = drag.elm.offsetWidth;
          dragHeight = drag.elm.offsetHeight;
          dropWidth  = dropBox.offsetWidth;
          dropHeight = dropBox.offsetHeight;

          if (((drag.newX > parseInt(dropX - 30, 10)) && (drag.newX < parseInt(dropX + dropBox.offsetWidth  - 10, 10))) &&
              ((drag.newY > parseInt(dropY - 30, 10)) && (drag.newY < parseInt(dropY + dropBox.offsetHeight - 10, 10)))) {
            canDrop = true;
            drag.activeDropBox = dropBox;
            bevey.addClass(dropBox, 'active');

            drag.newX = dropX;
            drag.newY = dropY;

            if (dropWidth > dragWidth) {
              drag.newX += (dropWidth - dragWidth) / 2;
            }

            if (dropHeight > dragHeight) {
              drag.newY += (dropHeight - dragHeight) / 2;
            }

            if (drop) {
              bevey.removeClass(dropBox, 'active');

              drag.onDrop[i](drag.elm);
            }
          }

          else {
            bevey.removeClass(dropBox, 'active');
          }
        }

        if (canDrop === true) {
          bevey.addClass(drag.elm, 'dropable');
        }

        else {
          bevey.removeClass(drag.elm, 'dropable');
        }
      };

      bevey.event.add(drag.dragElm, start, function (e) {
        var startOffset = bevey.findMousePosition(e);

        bevey.clickDrag.zindex  = bevey.clickDrag.zindex || 99;

        bevey.cancelBubble(e);
        drag.clickOffsetX       = startOffset.positionX;
        drag.clickOffsetY       = startOffset.positionY;
        drag.startOffsetX       = drag.elm.offsetLeft;
        drag.startOffsetY       = drag.elm.offsetTop;
        drag.startWidth         = bevey.findScroll().positionX;
        drag.startHeight        = bevey.findScroll().positionY;
        drag.elm.style.zIndex   = bevey.clickDrag.zindex += 1;
        drag.elm.style.margin   = 0;
        drag.elm.style.bottom   = 'auto';
        drag.elm.style.right    = 'auto';
        drag.elm.style.position = 'absolute';
        bevey.addClass(drag.elm, 'active');

        drag.onStart();

        if (e.preventDefault) {
          e.preventDefault();
        }

        bevey.event.add(document, move, mover);
        bevey.event.add(document, end,   dropper);

        mover(e);
      });
    },

   /**
    * Creates a dragable element within a parent element that will be used to
    *  resize the parent.
    *
    * @param {Object} resize Object containing:
    *         {Object} elm Element to be resizable.
    *         {Function} onStart Function to be executed when the element first
    *          gets clicked.
    *         {Function} onComplete Function to be executed after the element
    *          is done moving (mouseup).
    */
    resize : function (resize) {
      var restrictParent       = resize.restrict,
          dragElm              = document.createElement('div'),
          parentBorderOffsetX  = bevey.findStyle(resize.elm, 'border-left-width') + bevey.findStyle(resize.elm, 'border-right-width'),
          parentBorderOffsetY  = bevey.findStyle(resize.elm, 'border-top-width') + bevey.findStyle(resize.elm, 'border-bottom-width'),
          wrapperBorderOffsetX = bevey.findStyle(resize.elm.parentNode, 'border-left-width') + bevey.findStyle(resize.elm.parentNode, 'border-right-width'),
          wrapperBorderOffsetY = bevey.findStyle(resize.elm.parentNode, 'border-top-width') + bevey.findStyle(resize.elm.parentNode, 'border-bottom-width'),
          parentHeight         = resize.elm.offsetHeight,
          parentWidth          = resize.elm.offsetWidth;

      resize.restrict   = false;
      resize.onStart    = resize.onStart    || function () {};
      resize.onComplete = resize.onComplete || function () {};

      resize.elm.appendChild(dragElm);

      bevey.addClass(dragElm, 'resize');
      dragElm.style.left = parentWidth  - dragElm.offsetWidth  - parentBorderOffsetX + 'px';
      dragElm.style.top  = parentHeight - dragElm.offsetHeight - parentBorderOffsetY + 'px';
      resize.elm         = dragElm;

      resize.onTween = function () {
        var containerWidth  = resize.elm.parentNode.parentNode.offsetWidth,
            containerHeight = resize.elm.parentNode.parentNode.offsetHeight,
            width  = bevey.stripUnits(resize.elm.style.left) + dragElm.offsetWidth,
            height = bevey.stripUnits(resize.elm.style.top)  + dragElm.offsetHeight,
           parentLeft = resize.elm.parentNode.offsetLeft,
           parentTop  = resize.elm.parentNode.offsetTop;

        if ((width > dragElm.offsetWidth) && ((!restrictParent) || ((width < (containerWidth - parentLeft - parentBorderOffsetX - wrapperBorderOffsetX))))) {
          resize.elm.parentNode.style.width = width + 'px';
        }

        else if (width >= (containerWidth - parentLeft - parentBorderOffsetX - wrapperBorderOffsetX)) {
          resize.elm.parentNode.style.width = resize.elm.parentNode.parentNode.offsetWidth - resize.elm.parentNode.offsetLeft - parentBorderOffsetX - wrapperBorderOffsetX + 'px';
          resize.elm.style.left = resize.elm.parentNode.offsetWidth - dragElm.offsetWidth - parentBorderOffsetX + 'px';
        }

        if ((height > dragElm.offsetHeight) && ((!restrictParent) || (height < (containerHeight - parentTop - parentBorderOffsetY - wrapperBorderOffsetY)))) {
          resize.elm.parentNode.style.height = height + 'px';
        }

        else if (height >= (containerHeight - parentTop - parentBorderOffsetY - wrapperBorderOffsetY)) {
          resize.elm.parentNode.style.height = resize.elm.parentNode.parentNode.offsetHeight - resize.elm.parentNode.offsetTop - parentBorderOffsetY - wrapperBorderOffsetY + 'px';
          dragElm.style.top = resize.elm.parentNode.offsetHeight - dragElm.offsetHeight - parentBorderOffsetY + 'px';
        }

        if (width <= dragElm.offsetWidth) {
          resize.elm.parentNode.style.width = dragElm.offsetWidth + 'px';
          dragElm.style.left = 0;
        }

        if (height <= dragElm.offsetHeight) {
          resize.elm.parentNode.style.height = dragElm.offsetHeight + 'px';
          dragElm.style.top = 0;
        }
      };

      bevey.clickDrag(resize);
    },

    rotator : {
     /**
      * Animated transitions between a series of images.
      *
      * @param {Object} rotator Object containing:
      *         {Object} elm Element to contain the transitioned images.
      *         {Array} photos Array of images to be rotated through.
      *         {Integer} index Current image being viewed.
      *         {Integer} last Last image that has been viewed.  Should not be
      *          modified by user.
      *         {Boolean} wrap true if the rotator should begin at the first
      *          image once the last image has been reached.
      *         {Boolean} bounce true if the rotator should begin decending
      *          through the photo list once the last image has been reached.
      *         {Function} onComplete Function to be executed after the image
      *          transitions.
      */
      rotate : function (rotator) {
        rotator.onComplete = rotator.onComplete || function () {};

        var imageFetch,
            animation;

        if (rotator.index === undefined) {
          rotator.index = 0;
          rotator.last  = 0;
        }

        if ((rotator.wrap) && ((rotator.index + 1) >= rotator.photos.length)) {
          rotator.last  = rotator.index;
          rotator.index = 0;
        }

        else if (rotator.wrap) {
          rotator.last = rotator.index;
          rotator.index += 1;
        }

        else if (((rotator.bounce) && (rotator.index === 0)) ||
                ((rotator.bounce) && ((rotator.index + 1) < rotator.photos.length) && (rotator.index >= rotator.last)) ||
                ((rotator.direction === 'next') && ((rotator.index + 1) < rotator.photos.length))) {
          rotator.last = rotator.index;
          rotator.index += 1;

          if ((rotator.index + 1) < rotator.photos.length) {
            imageFetch = new Image();
            imageFetch.index = rotator.index + 1;
          }
        }

        else if (((rotator.bounce) ||
                  (rotator.direction === 'prev')) && (rotator.index > 0)) {
          rotator.last = rotator.index;
          rotator.index -= 1;

          if (rotator.index > 0) {
            imageFetch = new Image();
            imageFetch.index = rotator.index - 1;
          }
        }

        else {
          return false;
        }

        if (imageFetch) {
          if (typeof(rotator.photos[imageFetch.index]) === 'object') {
            imageFetch.src = rotator.photos[imageFetch.index].src;
          }

          else {
            imageFetch.src = rotator.photos[imageFetch.index];
          }
        }

        animation = {
          elm        : rotator.elm,
          duration   : 250,
          start      : 1,
          end        : 0,
          property   : 'opacity',
          onComplete : function () {
            rotator.elm.style.display = 'block';

            if (typeof(rotator.photos[rotator.index]) === 'object') {
              rotator.elm.src = rotator.photos[rotator.index].src;
              rotator.elm.alt = rotator.photos[rotator.index].alt;
            }

            else {
              if (rotator.alt) {
                rotator.elm.alt = rotator.alt[rotator.index];
              }

              rotator.elm.src = rotator.photos[rotator.index];
            }

            animation  = {
              elm      : rotator.elm,
              duration : 250,
              start    : 0,
              end      : 1,
              property : 'opacity'
            };

            setTimeout(function () {
              bevey.animate(animation);
            }, 250);

            rotator.onComplete();
          }
        };

        bevey.animate(animation);
      },

     /**
      * Transitions through a set of images automatically, pausing when a user
      *  mouses over the image.  A simple slide-show.
      *
      * @param {Object} rotator Object containing:
      *         {Object} elm Element to contain the transitioned images.
      *         {Array} photos Array of images to be rotated through.
      *         {Integer} interval Time delay of each image.  Defaults to 5000 ms.
      *         {Integer} index Current image being viewed.
      *         {Integer} autoIndex Current step in the image rotation.  Should not
      *          be modified by user.
      *         {Boolean} wrap true if the rotator should begin at the first image
      *          once the last image has been reached.
      *         {Boolean} bounce true if the rotator should begin decending through
      *          the photo list once the last image has been reached.
      *         {Boolean} pause If set to true, the rotator will pause on the
      *          current image.
      *         {Function} onComplete Function to be executed after the image
      *          transitions.
      */
      auto : function (rotator) {
        rotator.interval  = rotator.interval  || 5000;
        rotator.index     = rotator.index     || 0;
        rotator.autoIndex = rotator.autoIndex || 0;
        rotator.bounce    = rotator.bounce    || false;
        rotator.onStart   = rotator.onStart   || function () {};
        rotator.onTween   = rotator.onTween   || function () {};

        if (rotator.wrap !== false) {
          rotator.wrap = true;
        }

        if (rotator.autoIndex === 0) {
          bevey.event.add(rotator.elm, 'mouseenter', function () {
            rotator.pause = true;
          });

          bevey.event.add(rotator.elm, 'mouseleave', function () {
            if (rotator.pause === true) {
              rotator.pause = false;
            }
          });
        }

        if ((rotator.autoIndex) && (rotator.pause !== true)) {
          bevey.rotator.rotate(rotator);
        }

        rotator.autoIndex += 1;

        setTimeout(function () {
          rotator.onStart();
          bevey.rotator.auto(rotator);
          rotator.onTween();
        }, rotator.interval);
      },

     /**
      * Transitions through a set of images according to a user's selection via a
      *  simple "next" / "previous" navigation.
      *
      * @param {Object} rotator Object containing:
      *         {Object} elm Element to contain the transitioned images.
      *         {Array} photos Array of images to be rotated through.
      *         {Integer} index Current image being viewed.
      *         {Function} onStart Function to be executed when the user clicks a
      *          navigation link.
      *         {Function} onComplete Function to be executed after the image
      *          transitions.
      */
      control : function (rotator) {
        rotator.index      = rotator.index      || 0;
        rotator.onStart    = rotator.onStart    || function () {};
        rotator.onComplete = rotator.onComplete || function () {};

        var prev,
            next,
            navAction,
            i = 0,
            linkCheck;

       /**
        * @private
        */
        navAction = function (e) {
          var elm = bevey.getTarget(e);

          if (elm.tagName.toLowerCase() === 'a') {
            if (bevey.hasClass(elm, 'prev')) {
              rotator.direction = 'prev';
            }

            else if (bevey.hasClass(elm, 'next')) {
              rotator.direction = 'next';
            }

            rotator.onStart();
            bevey.rotator.rotate(rotator);
            linkCheck();
            rotator.onComplete();
          }

          e.cancelBubble = true;

          if (e.stopPropagation) {
            e.stopPropagation();
          }

          if (e.preventDefault) {
            e.preventDefault();
          }

          return false;
        };

       /**
        * @private
        */
        linkCheck = function () {
          if (rotator.index <= 0) {
            bevey.addClass(prev, 'disabled');
            prev.href = '#';
          }

          else {
            bevey.removeClass(prev, 'disabled');

            if (typeof(rotator.photos[(rotator.index - 1)]) === 'object') {
              prev.href = rotator.photos[(rotator.index - 1)].src;
            }

            else {
              prev.href = rotator.photos[(rotator.index - 1)];
            }
          }

          if ((rotator.index + 1) >= rotator.photos.length) {
            bevey.addClass(next, 'disabled');
            next.href = '#';
          }

          else {
            bevey.removeClass(next, 'disabled');

            if (typeof(rotator.photos[(rotator.index + 1)]) === 'object') {
              next.href = rotator.photos[(rotator.index + 1)].src;
            }

            else {
              next.href = rotator.photos[(rotator.index + 1)];
            }
          }
        };

        if (rotator.elm.parentNode.getElementsByTagName('a').length) {
          prev = bevey.getElementsByClassName('prev', rotator.elm.parentNode, 'a')[0];
          next = bevey.getElementsByClassName('next', rotator.elm.parentNode, 'a')[0];

          for (i; i < bevey.event.list.length; i += 1) {
            if ((bevey.event.list[i]) &&
                (bevey.event.list[i][0] === rotator.elm.parentNode) &&
                (bevey.event.list[i][1] === 'click')) {
              bevey.event.remove(rotator.elm.parentNode, 'click', bevey.event.list[i][2]);
            }
          }

          bevey.event.add(rotator.elm.parentNode, 'click', navAction);
        }

        else {
          prev = document.createElement('a');
          next = document.createElement('a');
          bevey.addClass(prev, 'prev');
          bevey.putText(prev, 'Previous Image');
          bevey.addClass(next, 'next');
          bevey.putText(next, 'Next Image');
          rotator.elm.parentNode.appendChild(prev);
          rotator.elm.parentNode.appendChild(next);
          bevey.event.add(rotator.elm.parentNode, 'click', navAction);
        }

        linkCheck();
      }
    },

   /**
    * Creates a basic lightbox image viewer from a list of specifically
    *  formatted images and links.
    *
    * @param {Object} lightbox Object containing:
    *         {Object} elm Parent element that contains the image and link
    *          references.
    *         {Array} images Optional array of image thumbnail elements that
    *          are children of links to larger images.  If no array is
    *          specified, the elm object will be searched for all img tags.
    *         {Function} onStart Function to be executed when the user clicks
    *          an image thumbnail for viewing.
    *         {Function} onComplete Function to be executed after a user closes
    *          lightbox.
    */
    lightbox : function (lightbox) {
      lightbox.onStart    = lightbox.onStart    || function () {};
      lightbox.onComplete = lightbox.onComplete || function () {};
      lightbox.images     = lightbox.images     || lightbox.elm.getElementsByTagName('img');

      var images = [],
          image,
          full,
          i = 0,
          findSize;

      findSize = function (imageTag) {
        if ((imageTag.naturalWidth > 0) && (imageTag.naturalHeight > 0)) {
          imageTag.width                   = imageTag.naturalWidth;
          imageTag.height                  = imageTag.naturalHeight;
          imageTag.parentNode.style.width  = imageTag.width  + 'px';
          imageTag.parentNode.style.height = imageTag.height + 'px';
        }

        else if ((imageTag.complete !== false) && (imageTag.width > 0) && (imageTag.height > 0)) {
          imageTag.parentNode.style.width  = imageTag.width  + 'px';
          imageTag.parentNode.style.height = imageTag.height + 'px';
        }

        else {
          setTimeout(function () {
            findSize(imageTag);
          }, 250);
        }
      };

      for (i; i < lightbox.images.length; i += 1) {
        image       = new Image();
        image       = lightbox.images[i];
        image.index = i;

        full        = new Image();
        full.src    = image.parentNode.href;
        full.alt    = image.alt;
        images[i]   = full;
      }

      bevey.event.add(lightbox.elm, 'click', function (e) {
        if (bevey.getTarget(e).nodeName.toLowerCase() === 'img') {
          var elm       = bevey.getTarget(e),
              image     = elm,
              fullImage = image.parentNode.href,
              caption   = image.alt,
              overlay,
              content,
              curtain,
              imageContainer,
              imageWrapper,
              imageTag,
              captionTag,
              rotator;

          lightbox.onStart();

          if (bevey.hasClass(document.body.firstChild, 'overlay')) {
            overlay = document.body.firstChild;
            content = bevey.getElementsByClassName('content', overlay, 'div')[0];
            overlay.style.display = 'block';
            bevey.setOpacity(overlay, 1);

            imageWrapper   = content.getElementsByTagName('div')[0];
            imageContainer = imageWrapper.getElementsByTagName('div')[0];
            imageTag       = imageContainer.getElementsByTagName('img')[0];
            captionTag     = imageContainer.nextSibling;
          }

          else {
            overlay = document.createElement('div');
            bevey.addClass(overlay, 'overlay');
            curtain = document.createElement('div');
            bevey.addClass(curtain, 'curtain');
            overlay.appendChild(curtain);
            content = document.createElement('div');
            bevey.addClass(content, 'content');

            imageContainer = document.createElement('div');
            imageWrapper   = document.createElement('div');
            imageTag       = document.createElement('img');
            captionTag     = document.createElement('p');

            imageWrapper.appendChild(imageTag);
            imageContainer.appendChild(imageWrapper);
            imageContainer.appendChild(captionTag);
            content.appendChild(imageContainer);
            overlay.appendChild(content);

            bevey.event.add(imageContainer, 'click', function (e) {
              bevey.cancelBubble(e);
            });

            bevey.event.add(overlay, 'click', function () {
              var overlayAnimation = {
                elm        : overlay,
                property   : 'opacity',
                duration   : 250,
                start      : 1,
                end        : 0,
                onComplete : lightbox.onComplete
              };

              bevey.animate(overlayAnimation);
            });

            bevey.insertFirst(overlay, document.body);
          }

          imageTag.src = fullImage;
          imageTag.alt = caption;

          bevey.putText(captionTag, caption);

          findSize(imageTag);

          overlay.style.height = bevey.findDocumentHeight() + 'px';

          if (bevey.findStyle(content, 'position') === 'relative') {
            content.style.paddingTop = bevey.findScroll().positionY + 'px';
          }

          else {
            if ((imageTag.offsetHeight + 85) > Math.min(document.body.clientHeight, document.documentElement.clientHeight)) {
              content.style.position   = 'absolute';
              content.style.paddingTop = bevey.findScroll().positionY + 'px';
            }

            else {
              content.style.position   = 'fixed';
              content.style.paddingTop = 0;
            }
          }

          rotator = {
            elm        : imageTag,
            photos     : images,
            index      : image.index,
            onComplete : function () {
              var tempImage      = new Image();
              tempImage.src      = rotator.elm.src;

              findSize(rotator.elm);

              overlay.style.height = bevey.findDocumentHeight() + 'px';

              bevey.putText(rotator.elm.parentNode.nextSibling, rotator.elm.alt);
            }
          };

          bevey.rotator.control(rotator);

          if (e.preventDefault) {
            e.preventDefault();
          }

          return false;
        }
      });
    },

   /**
    * Interupts the loading of images outside the initial viewport.  Once the
    *  user's viewport comes near any of the images, their loading will be
    *  resumed.
    *
    * @param {Object} elm Parent element containing images that should be lazy
    *         loaded.  If no parent element is defined, the document will be
    *         used (all images will be lazy loaded).
    */
    lazyLoad : function (elm) {
      elm = elm || document;

      var allImages,
          lazyImages = [],
          loadImages,
          setSrc,
          i = 0;

      if (elm.nodeName) {
        allImages = elm.getElementsByTagName('img');
      }

      else {
        allImages = elm;
      }

      loadImages = function () {
        var scroll,
            i = lazyImages.length - 1;

        if (lazyImages.length) {
          scroll = bevey.findScroll().positionY + Math.min(document.body.clientHeight, document.documentElement.clientHeight);

          for (i; i >= 0; i -= 1) {
            if (lazyImages[i].offsetTop < scroll) {
              lazyImages[i].src = lazyImages[i].getAttribute('data-src');
              lazyImages.splice(i, 1);
            }
          }
        }
      };

      setSrc = function (image) {
        image.setAttribute('data-src', image.src);
        image.src = '#';
      };

      for (i; i < allImages.length; i += 1) {
        if (allImages[i].offsetTop > Math.min(document.body.clientHeight, document.documentElement.clientHeight)) {
          if (!allImages[i].complete) {
            lazyImages.push(allImages[i]);
            bevey.closure(allImages[i], setSrc(allImages[i]));
          }
        }
      }

      if (lazyImages.length > 0) {
        bevey.event.add(window, 'scroll', function () {
          loadImages();
        });

        bevey.event.add(window, 'resize', function () {
          loadImages();
        });
      }

      loadImages();
    },

   /**
    * Creates a carousel from pre-formatted list of carousel panes.
    *
    * @param {Object} elm Element that contains the preformated carousel
    *         markup.  If no parent element is defined, the document will be
    *         used to find all applicable carousels.
    */
    carousel : function (elm) {
      elm = elm || document;

      var carouselTemp,
          carousel,
          i = 0,
          j,
          carousels = bevey.getElementsByClassName('carousel-wrap', elm, 'div'),
          movePrev,
          moveNext;

     /**
      * @private
      */
      movePrev = function (carousel) {
        return function () {
          if (carousel.currPane > 0) {
            bevey.removeClass(carousel.navNext, 'carousel-disabled');

            var animation = {
              elm      : carousel.parent,
              duration : 500,
              start    : parseInt(carousel.currPane * carousel.paneStep * -1, 10),
              end      : parseInt(carousel.currPane * carousel.paneStep * -1, 10) + carousel.paneStep,
              property : 'left',
              ease     : 'ease-out',
              onStart  : function () {
                carousel.currPane = carousel.currPane - 1;
                if (carousel.currPane <= 0) {
                  bevey.addClass(carousel.navPrev, 'carousel-disabled');
                }

                else {
                  bevey.removeClass(carousel.navPrev, 'carousel-disabled');
                }
              }
            };

            bevey.animate(animation);
          }
        };
      };

     /**
      * @private
      */
      moveNext = function (carousel) {
        return function () {
          if (carousel.currPane < carousel.panes.length - 1) {
            bevey.removeClass(carousel.navPrev, 'carousel-disabled');

            var animation = {
              elm      : carousel.parent,
              duration : 500,
              start    : parseInt(carousel.currPane * carousel.paneStep * -1, 10),
              end      : parseInt(carousel.currPane * carousel.paneStep * -1, 10) - carousel.paneStep,
              property : 'left',
              ease     : 'ease-out',
              onStart  : function () {
                carousel.currPane += 1;
                if (carousel.currPane >= carousel.panes.length - 1) {
                  bevey.addClass(carousel.navNext, 'carousel-disabled');
                }

                else {
                  bevey.removeClass(carousel.navNext, 'carousel-disabled');
                }
              }
            };

            bevey.animate(animation);
          }
        };
      };

      for (i; i < carousels.length; i += 1) {
        carouselTemp = bevey.getElementsByClassName('carousel', carousels[i], 'ul');

        carousel = {
          parent     : carouselTemp[0],
          panes      : bevey.getElementsByClassName('pane', carouselTemp[0], 'li'),
          totalWidth : 0,
          currPane   : 0,
          paneStep   : 0,
          navPrev    : document.createElement('a'),
          navNext    : document.createElement('a')
        };

        for (j = 0; j < carousel.panes.length; j += 1) {
          carousel.totalWidth = carousel.totalWidth + carousel.panes[i].offsetWidth;
          carousel.paneStep   = carousel.panes[i].offsetWidth;
        }

        carousel.parent.style.width = carousel.totalWidth + 'px';

        carousel.navPrev.href  = '#';
        carousel.navPrev.title = 'Previous pane in carousel';
        bevey.cancelLink(carousel.navPrev);
        bevey.addClass(carousel.navPrev, 'carousel-prev');
        bevey.addClass(carousel.navPrev, 'carousel-disabled');
        carousels[i].appendChild(carousel.navPrev);

        carousel.navNext.href  = '#';
        carousel.navNext.title = 'Next pane in carousel';
        bevey.cancelLink(carousel.navNext);
        bevey.addClass(carousel.navNext, 'carousel-next');
        carousels[i].appendChild(carousel.navNext);

        bevey.event.add(carousel.navPrev, 'click', bevey.closure(carousel, movePrev(carousel)));
        bevey.event.add(carousel.navNext, 'click', bevey.closure(carousel, moveNext(carousel)));
      }
    },

   /**
    * Creates a list of items dynamically loaded based off the criteria entered
    *  into the form element provided.
    *
    * @param {Object} autoComplete Object containing:
    *         {Object} elm Form element.
    *         {String} preText Text that will populate the result area before a
    *          request is made.
    *         {String} noResultText Text that will populate the result area if
    *          no results are found.
    *         {String} param Additional query parameters used in the AJAX
    *          request.
    *         {String} template HTML or text template of contents of each
    *          response list item's contents.  For each property replacement,
    *          the propertie's name should be referenced, surrounded by
    *          brackets:
    *          ("Result: [name]").
    *         {Integer} time Time of last request.  Should not be modified by
    *          the user.
    *         {Function} onStart Function to be executed when an AJAX search
    *          request begins.
    *         {Function} onComplete Function to be executed after an AJAX
    *          search request completes.
    * @note Uses eval if JSON.parse is not available.
    */
    autoComplete : function (autoComplete) {
      autoComplete.onStart      = autoComplete.onStart      || function () {};
      autoComplete.onComplete   = autoComplete.onComplete   || function () {};
      autoComplete.preText      = autoComplete.preText      || 'Your list of responses will show up here';
      autoComplete.noResultText = autoComplete.noResultText || 'No matches found';
      autoComplete.param        = autoComplete.param        || '';

      if (autoComplete.param) {
        autoComplete.param = '&' + autoComplete.param;
      }

      autoComplete.elm.setAttribute('autocomplete', 'off');

      var container = document.createElement('div'),
          anchor    = document.createElement('a'),
          list      = document.createElement('ul'),
          item      = document.createElement('li'),
          reply,
          newKey;

      if (!autoComplete.external) {
        autoComplete.external = true;
      }

      bevey.addClass(anchor, 'closeResults');
      bevey.addClass(container, 'noResults');
      bevey.putText(item, autoComplete.preText);
      container.appendChild(anchor);
      container.appendChild(list);
      list.appendChild(item);
      autoComplete.elm.parentNode.appendChild(container);

      bevey.event.add(anchor, 'click', function () {
        bevey.addClass(container, 'noResults');
      });

     /**
      * @private
      */
      newKey = function (elm, index) {
        var date  = new Date(),
            time  = date.getTime(),
            input = elm.value,
            newItem,
            ajaxRequest,
            item,
            link,
            caption;

        index = index || 0;
        autoComplete.time = autoComplete.time || 0;

        setTimeout(function () {
          if (((time - 2000) > autoComplete.time) && (input.length > 3)) {
            index += 1;
            newKey(elm, index);
          }
        }, 2000);

        if (index && input) {
          autoComplete.onStart();

          bevey.addClass(elm, 'active');

          ajaxRequest = {
            path       : autoComplete.path,
            param      : 'q=' + input + autoComplete.param,
            method     : 'GET',
            onComplete : function () {
              var i = 0,
                  property,
                  templateItem,
                  template;

              if (ajaxRequest.response !== '[]') {
                bevey.removeClass(container, 'noResults');

                if (typeof(JSON) === 'object') {
                  reply = JSON.parse(ajaxRequest.response);
                }

                else {
                  reply = eval('(' + ajaxRequest.response + ')');
                }

                for (i; i < reply.length; i += 1) {
                  if (autoComplete.template) {
                    template = autoComplete.template;
                    property = '';
                    templateItem = document.createElement('li');

                    for (property in reply[i]) {
                      if (reply[i].hasOwnProperty(property)) {
                        while (template.indexOf('[' + property + ']') !== -1) {
                          template = template.replace('[' + property + ']', reply[i][property]);
                        }
                      }
                    }

                    templateItem.innerHTML = template;
                    list.appendChild(templateItem);
                  }

                  else {
                    item = document.createElement('li');
                    link = document.createElement('a');
                    caption = document.createElement('span');

                    link.setAttribute('href', reply[i].clickUrl);

                    if (autoComplete.external) {
                      link.setAttribute('rel', 'external');
                      link.target = '_blank';
                    }

                    bevey.putText(link, reply[i].url);
                    bevey.putText(caption, reply[i].title);

                    item.appendChild(link);
                    item.appendChild(caption);
                    list.appendChild(item);
                  }
                }
              }

              else {
                bevey.removeChildren(list);
                newItem = document.createElement('li');
                bevey.putText(newItem, autoComplete.noResultText);

                bevey.addClass(container, 'noResults');
                list.appendChild(newItem);
              }

              bevey.removeClass(elm, 'active');

              autoComplete.onComplete();
            }
          };

          autoComplete.time = time;
          bevey.removeChildren(list);

          bevey.ajax.request(ajaxRequest);
        }
      };

      bevey.event.add(autoComplete.elm, 'keyup', bevey.closure(autoComplete.elm, function () {
        newKey(autoComplete.elm);
      }));
    },

   /**
    * Creates a text default for the given form element.  Once the form element
    *  is focused, the text will be removed, allowing normal form use.  If no
    *  alternate text is defined, that input's <label> text will be used.
    *
    * @param {Object/String} input Form input element to have text default
    *         added to.  If a string value is passed, it's assumed to be the ID
    *         of the desired form element.
    * @param {String} text Optionally, default text to populate the form may be
    *         defined.  If no text value is defined, the input element's
    *         <label> value will be used.
    */
    formDefault : function (input, text) {
      var elm,
          labels,
          i = 0,
          textNode;

      if (typeof(input) === 'string') {
        elm = document.getElementById(input);
      }

      else {
        elm = input;
      }

      if (elm !== null) {
        if (text === undefined) {
          text = '';
          labels = elm.parentNode.getElementsByTagName('label');

          for (i; i < labels.length; i += 1) {
            if (labels[i].htmlFor) {
              textNode = labels[i].childNodes[0];

              if (textNode !== null) {
                text = textNode.nodeValue;
              }

              break;
            }
          }
        }

        bevey.event.add(elm, 'focus', function () {
          if (elm.value === text) {
            elm.value = '';
          }
        });

        bevey.event.add(elm, 'blur', function () {
          elm.value = bevey.trim(elm.value);

          if (elm.value === '') {
            elm.value = text;
          }
        });

        elm.value = bevey.trim(text);
      }
    },

   /**
    * For each form element in the parent element with a maxlength specified,
    *  shift focus to the next visible form element once that maxlength is
    *  reached.  If no parent is specified, the document root will be used.
    *
    * @param {Object} elm Element that contains the form elements to have focus
    *         changes.  If no parent element is defined, the documentwill be
    *         used to find all form elements.
    */
    formFocus : function (elm) {
      var removeHidden,
          focusNext,
          checkFocus,
          inputs,
          i = 0;

      elm = elm || document;

     /**
      * @private
      */
      removeHidden = function (inputs) {
        var newInputs = [],
            j = 0,
            i = 0;

        for (i; i < inputs.length; i += 1) {
          if (inputs[i].type !== 'hidden') {
            newInputs[j] = inputs[i];
            j += 1;
          }
        }

        return newInputs;
      };

     /**
      * @private
      */
      focusNext = function (input) {
        var i = 0,
            parentForm = input.form,
            formInputs = removeHidden(parentForm.getElementsByTagName('input'));

        for (i; (i + 1) < formInputs.length; i += 1) {
          if (formInputs[i] === input) {
            if (formInputs[i + 1].type !== 'hidden') {
              formInputs[i + 1].focus();
            }
          }
        }
      };

     /**
      * @private
      */
      checkFocus = function (elm) {
        return function (elm) {
          if (elm.value.length >= elm.maxLength) {
            focusNext(elm);
          }
        };
      };

      inputs = removeHidden(elm.getElementsByTagName('input'));

      for (i; i < inputs.length; i += 1) {
        if (inputs[i].maxLength > 0) {
          bevey.event.add(inputs[i], 'keyup', bevey.closure(inputs[i], checkFocus(inputs[i])));
        }
      }
    },

   /**
    * Creates a dynamic tab interface to specially structured markup.
    *
    * @return {Object} Object containing:
    *          {Object} elm Parent element of the tab markup.  If no parent is
    *           specified, the document root will be used.
    *          {Boolean} animate Specifies if tabs should fade when changed.
    *           Defaults to true.
    *          {Function} onStart Function to be executed before a tab change.
    *          {Function} onComplete Function to be executed after a tab
    *           change.
    */
    tabs : function (tabs) {
      tabs = tabs || [];

      tabs.elm        = tabs.elm        || document;
      tabs.onStart    = tabs.onStart    || function () {};
      tabs.onComplete = tabs.onComplete || function () {};

      if (tabs.animate !== false) {
        tabs.animate = true;
      }

      var tabSets = bevey.getElementsByClassName('tabs', tabs.elm, 'ul'),
          i       = 0,
          changeTab;

     /**
      * @private
      */
      changeTab = function () {
        return function (e) {
          var elm = bevey.getTarget(e),
              tabSet,
              paneSet,
              index,
              animation,
              j = 0;

          while (elm.nodeName.toLowerCase() !== 'li') {
            elm = elm.parentNode;
          }

          tabSet  = elm.parentNode.getElementsByTagName('li');
          paneSet = bevey.getElementsByClassName('panes', elm.parentNode.parentNode, 'ul');
          paneSet = paneSet[0].getElementsByTagName('li');

          tabs.onStart();

          for (j; j < tabSet.length; j += 1) {
            if (tabSet[j] === elm) {
              index = j;
            }

            else {
              bevey.removeClass(tabSet[j],  'selected');
              bevey.removeClass(paneSet[j], 'selected');
            }
          }

          if (tabs.animate) {
            if (!bevey.hasClass(paneSet[index], 'selected')) {
              bevey.setOpacity(paneSet[index], 0);

              animation = {
                elm        : paneSet[index],
                property   : 'opacity',
                start      : 0,
                end        : 1,
                duration   : 250,
                noNative   : true,
                onComplete : function () {
                  paneSet[index].style.display = '';
                  tabs.onComplete();
                }
              };

              bevey.animate(animation);
            }
          }

          bevey.addClass(tabSet[index],  'selected');
          bevey.addClass(paneSet[index], 'selected');

          if (e.preventDefault) {
            e.preventDefault();
          }

          return false;
        };
      };

      for (i; i < tabSets.length; i += 1) {
        bevey.event.add(tabSets[i], 'click', changeTab());
      }
    },

   /**
    * Alters the document body's font-size to zoom text up and down.  Behaves
    *  best when a page is built using the correct "em" measurement.
    *
    * @param {String} direction Direction of zoom.  Valid values are "up" and
    *         "down".  If any other value is passed, it is assumed to be a call
    *         to be initialized - and the value stored in a cookie (if any)
    *         will be applied.
    */
    zoomer : function (direction) {
      var currentSize = bevey.findStyle(document.body, 'font-size') || 12;

      if (direction === undefined) {
        currentSize = bevey.readCookie('zoomer') || currentSize;
      }

      if (direction === 'down') {
        currentSize -= 1;
      }

      else if (direction === 'up') {
        currentSize += 1;
      }

      if ((currentSize !== undefined) && (currentSize < 40) && (currentSize > 8)) {
        document.body.style.fontSize = currentSize + 'px';
        document.cookie = 'zoomer=' + currentSize + '; path=/';
      }
    },

   /**
    * Initialization for Bevey.  Executes the standard functions used.  If a
    *  global function of "init" is available, it will also be executed.
    */
    init : function () {
      bevey.lazyLoad();
      bevey.addClass(document.body, 'rich');
      bevey.externalLinks();
      bevey.tabs();
      bevey.carousel();

      if (typeof(init) === 'function') {
        init();
      }
    }
  };
} ());

if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', bevey.init, false);
}

bevey.event.add(window, 'load', function () {
  'use strict';
  if (!document.addEventListener) {
    bevey.init();
  }
});

bevey.event.add(window, 'unload', function () {
  'use strict';
  bevey.event.removeAll();
});