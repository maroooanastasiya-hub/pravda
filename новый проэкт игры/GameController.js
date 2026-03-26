/* eslint no-constant-condition: "off" */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class GameController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.maxRounds = 10;
    this.currentTheme = 1;
  }

  async selectTheme() {
    const themeChoice = await this.view.promptChoice(['Легкая (100 очков)', 'Средняя (500 очков)', 'Сложная (1000 очков)']);
    if (themeChoice === 'Легкая (100 очков)') this.currentTheme = 1;
    else if (themeChoice === 'Средняя (500 очков)') this.currentTheme = 2;
    else if (themeChoice === 'Сложная (1000 очков)') this.currentTheme = 3;
    else {
      this.view.printLine('Неверный выбор, по умолчанию тема 1');
      this.currentTheme = 1;
    }
    this.view.printLine(`Текущая тема: ${this.currentTheme} (одно задание = ${this.getThemePoints()} очков)`);
  }

  getThemeKey() {
    if (this.currentTheme === 2) return 'medium';
    if (this.currentTheme === 3) return 'hard';
    return 'easy';
  }

  getThemePoints() {
    if (this.currentTheme === 2) return 500;
    if (this.currentTheme === 3) return 1000;
    return 100;
  }

  async run() {
    this.view.printLine('Добро пожаловать в игру "Правда или действие"!');
    await this.playerSetupLoop();

    if (!this.model.hasPlayers()) {
      this.view.printLine('Игроки не добавлены. Выход.');
      this.view.close();
      return;
    }

    let currentRound = 0;

    while (currentRound < this.maxRounds) {
      this.view.printLine(`\nРаунд ${currentRound + 1} из ${this.maxRounds}`);
      const actionChoice = await this.view.promptChoice(['Бросить кубик', 'Завершить игру']);

      if (actionChoice === 'Завершить игру') {
        break;
      }

      const selectedPlayer = this.model.players[Math.floor(Math.random() * this.model.players.length)];
      this.view.printLine(`Выбран игрок: ${selectedPlayer.name} (${selectedPlayer.role}${selectedPlayer.teacherName ? ' - ' + selectedPlayer.teacherName : ''})`);

      if (selectedPlayer.role === 'student') {
        await this.selectTheme();
      }

      currentRound += 1;

      const choice = await this.getChoiceTruthOrAction(selectedPlayer);
      if (choice === 'правда') {
        await this.handleTruth(selectedPlayer);
      } else {
        await this.handleAction(selectedPlayer);
      }
    }

    this.view.displayLeaderboard(this.model.leaderboard());
    this.view.printLine('Спасибо за игру!');
    this.view.close();
  }

  async playerSetupLoop() {
    while (true) {
      const choice = await this.view.promptChoice(['Добавить игрока', 'Начать игру', 'Выйти']);

      if (choice === 'Добавить игрока') {
        const name = await this.view.prompt('Введите имя игрока: ');
        const roleChoice = await this.view.promptChoice(['Студент', 'Преподаватель Юрий', 'Преподаватель Тарас']);
        let role = 'student';
        let teacherName = null;
        if (roleChoice === 'Студент') {
          role = 'student';
        } else if (roleChoice === 'Преподаватель Юрий') {
          role = 'teacher';
          teacherName = 'yuri';
        } else if (roleChoice === 'Преподаватель Тарас') {
          role = 'teacher';
          teacherName = 'taras';
        }

        if (this.model.addPlayer(name, role, teacherName)) {
          this.view.printLine(`Игрок '${name}' добавлен как ${role}${teacherName ? ' (' + teacherName + ')' : ''}.`);
        } else {
          this.view.printLine('Неверное имя или игрок с таким именем уже существует.');
        }
      } else if (choice === 'Начать игру') {
        if (!this.model.hasPlayers()) {
          this.view.printLine('Сначала добавьте хотя бы одного игрока.');
          continue;
        }
        break;
      } else if (choice === 'Выйти') {
        break;
      }
    }
  }

  async rollDiceAnimation(player) {
    const frames = ['🎲', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    this.view.printLine(`${player.name} бросает кубик...`);
    for (let i = 0; i < 15; i++) {
      const symbol = frames[Math.floor(Math.random() * frames.length)];
      process.stdout.write(`\r${symbol} `);
      await sleep(80);
    }
    process.stdout.write('\r');
  }

  async getChoiceTruthOrAction(player) {
    await this.rollDiceAnimation(player);
    const dice = Math.floor(Math.random() * 6) + 1;
    this.view.printLine(`Выпало: ${dice}`);

    if (dice === 1 || dice === 2) {
      this.view.printLine('Результат: правда');
      return 'правда';
    }

    if (dice === 3 || dice === 4) {
      this.view.printLine('Результат: действие');
      return 'действие';
    }

    const choice = await this.view.promptChoice(['правда', 'действие']);
    return choice;
  }

  async handleTruth(player) {
    let q;
    let points = 0;

    if (player.role === 'teacher') {
      q = this.model.getRandomTeacherQuestion(player.teacherName);
      points = 1000;
      this.view.printLine(`Тема преподавателя ${player.teacherName}.`);
    } else {
      const themeKey = this.getThemeKey();
      q = this.model.getRandomQuestion(themeKey);
      points = this.getThemePoints();
    }

    if (!q) {
      this.view.printLine('Вопросы для выбранной роли/темы не найдены.');
      return;
    }

    this.view.printLine(`Вопрос: ${q.text}`);
    const answer = (await this.view.prompt('Ваш ответ: ')).toLowerCase();
    if (answer === q.answer) {
      player.addPoint(points);
      this.view.printLine(`Правильно! +${points} очков`);
    } else {
      this.view.printLine(`Неправильно. Правильный ответ: ${q.answer}`);
    }
  }

  async handleAction(player) {
    let action;
    let points = 0;

    let sourceList;

    if (player.role === 'teacher') {
      sourceList = this.model.teacherActions[player.teacherName];
      action = this.model.getRandomTeacherAction(player.teacherName);
      points = 1000;
      this.view.printLine(`Тема преподавателя ${player.teacherName}.`);
    } else {
      const themeKey = this.getThemeKey();
      sourceList = this.model.actions[themeKey];
      action = this.model.getRandomAction(themeKey);
      points = this.getThemePoints();
    }

    if (!action) {
      this.view.printLine('Действия для выбранной роли/темы не найдены.');
      return;
    }

    this.view.printLine(`Действие: ${action.text}`);
    const done = await this.view.promptChoice(['да', 'нет']);
    if (['да', 'выполнил', 'yes', 'y'].includes(done)) {
      player.addPoint(points);
      this.view.printLine(`Отлично! +${points} очков`);

      if (sourceList && sourceList.length > 0) {
        const textToRemove = action.text;
        sourceList = sourceList.filter((item) => item.text.toLowerCase() !== textToRemove.toLowerCase());
        if (player.role === 'teacher') {
          this.model.teacherActions[player.teacherName] = sourceList;
        } else {
          const themeKey = this.getThemeKey();
          this.model.actions[themeKey] = sourceList;
        }
      }
    } else {
      this.view.printLine('Хорошо, идем дальше.');
    }
  }

  async askStop() {
    const stop = (await this.view.prompt('Завершить игру сейчас? (да/нет): ')).toLowerCase();
    return ['да', 'y', 'yes'].includes(stop);
  }
}

module.exports = GameController;
