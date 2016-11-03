import Tetris from './modules/Tetris';

var tetris = new Tetris();
var container = document.querySelector('.container');


// Event
tetris.once('gamestart', () => {
});
tetris.on('gamequit', () => {
  tetris.newGame();
});


// start
tetris.newGame();
