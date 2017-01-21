import SHAPE_LIST from './SHAPE_LIST_4';

export const BLOCK_SIZE = 100;
export const NUMBER_OF_BLOCK = 4;

export const NEXT_WIDTH = BLOCK_SIZE * NUMBER_OF_BLOCK;
export const NEXT_HEIGHT = BLOCK_SIZE * NUMBER_OF_BLOCK;

export const RENDER_INTERVAL = 30;
export const DEFAULT_TICK_INTERVAL = 500;
export const SPEEDUP_RATE = 10;

export const BG_COLOR = '#111';

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
};

export const GAMEOVER_BLOCK = {
  id: 8,
  color: '#777',
};

export const BLOCK_LIST = [
  {
    id: 0,
    color: '#FF6666',
    shape: SHAPE_LIST[0],
  },
  {
    id: 1,
    color: '#FFCC66',
    shape: SHAPE_LIST[1],
  },
  {
    id: 2,
    color: '#FFFF66',
    shape: SHAPE_LIST[2],
  },
  {
    id: 3,
    color: '#CCFF66',
    shape: SHAPE_LIST[3],
  },
  {
    id: 4,
    color: '#66FF66',
    shape: SHAPE_LIST[4],
  },
  {
    id: 5,
    color: '#66FFCC',
    shape: SHAPE_LIST[5],
  },
  {
    id: 6,
    color: '#66FFFF',
    shape: SHAPE_LIST[6],
  },
];
