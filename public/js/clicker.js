var marketFront;
var marketBack;

var images = {};

var canvas;
var ctx;

const traders = [];

var totalGold = 1;
var goldPerTurn = 0;

function getWidthPadding() {
  return canvas.width * 0.15;
}

function getHeightPadding() {
  return canvas.height * 0.15;
}

class Trader {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
  }

  render(ctx, width, height) {
    ctx.drawImage(this.img, this.x, this.y, width, height);
  }
}

function renderClicker() {
  requestAnimationFrame(renderClicker);
  const widthPadding = getWidthPadding();
  const heightPadding = getHeightPadding();
  const marketWidth = canvas.width - (widthPadding * 2);
  const marketHeight = canvas.height - (heightPadding * 2);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(images.marketBack, widthPadding, heightPadding, marketWidth, marketHeight);
  traders.forEach(function(trader) {
    trader.render(ctx, marketWidth * .15, marketHeight * .60);
  });
  ctx.drawImage(images.marketFront, widthPadding, heightPadding, marketWidth, marketHeight);
}

function addGold(amount) {
  totalGold += amount;
  $('#gold-counter').text(totalGold);
}

function addGoldPerTurn(amount) {
  goldPerTurn += amount;
  $('#perturn-counter').text(goldPerTurn);
}

function loadImages(imagesToLoad) {
  const imageData = imagesToLoad.pop();

  if (!imageData) {
    renderClicker();
    return;
  }

  const url = `img/${imageData[0]}.png`;
  const img = new Image();
  img.onload = function() {
    images[imageData[1]] = img;
    loadImages(imagesToLoad);
  }
  img.src = url;
}

function addTrader($element) {
  const goldPerTurn = $element.data('work');
  addGoldPerTurn(goldPerTurn);
  const img = images[`trader${getRandomInt(1, 3)}`];
  const widthPadding = getWidthPadding();
  traders.push(new Trader(img, getRandomInt(widthPadding * 2, canvas.width - (widthPadding * 2)), (canvas.height / 2) - getHeightPadding()));
}

$(document).on('ready', function() {
  canvas = document.getElementById('clicker');
  const $clickerCanvasParent = $('#clicker').parent();
  canvas.width = $clickerCanvasParent.width();
  canvas.height = $clickerCanvasParent.parent().height();
  ctx = canvas.getContext('2d');

  var imagesToLoad = [
    ['market_stall_front', 'marketFront'],
    ['market_stall_back', 'marketBack'],
    ['trader_basic_1', 'trader1'],
    ['trader_basic_2', 'trader2'],
    ['trader_basic_3', 'trader3']
  ];
  loadImages(imagesToLoad);

  $('#clicker').on('click', function(e) {
    $('.deleteme').remove();
    addGold(1);
  });

  $('.item').on('click', function(e) {
    const cost = $(this).data('cost');
    if (cost > totalGold) {
      return;
    }
    addGold(-cost);

    const type = $(this).data('item-type');

    if (type == 'clicker') {
      addTrader($(this));
    }
    else if(type == 'builder') {
      const builderType = $(this).data('name');
      workerGroups.push(new WorkerGroup(builderType));
    }
  });

  setInterval(function() {
    addGold(goldPerTurn);
  }, 1000);

});
