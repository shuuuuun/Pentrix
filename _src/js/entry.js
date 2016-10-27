import Tetris from './modules/Tetris';

var tetris = new Tetris();
var container = document.querySelector('.container');


// Event
tetris.once('gamestart', function(){
});
tetris.on('gamequit', function(){
  tetris.newGame();
});


// start
tetris.newGame();

