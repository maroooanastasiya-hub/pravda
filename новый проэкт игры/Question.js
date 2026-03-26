class Question {
  constructor(text, answer) {
    this.text = text;
    this.answer = answer.trim().toLowerCase();
  }
}

module.exports = Question;
