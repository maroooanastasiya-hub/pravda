const fs = require('fs').promises;
const path = require('path');
const Player = require('./Player');
const Question = require('./Question');
const Action = require('./Action');

class GameModel {
  constructor() {
    this.players = [];
    this.questions = {
      easy: [],
      medium: [],
      hard: [],
    };
    this.actions = {
      easy: [],
      medium: [],
      hard: [],
    };
    this.teacherQuestions = {
      yuri: [],
      taras: [],
    };
    this.teacherActions = {
      yuri: [],
      taras: [],
    };
  }

  async init(dataFilePath = path.resolve(__dirname, 'data.json'), teacherDataPath = path.resolve(__dirname, 'teacher_data.json')) {
    await this.loadData(dataFilePath);
    await this.loadTeacherData(teacherDataPath);
    return this;
  }

  async loadData(dataFilePath) {
    try {
      await fs.access(dataFilePath);
      const raw = await fs.readFile(dataFilePath, 'utf8');
      const data = JSON.parse(raw);

      if (data.questions) {
        if (Array.isArray(data.questions)) {
          const allQuestions = data.questions.map((q) => new Question(q.text, q.answer));
          this.questions.easy = [...allQuestions];
          this.questions.medium = [...allQuestions];
          this.questions.hard = [...allQuestions];
        } else {
          ['easy', 'medium', 'hard'].forEach((lvl) => {
            if (Array.isArray(data.questions[lvl])) {
              this.questions[lvl] = data.questions[lvl].map((q) => new Question(q.text, q.answer));
            }
          });
        }
      }

      if (data.actions) {
        if (Array.isArray(data.actions)) {
          const allActions = data.actions.map((a) => new Action(a.text));
          this.actions.easy = [...allActions];
          this.actions.medium = [...allActions];
          this.actions.hard = [...allActions];
        } else {
          ['easy', 'medium', 'hard'].forEach((lvl) => {
            if (Array.isArray(data.actions[lvl])) {
              this.actions[lvl] = data.actions[lvl].map((a) => new Action(a.text));
            }
          });
        }
      }

      if (
        this.questions.easy.length === 0 &&
        this.questions.medium.length === 0 &&
        this.questions.hard.length === 0
      ) {
        this.loadDefaultData();
      }
      if (
        this.actions.easy.length === 0 &&
        this.actions.medium.length === 0 &&
        this.actions.hard.length === 0
      ) {
        this.loadDefaultData();
      }
    } catch (error) {
      // Файл не существует или повреждён, используем данные по умолчанию
      this.loadDefaultData();
    }
  }

  async loadTeacherData(teacherDataPath) {
    try {
      await fs.access(teacherDataPath);
      const raw = await fs.readFile(teacherDataPath, 'utf8');
      const data = JSON.parse(raw);

      if (data.yuri) {
        if (Array.isArray(data.yuri.questions)) {
          this.teacherQuestions.yuri = data.yuri.questions.map((q) => new Question(q.text, q.answer));
        }
        if (Array.isArray(data.yuri.actions)) {
          this.teacherActions.yuri = data.yuri.actions.map((a) => new Action(a.text));
        }
      }

      if (data.taras) {
        if (Array.isArray(data.taras.questions)) {
          this.teacherQuestions.taras = data.taras.questions.map((q) => new Question(q.text, q.answer));
        }
        if (Array.isArray(data.taras.actions)) {
          this.teacherActions.taras = data.taras.actions.map((a) => new Action(a.text));
        }
      }
    } catch (error) {
      // Нет teacher_data.json — просто оставляем пустые массивы
    }
  }

  loadDefaultData() {
    this.questions = {
      easy: [
        new Question('Столица Франции?', 'париж'),
        new Question('2+2=?', '4'),
      ],
      medium: [
        new Question('Сколько сторон у треугольника?', '3'),
        new Question('Какой язык программирования мы сейчас используем?', 'javascript'),
      ],
      hard: [
        new Question('Сколько букв в слове "кот"?', '3'),
        new Question('Назовите протокол передачи данных по интернету (TCP/IP).', 'tcp/ip'),
      ],
    };

    this.actions = {
      easy: [
        new Action('Сделать 5 отжиманий'),
        new Action('Прыгнуть на месте 10 раз'),
      ],
      medium: [
        new Action('Спеть короткую песню'),
        new Action('Рассказать анекдот'),
      ],
      hard: [
        new Action('Станцевать 10 секунд'),
        new Action('Сделать 20 приседаний'),
      ],
    };
  }

  addPlayer(name, role = 'student', teacherName = null) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (this.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return false;
    this.players.push(new Player(trimmed, role, teacherName));
    return true;
  }

  hasPlayers() {
    return this.players.length > 0;
  }

  getRandomQuestion(themeKey) {
    const questions = this.questions[themeKey] && this.questions[themeKey].length > 0
      ? this.questions[themeKey]
      : [...this.questions.easy, ...this.questions.medium, ...this.questions.hard];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  getRandomAction(themeKey) {
    const actions = this.actions[themeKey] && this.actions[themeKey].length > 0
      ? this.actions[themeKey]
      : [...this.actions.easy, ...this.actions.medium, ...this.actions.hard];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  getRandomTeacherQuestion(teacherKey) {
    const qlist = this.teacherQuestions[teacherKey] && this.teacherQuestions[teacherKey].length > 0
      ? this.teacherQuestions[teacherKey]
      : [];
    return qlist.length > 0 ? qlist[Math.floor(Math.random() * qlist.length)] : null;
  }

  getRandomTeacherAction(teacherKey) {
    const alist = this.teacherActions[teacherKey] && this.teacherActions[teacherKey].length > 0
      ? this.teacherActions[teacherKey]
      : [];
    return alist.length > 0 ? alist[Math.floor(Math.random() * alist.length)] : null;
  }

  leaderboard() {
    return [...this.players].sort((a, b) => b.score - a.score);
  }
}

module.exports = GameModel;
