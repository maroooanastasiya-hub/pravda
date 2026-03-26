class Player {
  constructor(name, role = 'student', teacherName = null) {
    this.name = name.trim();
    this.score = 0;
    this.role = role;
    this.teacherName = teacherName;
  }

  addPoint(points = 1) {
    this.score += points;
  }
}

module.exports = Player;
