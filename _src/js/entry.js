import Pentrix from './modules/Pentrix';


// Init
const pentrix = new Pentrix();
const container = document.querySelector('.container');


// Event
pentrix.on('gamequit', () => {
  pentrix.newGame();
});


// Start
pentrix.newGame();
