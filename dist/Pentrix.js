(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){

module.exports = require('./lib/jquery-deferred');
},{"./lib/jquery-deferred":5}],3:[function(require,module,exports){
var jQuery = module.exports = require("./jquery-core.js"),
	core_rspace = /\s+/;
/**
* jQuery Callbacks
*
* Code from: https://github.com/jquery/jquery/blob/master/src/callbacks.js
*
*/


// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.split( core_rspace ), function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// Flag to know if list is currently firing
		firing,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Control if a given callback is in the list
			has: function( fn ) {
				return jQuery.inArray( fn, list ) > -1;
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				args = args || [];
				args = [ context, args.slice ? args.slice() : args ];
				if ( list && ( !fired || stack ) ) {
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


},{"./jquery-core.js":4}],4:[function(require,module,exports){
/**
* jQuery core object.
*
* Worker with jQuery deferred
*
* Code from: https://github.com/jquery/jquery/blob/master/src/core.js
*
*/

var jQuery = module.exports = {
	type: type
	, isArray: isArray
	, isFunction: isFunction
	, isPlainObject: isPlainObject
	, each: each
	, extend: extend
	, noop: function() {}
};

var toString = Object.prototype.toString;

var class2type = {};
// Populate the class2type map
"Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});


function type( obj ) {
	return obj == null ?
		String( obj ) :
			class2type[ toString.call(obj) ] || "object";
}

function isFunction( obj ) {
	return jQuery.type(obj) === "function";
}

function isArray( obj ) {
	return jQuery.type(obj) === "array";
}

function each( object, callback, args ) {
	var name, i = 0,
	length = object.length,
	isObj = length === undefined || isFunction( object );

	if ( args ) {
		if ( isObj ) {
			for ( name in object ) {
				if ( callback.apply( object[ name ], args ) === false ) {
					break;
				}
			}
		} else {
			for ( ; i < length; ) {
				if ( callback.apply( object[ i++ ], args ) === false ) {
					break;
				}
			}
		}

		// A special, fast, case for the most common use of each
	} else {
		if ( isObj ) {
			for ( name in object ) {
				if ( callback.call( object[ name ], name, object[ name ] ) === false ) {
					break;
				}
			}
		} else {
			for ( ; i < length; ) {
				if ( callback.call( object[ i ], i, object[ i++ ] ) === false ) {
					break;
				}
			}
		}
	}

	return object;
}

function isPlainObject( obj ) {
	// Must be an Object.
	if ( !obj || jQuery.type(obj) !== "object" ) {
		return false;
	}
	return true;
}

function extend() {
	var options, name, src, copy, copyIsArray, clone,
	target = arguments[0] || {},
	i = 1,
	length = arguments.length,
	deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

					// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};



},{}],5:[function(require,module,exports){

/*!
* jquery-deferred
* Copyright(c) 2011 Hidden <zzdhidden@gmail.com>
* MIT Licensed
*/

/**
* Library version.
*/

var jQuery = module.exports = require("./jquery-callbacks.js"),
	core_slice = Array.prototype.slice;

/**
* jQuery deferred
*
* Code from: https://github.com/jquery/jquery/blob/master/src/deferred.js
* Doc: http://api.jquery.com/category/deferred-object/
*
*/

jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var action = tuple[ 0 ],
								fn = fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ]( jQuery.isFunction( fn ) ?
								function() {
									var returned = fn.apply( this, arguments );
									if ( returned && jQuery.isFunction( returned.promise ) ) {
										returned.promise()
											.done( newDefer.resolve )
											.fail( newDefer.reject )
											.progress( newDefer.notify );
									} else {
										newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
									}
								} :
								newDefer[ action ]
							);
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ] = list.fire
			deferred[ tuple[0] ] = list.fire;
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = core_slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});

},{"./jquery-callbacks.js":3}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jqueryDeferred = require('jquery-deferred');

var _jqueryDeferred2 = _interopRequireDefault(_jqueryDeferred);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _Util = require('./modules/Util');

var _Util2 = _interopRequireDefault(_Util);

var _TouchController = require('./modules/TouchController');

var _TouchController2 = _interopRequireDefault(_TouchController);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ALL_BLOCK_LIST = _constants.BLOCK_LIST.concat([_constants.CLEARLINE_BLOCK, _constants.GAMEOVER_BLOCK]);
var BLANK_ROW = Array.apply(null, Array(_constants.COLS)).map(function () {
  return 0;
}); // [0,0,0,0,0,...]

