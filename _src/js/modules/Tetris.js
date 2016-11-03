import $ from 'jquery-deferred';
import EventEmitter from 'events';
import Util from './Util';
import TouchController from './TouchController';
import {
  COLS,
  ROWS,
  BLOCK_SIZE,
  NUMBER_OF_BLOCK,
  HIDDEN_ROWS,
  LOGICAL_ROWS,
  WIDTH,
  HEIGHT,
  NEXT_WIDTH,
  NEXT_HEIGHT,
  RENDER_INTERVAL,
  DEFAULT_TICK_INTERVAL,
  SPEEDUP_RATE,
  START_X,
  START_Y,
  CLEARLINE_BLOCK_INDEX,
  GAMEOVER_BLOCK_INDEX,
  BG_COLOR,
  DEFAULT_DROP_DIRECTION,
  COLOR_LIST,
  KEYS
} from '../constants';
import SHAPE_LIST from '../constants/SHAPE_LIST';

export default class Tetris extends EventEmitter {
  constructor(opts = {}) {
    super();
    
    var _this = this;
    
    this.cnvs = document.getElementById('game-canvas');
    this.ctx = this.cnvs.getContext('2d');
    this.cnvsNext = document.getElementById('next-canvas');
    this.ctxNext = this.cnvsNext.getContext('2d');

    this.initCanvasSize();
    
    if (!opts.disableFocusControls) this.setBlurEvent();
    if (!opts.disableKey) this.setKeyEvent();
    if (!opts.disableTouch) this.setTouchEvent();
    
    this.renderId = setInterval(function(){ _this.render(); }, RENDER_INTERVAL);
  }

  initCanvasSize() {
    this.cnvs.style.width = WIDTH + 'px';
    this.cnvs.style.height = HEIGHT + 'px';
    this.cnvs.width = WIDTH * 2; // for retina
    this.cnvs.height = HEIGHT * 2; // for retina
    this.ctx.scale(2,2); // for retina
    this.ctx.strokeStyle = BG_COLOR;
    
    this.cnvsNext.style.width = NEXT_WIDTH + 'px';
    this.cnvsNext.style.height = NEXT_HEIGHT + 'px';
    this.cnvsNext.width = NEXT_WIDTH * 2; // for retina
    this.cnvsNext.height = NEXT_HEIGHT * 2; // for retina
    this.ctxNext.scale(2,2); // for retina
    this.ctxNext.strokeStyle = BG_COLOR;
  }

  rotateWorld(sign = 1) { // 1 or -1
    this.worldDirection += sign;
    this.cnvs.style.transform = `rotate(${this.worldDirection * 90}deg)`;
  }
  
  // Controller ------------------------------
  setBlurEvent() {
    var _this = this;
    
    window.addEventListener('blur',function(){
        _this.pauseGame();
    }, false);
    window.addEventListener('focus',function(){
        _this.resumeGame();
    }, false);
  }

  setKeyEvent() {
    var _this = this;
    
    document.addEventListener('keydown', function(evt){
      if (typeof KEYS[evt.keyCode] === 'undefined') return;
      evt.preventDefault();
      _this.moveBlock(KEYS[evt.keyCode]);
    }, false);
  }

