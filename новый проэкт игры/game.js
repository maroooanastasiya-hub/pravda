const GameController = require('./GameController');
const GameModel = require('./GameModel');
const GameView = require('./GameView');

async function main() {
  const model = await new GameModel().init();
  const view = new GameView();
  const controller = new GameController(model, view);

  await controller.run();
}

main().catch((error) => {
  console.error('Ошибка выполнения игры:', error);
});