var pentrix = function (_EventEmitter) {
  _inherits(pentrix, _EventEmitter);

  function pentrix() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, pentrix);

    var _this = _possibleConstructorReturn(this, (pentrix.__proto__ || Object.getPrototypeOf(pentrix)).call(this));

    _this.rootElm = opts.rootElement || document.createElement('div');
    _this.cnvs = opts.canvas || document.createElement('canvas');
    _this.ctx = _this.cnvs.getContext('2d');
    _this.cnvsNext = opts.canvasNext || document.createElement('canvas');
    _this.ctxNext = _this.cnvsNext.getContext('2d');
    _this.rootElm.appendChild(_this.cnvsNext);
    _this.rootElm.appendChild(_this.cnvs);

    _this.initCanvasSize();

    if (!opts.disableFocusControls) _this.initBlurEvent();
    if (!opts.disableKey) _this.initKeyEvent();
    if (!opts.disableTouch) _this.initTouchEvent();
    return _this;
  }

  _createClass(pentrix, [{
    key: 'initCanvasSize',
    value: function initCanvasSize() {
      this.cnvs.style.width = _constants.WIDTH + 'px';
      this.cnvs.style.height = _constants.HEIGHT + 'px';
      this.cnvs.width = _constants.WIDTH * 2; // for retina
      this.cnvs.height = _constants.HEIGHT * 2; // for retina
      this.ctx.scale(2, 2); // for retina
      this.ctx.strokeStyle = _constants.BG_COLOR;

      this.cnvsNext.style.width = _constants.NEXT_WIDTH + 'px';
      this.cnvsNext.style.height = _constants.NEXT_HEIGHT + 'px';
      this.cnvsNext.width = _constants.NEXT_WIDTH * 2; // for retina
      this.cnvsNext.height = _constants.NEXT_HEIGHT * 2; // for retina
      this.ctxNext.scale(2, 2); // for retina
      this.ctxNext.strokeStyle = _constants.BG_COLOR;
    }

    // Controller ------------------------------

  }, {
    key: 'initBlurEvent',
    value: function initBlurEvent() {
      var _this2 = this;

      window.addEventListener('blur', function () {
        _this2.pauseGame();
      }, false);
      window.addEventListener('focus', function () {
        _this2.resumeGame();
      }, false);
    }
  }, {
    key: 'initKeyEvent',
    value: function initKeyEvent() {
      var _this3 = this;

      document.addEventListener('keydown', function (evt) {
        if (typeof _constants.KEYS[evt.keyCode] === 'undefined') return;
        evt.preventDefault();
        _this3.handleMethod(_constants.KEYS[evt.keyCode]);
      }, false);
    }
  }, {
    key: 'initTouchEvent',
    value: function initTouchEvent() {
      var _this4 = this;

      var touch = new _TouchController2.default({
        element: this.cnvs
      });
      var touchStartX = void 0;
      var touchStartY = void 0;
      var isTap = false;
      var isFreeze = false;

      touch.on('touchstart', function (info) {
        touchStartX = info.touchStartX;
        touchStartY = info.touchStartY;
        isTap = true;
        isFreeze = false;
      });
      touch.on('touchmove', function (info) {
        // const blockMoveX = (info.moveX / BLOCK_SIZE) | 0;
        var moveX = info.touchX - touchStartX;
        var moveY = info.touchY - touchStartY;
        var blockMoveX = moveX / _constants.BLOCK_SIZE | 0;
        var blockMoveY = moveY / _constants.BLOCK_SIZE | 0;

        if (isFreeze) return;

        // 1マスずつバリデーション（すり抜け対策）
        while (!!blockMoveX) {
          var sign = blockMoveX / Math.abs(blockMoveX); // 1 or -1
          if (!_this4.validate(sign, 0)) break;
          _this4.currentBlock.x += sign;
          blockMoveX -= sign;
          touchStartX = info.touchX;
        }
        while (blockMoveY > 0) {
          if (!_this4.validate(0, 1)) break;
          _this4.currentBlock.y++;
          blockMoveY--;
          touchStartY = info.touchY;
        }
        isTap = false;
      });
      touch.on('touchend', function (info) {
        if (!!isTap) _this4.rotateBlock();
      });
      this.on('freeze', function () {
        isFreeze = true;
      });
    }
  }, {
    key: 'handleMethod',
    value: function handleMethod(key) {
      // helper
      switch (key) {
        case 'left':
          this.moveBlockLeft();
          break;
        case 'right':
          this.moveBlockRight();
          break;
        case 'down':
          this.moveBlockDown();
          break;
        case 'rotate':
          this.rotateBlock();
          break;
        default:
          break;
      }
    }

    // Model ------------------------------

  }, {
    key: 'newGame',
    value: function newGame() {
      this.initGame();
      this.startGame();
    }
  }, {
    key: 'initGame',
    value: function initGame() {
      clearTimeout(this.tickId);
      this.stopRender();
      this.isPlayng = false;
      this.lose = false;
      this.tickInterval = _constants.DEFAULT_TICK_INTERVAL;
      this.sumOfClearLines = 0;
      this.score = 0;
      this.frameCount = 0;
      this.initBoard();
      this.initBlock();
      this.createNextBlock();
      this.render();
      this.emit('gameinit');
    }
  }, {
    key: 'startGame',
    value: function startGame() {
      this.isPlayng = true;
      this.createCurrentBlock();
      this.createNextBlock();
      this.startRender();
      this.emit('gamestart');
      this.tick();
    }
  }, {
    key: 'initBoard',
    value: function initBoard() {
      this.board = [];
      for (var y = 0; y < _constants.LOGICAL_ROWS; ++y) {
        this.board[y] = [];
        for (var x = 0; x < _constants.COLS; ++x) {
          this.board[y][x] = 0;
        }
      }
    }
  }, {
    key: 'initBlock',
    value: function initBlock() {
      this.nextBlock = this.createBlock(0);
      this.currentBlock = this.createBlock(0);
      this.currentBlock.x = _constants.START_X;
      this.currentBlock.y = _constants.START_Y;
    }
  }, {
    key: 'createBlock',
    value: function createBlock() {
      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      var blockConst = _constants.BLOCK_LIST[id] || {};
      var shape = blockConst.shape;
      var block = Object.assign({}, _constants.BLOCK_LIST[id], {
        shape: [],
        x: 0,
        y: 0
      });
      for (var y = 0; y < _constants.NUMBER_OF_BLOCK; ++y) {
        block.shape[y] = [];
        for (var x = 0; x < _constants.NUMBER_OF_BLOCK; ++x) {
          block.shape[y][x] = shape[y][x] || 0;
        }
      }
      this.emit('newblockcreated');
      return block;
    }
  }, {
    key: 'createCurrentBlock',
    value: function createCurrentBlock() {
      if (!this.nextBlock) this.createNextBlock();
      this.currentBlock = this.nextBlock;
      this.currentBlock.x = _constants.START_X;
      this.currentBlock.y = _constants.START_Y;
      this.emit('currentblockcreated');
    }
  }, {
    key: 'createNextBlock',
    value: function createNextBlock() {
      var id = Math.floor(Math.random() * _constants.BLOCK_LIST.length);
      this.nextBlock = this.createBlock(id);
      this.emit('nextblockcreated');
    }

    // メインでループする関数

  }, {
    key: 'tick',
    value: function tick() {
      var _this5 = this;

      clearTimeout(this.tickId);
      if (!this.moveBlockDown()) {
        this.freeze();
        this.clearLines();
        if (this.checkGameOver()) {
          this.emit('gameover');
          this.quitGame().then(function () {
            // this.newGame();
          });
          return false;
        }
        this.frameCount++;
        this.createCurrentBlock();
        this.createNextBlock();
      }
      this.tickId = setTimeout(function () {
        return _this5.tick();
      }, this.tickInterval);
      this.emit('tick');
    }
  }, {
    key: 'quitGame',
    value: function quitGame() {
      var _this6 = this;

      var dfd = _jqueryDeferred2.default.Deferred();
      this.gameOverEffect().then(function () {
        _this6.isPlayng = false;
        _this6.emit('gamequit');
        dfd.resolve();
      });
      return dfd.promise();
    }
  }, {
    key: 'pauseGame',
    value: function pauseGame() {
      clearTimeout(this.tickId);
      this.stopRender();
    }
  }, {
    key: 'resumeGame',
    value: function resumeGame() {
      var _this7 = this;

      if (!this.isPlayng) return;
      this.tickId = setTimeout(function () {
        return _this7.tick();
      }, this.tickInterval);
      this.startRender();
    }
  }, {
    key: 'freeze',
    value: function freeze() {
      for (var y = 0; y < _constants.NUMBER_OF_BLOCK; ++y) {
        for (var x = 0; x < _constants.NUMBER_OF_BLOCK; ++x) {
          var boardX = x + this.currentBlock.x;
          var boardY = y + this.currentBlock.y;
          if (!this.currentBlock.shape[y][x] || boardY < 0) continue;
          this.board[boardY][boardX] = this.currentBlock.shape[y][x] ? this.currentBlock.id + 1 : 0;
        }
      }
      this.emit('freeze');
    }
  }, {
    key: 'clearLines',
    value: function clearLines() {
      var _this8 = this;

      var clearLineLength = 0; // 同時消去ライン数
      var filledRowList = [];
      var dfd = _jqueryDeferred2.default.Deferred();
      dfd.resolve();

      var effect = function effect(x, y) {
        return function () {
          var d = _jqueryDeferred2.default.Deferred();
          _this8.board[y][x] = _constants.CLEARLINE_BLOCK.id + 1;
          d.resolve();
          return d.promise();
        };
      };
      var dropRow = function dropRow() {
        return function () {
          var d = _jqueryDeferred2.default.Deferred();
          if (!filledRowList.length) return;
          filledRowList.reverse().forEach(function (row) {
            _this8.board.splice(row, 1);
            _this8.board.unshift(BLANK_ROW);
          });
          d.resolve();
          return d.promise();
        };
      };

      for (var y = _constants.LOGICAL_ROWS - 1; y >= 0; --y) {
        var isRowFilled = this.board[y].every(function (val) {
          return val !== 0;
        });
        if (!isRowFilled) continue;
        filledRowList.push(y);
        clearLineLength++;
        this.sumOfClearLines++;
        this.tickInterval -= _constants.SPEEDUP_RATE; // 1行消去で速度を上げる

        // clear line effect
        for (var x = 0; x < _constants.COLS; ++x) {
          if (!this.board[y][x]) continue;
          dfd = dfd.then(effect(x, y)).then(_Util2.default.sleep(10));
        }
      }
      // clear line drop
      dfd.then(dropRow());

      // calc score
      this.score += clearLineLength <= 1 ? clearLineLength : Math.pow(2, clearLineLength);

      if (clearLineLength > 0) this.emit('clearline', filledRowList);
    }
  }, {
    key: 'gameOverEffect',
    value: function gameOverEffect() {
      var _this9 = this;

      var dfd = _jqueryDeferred2.default.Deferred();
      dfd.resolve();

      var effect = function effect(x, y) {
        return function () {
          var d = _jqueryDeferred2.default.Deferred();
          _this9.board[y][x] = _constants.GAMEOVER_BLOCK.id + 1;
          _this9.emit('gameOverEffectTick');
          d.resolve();
          return d.promise();
        };
      };

      for (var y = 0; y < _constants.LOGICAL_ROWS; ++y) {
        for (var x = 0; x < _constants.COLS; ++x) {
          if (!this.board[y][x]) continue;
          // this.board[y][x] = BLOCK_IMAGE_LIST.length - 1;
          dfd = dfd.then(effect(x, y)).then(_Util2.default.sleep(10));
        }
      }
      this.emit('gameOverEffect');
      return dfd.then(_Util2.default.sleep(500)).promise();
    }
  }, {
    key: 'moveBlockLeft',
    value: function moveBlockLeft() {
      var isValid = this.validate(-1, 0);
      if (isValid) {
        --this.currentBlock.x;
      }
      return isValid;
    }
  }, {
    key: 'moveBlockRight',
    value: function moveBlockRight() {
      var isValid = this.validate(1, 0);
      if (isValid) {
        ++this.currentBlock.x;
      }
      return isValid;
    }
  }, {
    key: 'moveBlockDown',
    value: function moveBlockDown() {
      var isValid = this.validate(0, 1);
      if (isValid) {
        ++this.currentBlock.y;
      }
      return isValid;
    }
  }, {
    key: 'rotateBlock',
    value: function rotateBlock() {
      var rotatedBlock = Object.assign({}, this.currentBlock);
      rotatedBlock.shape = this.rotate(this.currentBlock.shape);
      var isValid = this.validate(0, 0, rotatedBlock);
      if (isValid) {
        this.currentBlock = rotatedBlock;
      }
      return isValid;
    }
  }, {
    key: 'rotate',
    value: function rotate() {
      var shape = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.currentBlock.shape;

      var newBlockShape = [];
      for (var y = 0; y < _constants.NUMBER_OF_BLOCK; ++y) {
        newBlockShape[y] = [];
        for (var x = 0; x < _constants.NUMBER_OF_BLOCK; ++x) {
          newBlockShape[y][x] = shape[_constants.NUMBER_OF_BLOCK - 1 - x][y];
        }
      }
      return newBlockShape;
    }
  }, {
    key: 'rotateBoard',
    value: function rotateBoard(sign) {
      var newBoard = [];
      for (var y = 0; y < _constants.ROWS; ++y) {
        newBoard[y] = [];
        for (var x = 0; x < _constants.COLS; ++x) {
          newBoard[y][x] = this.board[_constants.COLS - 1 - x + _constants.HIDDEN_ROWS][y];
        }
      }
      for (var i = 0; i < _constants.HIDDEN_ROWS; ++i) {
        newBoard.unshift(BLANK_ROW);
      }
      this.board = newBoard;
      return newBoard;
    }
  }, {
    key: 'validate',
    value: function validate() {
      var offsetX = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var offsetY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var block = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.currentBlock;

      var nextX = block.x + offsetX;
      var nextY = block.y + offsetY;

      for (var y = 0; y < _constants.NUMBER_OF_BLOCK; ++y) {
        for (var x = 0; x < _constants.NUMBER_OF_BLOCK; ++x) {
          if (!block.shape || !block.shape[y][x]) {
            continue;
          }
          var boardX = x + nextX;
          var boardY = y + nextY;
          var isOutsideLeftWall = boardX < 0;
          var isOutsideRightWall = boardX >= _constants.COLS;
          var isUnderBottom = boardY >= _constants.LOGICAL_ROWS;
          var isOutsideBoard = typeof this.board[boardY] === 'undefined' || typeof this.board[boardY][boardX] === 'undefined';
          var isExistsBlock = !isOutsideBoard && !!this.board[boardY][boardX];
          if (isOutsideLeftWall || isOutsideRightWall || isUnderBottom || isOutsideBoard || isExistsBlock) {
            return false;
          }
        }
      }
      return true;
    }
  }, {
    key: 'checkGameOver',
    value: function checkGameOver() {
      // ブロックの全てが画面外ならゲームオーバー
      var isGameOver = true;
      for (var y = 0; y < _constants.NUMBER_OF_BLOCK; ++y) {
        for (var x = 0; x < _constants.NUMBER_OF_BLOCK; ++x) {
          var boardX = x + this.currentBlock.x;
          var boardY = y + this.currentBlock.y;
          if (boardY >= _constants.HIDDEN_ROWS) {
            isGameOver = false;
            break;
          }
        }
      }
      return isGameOver;
    }

    // View ------------------------------

  }, {
    key: 'startRender',
    value: function startRender() {
      var _this10 = this;

      // TODO: change to requestAnimationFrame
      this.renderId = setInterval(function () {
        return _this10.render();
      }, _constants.RENDER_INTERVAL);
    }
  }, {
    key: 'stopRender',
    value: function stopRender() {
      clearInterval(this.renderId);
    }
  }, {
    key: 'render',
    value: function render() {
      this.ctx.clearRect(0, 0, _constants.WIDTH, _constants.HEIGHT);
      this.ctxNext.clearRect(0, 0, _constants.NEXT_WIDTH, _constants.NEXT_HEIGHT);

      // background
      this.ctx.fillStyle = _constants.BG_COLOR;
      this.ctx.fillRect(0, 0, _constants.WIDTH, _constants.HEIGHT);
      this.ctxNext.fillStyle = _constants.BG_COLOR;
      this.ctxNext.fillRect(0, 0, _constants.NEXT_WIDTH, _constants.NEXT_HEIGHT);

      this.renderBoard();
      this.renderCurrentBlock();
      this.renderNextBlock();
    }
  }, {
    key: 'renderBoard',
    value: function renderBoard() {
      // 盤面を描画する
      for (var x = 0; x < _constants.COLS; ++x) {
        for (var y = 0; y < _constants.ROWS; ++y) {
          var boardX = x;
          var boardY = y + _constants.HIDDEN_ROWS;
          var blockId = this.board[boardY][boardX] - 1;
          if (!this.board[boardY][boardX] || isNaN(blockId) || blockId < 0) continue;
          this.drawBlock(x, y, blockId);
        }
      }
    }
  }, {
    key: 'renderCurrentBlock',
    value: function renderCurrentBlock() {
      // 操作ブロックを描画する
      if (!this.currentBlock.shape || !this.currentBlock.shape.length) {
        return;
      }
      for (var y = 0; y < _constants.NUMBER_OF_BLOCK; ++y) {
        for (var x = 0; x < _constants.NUMBER_OF_BLOCK; ++x) {
          var blockId = this.currentBlock.id;
          if (!this.currentBlock.shape[y][x] || isNaN(blockId) || blockId < 0) continue;
          var drawX = x + this.currentBlock.x;
          var drawY = y + this.currentBlock.y - _constants.HIDDEN_ROWS;
          this.drawBlock(drawX, drawY, blockId);
        }
      }
    }
  }, {
    key: 'renderNextBlock',
    value: function renderNextBlock() {
      // Nextブロック描画
      if (!this.nextBlock.shape || !this.nextBlock.shape.length) {
        return;
      }
      for (var y = 0; y < _constants.NUMBER_OF_BLOCK; ++y) {
        for (var x = 0; x < _constants.NUMBER_OF_BLOCK; ++x) {
          var blockId = this.nextBlock.id;
          if (!this.nextBlock.shape[y][x] || isNaN(blockId) || blockId < 0) continue;
          this.drawNextBlock(x, y, blockId);
        }
      }
    }
  }, {
    key: 'drawBlock',
    value: function drawBlock(x, y, id) {
      if (!ALL_BLOCK_LIST[id]) {
        return;
      }
      var blockX = _constants.BLOCK_SIZE * x;
      var blockY = _constants.BLOCK_SIZE * y;
      var blockSize = _constants.BLOCK_SIZE;
      this.ctx.fillStyle = ALL_BLOCK_LIST[id].color;
      this.ctx.fillRect(blockX, blockY, blockSize, blockSize);
      this.ctx.strokeRect(blockX, blockY, blockSize, blockSize);
    }
  }, {
    key: 'drawNextBlock',
    value: function drawNextBlock(x, y, id) {
      if (!ALL_BLOCK_LIST[id]) {
        return;
      }
      var blockX = _constants.BLOCK_SIZE * x;
      var blockY = _constants.BLOCK_SIZE * y;
      var blockSize = _constants.BLOCK_SIZE;
      this.ctxNext.fillStyle = ALL_BLOCK_LIST[id].color;
      this.ctxNext.fillRect(blockX, blockY, blockSize, blockSize);
      this.ctxNext.strokeRect(blockX, blockY, blockSize, blockSize);
    }
  }]);

  return pentrix;
}(_events2.default);