  setTouchEvent() {
    var _this = this;
    var touch = new TouchController({
      element: this.cnvs
    });
    var touchStartX;
    var touchStartY;
    var isTap = false;
    var isFreeze = false;
    
    touch.on('touchstart',function(info){
      touchStartX = info.touchStartX;
      touchStartY = info.touchStartY;
      isTap = true;
      isFreeze = false;
    });
    touch.on('touchmove',function(info){
      // var blockMoveX = (info.moveX / BLOCK_SIZE) | 0;
      var moveX  = info.touchX - touchStartX;
      var moveY  = info.touchY - touchStartY;
      var blockMoveX = (moveX / BLOCK_SIZE) | 0;
      var blockMoveY = (moveY / BLOCK_SIZE) | 0;
      
      if (isFreeze) return;
      
      // 1マスずつバリデーション（すり抜け対策）
      while (!!blockMoveX) {
        var sign = blockMoveX / Math.abs(blockMoveX); // 1 or -1
        if (!_this.valid(sign, 0)) break;
        _this.currentX += sign;
        blockMoveX -= sign;
        touchStartX = info.touchX;
      }
      while (blockMoveY > 0) {
        if (!_this.valid(0, 1)) break;
        _this.currentY++;
        blockMoveY--;
        touchStartY = info.touchY;
      }
      isTap = false;
    });
    touch.on('touchend',function(info){
      if (!!isTap) _this.moveBlock('rotate');
    });
    this.on('freeze',function(){
      isFreeze = true;
    });
  }

  // Model ------------------------------
  newGame() {
    this.initGame();
    this.startGame();
  }

  initGame() {
    clearTimeout(this.tickId);
    clearInterval(this.renderId);
    this.isPlayng = false;
    this.lose = false;
    this.tickInterval = DEFAULT_TICK_INTERVAL;
    this.dropDirection = DEFAULT_DROP_DIRECTION;
    this.worldDirection = 0;
    this.sumOfClearLines = 0;
    this.score = 0;
    this.frameCount = 0;
    this.initBoad();
    this.initBlock();
    this.createNextBlock();
    this.render();
  }

  startGame() {
    var _this = this;
    this.isPlayng = true;
    this.createNewBlock();
    this.createNextBlock();
    this.renderId = setInterval(function(){ _this.render(); }, RENDER_INTERVAL);
    this.emit('gamestart');
    this.tick();
  }

  initBoad() {
    this.board = [];
    for ( var y = 0; y < LOGICAL_ROWS; ++y ) {
      this.board[y] = [];
      for ( var x = 0; x < COLS; ++x ) {
        this.board[y][x] = 0;
      }
    }
  }

  initBlock() {
    this.currentBlock = [];
    for ( var y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      this.currentBlock[y] = [];
      for ( var x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        this.currentBlock[y][x] = 0;
      }
    }
    this.currentBlockId = 0;
    this.currentX = START_X;
    this.currentY = START_Y;
  }

  createNewBlock() {
    if (!this.nextBlock[0]) this.createNextBlock();
    this.currentBlock = this.nextBlock;
    this.currentBlockId = this.nextBlockId;
    this.currentX = START_X;
    this.currentY = START_Y;
    this.emit('newblockcreated');
  }

  createNextBlock() {
    var index = Math.floor(Math.random() * SHAPE_LIST.length);
    var shape = SHAPE_LIST[index];
    this.nextBlockId = index;
    this.nextBlock = [];
    for (var y = 0; y < NUMBER_OF_BLOCK; ++y) {
      this.nextBlock[y] = [];
      for (var x = 0; x < NUMBER_OF_BLOCK; ++x) {
        var i = NUMBER_OF_BLOCK * y + x;
        this.nextBlock[y][x] = (!!shape[i]) ? (index + 1) : 0;
      }
    }
    this.emit('nextblockcreated');
  }

  // メインでループする関数
  tick() {
    var _this = this;
    clearTimeout(this.tickId);
    if (!this.moveBlock(this.dropDirection)) {
      this.freeze();
      this.clearLines();
      if (this.checkGameOver()) {
        this.emit('gameover');
        this.quitGame().then(function(){
          // _this.newGame();
        });
        return false;
      }
      this.frameCount++;
      this.createNewBlock();
      this.createNextBlock();
    }
    this.tickId = setTimeout(function(){ _this.tick(); }, this.tickInterval);
    this.emit('tick');
  }

  quitGame() {
    var _this = this;
    var dfd = $.Deferred();
    this.gameOverEffect().then(function(){
      _this.isPlayng = false;
      _this.emit('gamequit');
      dfd.resolve();
    });
    return dfd.promise();
  }
  // Tetris.prototype.stopGame = Tetris.prototype.quitGame; // alias

