import SHAPE_LIST from './SHAPE_LIST_5';

export const COLS = 15;
export const ROWS = 15;

export const BLOCK_SIZE = 25;
export const NUMBER_OF_BLOCK = 5;

export const HIDDEN_ROWS = NUMBER_OF_BLOCK;
export const LOGICAL_ROWS = ROWS + HIDDEN_ROWS;

export const WIDTH = BLOCK_SIZE * COLS;
export const HEIGHT = BLOCK_SIZE * ROWS;
export const NEXT_WIDTH = BLOCK_SIZE * NUMBER_OF_BLOCK;
export const NEXT_HEIGHT = BLOCK_SIZE * NUMBER_OF_BLOCK;

export const RENDER_INTERVAL = 30;
export const DEFAULT_TICK_INTERVAL = 500;
export const SPEEDUP_RATE = 10;

export const START_X = Math.floor((COLS - NUMBER_OF_BLOCK) / 2);
export const START_Y = 0;

export const BG_COLOR = '#888';

export const KEYS = {
  37: 'left',  // ←
  39: 'right',  // →
  40: 'down',  // ↓
  38: 'rotate',  // ↑
  32: 'rotate'  // space
};

export const CLEARLINE_BLOCK = {
  id: 7,
  color: '#aaa',
  image: '/img/block_8.png',
};

export const GAMEOVER_BLOCK = {
  id: 8,
  color: '#777',
  image: '/img/block_9.png',
};

export const BLOCK_LIST = [
  {
    id: 0,
    color: '#FF6666',
    shape: SHAPE_LIST[0],
    image: '/img/block_1.png',
  },
  {
    id: 1,
    color: '#FFCC66',
    shape: SHAPE_LIST[1],
    image: '/img/block_2.png',
  },
  {
    id: 2,
    color: '#FFFF66',
    shape: SHAPE_LIST[2],
    image: '/img/block_3.png',
  },
  {
    id: 3,
    color: '#CCFF66',
    shape: SHAPE_LIST[3],
    image: '/img/block_4.png',
  },
  {
    id: 4,
    color: '#66FF66',
    shape: SHAPE_LIST[4],
    image: '/img/block_5.png',
  },
  {
    id: 5,
    color: '#66FFCC',
    shape: SHAPE_LIST[5],
    image: '/img/block_6.png',
  },
  {
    id: 6,
    color: '#66FFFF',
    shape: SHAPE_LIST[6],
    image: '/img/block_7.png',
  },
];