exports.default = pentrix;

},{"./constants":8,"./modules/TouchController":9,"./modules/Util":10,"events":1,"jquery-deferred":2}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = [[[0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]], [[0, 0, 0, 0, 0], [0, 0, 1, 1, 0], [0, 0, 1, 0, 0], [0, 1, 1, 0, 0], [0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0], [0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 1, 0, 1, 0], [0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 1, 1, 0, 0], [0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0], [0, 0, 1, 0, 0], [1, 1, 1, 1, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]];

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BLOCK_LIST = exports.GAMEOVER_BLOCK = exports.CLEARLINE_BLOCK = exports.KEYS = exports.BG_COLOR = exports.START_Y = exports.START_X = exports.SPEEDUP_RATE = exports.DEFAULT_TICK_INTERVAL = exports.RENDER_INTERVAL = exports.NEXT_HEIGHT = exports.NEXT_WIDTH = exports.HEIGHT = exports.WIDTH = exports.LOGICAL_ROWS = exports.HIDDEN_ROWS = exports.NUMBER_OF_BLOCK = exports.BLOCK_SIZE = exports.ROWS = exports.COLS = undefined;

var _SHAPE_LIST_ = require('./SHAPE_LIST_5');

var _SHAPE_LIST_2 = _interopRequireDefault(_SHAPE_LIST_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var COLS = exports.COLS = 15;
var ROWS = exports.ROWS = 15;

var BLOCK_SIZE = exports.BLOCK_SIZE = 25;
var NUMBER_OF_BLOCK = exports.NUMBER_OF_BLOCK = 5;

var HIDDEN_ROWS = exports.HIDDEN_ROWS = NUMBER_OF_BLOCK;
var LOGICAL_ROWS = exports.LOGICAL_ROWS = ROWS + HIDDEN_ROWS;

var WIDTH = exports.WIDTH = BLOCK_SIZE * COLS;
var HEIGHT = exports.HEIGHT = BLOCK_SIZE * ROWS;
var NEXT_WIDTH = exports.NEXT_WIDTH = BLOCK_SIZE * NUMBER_OF_BLOCK;
var NEXT_HEIGHT = exports.NEXT_HEIGHT = BLOCK_SIZE * NUMBER_OF_BLOCK;

var RENDER_INTERVAL = exports.RENDER_INTERVAL = 30;
var DEFAULT_TICK_INTERVAL = exports.DEFAULT_TICK_INTERVAL = 500;
var SPEEDUP_RATE = exports.SPEEDUP_RATE = 10;

var START_X = exports.START_X = Math.floor((COLS - NUMBER_OF_BLOCK) / 2);
var START_Y = exports.START_Y = 0;

var BG_COLOR = exports.BG_COLOR = '#888';

var KEYS = exports.KEYS = {
  37: 'left', // ←
  39: 'right', // →
  40: 'down', // ↓
  38: 'rotate', // ↑
  32: 'rotate' // space
};

var CLEARLINE_BLOCK = exports.CLEARLINE_BLOCK = {
  id: 7,
  color: '#aaa'
};

var GAMEOVER_BLOCK = exports.GAMEOVER_BLOCK = {
  id: 8,
  color: '#777'
};

var BLOCK_LIST = exports.BLOCK_LIST = [{
  id: 0,
  color: '#FF6666',
  shape: _SHAPE_LIST_2.default[0]
}, {
  id: 1,
  color: '#FFCC66',
  shape: _SHAPE_LIST_2.default[1]
}, {
  id: 2,
  color: '#FFFF66',
  shape: _SHAPE_LIST_2.default[2]
}, {
  id: 3,
  color: '#CCFF66',
  shape: _SHAPE_LIST_2.default[3]
}, {
  id: 4,
  color: '#66FF66',
  shape: _SHAPE_LIST_2.default[4]
}, {
  id: 5,
  color: '#66FFCC',
  shape: _SHAPE_LIST_2.default[5]
}, {
  id: 6,
  color: '#66FFFF',
  shape: _SHAPE_LIST_2.default[6]
}];

},{"./SHAPE_LIST_5":7}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TouchController = function (_EventEmitter) {
  _inherits(TouchController, _EventEmitter);

  function TouchController() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, TouchController);

    var _this = _possibleConstructorReturn(this, (TouchController.__proto__ || Object.getPrototypeOf(TouchController)).call(this));

    _this.element = opts.element || document;
    _this.touchstartElement = opts.touchstartElement || _this.element;
    _this.touchmoveElement = opts.touchmoveElement || _this.element;
    _this.touchendElement = opts.touchendElement || _this.element;

    _this.doubleTapDelay = opts.doubleTapDelay || 500;
    _this.holdingDelay = opts.holdingDelay || 1000;
    _this.watchInterval = opts.watchInterval || 100;

    _this.touchSupport = 'ontouchstart' in window;
    _this.touchstart = _this.touchSupport ? 'touchstart' : 'mousedown';
    _this.touchmove = _this.touchSupport ? 'touchmove' : 'mousemove';
    _this.touchend = _this.touchSupport ? 'touchend' : 'mouseup';

    _this.deltaX = 0;
    _this.deltaY = 0;
    _this.moveX = 0;
    _this.moveY = 0;

    _this.defineEventListener();
    _this.setEvent();
    return _this;
  }

  _createClass(TouchController, [{
    key: 'setEvent',
    value: function setEvent() {
      this.touchstartElement.addEventListener(this.touchstart, this.onTouchStart, false);
      this.touchmoveElement.addEventListener(this.touchmove, this.onTouchMove, false);
      this.touchendElement.addEventListener(this.touchend, this.onTouchEnd, false);
      // document.addEventListener(touchstart, function(){ return false; }, false); // disableDocumentTouch
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.touchstartElement.removeEventListener(this.touchstart, this.onTouchStart, false);
      this.touchmoveElement.removeEventListener(this.touchmove, this.onTouchMove, false);
      this.touchendElement.removeEventListener(this.touchend, this.onTouchEnd, false);
    }
  }, {
    key: 'defineEventListener',
    value: function defineEventListener() {
      var _this2 = this;

      var watchTimer = void 0;
      var delayTimer = void 0;

      var clearWatcher = function clearWatcher() {
        clearInterval(watchTimer);
        clearTimeout(delayTimer);
      };

      var setWatcher = function setWatcher() {
        clearWatcher();
        delayTimer = setTimeout(function () {
          watchTimer = setInterval(function () {
            _this2.emit('touchholding', _this2);
          }, _this2.watchInterval);
        }, _this2.holdingDelay);
      };

      this.onTouchStart = function (evt) {
        evt.preventDefault(); // enablePreventDefault
        evt.stopPropagation(); // enableStopPropagation

        _this2.isDoubleTap = _this2.isTap;
        _this2.isDragging = true;
        _this2.isTap = true;
        _this2.touchStartTime = Date.now();

        _this2.touchStartX = _this2.touchSupport ? evt.touches[0].pageX : evt.pageX;
        _this2.touchStartY = _this2.touchSupport ? evt.touches[0].pageY : evt.pageY;

        setWatcher();

        _this2.emit('touchstart', {
          'touchStartTime': _this2.touchStartTime,
          'touchStartX': _this2.touchStartX,
          'touchStartY': _this2.touchStartY
        });

        //return false; // enableReturnFalse
      };

      this.onTouchMove = function (evt) {
        if (!_this2.isDragging) return;

        clearWatcher();

        _this2.lasttouchX = _this2.touchX || _this2.touchStartX;
        _this2.lasttouchY = _this2.touchY || _this2.touchStartY;

        _this2.touchX = _this2.touchSupport ? evt.touches[0].pageX : evt.pageX;
        _this2.touchY = _this2.touchSupport ? evt.touches[0].pageY : evt.pageY;
        _this2.deltaX = _this2.touchX - _this2.lasttouchX;
        _this2.deltaY = _this2.touchY - _this2.lasttouchY;
        _this2.moveX = _this2.touchX - _this2.touchStartX;
        _this2.moveY = _this2.touchY - _this2.touchStartY;

        _this2.isTap = _this2.isDoubleTap = false;

        setWatcher();

        _this2.emit('touchmove', {
          'lasttouchX': _this2.lasttouchX,
          'lasttouchY': _this2.lasttouchY,
          'touchX': _this2.touchX,
          'touchY': _this2.touchY,
          'deltaX': _this2.deltaX,
          'deltaY': _this2.deltaY,
          'moveX': _this2.moveX,
          'moveY': _this2.moveY
        });

        // clearTimeout(movingtimer);
        // movingtimer = setTimeout(function(){ this.isDragging = false; },1000);
      };

      this.onTouchEnd = function (evt) {
        _this2.isDragging = false;

        clearWatcher();

        _this2.elapsedTime = Date.now() - _this2.touchStartTime;
        _this2.touchEndX = _this2.touchX;
        _this2.touchEndY = _this2.touchY;

        _this2.emit('touchend', {
          'elapsedTime': _this2.elapsedTime,
          'touchEndX': _this2.touchEndX,
          'touchEndY': _this2.touchEndY,
          'moveX': _this2.moveX,
          'moveY': _this2.moveY,
          'isTap': _this2.isTap,
          'isDoubleTap': _this2.isDoubleTap
        });

        _this2.touchX = _this2.touchY = null;
        _this2.moveX = _this2.moveY = 0;
        setTimeout(function () {
          _this2.isTap = _this2.isDoubleTap = false;
        }, _this2.doubleTapDelay);
      };
    }
  }]);

  return TouchController;
}(_events2.default);