  pauseGame() {
    clearTimeout(this.tickId);
  }

  resumeGame() {
    var _this = this;
    if (!this.isPlayng) return;
    this.tickId = setTimeout(function(){ _this.tick(); }, this.tickInterval);
  }

  freeze() {
    for ( var y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      for ( var x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        var boardX = x + this.currentX;
        var boardY = y + this.currentY;
        if (!this.currentBlock[y][x] || boardY < 0) continue;
        this.board[boardY][boardX] = this.currentBlock[y][x];
      }
    }
    this.emit('freeze');
  }

  clearLines() {
    var _this = this;
    var clearLineLength = 0; // 同時消去ライン数
    var filledRowList = [];
    var blankRow = Array.apply(null, Array(COLS)).map(function(){ return 0; }); // => [0,0,0,0,0,...]
    var dfd = $.Deferred();
    dfd.resolve();
    for ( var y = LOGICAL_ROWS - 1; y >= 0; --y ) {
      var isRowFilled = this.board[y].every(function(val){
        return val !== 0;
      });
      if (!isRowFilled) continue;
      filledRowList.push(y);
      clearLineLength++;
      this.sumOfClearLines++;
      this.tickInterval -= SPEEDUP_RATE; // 1行消去で速度を上げる
      
      // clear line effect
      for ( var x = 0; x < COLS; ++x ) {
        if (!this.board[y][x]) continue;
        dfd = dfd
          .then(effect(x, y))
          .then(Util.sleep(10));
      }
    }
    // clear line drop
    dfd.then(dropRow(x, y));
    
    // calc score
    this.score += (clearLineLength <= 1) ? clearLineLength : Math.pow(2, clearLineLength);
    
    if (clearLineLength > 0) this.emit('clearline', filledRowList);
    
    function effect(x, y) {
      return function(){
        var dfd = $.Deferred();
        _this.board[y][x] = CLEARLINE_BLOCK_INDEX;
        dfd.resolve();
        return dfd.promise();
      };
    }
    function dropRow(x, y) {
      return function(){
        var dfd = $.Deferred();
        if (!filledRowList.length) return;
        filledRowList.reverse().forEach(function(row){
          _this.board.splice(row, 1);
          _this.board.unshift(blankRow);
        });
        dfd.resolve();
        return dfd.promise();
      };
    }
  }

  gameOverEffect() {
    var _this = this;
    var dfd = $.Deferred();
    dfd.resolve();
    for ( var y = 0; y < LOGICAL_ROWS; ++y ) {
      for ( var x = 0; x < COLS; ++x ) {
        if (!this.board[y][x]) continue;
        // this.board[y][x] = BLOCK_IMAGE_LIST.length - 1;
        dfd = dfd
          .then(effect(x, y))
          .then(Util.sleep(10));
      }
    }
    this.emit('gameOverEffect');
    function effect(x, y) {
      return function(){
        var dfd = $.Deferred();
        _this.board[y][x] = GAMEOVER_BLOCK_INDEX;
        _this.emit('gameOverEffectTick');
        dfd.resolve();
        return dfd.promise();
      };
    }
    return dfd.then(Util.sleep(500)).promise();
  }

  moveBlock(code) {
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
  }

  rotate() {
    var newBlock = [];
    for ( var y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      newBlock[y] = [];
      for ( var x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        newBlock[y][x] = this.currentBlock[NUMBER_OF_BLOCK - 1 - x][y];
      }
    }
    return newBlock;
  }

  rotateBoard(sign) {
    const blankRow = Array.apply(null, Array(COLS)).map(function(){ return 0; }); // => [0,0,0,0,0,...]
    const newBoard = [];
    for ( let y = 0; y < ROWS; ++y ) {
      newBoard[y] = [];
      for ( let x = 0; x < COLS; ++x ) {
        newBoard[y][x] = this.board[COLS - 1 - x + HIDDEN_ROWS][y];
      }
    }
    for (let i = 0; i < HIDDEN_ROWS; ++i) {
      newBoard.unshift(blankRow);
    }
    this.board = newBoard;
    return newBoard;
  }

