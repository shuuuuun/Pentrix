import qs from 'querystring';

// Location
const locationHash = (location.hash || '').replace(/^#/, '');
const locationSearch = (location.search || '').replace(/^\?/, '');
const locationParams = qs.parse(locationSearch);

// Init
const sample_image_list = ['./img/block_1.png','./img/block_2.png','./img/block_3.png','./img/block_4.png','./img/block_5.png','./img/block_6.png','./img/block_7.png','./img/block_8.png','./img/block_9.png'];
const container = document.querySelector('.container');
const gameRoot = document.getElementById('game-root');
const pentrix = new Pentrix({
  rootElement: gameRoot,
  blockImageList: locationParams.image === undefined ? null : sample_image_list.map(src => {
    const img = new Image();
    img.src = src;
    return img;
  }),
});


// Event
pentrix.on('gamequit', () => {
  pentrix.newGame();
});


// Start
pentrix.newGame();