exports.default = TouchController;

},{"events":1}],10:[function(require,module,exports){
"use strict";

var _jqueryDeferred = require("jquery-deferred");

var _jqueryDeferred2 = _interopRequireDefault(_jqueryDeferred);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// prefix: 
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (callback) {
  var id = window.setTimeout(callback, 1000 / 60);return id;
};
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || window.oCancelAnimationFrame || function (id) {
  window.clearTimeout(id);
};

var Util = {
  TRANSITIONEND: "transitionend webkitTransitionEnd mozTransitionEnd msTransitionEnd oTransitionEnd",
  ANIMATIONEND: "animationend webkitAnimationEnd mozAnimationEnd msAnimationEnd oAnimationEnd",
  getRandomInt: function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  throttle: function throttle(fn, interval) {
    var isWaiting = false;
    var exec = function exec(event) {
      if (isWaiting) return;
      isWaiting = true;
      setTimeout(function () {
        isWaiting = false;
        fn(event);
      }, interval);
    };
    return exec;
  },
  debounce: function debounce(fn, interval) {
    var timer;
    var exec = function exec(event) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn(event);
      }, interval);
    };
    return exec;
  },
  async: function async(fnList) {
    // fnList ... 第一引数にcallbackを取る関数の配列
    (function exec(index) {
      if (!fnList[index]) return;
      fnList[index](function () {
        exec(index + 1);
      });
    })(0);
  },
  delay: function delay(time) {
    // asyncで使う用
    return function (callback) {
      setTimeout(callback, time);
    };
  },
  sleep: function sleep(time) {
    // Deferred
    return function () {
      var dfd = _jqueryDeferred2.default.Deferred();
      setTimeout(function () {
        dfd.resolve();
      }, time);
      return dfd.promise();
    };
  },
  zeroPadding: function zeroPadding(num, len) {
    return (new Array(len).join("0") + num).slice(-len);
  },
  getQueryString: function getQueryString() {
    var result = {};
    var search = window.location.search;
    if (search.length > 1) {
      var query = search.substring(1);
      var parameters = query.split("&");
      for (var i = 0; i < parameters.length; i++) {
        var element = parameters[i].split("=");
        var paramName = decodeURIComponent(element[0]);
        var paramValue = decodeURIComponent(element[1]);
        result[paramName] = paramValue;
      }
    }
    return result;
  },
  getUserAgent: function getUserAgent() {
    Util.ua = {};
    Util.ua.name = window.navigator.userAgent.toLowerCase();
    Util.ua.isSP = /ipod|iphone|ipad|android/i.test(Util.ua.name);
    Util.ua.isPC = !Util.ua.isSP;
    Util.ua.isIOS = /ipod|iphone|ipad/i.test(Util.ua.name);
    Util.ua.isAndroid = /android/.test(Util.ua.name);
    Util.ua.isIE = /msie|trident/i.test(Util.ua.name);
    Util.ua.isIE8 = /msie 8/.test(Util.ua.name);
    Util.ua.isIE9 = /msie 9/.test(Util.ua.name);
    Util.ua.isIE10 = /msie 10/.test(Util.ua.name);
    Util.ua.isMac = /macintosh/.test(Util.ua.name);
    Util.ua.isChrome = /chrome/.test(Util.ua.name);
    Util.ua.isFirefox = /firefox/.test(Util.ua.name);
    Util.ua.isSafari = /safari/.test(Util.ua.name);
    Util.ua.isMacSafari = Util.ua.isSafari && Util.ua.isMac && !Util.ua.isChrome; // chromeのuaにもsafariの文字列がある
    if (Util.ua.isSP) document.body.className += " isSP";
    if (Util.ua.isPC) document.body.className += " isPC";
    return Util.ua;
  }
};

module.exports = Util;

},{"jquery-deferred":2}]},{},[6]);
