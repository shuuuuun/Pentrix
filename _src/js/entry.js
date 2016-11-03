import Pentrix from './modules/Pentrix';

const pentrix = new Pentrix();
const container = document.querySelector('.container');


// Event
pentrix.once('gamestart', () => {
});
pentrix.on('gamequit', () => {
  pentrix.newGame();
});


// start
pentrix.newGame();
