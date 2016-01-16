(function(win, doc){
  var ns = win.App = win.App || {};
  
  var $win = $(win);
  var util = new ns.Util();
  // util.bindOnResize();
  
  $(function(){
    
    if (ns.ua.isSP) {
      // sp
      $(".onlypc").remove();
    }
    else {
      // pc
      $(".onlysp").remove();
    }
    
    var tetris = new ns.Tetris();
    
    var query = util.getQueryString();
    
    if (query.debug === 'true') {
      var line = query.line || 5;
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
    
  });
  
})(this, document);
