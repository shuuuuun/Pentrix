(function(win, doc){
  var ns = win.App = win.App || {};
  
  ns.Tetris = function(){
    ns.EventDispatcher.call(this);
    
    var _this = this;
    
    this.COLS = 15;
    this.ROWS = 30;
    this.BLOCK_SIZE = 20;
    this.NUMBER_OF_BLOCK = 5;
    this.WIDTH = this.BLOCK_SIZE * this.COLS;
    this.HEIGHT = this.BLOCK_SIZE * this.ROWS;
    this.NEXT_WIDTH = this.BLOCK_SIZE * this.NUMBER_OF_BLOCK;
    this.NEXT_HEIGHT = this.BLOCK_SIZE * this.NUMBER_OF_BLOCK;
    this.RENDER_INTERVAL = 30;
    this.DEFAULT_TICK_INTERVAL = 250;
    this.SPEEDUP_RATE = 10;
    this.START_X = Math.floor((this.COLS - this.NUMBER_OF_BLOCK) / 2);
    this.START_Y = 0; // -this.NUMBER_OF_BLOCK;
    this.SHAPE_LIST = [
      [ 0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0 ],
      [ 0, 0, 0, 0, 0,
        0, 0, 1, 1, 0,
        0, 0, 1, 0, 0,
        0, 1, 1, 0, 0,
        0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 1, 1, 1, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
        0, 1, 1, 1, 0,
        0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 1, 1, 1, 0,
        0, 1, 0, 1, 0,
        0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 1, 1, 1, 0,
        0, 1, 1, 0, 0,
        0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0,
        1, 1, 1, 1, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0 ],
    ];
    this.COLOR_LIST = [
      "#FF6666",
      "#FFCC66",
      "#FFFF66",
      "#CCFF66",
      "#66FF66",
      "#66FFCC",
      "#66FFFF",
      "#66CCFF",
      "#6666FF",
      "#CC66FF",
      "#FF66FF",
      "#FF6FCF",
    ];
    this.KEYS = {
      37: 'left',  // ←
      39: 'right',  // →
      // 40: 'down',  // ↓
      // 38: 'rotate',  // ↑
      38: 'down',  // ↓ 上下反転
      40: 'rotate',  // ↑ 上下反転
      // 32: 'stop'  // space
      32: 'rotate'  // space
    };
    
    this.tickId;
    this.lose;
    this.board = [];
    this.currentBlock = [];
    this.currentX;
    this.currentY;
    this.numberOfClearLines;
    
    
    this.$clearLine = $('#clearLine');
    this.$score = $('#score');
    this.$cnvs = $('#canvas');
    this.cnvs = document.getElementById('canvas');
    this.ctx = this.cnvs.getContext('2d');
    this.cnvsNext = document.getElementById('nextBlock');
    this.ctxNext = this.cnvsNext.getContext('2d');
    
    this.cnvs.width = this.WIDTH;
    this.cnvs.height = this.HEIGHT;
    this.ctx.strokeStyle = '#eee';
    this.cnvsNext.width = this.NEXT_WIDTH;
    this.cnvsNext.height = this.NEXT_HEIGHT;
    this.ctxNext.strokeStyle = '#eee';
    
    this.setBlurEvent();
    this.setKeyEvent();
    this.setTouchEvent();
    
    this.renderId = setInterval(function(){ _this.render(); }, this.RENDER_INTERVAL);
    
    this.newGame();
  };
  ns.Tetris.prototype = Object.create(ns.EventDispatcher.prototype);
  ns.Tetris.prototype.constructor = ns.Tetris;
  
  // Controller ------------------------------
  ns.Tetris.prototype.setBlurEvent = function() {
    var _this = this;
    
    $(window).on('blur',function(){
        _this.pauseGame();
    }).on('focus',function(){
        _this.restartGame();
    });
  };
  
  ns.Tetris.prototype.setKeyEvent = function() {
    var _this = this;
    
    $(document).on('keydown', function(evt){
      if (typeof _this.KEYS[evt.keyCode] === 'undefined') return;
      evt.preventDefault();
      _this.moveBlock(_this.KEYS[evt.keyCode]);
    });
  };
  
  ns.Tetris.prototype.setTouchEvent = function() {
    var _this = this;
    var touch = new ns.TouchController(this.$cnvs);
    var touchStartX;
    var touchStartY;
    var isTap;
    
    touch.on('touchstart',function(evt, info){
      touchStartX = info.touchStartX;
      touchStartY = info.touchStartY;
      isTap = true;
    });
    touch.on('touchmove',function(evt, info){
      // var blockMoveX = (info.moveX / _this.BLOCK_SIZE) | 0;
      var moveX  = info.touchX - touchStartX;
      var moveY  = info.touchY - touchStartY;
      var blockMoveX = (moveX / _this.BLOCK_SIZE) | 0;
      var blockMoveY = -(moveY / _this.BLOCK_SIZE) | 0; // 上下反転
      if (!!blockMoveX && _this.valid(blockMoveX, 0)) {
        _this.currentX += blockMoveX;
        touchStartX = info.touchX;
      }
      if ((blockMoveY > 0) && _this.valid(0, blockMoveY)) {
        _this.currentY += blockMoveY;
        touchStartY = info.touchY;
      }
      isTap = false;
    });
    touch.on('touchend',function(evt, info){
      if (!!isTap) _this.moveBlock('rotate');
    });
  };
  
  // Model ------------------------------
  ns.Tetris.prototype.newGame = function() {
    var _this = this;
    clearTimeout(this.tickId);
    this.initBoad();
    this.nextShape();
    this.newShape();
    this.lose = false;
    this.tickInterval = this.DEFAULT_TICK_INTERVAL;
    this.numberOfClearLines = 0;
    this.score = 0;
    this.tick();
  };
  
  ns.Tetris.prototype.initBoad = function() {
    for ( var y = 0; y < this.ROWS; ++y ) {
      this.board[y] = [];
      for ( var x = 0; x < this.COLS; ++x ) {
        this.board[y][x] = 0;
      }
    }
  };
  
  ns.Tetris.prototype.newShape = function() {
    this.currentBlock = this.nextBlock;
    this.currentX = this.START_X;
    this.currentY = this.START_Y;
  };
  
  ns.Tetris.prototype.nextShape = function() {
    var index = Math.floor(Math.random() * this.SHAPE_LIST.length);
    var shape = this.SHAPE_LIST[index];
    // パターンを操作ブロックへセットする
    this.nextBlock = [];
    for (var y = 0; y < this.NUMBER_OF_BLOCK; ++y) {
      this.nextBlock[y] = [];
      for (var x = 0; x < this.NUMBER_OF_BLOCK; ++x) {
        var i = this.NUMBER_OF_BLOCK * y + x;
        if (!!shape[i]) {
          this.nextBlock[y][x] = index + 1;
        }
        else {
          this.nextBlock[y][x] = 0;
        }
      }
    }
  };
  
  // メインでループする関数
  // 操作ブロックを下の方へ動かし、操作ブロックが着地したら消去処理、ゲームオーバー判定を行う
  ns.Tetris.prototype.tick = function() {
    var _this = this;
    clearTimeout(this.tickId);
    if (!this.moveBlock('down')) {
      this.freeze();
      this.clearLines();
      if (this.lose) {
        this.newGame();
        return false;
      }
      this.newShape();
      this.nextShape();
    }
    this.tickId = setTimeout(function(){ _this.tick(); }, this.tickInterval);
  };
  
  ns.Tetris.prototype.pauseGame = function() {
    clearTimeout(this.tickId);
  };
  
  ns.Tetris.prototype.restartGame = function() {
    var _this = this;
    this.tickId = setTimeout(function(){ _this.tick(); }, this.tickInterval);
  };
  
  // 操作ブロックを盤面へ固定する
  ns.Tetris.prototype.freeze = function() {
    for ( var y = 0; y < this.NUMBER_OF_BLOCK; ++y ) {
      for ( var x = 0; x < this.NUMBER_OF_BLOCK; ++x ) {
        if (!this.currentBlock[y][x]) continue;
        this.board[y + this.currentY][x + this.currentX] = this.currentBlock[y][x];
      }
    }
  };
  
  ns.Tetris.prototype.clearLines = function() {
    var simultaneous = 0; // 同時消去ライン数
    for ( var y = this.ROWS - 1; y >= 0; --y ) {
      var isRowFilled = this.board[y].every(function(val){
        return val !== 0;
      });
      if (!isRowFilled) continue;
      simultaneous++;
      this.numberOfClearLines++;
      this.tickInterval -= this.SPEEDUP_RATE; // 1行消去で速度を上げる
      
      // もし一行揃っていたら、ブロックを一つずつ落としていく
      for ( var yy = y; yy > 0; --yy ) {
        for ( var x = 0; x < this.COLS; ++x ) {
          this.board[yy][x] = this.board[yy - 1][x];
        }
      }
      ++y;  // 一行落としたのでチェック処理を一つ戻る
    }
    if (simultaneous <= 1) this.score += simultaneous;
    else this.score += Math.pow(2, simultaneous);
  };
  
  ns.Tetris.prototype.moveBlock = function(code) {
    switch (code) {
      case 'left':
        if ( this.valid(-1, 0) ) {
          --this.currentX;
          return true;
        }
        return false;
        break;
      case 'right':
        if ( this.valid(1, 0) ) {
          ++this.currentX;
          return true;
        }
        return false;
        break;
      case 'down':
        if ( this.valid(0, 1) ) {
          ++this.currentY;
          return true;
        }
        return false;
        break;
      case 'rotate':
        var rotatedBlock = this.rotate(this.currentBlock);
        if ( this.valid(0, 0, rotatedBlock) ) {
          this.currentBlock = rotatedBlock;
          return true;
        }
        return false;
        break;
    }
  };
  
  ns.Tetris.prototype.rotate = function() {
    var newBlock = [];
    for ( var y = 0; y < this.NUMBER_OF_BLOCK; ++y ) {
      newBlock[y] = [];
      for ( var x = 0; x < this.NUMBER_OF_BLOCK; ++x ) {
        newBlock[y][x] = this.currentBlock[this.NUMBER_OF_BLOCK - 1 - x][y];
      }
    }
    return newBlock;
  };
  
  // 指定された方向に、操作ブロックを動かせるかどうかチェックする ＆ ゲームオーバー判定もここで行う
  ns.Tetris.prototype.valid = function(offsetX, offsetY, newBlock) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    var nextX = this.currentX + offsetX;
    var nextY = this.currentY + offsetY;
    newBlock = newBlock || this.currentBlock;
    // console.log(offsetX, offsetY, nextX, nextY);
    
    for ( var y = 0; y < this.NUMBER_OF_BLOCK; ++y ) {
      for ( var x = 0; x < this.NUMBER_OF_BLOCK; ++x ) {
        if (!newBlock[y][x]) continue;
        // if ((y + nextY) < 0) continue;
        if ( typeof this.board[ y + nextY ] === 'undefined' // 次の位置が盤面外なら
          || typeof this.board[ y + nextY ][ x + nextX ] === 'undefined' // 盤面外なら
          || this.board[ y + nextY ][ x + nextX ] // 次の位置にブロックがあれば
          || x + nextX < 0 // 盤面外なら
          || y + nextY >= this.ROWS // 盤面外なら
          || x + nextX >= this.COLS ) { // 盤面外なら
          // if (nextY === 1) lose = true; // lose if the current shape at the top row when checked
          if (nextY === 1 && offsetY === 1) { // 次のy座標が1ならゲームオーバー
            console.log('game over');
            this.lose = true;
          }
          return false;
        }
      }
    }
    return true;
  };
  
  ns.Tetris.prototype.checkGameOver = function() {
  };
  
  // View ------------------------------
  ns.Tetris.prototype.render = function() {
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    // 盤面を描画する
    for (var x = 0; x < this.COLS; ++x) {
      for (var y = 0; y < this.ROWS; ++y) {
        if (!this.board[y][x]) continue;
        this.ctx.fillStyle = this.COLOR_LIST[this.board[y][x] - 1];
        this.drawBlock(x, y);
      }
    }
    // 操作ブロックを描画する
    for (var y = 0; y < this.NUMBER_OF_BLOCK; ++y) {
      for (var x = 0; x < this.NUMBER_OF_BLOCK; ++x) {
        if (!this.currentBlock[y][x]) continue;
        this.ctx.fillStyle = this.COLOR_LIST[this.currentBlock[y][x] - 1];
        this.drawBlock(this.currentX + x, this.currentY + y);
      }
    }
    
    // Nextブロック描画
    this.ctxNext.clearRect(0, 0, this.NEXT_WIDTH, this.NEXT_HEIGHT);
    for (var y = 0; y < this.NUMBER_OF_BLOCK; ++y) {
      for (var x = 0; x < this.NUMBER_OF_BLOCK; ++x) {
        if (!this.nextBlock[y][x]) continue;
        this.ctxNext.fillStyle = this.COLOR_LIST[this.nextBlock[y][x] - 1];
        this.drawNextBlock(x, y);
      }
    }
    
    // clear lines表示
    this.$clearLine.text(this.numberOfClearLines);
    
    // score表示
    this.$score.text(this.score);
  };
  
  ns.Tetris.prototype.drawBlock = function(x, y) {
    var blockX = this.BLOCK_SIZE * x;
    var blockY = this.BLOCK_SIZE * y;
    var blockSize = this.BLOCK_SIZE - 1; // border分-1？
    this.ctx.fillRect( blockX, blockY, blockSize, blockSize );
    this.ctx.strokeRect( blockX, blockY, blockSize, blockSize );
  };
  
  ns.Tetris.prototype.drawNextBlock = function(x, y) {
    var blockX = this.BLOCK_SIZE * x;
    var blockY = this.BLOCK_SIZE * y;
    var blockSize = this.BLOCK_SIZE - 1; // border分-1？
    this.ctxNext.fillRect( blockX, blockY, blockSize, blockSize );
    this.ctxNext.strokeRect( blockX, blockY, blockSize, blockSize );
  };
  
})(this, document);
