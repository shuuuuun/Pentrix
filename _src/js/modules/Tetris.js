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
    
    this.cnvs = document.getElementById('game-canvas');
    this.ctx = this.cnvs.getContext('2d');
    this.cnvsNext = document.getElementById('next-canvas');
    this.ctxNext = this.cnvsNext.getContext('2d');

    this.initCanvasSize();
    
    if (!opts.disableFocusControls) this.setBlurEvent();
    if (!opts.disableKey) this.setKeyEvent();
    if (!opts.disableTouch) this.setTouchEvent();
    
    this.renderId = setInterval(() => this.render(), RENDER_INTERVAL);
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
    window.addEventListener('blur', () => {
      this.pauseGame();
    }, false);
    window.addEventListener('focus', () => {
      this.resumeGame();
    }, false);
  }

  setKeyEvent() {
    document.addEventListener('keydown', (evt) => {
      if (typeof KEYS[evt.keyCode] === 'undefined') return;
      evt.preventDefault();
      this.moveBlock(KEYS[evt.keyCode]);
    }, false);
  }

  setTouchEvent() {
    const touch = new TouchController({
      element: this.cnvs
    });
    let touchStartX;
    let touchStartY;
    let isTap = false;
    let isFreeze = false;
    
    touch.on('touchstart',(info) => {
      touchStartX = info.touchStartX;
      touchStartY = info.touchStartY;
      isTap = true;
      isFreeze = false;
    });
    touch.on('touchmove',(info) => {
      // const blockMoveX = (info.moveX / BLOCK_SIZE) | 0;
      const moveX  = info.touchX - touchStartX;
      const moveY  = info.touchY - touchStartY;
      let blockMoveX = (moveX / BLOCK_SIZE) | 0;
      let blockMoveY = (moveY / BLOCK_SIZE) | 0;
      
      if (isFreeze) return;
      
      // 1マスずつバリデーション（すり抜け対策）
      while (!!blockMoveX) {
        const sign = blockMoveX / Math.abs(blockMoveX); // 1 or -1
        if (!this.valid(sign, 0)) break;
        this.currentX += sign;
        blockMoveX -= sign;
        touchStartX = info.touchX;
      }
      while (blockMoveY > 0) {
        if (!this.valid(0, 1)) break;
        this.currentY++;
        blockMoveY--;
        touchStartY = info.touchY;
      }
      isTap = false;
    });
    touch.on('touchend',(info) => {
      if (!!isTap) this.moveBlock('rotate');
    });
    this.on('freeze',() => {
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
    this.isPlayng = true;
    this.createNewBlock();
    this.createNextBlock();
    this.renderId = setInterval(() => this.render(), RENDER_INTERVAL);
    this.emit('gamestart');
    this.tick();
  }

  initBoad() {
    this.board = [];
    for ( let y = 0; y < LOGICAL_ROWS; ++y ) {
      this.board[y] = [];
      for ( let x = 0; x < COLS; ++x ) {
        this.board[y][x] = 0;
      }
    }
  }

  initBlock() {
    this.currentBlock = [];
    for ( let y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      this.currentBlock[y] = [];
      for ( let x = 0; x < NUMBER_OF_BLOCK; ++x ) {
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
    const index = Math.floor(Math.random() * SHAPE_LIST.length);
    const shape = SHAPE_LIST[index];
    this.nextBlockId = index;
    this.nextBlock = [];
    for (let y = 0; y < NUMBER_OF_BLOCK; ++y) {
      this.nextBlock[y] = [];
      for (let x = 0; x < NUMBER_OF_BLOCK; ++x) {
        const i = NUMBER_OF_BLOCK * y + x;
        this.nextBlock[y][x] = (!!shape[i]) ? (index + 1) : 0;
      }
    }
    this.emit('nextblockcreated');
  }

  // メインでループする関数
  tick() {
    clearTimeout(this.tickId);
    if (!this.moveBlock(this.dropDirection)) {
      this.freeze();
      this.clearLines();
      if (this.checkGameOver()) {
        this.emit('gameover');
        this.quitGame().then(() => {
          // this.newGame();
        });
        return false;
      }
      this.frameCount++;
      this.createNewBlock();
      this.createNextBlock();
    }
    this.tickId = setTimeout(() => this.tick(), this.tickInterval);
    this.emit('tick');
  }

  quitGame() {
    const dfd = $.Deferred();
    this.gameOverEffect().then(() => {
      this.isPlayng = false;
      this.emit('gamequit');
      dfd.resolve();
    });
    return dfd.promise();
  }
  // Tetris.prototype.stopGame = Tetris.prototype.quitGame; // alias

  pauseGame() {
    clearTimeout(this.tickId);
  }

  resumeGame() {
    if (!this.isPlayng) return;
    this.tickId = setTimeout(() => this.tick(), this.tickInterval);
  }

  freeze() {
    for ( let y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      for ( let x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        const boardX = x + this.currentX;
        const boardY = y + this.currentY;
        if (!this.currentBlock[y][x] || boardY < 0) continue;
        this.board[boardY][boardX] = this.currentBlock[y][x];
      }
    }
    this.emit('freeze');
  }

  clearLines() {
    const blankRow = Array.apply(null, Array(COLS)).map(() => 0); // => [0,0,0,0,0,...]
    let clearLineLength = 0; // 同時消去ライン数
    let filledRowList = [];
    let dfd = $.Deferred();
    dfd.resolve();
    
    const effect = (x, y) => {
      return () => {
        const d = $.Deferred();
        this.board[y][x] = CLEARLINE_BLOCK_INDEX;
        d.resolve();
        return d.promise();
      };
    }
    const dropRow = () => {
      return () => {
        const d = $.Deferred();
        if (!filledRowList.length) return;
        filledRowList.reverse().forEach((row) => {
          this.board.splice(row, 1);
          this.board.unshift(blankRow);
        });
        d.resolve();
        return d.promise();
      };
    }
    
    for ( let y = LOGICAL_ROWS - 1; y >= 0; --y ) {
      const isRowFilled = this.board[y].every((val) => val !== 0);
      if (!isRowFilled) continue;
      filledRowList.push(y);
      clearLineLength++;
      this.sumOfClearLines++;
      this.tickInterval -= SPEEDUP_RATE; // 1行消去で速度を上げる
      
      // clear line effect
      for ( let x = 0; x < COLS; ++x ) {
        if (!this.board[y][x]) continue;
        dfd = dfd
          .then(effect(x, y))
          .then(Util.sleep(10));
      }
    }
    // clear line drop
    dfd.then(dropRow());
    
    // calc score
    this.score += (clearLineLength <= 1) ? clearLineLength : Math.pow(2, clearLineLength);
    
    if (clearLineLength > 0) this.emit('clearline', filledRowList);
  }

  gameOverEffect() {
    let dfd = $.Deferred();
    dfd.resolve();
    
    const effect = (x, y) => {
      return () => {
        const d = $.Deferred();
        this.board[y][x] = GAMEOVER_BLOCK_INDEX;
        this.emit('gameOverEffectTick');
        d.resolve();
        return d.promise();
      };
    }
    
    for ( let y = 0; y < LOGICAL_ROWS; ++y ) {
      for ( let x = 0; x < COLS; ++x ) {
        if (!this.board[y][x]) continue;
        // this.board[y][x] = BLOCK_IMAGE_LIST.length - 1;
        dfd = dfd
          .then(effect(x, y))
          .then(Util.sleep(10));
      }
    }
    this.emit('gameOverEffect');
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
        const rotatedBlock = this.rotate(this.currentBlock);
        if ( this.valid(0, 0, rotatedBlock) ) {
          this.currentBlock = rotatedBlock;
          return true;
        }
        return false;
        break;
    }
  }

  rotate() {
    const newBlock = [];
    for ( let y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      newBlock[y] = [];
      for ( let x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        newBlock[y][x] = this.currentBlock[NUMBER_OF_BLOCK - 1 - x][y];
      }
    }
    return newBlock;
  }

  rotateBoard(sign) {
    const blankRow = Array.apply(null, Array(COLS)).map(() => 0); // => [0,0,0,0,0,...]
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
    const nextX = this.currentX + offsetX;
    const nextY = this.currentY + offsetY;
    const block = newBlock || this.currentBlock;
    
    for ( let y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      for ( let x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        const boardX = x + nextX;
        const boardY = y + nextY;
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
    let isGameOver = true;
    for ( let y = 0; y < NUMBER_OF_BLOCK; ++y ) {
      for ( let x = 0; x < NUMBER_OF_BLOCK; ++x ) {
        const boardX = x + this.currentX;
        const boardY = y + this.currentY;
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
    for (let x = 0; x < COLS; ++x) {
      for (let y = 0; y < ROWS; ++y) {
        const boardX = x;
        const boardY = y + HIDDEN_ROWS;
        const blockId = this.board[boardY][boardX] - 1;
        if (!this.board[boardY][boardX] || blockId < 0) continue;
        this.drawBlock(x, y, blockId);
      }
    }
  }

  renderCurrentBlock() {
    // 操作ブロックを描画する
    for (let y = 0; y < NUMBER_OF_BLOCK; ++y) {
      for (let x = 0; x < NUMBER_OF_BLOCK; ++x) {
        const blockId = this.currentBlock[y][x] - 1;
        if (!this.currentBlock[y][x] || blockId < 0) continue;
        const drawX = x + this.currentX;
        const drawY = y + this.currentY - HIDDEN_ROWS;
        this.drawBlock(drawX, drawY, blockId);
      }
    }
  }

  renderNextBlock() {
    // Nextブロック描画
    this.ctxNext.clearRect(0, 0, NEXT_WIDTH, NEXT_HEIGHT);
    for (let y = 0; y < NUMBER_OF_BLOCK; ++y) {
      for (let x = 0; x < NUMBER_OF_BLOCK; ++x) {
        const blockId = this.nextBlock[y][x] - 1;
        if (!this.nextBlock[y][x] || blockId < 0) continue;
        this.drawNextBlock(x, y, blockId);
      }
    }
  }

  drawBlock(x, y, id) {
    const blockX = BLOCK_SIZE * x;
    const blockY = BLOCK_SIZE * y;
    const blockSize = BLOCK_SIZE;
    this.ctx.fillStyle = COLOR_LIST[id];
    this.ctx.fillRect( blockX, blockY, blockSize, blockSize );
    this.ctx.strokeRect( blockX, blockY, blockSize, blockSize );
  }

  drawNextBlock(x, y, id) {
    const blockX = BLOCK_SIZE * x;
    const blockY = BLOCK_SIZE * y;
    const blockSize = BLOCK_SIZE;
    this.ctxNext.fillStyle = COLOR_LIST[id];
    this.ctxNext.fillRect( blockX, blockY, blockSize, blockSize );
    this.ctxNext.strokeRect( blockX, blockY, blockSize, blockSize );
  }
}
