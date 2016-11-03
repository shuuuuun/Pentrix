import Tetris from './modules/Tetris';

const tetris = new Tetris();
const container = document.querySelector('.container');


// Event
tetris.once('gamestart', () => {
});
tetris.on('gamequit', () => {
  tetris.newGame();
});


// start
tetris.newGame();
