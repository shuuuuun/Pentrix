(function(win, doc){
  var ns = win.App = win.App || {};
  
  ns.TouchController = function($element){
    ns.EventDispatcher.call(this);
    var _this = this;
    
    var touchsupport = ("ontouchstart" in window);
    var touchstart = (touchsupport) ? "touchstart" : "mousedown";
    var touchmove  = (touchsupport) ? "touchmove"  : "mousemove";
    var touchend   = (touchsupport) ? "touchend"   : "mouseup";
    
    var movingtimer;
    
    var dragging = false,
      touchStartX,
      touchStartY,
      lasttouchX,
      lasttouchY,
      touchX,
      touchY,
      deltaX = 0,
      deltaY = 0,
      moveX = 0,
      moveY = 0,
      touchEndX,
      touchEndY,
      touchStartTime,
      elapsedTime;
    
    $element
      .on(touchstart, onTouchStart)
      .on(touchmove, ontouchMove)
      .on(touchend, onTouchEnd);
    
    // $(document)
    //   .on(touchstart, function(){ return false; }) // disableDocumentTouch
    //   .on(touchmove, ontouchMove)
    //   .on(touchend, onTouchEnd);
    
    function onTouchStart(evt){
      evt.preventDefault(); // enablePreventDefault
      dragging = true;
      touchStartTime = Date.now();
      
      touchStartX = (touchsupport) ? evt.originalEvent.touches[0].pageX : evt.pageX;
      touchStartY = (touchsupport) ? evt.originalEvent.touches[0].pageY : evt.pageY;
      
      // console.log("touchstart");
      _this.trigger("touchstart", {
        "touchStartTime": touchStartTime,
        "touchStartX"   : touchStartX,
        "touchStartY"   : touchStartY,
      });
      
      //return false; // enableReturnFalse
    }
    function ontouchMove(evt){
      if (!dragging) return;
      lasttouchX = touchX || touchStartX;
      lasttouchY = touchY || touchStartY;
      
      touchX = (touchsupport) ? evt.originalEvent.touches[0].pageX : evt.pageX;
      touchY = (touchsupport) ? evt.originalEvent.touches[0].pageY : evt.pageY;
      deltaX = touchX - lasttouchX;
      deltaY = touchY - lasttouchY;
      moveX  = touchX - touchStartX;
      moveY  = touchY - touchStartY;
      
      // console.log("touchmove", touchX, touchY, deltaX, deltaY, moveX, moveY);
      _this.trigger("touchmove", {
        "lasttouchX": lasttouchX,
        "lasttouchY": lasttouchY,
        "touchX"    : touchX,
        "touchY"    : touchY,
        "deltaX"    : deltaX,
        "deltaY"    : deltaY,
        "moveX"     : moveX,
        "moveY"     : moveY,
      });
      
      // clearTimeout(movingtimer);
      // movingtimer = setTimeout(function(){ dragging = false; },1000);
    }
    function onTouchEnd(evt){
      dragging = false;
      
      elapsedTime = Date.now() - touchStartTime;
      touchEndX = touchX;
      touchEndY = touchY;
      
      // console.log("touchend");
      _this.trigger("touchend", {
        "elapsedTime": elapsedTime,
        "touchEndX"  : touchEndX,
        "touchEndY"  : touchEndY,
        "moveX"      : moveX,
        "moveY"      : moveY,
      });
      
      touchX = touchY = null;
      moveX = moveY = 0;
    }
  };
  ns.TouchController.prototype = Object.create(ns.EventDispatcher.prototype);
  ns.TouchController.prototype.constructor = ns.TouchController;
  
})(this, document);
