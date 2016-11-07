!function e(t,n,r){function i(s,a){if(!n[s]){if(!t[s]){var u="function"==typeof require&&require;if(!a&&u)return u(s,!0);if(o)return o(s,!0);var c=new Error("Cannot find module '"+s+"'");throw c.code="MODULE_NOT_FOUND",c}var h=n[s]={exports:{}};t[s][0].call(h.exports,function(e){var n=t[s][1][e];return i(n?n:e)},h,h.exports,e,t,n,r)}return n[s].exports}for(var o="function"==typeof require&&require,s=0;s<r.length;s++)i(r[s]);return i}({1:[function(e,t,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var r=n.COLS=20,i=n.ROWS=20,o=n.BLOCK_SIZE=20,s=n.NUMBER_OF_BLOCK=5,a=n.HIDDEN_ROWS=s;n.LOGICAL_ROWS=i+a,n.WIDTH=o*r,n.HEIGHT=o*i,n.NEXT_WIDTH=o*s,n.NEXT_HEIGHT=o*s,n.RENDER_INTERVAL=30,n.DEFAULT_TICK_INTERVAL=500,n.SPEEDUP_RATE=10,n.START_X=Math.floor((r-s)/2),n.START_Y=0,n.BG_COLOR="#888",n.DEFAULT_DROP_DIRECTION="down",n.KEYS={37:"left",39:"right",40:"down",38:"rotate",32:"rotate"},n.CLEARLINE_BLOCK={id:7,color:"#aaa"},n.GAMEOVER_BLOCK={id:8,color:"#777"},n.BLOCK_LIST=[{id:0,color:"#FF6666",shape:[[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]]},{id:1,color:"#FFCC66",shape:[[0,0,0,0,0],[0,0,1,1,0],[0,0,1,0,0],[0,1,1,0,0],[0,0,0,0,0]]},{id:2,color:"#FFFF66",shape:[[0,0,0,0,0],[0,0,1,0,0],[0,1,1,1,0],[0,0,1,0,0],[0,0,0,0,0]]},{id:3,color:"#CCFF66",shape:[[0,0,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0],[0,0,0,0,0]]},{id:4,color:"#66FF66",shape:[[0,0,0,0,0],[0,0,0,0,0],[0,1,1,1,0],[0,1,0,1,0],[0,0,0,0,0]]},{id:5,color:"#66FFCC",shape:[[0,0,0,0,0],[0,0,0,0,0],[0,1,1,1,0],[0,1,1,0,0],[0,0,0,0,0]]},{id:6,color:"#66FFFF",shape:[[0,0,0,0,0],[0,0,1,0,0],[1,1,1,1,0],[0,0,0,0,0],[0,0,0,0,0]]}]},{}],2:[function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var i=e("./modules/Pentrix"),o=r(i),s=new o.default;document.querySelector(".container");s.on("gamequit",function(){s.newGame()}),s.newGame()},{"./modules/Pentrix":3}],3:[function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function s(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(n,"__esModule",{value:!0});var a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u=e("jquery-deferred"),c=r(u),h=e("events"),l=r(h),f=e("./Util"),v=r(f),d=e("./TouchController"),m=r(d),p=e("../constants"),y=p.BLOCK_LIST.concat([p.CLEARLINE_BLOCK,p.GAMEOVER_BLOCK]),_=function(e){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};i(this,t);var n=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return n.cnvs=document.getElementById("game-canvas"),n.ctx=n.cnvs.getContext("2d"),n.cnvsNext=document.getElementById("next-canvas"),n.ctxNext=n.cnvsNext.getContext("2d"),n.initCanvasSize(),e.disableFocusControls||n.setBlurEvent(),e.disableKey||n.setKeyEvent(),e.disableTouch||n.setTouchEvent(),n.renderId=setInterval(function(){return n.render()},p.RENDER_INTERVAL),n}return s(t,e),a(t,[{key:"initCanvasSize",value:function(){this.cnvs.style.width=p.WIDTH+"px",this.cnvs.style.height=p.HEIGHT+"px",this.cnvs.width=2*p.WIDTH,this.cnvs.height=2*p.HEIGHT,this.ctx.scale(2,2),this.ctx.strokeStyle=p.BG_COLOR,this.cnvsNext.style.width=p.NEXT_WIDTH+"px",this.cnvsNext.style.height=p.NEXT_HEIGHT+"px",this.cnvsNext.width=2*p.NEXT_WIDTH,this.cnvsNext.height=2*p.NEXT_HEIGHT,this.ctxNext.scale(2,2),this.ctxNext.strokeStyle=p.BG_COLOR}},{key:"rotateWorld",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1;this.worldDirection+=e,this.cnvs.style.transform="rotate("+90*this.worldDirection+"deg)"}},{key:"setBlurEvent",value:function(){var e=this;window.addEventListener("blur",function(){e.pauseGame()},!1),window.addEventListener("focus",function(){e.resumeGame()},!1)}},{key:"setKeyEvent",value:function(){var e=this;document.addEventListener("keydown",function(t){"undefined"!=typeof p.KEYS[t.keyCode]&&(t.preventDefault(),e.moveBlock(p.KEYS[t.keyCode]))},!1)}},{key:"setTouchEvent",value:function(){var e=this,t=new m.default({element:this.cnvs}),n=void 0,r=void 0,i=!1,o=!1;t.on("touchstart",function(e){n=e.touchStartX,r=e.touchStartY,i=!0,o=!1}),t.on("touchmove",function(t){var s=t.touchX-n,a=t.touchY-r,u=s/p.BLOCK_SIZE|0,c=a/p.BLOCK_SIZE|0;if(!o){for(;u;){var h=u/Math.abs(u);if(!e.valid(h,0))break;e.currentBlock.x+=h,u-=h,n=t.touchX}for(;c>0&&e.valid(0,1);)e.currentBlock.y++,c--,r=t.touchY;i=!1}}),t.on("touchend",function(t){i&&e.moveBlock("rotate")}),this.on("freeze",function(){o=!0})}},{key:"newGame",value:function(){this.initGame(),this.startGame()}},{key:"initGame",value:function(){clearTimeout(this.tickId),clearInterval(this.renderId),this.isPlayng=!1,this.lose=!1,this.tickInterval=p.DEFAULT_TICK_INTERVAL,this.dropDirection=p.DEFAULT_DROP_DIRECTION,this.worldDirection=0,this.sumOfClearLines=0,this.score=0,this.frameCount=0,this.initBoard(),this.initBlock(),this.createNextBlock(),this.render()}},{key:"startGame",value:function(){var e=this;this.isPlayng=!0,this.createCurrentBlock(),this.createNextBlock(),this.renderId=setInterval(function(){return e.render()},p.RENDER_INTERVAL),this.emit("gamestart"),this.tick()}},{key:"initBoard",value:function(){this.board=[];for(var e=0;e<p.LOGICAL_ROWS;++e){this.board[e]=[];for(var t=0;t<p.COLS;++t)this.board[e][t]=0}}},{key:"initBlock",value:function(){this.nextBlock=this.createBlock(0),this.currentBlock=this.createBlock(0),this.currentBlock.x=p.START_X,this.currentBlock.y=p.START_Y}},{key:"createBlock",value:function(){for(var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,t=p.BLOCK_LIST[e]||{},n=t.shape,r=Object.assign({},p.BLOCK_LIST[e],{shape:[],x:0,y:0}),i=0;i<p.NUMBER_OF_BLOCK;++i){r.shape[i]=[];for(var o=0;o<p.NUMBER_OF_BLOCK;++o)r.shape[i][o]=n[i][o]||0}return this.emit("newblockcreated"),r}},{key:"createCurrentBlock",value:function(){this.nextBlock||this.createNextBlock(),this.currentBlock=this.nextBlock,this.currentBlock.x=p.START_X,this.currentBlock.y=p.START_Y,this.emit("currentblockcreated")}},{key:"createNextBlock",value:function(){var e=Math.floor(Math.random()*p.BLOCK_LIST.length);this.nextBlock=this.createBlock(e),this.emit("nextblockcreated")}},{key:"tick",value:function(){var e=this;if(clearTimeout(this.tickId),!this.moveBlock(this.dropDirection)){if(this.freeze(),this.clearLines(),this.checkGameOver())return this.emit("gameover"),this.quitGame().then(function(){}),!1;this.frameCount++,this.createCurrentBlock(),this.createNextBlock()}this.tickId=setTimeout(function(){return e.tick()},this.tickInterval),this.emit("tick")}},{key:"quitGame",value:function(){var e=this,t=c.default.Deferred();return this.gameOverEffect().then(function(){e.isPlayng=!1,e.emit("gamequit"),t.resolve()}),t.promise()}},{key:"pauseGame",value:function(){clearTimeout(this.tickId)}},{key:"resumeGame",value:function(){var e=this;this.isPlayng&&(this.tickId=setTimeout(function(){return e.tick()},this.tickInterval))}},{key:"freeze",value:function(){for(var e=0;e<p.NUMBER_OF_BLOCK;++e)for(var t=0;t<p.NUMBER_OF_BLOCK;++t){var n=t+this.currentBlock.x,r=e+this.currentBlock.y;!this.currentBlock.shape[e][t]||r<0||(this.board[r][n]=this.currentBlock.shape[e][t]?this.currentBlock.id+1:0)}this.emit("freeze")}},{key:"clearLines",value:function(){var e=this,t=Array.apply(null,Array(p.COLS)).map(function(){return 0}),n=0,r=[],i=c.default.Deferred();i.resolve();for(var o=function(t,n){return function(){var r=c.default.Deferred();return e.board[n][t]=p.CLEARLINE_BLOCK.id+1,r.resolve(),r.promise()}},s=function(){return function(){var n=c.default.Deferred();if(r.length)return r.reverse().forEach(function(n){e.board.splice(n,1),e.board.unshift(t)}),n.resolve(),n.promise()}},a=p.LOGICAL_ROWS-1;a>=0;--a){var u=this.board[a].every(function(e){return 0!==e});if(u){r.push(a),n++,this.sumOfClearLines++,this.tickInterval-=p.SPEEDUP_RATE;for(var h=0;h<p.COLS;++h)this.board[a][h]&&(i=i.then(o(h,a)).then(v.default.sleep(10)))}}i.then(s()),this.score+=n<=1?n:Math.pow(2,n),n>0&&this.emit("clearline",r)}},{key:"gameOverEffect",value:function(){var e=this,t=c.default.Deferred();t.resolve();for(var n=function(t,n){return function(){var r=c.default.Deferred();return e.board[n][t]=p.GAMEOVER_BLOCK.id+1,e.emit("gameOverEffectTick"),r.resolve(),r.promise()}},r=0;r<p.LOGICAL_ROWS;++r)for(var i=0;i<p.COLS;++i)this.board[r][i]&&(t=t.then(n(i,r)).then(v.default.sleep(10)));return this.emit("gameOverEffect"),t.then(v.default.sleep(500)).promise()}},{key:"moveBlock",value:function(e){switch(e){case"left":return!!this.valid(-1,0)&&(--this.currentBlock.x,!0);case"right":return!!this.valid(1,0)&&(++this.currentBlock.x,!0);case"down":return!!this.valid(0,1)&&(++this.currentBlock.y,!0);case"rotate":var t=Object.assign({},this.currentBlock);return t.shape=this.rotate(this.currentBlock.shape),!!this.valid(0,0,t)&&(this.currentBlock=t,!0)}}},{key:"rotate",value:function(){for(var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.currentBlock.shape,t=[],n=0;n<p.NUMBER_OF_BLOCK;++n){t[n]=[];for(var r=0;r<p.NUMBER_OF_BLOCK;++r)t[n][r]=e[p.NUMBER_OF_BLOCK-1-r][n]}return t}},{key:"rotateBoard",value:function(e){for(var t=Array.apply(null,Array(p.COLS)).map(function(){return 0}),n=[],r=0;r<p.ROWS;++r){n[r]=[];for(var i=0;i<p.COLS;++i)n[r][i]=this.board[p.COLS-1-i+p.HIDDEN_ROWS][r]}for(var o=0;o<p.HIDDEN_ROWS;++o)n.unshift(t);return this.board=n,n}},{key:"valid",value:function(){for(var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.currentBlock,r=this.currentBlock.x+e,i=this.currentBlock.y+t,o=0;o<p.NUMBER_OF_BLOCK;++o)for(var s=0;s<p.NUMBER_OF_BLOCK;++s){var a=s+r,u=o+i;if(n.shape&&n.shape[o][s]&&("undefined"==typeof this.board[u]||"undefined"==typeof this.board[u][a]||this.board[u][a]||a<0||a>=p.COLS||u>=p.LOGICAL_ROWS))return!1}return!0}},{key:"checkGameOver",value:function(){for(var e=!0,t=0;t<p.NUMBER_OF_BLOCK;++t)for(var n=0;n<p.NUMBER_OF_BLOCK;++n){var r=(n+this.currentBlock.x,t+this.currentBlock.y);if(r>=p.HIDDEN_ROWS){e=!1;break}}return e}},{key:"render",value:function(){this.ctx.clearRect(0,0,p.WIDTH,p.HEIGHT),this.ctx.fillStyle=p.BG_COLOR,this.ctx.fillRect(0,0,p.WIDTH,p.HEIGHT),this.renderBoard(),this.renderCurrentBlock(),this.renderNextBlock()}},{key:"renderBoard",value:function(){for(var e=0;e<p.COLS;++e)for(var t=0;t<p.ROWS;++t){var n=e,r=t+p.HIDDEN_ROWS,i=this.board[r][n]-1;!this.board[r][n]||isNaN(i)||i<0||this.drawBlock(e,t,i)}}},{key:"renderCurrentBlock",value:function(){if(this.currentBlock.shape&&this.currentBlock.shape.length)for(var e=0;e<p.NUMBER_OF_BLOCK;++e)for(var t=0;t<p.NUMBER_OF_BLOCK;++t){var n=this.currentBlock.id;if(!(!this.currentBlock.shape[e][t]||isNaN(n)||n<0)){var r=t+this.currentBlock.x,i=e+this.currentBlock.y-p.HIDDEN_ROWS;this.drawBlock(r,i,n)}}}},{key:"renderNextBlock",value:function(){if(this.ctxNext.clearRect(0,0,p.NEXT_WIDTH,p.NEXT_HEIGHT),this.nextBlock.shape&&this.nextBlock.shape.length)for(var e=0;e<p.NUMBER_OF_BLOCK;++e)for(var t=0;t<p.NUMBER_OF_BLOCK;++t){var n=this.nextBlock.id;!this.nextBlock.shape[e][t]||isNaN(n)||n<0||this.drawNextBlock(t,e,n)}}},{key:"drawBlock",value:function(e,t,n){if(y[n]){var r=p.BLOCK_SIZE*e,i=p.BLOCK_SIZE*t,o=p.BLOCK_SIZE;this.ctx.fillStyle=y[n].color,this.ctx.fillRect(r,i,o,o),this.ctx.strokeRect(r,i,o,o)}}},{key:"drawNextBlock",value:function(e,t,n){if(y[n]){var r=p.BLOCK_SIZE*e,i=p.BLOCK_SIZE*t,o=p.BLOCK_SIZE;this.ctxNext.fillStyle=y[n].color,this.ctxNext.fillRect(r,i,o,o),this.ctxNext.strokeRect(r,i,o,o)}}}]),t}(l.default);n.default=_},{"../constants":1,"./TouchController":4,"./Util":5,events:6,"jquery-deferred":7}],4:[function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function s(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(n,"__esModule",{value:!0});var a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u=e("events"),c=r(u),h=function(e){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};i(this,t);var n=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return n.element=e.element||document,n.touchstartElement=e.touchstartElement||n.element,n.touchmoveElement=e.touchmoveElement||n.element,n.touchendElement=e.touchendElement||n.element,n.doubleTapDelay=e.doubleTapDelay||500,n.holdingDelay=e.holdingDelay||1e3,n.watchInterval=e.watchInterval||100,n.touchSupport="ontouchstart"in window,n.touchstart=n.touchSupport?"touchstart":"mousedown",n.touchmove=n.touchSupport?"touchmove":"mousemove",n.touchend=n.touchSupport?"touchend":"mouseup",n.deltaX=0,n.deltaY=0,n.moveX=0,n.moveY=0,n.defineEventListener(),n.setEvent(),n}return s(t,e),a(t,[{key:"setEvent",value:function(){this.touchstartElement.addEventListener(this.touchstart,this.onTouchStart,!1),this.touchmoveElement.addEventListener(this.touchmove,this.onTouchMove,!1),this.touchendElement.addEventListener(this.touchend,this.onTouchEnd,!1)}},{key:"dispose",value:function(){this.touchstartElement.removeEventListener(this.touchstart,this.onTouchStart,!1),this.touchmoveElement.removeEventListener(this.touchmove,this.onTouchMove,!1),this.touchendElement.removeEventListener(this.touchend,this.onTouchEnd,!1)}},{key:"defineEventListener",value:function(){var e=this,t=void 0,n=void 0,r=function(){clearInterval(t),clearTimeout(n)},i=function(){r(),n=setTimeout(function(){t=setInterval(function(){e.emit("touchholding",e)},e.watchInterval)},e.holdingDelay)};this.onTouchStart=function(t){t.preventDefault(),t.stopPropagation(),e.isDoubleTap=e.isTap,e.isDragging=!0,e.isTap=!0,e.touchStartTime=Date.now(),e.touchStartX=e.touchSupport?t.touches[0].pageX:t.pageX,e.touchStartY=e.touchSupport?t.touches[0].pageY:t.pageY,i(),e.emit("touchstart",{touchStartTime:e.touchStartTime,touchStartX:e.touchStartX,touchStartY:e.touchStartY})},this.onTouchMove=function(t){e.isDragging&&(r(),e.lasttouchX=e.touchX||e.touchStartX,e.lasttouchY=e.touchY||e.touchStartY,e.touchX=e.touchSupport?t.touches[0].pageX:t.pageX,e.touchY=e.touchSupport?t.touches[0].pageY:t.pageY,e.deltaX=e.touchX-e.lasttouchX,e.deltaY=e.touchY-e.lasttouchY,e.moveX=e.touchX-e.touchStartX,e.moveY=e.touchY-e.touchStartY,e.isTap=e.isDoubleTap=!1,i(),e.emit("touchmove",{lasttouchX:e.lasttouchX,lasttouchY:e.lasttouchY,touchX:e.touchX,touchY:e.touchY,deltaX:e.deltaX,deltaY:e.deltaY,moveX:e.moveX,moveY:e.moveY}))},this.onTouchEnd=function(t){e.isDragging=!1,r(),e.elapsedTime=Date.now()-e.touchStartTime,e.touchEndX=e.touchX,e.touchEndY=e.touchY,e.emit("touchend",{elapsedTime:e.elapsedTime,touchEndX:e.touchEndX,touchEndY:e.touchEndY,moveX:e.moveX,moveY:e.moveY,isTap:e.isTap,isDoubleTap:e.isDoubleTap}),e.touchX=e.touchY=null,e.moveX=e.moveY=0,setTimeout(function(){e.isTap=e.isDoubleTap=!1},e.doubleTapDelay)}}}]),t}(c.default);n.default=h},{events:6}],5:[function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var i=e("jquery-deferred"),o=r(i);window.requestAnimationFrame=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||window.oRequestAnimationFrame||function(e){var t=window.setTimeout(e,1e3/60);return t},window.cancelAnimationFrame=window.cancelAnimationFrame||window.mozCancelAnimationFrame||window.webkitCancelAnimationFrame||window.msCancelAnimationFrame||window.oCancelAnimationFrame||function(e){window.clearTimeout(e)};var s={TRANSITIONEND:"transitionend webkitTransitionEnd mozTransitionEnd msTransitionEnd oTransitionEnd",ANIMATIONEND:"animationend webkitAnimationEnd mozAnimationEnd msAnimationEnd oAnimationEnd",getRandomInt:function(e,t){return Math.floor(Math.random()*(t-e+1))+e},throttle:function(e,t){var n=!1,r=function(r){n||(n=!0,setTimeout(function(){n=!1,e(r)},t))};return r},debounce:function(e,t){var n,r=function(r){clearTimeout(n),n=setTimeout(function(){e(r)},t)};return r},async:function(e){!function t(n){e[n]&&e[n](function(){t(n+1)})}(0)},delay:function(e){return function(t){setTimeout(t,e)}},sleep:function(e){return function(){var t=o.default.Deferred();return setTimeout(function(){t.resolve()},e),t.promise()}},zeroPadding:function(e,t){return(new Array(t).join("0")+e).slice(-t)},getQueryString:function(){var e={},t=window.location.search;if(t.length>1)for(var n=t.substring(1),r=n.split("&"),i=0;i<r.length;i++){var o=r[i].split("="),s=decodeURIComponent(o[0]),a=decodeURIComponent(o[1]);e[s]=a}return e},getUserAgent:function(){return s.ua={},s.ua.name=window.navigator.userAgent.toLowerCase(),s.ua.isSP=/ipod|iphone|ipad|android/i.test(s.ua.name),s.ua.isPC=!s.ua.isSP,s.ua.isIOS=/ipod|iphone|ipad/i.test(s.ua.name),s.ua.isAndroid=/android/.test(s.ua.name),s.ua.isIE=/msie|trident/i.test(s.ua.name),s.ua.isIE8=/msie 8/.test(s.ua.name),s.ua.isIE9=/msie 9/.test(s.ua.name),s.ua.isIE10=/msie 10/.test(s.ua.name),s.ua.isMac=/macintosh/.test(s.ua.name),s.ua.isChrome=/chrome/.test(s.ua.name),s.ua.isFirefox=/firefox/.test(s.ua.name),s.ua.isSafari=/safari/.test(s.ua.name),s.ua.isMacSafari=s.ua.isSafari&&s.ua.isMac&&!s.ua.isChrome,s.ua.isSP&&(document.body.className+=" isSP"),s.ua.isPC&&(document.body.className+=" isPC"),s.ua}};t.exports=s},{"jquery-deferred":7}],6:[function(e,t,n){function r(){this._events=this._events||{},this._maxListeners=this._maxListeners||void 0}function i(e){return"function"==typeof e}function o(e){return"number"==typeof e}function s(e){return"object"==typeof e&&null!==e}function a(e){return void 0===e}t.exports=r,r.EventEmitter=r,r.prototype._events=void 0,r.prototype._maxListeners=void 0,r.defaultMaxListeners=10,r.prototype.setMaxListeners=function(e){if(!o(e)||e<0||isNaN(e))throw TypeError("n must be a positive number");return this._maxListeners=e,this},r.prototype.emit=function(e){var t,n,r,o,u,c;if(this._events||(this._events={}),"error"===e&&(!this._events.error||s(this._events.error)&&!this._events.error.length)){if(t=arguments[1],t instanceof Error)throw t;var h=new Error('Uncaught, unspecified "error" event. ('+t+")");throw h.context=t,h}if(n=this._events[e],a(n))return!1;if(i(n))switch(arguments.length){case 1:n.call(this);break;case 2:n.call(this,arguments[1]);break;case 3:n.call(this,arguments[1],arguments[2]);break;default:o=Array.prototype.slice.call(arguments,1),n.apply(this,o)}else if(s(n))for(o=Array.prototype.slice.call(arguments,1),c=n.slice(),r=c.length,u=0;u<r;u++)c[u].apply(this,o);return!0},r.prototype.addListener=function(e,t){var n;if(!i(t))throw TypeError("listener must be a function");return this._events||(this._events={}),this._events.newListener&&this.emit("newListener",e,i(t.listener)?t.listener:t),this._events[e]?s(this._events[e])?this._events[e].push(t):this._events[e]=[this._events[e],t]:this._events[e]=t,s(this._events[e])&&!this._events[e].warned&&(n=a(this._maxListeners)?r.defaultMaxListeners:this._maxListeners,n&&n>0&&this._events[e].length>n&&(this._events[e].warned=!0,console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",this._events[e].length),"function"==typeof console.trace&&console.trace())),this},r.prototype.on=r.prototype.addListener,r.prototype.once=function(e,t){function n(){this.removeListener(e,n),r||(r=!0,t.apply(this,arguments))}if(!i(t))throw TypeError("listener must be a function");var r=!1;return n.listener=t,this.on(e,n),this},r.prototype.removeListener=function(e,t){var n,r,o,a;if(!i(t))throw TypeError("listener must be a function");if(!this._events||!this._events[e])return this;if(n=this._events[e],o=n.length,r=-1,n===t||i(n.listener)&&n.listener===t)delete this._events[e],this._events.removeListener&&this.emit("removeListener",e,t);else if(s(n)){for(a=o;a-- >0;)if(n[a]===t||n[a].listener&&n[a].listener===t){r=a;break}if(r<0)return this;1===n.length?(n.length=0,delete this._events[e]):n.splice(r,1),this._events.removeListener&&this.emit("removeListener",e,t)}return this},r.prototype.removeAllListeners=function(e){var t,n;if(!this._events)return this;if(!this._events.removeListener)return 0===arguments.length?this._events={}:this._events[e]&&delete this._events[e],this;if(0===arguments.length){for(t in this._events)"removeListener"!==t&&this.removeAllListeners(t);return this.removeAllListeners("removeListener"),this._events={},this}if(n=this._events[e],i(n))this.removeListener(e,n);else if(n)for(;n.length;)this.removeListener(e,n[n.length-1]);return delete this._events[e],this},r.prototype.listeners=function(e){var t;return t=this._events&&this._events[e]?i(this._events[e])?[this._events[e]]:this._events[e].slice():[]},r.prototype.listenerCount=function(e){if(this._events){var t=this._events[e];if(i(t))return 1;if(t)return t.length}return 0},r.listenerCount=function(e,t){return e.listenerCount(t)}},{}],7:[function(e,t,n){t.exports=e("./lib/jquery-deferred")},{"./lib/jquery-deferred":10}],8:[function(e,t,n){function r(e){var t=s[e]={};return i.each(e.split(o),function(e,n){t[n]=!0}),t}var i=t.exports=e("./jquery-core.js"),o=/\s+/,s={};i.Callbacks=function(e){e="string"==typeof e?s[e]||r(e):i.extend({},e);var t,n,o,a,u,c,h=[],l=!e.once&&[],f=function(r){for(t=e.memory&&r,n=!0,c=a||0,a=0,u=h.length,o=!0;h&&c<u;c++)if(h[c].apply(r[0],r[1])===!1&&e.stopOnFalse){t=!1;break}o=!1,h&&(l?l.length&&f(l.shift()):t?h=[]:v.disable())},v={add:function(){if(h){var n=h.length;!function t(n){i.each(n,function(n,r){var o=i.type(r);"function"===o?e.unique&&v.has(r)||h.push(r):r&&r.length&&"string"!==o&&t(r)})}(arguments),o?u=h.length:t&&(a=n,f(t))}return this},remove:function(){return h&&i.each(arguments,function(e,t){for(var n;(n=i.inArray(t,h,n))>-1;)h.splice(n,1),o&&(n<=u&&u--,n<=c&&c--)}),this},has:function(e){return i.inArray(e,h)>-1},empty:function(){return h=[],this},disable:function(){return h=l=t=void 0,this},disabled:function(){return!h},lock:function(){return l=void 0,t||v.disable(),this},locked:function(){return!l},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],!h||n&&!l||(o?l.push(t):f(t)),this},fire:function(){return v.fireWith(this,arguments),this},fired:function(){return!!n}};return v}},{"./jquery-core.js":9}],9:[function(e,t,n){function r(e){return null==e?String(e):l[h.call(e)]||"object"}function i(e){return"function"===c.type(e)}function o(e){return"array"===c.type(e)}function s(e,t,n){var r,o=0,s=e.length,a=void 0===s||i(e);if(n)if(a){for(r in e)if(t.apply(e[r],n)===!1)break}else for(;o<s&&t.apply(e[o++],n)!==!1;);else if(a){for(r in e)if(t.call(e[r],r,e[r])===!1)break}else for(;o<s&&t.call(e[o],o,e[o++])!==!1;);return e}function a(e){return!(!e||"object"!==c.type(e))}function u(){var e,t,n,r,i,o,s=arguments[0]||{},a=1,u=arguments.length,h=!1;for("boolean"==typeof s&&(h=s,s=arguments[1]||{},a=2),"object"==typeof s||c.isFunction(s)||(s={}),u===a&&(s=this,--a);a<u;a++)if(null!=(e=arguments[a]))for(t in e)n=s[t],r=e[t],s!==r&&(h&&r&&(c.isPlainObject(r)||(i=c.isArray(r)))?(i?(i=!1,o=n&&c.isArray(n)?n:[]):o=n&&c.isPlainObject(n)?n:{},s[t]=c.extend(h,o,r)):void 0!==r&&(s[t]=r));return s}var c=t.exports={type:r,isArray:o,isFunction:i,isPlainObject:a,each:s,extend:u,noop:function(){}},h=Object.prototype.toString,l={};"Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(e){l["[object "+e+"]"]=e.toLowerCase()})},{}],10:[function(e,t,n){/*!
* jquery-deferred
* Copyright(c) 2011 Hidden <zzdhidden@gmail.com>
* MIT Licensed
*/
var r=t.exports=e("./jquery-callbacks.js"),i=Array.prototype.slice;r.extend({Deferred:function(e){var t=[["resolve","done",r.Callbacks("once memory"),"resolved"],["reject","fail",r.Callbacks("once memory"),"rejected"],["notify","progress",r.Callbacks("memory")]],n="pending",i={state:function(){return n},always:function(){return o.done(arguments).fail(arguments),this},then:function(){var e=arguments;return r.Deferred(function(n){r.each(t,function(t,i){var s=i[0],a=e[t];o[i[1]](r.isFunction(a)?function(){var e=a.apply(this,arguments);e&&r.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[s+"With"](this===o?n:this,[e])}:n[s])}),e=null}).promise()},promise:function(e){return null!=e?r.extend(e,i):i}},o={};return i.pipe=i.then,r.each(t,function(e,r){var s=r[2],a=r[3];i[r[1]]=s.add,a&&s.add(function(){n=a},t[1^e][2].disable,t[2][2].lock),o[r[0]]=s.fire,o[r[0]+"With"]=s.fireWith}),i.promise(o),e&&e.call(o,o),o},when:function(e){var t,n,o,s=0,a=i.call(arguments),u=a.length,c=1!==u||e&&r.isFunction(e.promise)?u:0,h=1===c?e:r.Deferred(),l=function(e,n,r){return function(o){n[e]=this,r[e]=arguments.length>1?i.call(arguments):o,r===t?h.notifyWith(n,r):--c||h.resolveWith(n,r)}};if(u>1)for(t=new Array(u),n=new Array(u),o=new Array(u);s<u;s++)a[s]&&r.isFunction(a[s].promise)?a[s].promise().done(l(s,o,a)).fail(h.reject).progress(l(s,n,t)):--c;return c||h.resolveWith(o,a),h.promise()}})},{"./jquery-callbacks.js":8}]},{},[2]);