  valid(offsetX, offsetY, newBlock) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    var nextX = this.currentX + offsetX;
    var nextY = this.currentY + offsetY;
    var block = newBlock || this.currentBlock;
    
    for ( var y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      for ( var x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        var boardX = x + nextX;
        var boardY = y + nextY;
        if (!block[y][x]) continue;
        if ( typeof this.board[boardY] === 'undefined' // 次の位置が盤面外なら
          || typeof this.board[boardY][boardX] === 'undefined' // 盤面外なら
          || this.board[boardY][boardX] // 次の位置にブロックがあれば
          || boardX < 0 // 左壁
          || boardX >= COLS // 右壁
          || boardY >= LOGICAL_ROWS ) { // 底面
          
          return false;
        }
      }
    }
    return true;
  }

  checkGameOver() {
    // ブロックの全てが画面外ならゲームオーバー
    var isGameOver = true;
    for ( var y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      for ( var x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        var boardX = x + this.currentX;
        var boardY = y + this.currentY;
        if (boardY >= HIDDEN_ROWS) {
          isGameOver = false;
          break;
        }
      }
    }
    return isGameOver;
  }

  // View ------------------------------
  render() {
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // background
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    this.renderBoard();
    this.renderCurrentBlock();
    this.renderNextBlock();
  }

  renderBoard() {
    // 盤面を描画する
    for (var x = 0; x < COLS; ++x) {
      for (var y = 0; y < ROWS; ++y) {
        var boardX = x;
        var boardY = y + HIDDEN_ROWS;
        var blockId = this.board[boardY][boardX] - 1;
        if (!this.board[boardY][boardX] || blockId < 0) continue;
        this.drawBlock(x, y, blockId);
      }
    }
  }

  renderCurrentBlock() {
    // 操作ブロックを描画する
    for (var y = 0; y < NUMBER_OF_BLOCK; ++y) {
      for (var x = 0; x < NUMBER_OF_BLOCK; ++x) {
        var blockId = this.currentBlock[y][x] - 1;
        if (!this.currentBlock[y][x] || blockId < 0) continue;
        var drawX = x + this.currentX;
        var drawY = y + this.currentY - HIDDEN_ROWS;
        this.drawBlock(drawX, drawY, blockId);
      }
    }
  }

  renderNextBlock() {
    // Nextブロック描画
    this.ctxNext.clearRect(0, 0, NEXT_WIDTH, NEXT_HEIGHT);
    for (var y = 0; y < NUMBER_OF_BLOCK; ++y) {
      for (var x = 0; x < NUMBER_OF_BLOCK; ++x) {
        var blockId = this.nextBlock[y][x] - 1;
        if (!this.nextBlock[y][x] || blockId < 0) continue;
        this.drawNextBlock(x, y, blockId);
      }
    }
  }

  drawBlock(x, y, id) {
    var blockX = BLOCK_SIZE * x;
    var blockY = BLOCK_SIZE * y;
    var blockSize = BLOCK_SIZE;
    this.ctx.fillStyle = COLOR_LIST[id];
    this.ctx.fillRect( blockX, blockY, blockSize, blockSize );
    this.ctx.strokeRect( blockX, blockY, blockSize, blockSize );
  }

  drawNextBlock(x, y, id) {
    var blockX = BLOCK_SIZE * x;
    var blockY = BLOCK_SIZE * y;
    var blockSize = BLOCK_SIZE;
    this.ctxNext.fillStyle = COLOR_LIST[id];
    this.ctxNext.fillRect( blockX, blockY, blockSize, blockSize );
    this.ctxNext.strokeRect( blockX, blockY, blockSize, blockSize );
  }
}

