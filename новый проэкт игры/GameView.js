const inquirer = require('inquirer').default || require('inquirer');

class GameView {
  constructor() {
    this.output = [];
  }

  async prompt(question) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'answer',
        message: question,
      },
    ]);
    return answers.answer;
  }

  async promptChoice(options) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Выберите опцию:',
        choices: options,
      },
    ]);
    return answers.choice;
  }

  printLine(text = '') {
    console.log(text);
    this.output.push(text);
  }

  displayLeaderboard(players) {
    console.log('\n=== Таблица лидеров ===');
    console.log('Имя\tРоль\tОчки');
    players.forEach((p) => console.log(`${p.name}\t${p.role}${p.teacherName ? ' (' + p.teacherName + ')' : ''}\t${p.score}`));
    console.log('=======================\n');
  }

  close() {
    // Inquirer не требует закрытия
  }
}

module.exports = GameView;
