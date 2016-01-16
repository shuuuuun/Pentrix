(function(win, doc){
  var ns = win.App = win.App || {};
  
  var $win = $(win);
  var util = new ns.Util();
  
  if (ns.winW < 375) {
    $('meta[name=viewport]').attr('content', 'width=375,user-scalable=no');
  }
  
  var tetris = new ns.Tetris();
  tetris.newGame();
  
  // debug
  var query = util.getQueryString();
  if (query.debug) {
    var line = +query.debug || 5;
    var newary = tetris.SHAPE_LIST.map(function(){
      var ary = [];
      for (var i = 0; i < line; ++i) {
        ary = ary.concat([1, 1, 1, 1, 1]);
      }
      return ary;
    });
    tetris.SHAPE_LIST = newary;
    tetris.newGame();
  }
  
})(this, document);
