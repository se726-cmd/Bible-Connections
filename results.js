const teams = JSON.parse(sessionStorage.getItem("bibleConnectionsTeams") || "[]");
const scores = JSON.parse(sessionStorage.getItem("bibleConnectionsScores") || "{}");
const finalScoreboard = document.getElementById("finalScoreboard");
const winnerAnnouncement = document.getElementById("winnerAnnouncement");
const resultsTitle = document.getElementById("resultsTitle");
const confettiRain = document.getElementById("confettiRain");

const standings = teams.map((team, index) => ({
  name: team.name,
  score: Number(scores[String(index)] ?? scores[team.name] ?? 0)
}));
const highestScore = standings.length ? Math.max(...standings.map((team) => team.score)) : 0;
const winners = standings.filter((team) => team.score === highestScore);

if (standings.length === 0) {
  resultsTitle.textContent = "No teams to score yet";
  winnerAnnouncement.textContent = "Set up teams and play a round to see the results.";
} else if (winners.length > 1) {
  resultsTitle.textContent = "It’s a tie!";
  winnerAnnouncement.textContent = `${winners.map((team) => team.name).join(" and ")} finish with ${highestScore} points each.`;
} else {
  resultsTitle.textContent = `${winners[0].name} wins!`;
  winnerAnnouncement.textContent = `The winning score is ${highestScore} ${highestScore === 1 ? "point" : "points"}.`;
}

standings.forEach((team, index) => {
  const card = document.createElement("article");
  card.className = "final-score-card";
  if (team.score === highestScore) card.classList.add("leader");

  const rank = document.createElement("span");
  rank.className = "final-rank";
  rank.textContent = String(index + 1).padStart(2, "0");

  const name = document.createElement("h2");
  name.textContent = team.name;

  const score = document.createElement("strong");
  score.textContent = String(team.score);

  card.append(rank, name, score);
  finalScoreboard.appendChild(card);
});

if (standings.length > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const colors = ["#f2aabd", "#dbe7a5", "#f7f2e8", "#df7fa1", "#83b8a5"];
  for (let index = 0; index < 110; index++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--confetti-left", `${Math.random() * 100}%`);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 1.8}s`);
    piece.style.setProperty("--confetti-duration", `${3.2 + Math.random() * 2.2}s`);
    piece.style.setProperty("--confetti-drift", `${Math.random() * 220 - 110}px`);
    piece.style.setProperty("--confetti-rotation", `${Math.random() * 900 - 450}deg`);
    piece.style.backgroundColor = colors[index % colors.length];
    confettiRain.appendChild(piece);
  }
}
