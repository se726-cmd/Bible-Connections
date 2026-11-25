const gameId = new URLSearchParams(window.location.search).get("gameId");
const games = JSON.parse(localStorage.getItem("bibleConnectionsGames") || "[]");
const teams = JSON.parse(sessionStorage.getItem("bibleConnectionsTeams") || "[]");
const teamIndex = Number(sessionStorage.getItem("bibleConnectionsCurrentTeam") || 0);
const game = games.find((item) => item.id === gameId);
const team = teams[teamIndex];

const wordGrid = document.getElementById("wordGrid");
const solvedGroups = document.getElementById("solvedGroups");
const submitButton = document.getElementById("submitButton");
const shuffleButton = document.getElementById("shuffleButton");
const roundFeedback = document.getElementById("roundFeedback");
const connectionForm = document.getElementById("connectionForm");
const connectionAnswer = document.getElementById("connectionAnswer");
const connectionTries = document.getElementById("connectionTries");
const nextRoundButton = document.getElementById("nextRoundButton");
const endGameButton = document.getElementById("endGameButton");
const showProofButton = document.getElementById("showProofButton");
const proofDialog = document.getElementById("proofDialog");
const proofVerses = document.getElementById("proofVerses");
const roundFinishActions = document.getElementById("roundFinishActions");
const roundInstructions = document.getElementById("roundInstructions");
const roundTeam = document.getElementById("roundTeam");
const scoreEditor = document.getElementById("scoreEditor");
const finalScore = document.getElementById("finalScore");

let tiles = [];
let selected = new Set();
let pendingWordIds = new Set();
let solved = [];
let pendingCategory = null;
let triesLeft = 2;
let points = 0;
let mistakes = 0;
let scoreSaved = false;

function completeRound() {
  roundInstructions.textContent = "Round complete.";
  let scoreDisplay = document.querySelector(".round-score");
  if (!scoreDisplay) {
    scoreDisplay = document.createElement("p");
    scoreDisplay.className = "round-score";
    roundFeedback.after(scoreDisplay);
  }

  finalScore.value = String(points);
  scoreEditor.hidden = false;
  scoreDisplay.textContent = `${team.name} scored ${points} ${points === 1 ? "point" : "points"} this round.`;
  submitButton.hidden = true;
  shuffleButton.hidden = true;
  roundFinishActions.hidden = false;
}

function showError(message) {
  roundFeedback.textContent = message;
  submitButton.hidden = true;
  shuffleButton.hidden = true;
  showProofButton.hidden = true;
  nextRoundButton.hidden = false;
  endGameButton.hidden = true;
  roundFinishActions.hidden = false;
  nextRoundButton.querySelector("span").textContent = "Back to game choices";
}

if (!game || !team) {
  showError("Choose a saved game after setting up your teams.");
} else {
  document.getElementById("roundMeta").textContent = game.title;
  roundTeam.textContent = `${team.name} is playing`;
  roundInstructions.textContent = "Select four words that belong together.";
  tiles = game.categories.flatMap((category, categoryIndex) =>
    category.words.map((word, wordIndex) => ({
      id: `${categoryIndex}-${wordIndex}`,
      word,
      categoryIndex
    }))
  );
  shuffleTiles();
}

function shuffleTiles() {
  for (let index = tiles.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [tiles[index], tiles[randomIndex]] = [tiles[randomIndex], tiles[index]];
  }
  renderTiles();
}

function renderTiles() {
  wordGrid.replaceChildren();

  tiles.forEach((tile) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-tile";
    button.textContent = tile.word;
    const isSelected = selected.has(tile.id) || pendingWordIds.has(tile.id);
    button.setAttribute("aria-pressed", String(isSelected));
    if (isSelected) button.classList.add("selected");
    button.disabled = Boolean(pendingCategory);
    button.addEventListener("click", () => {
      if (selected.has(tile.id)) {
        selected.delete(tile.id);
      } else if (selected.size < 4) {
        selected.add(tile.id);
      }
      roundFeedback.textContent = "";
      renderTiles();
    });
    wordGrid.appendChild(button);
  });

  submitButton.disabled = selected.size !== 4 || Boolean(pendingCategory);
}

function renderSolvedGroups() {
  solvedGroups.replaceChildren();
  solved.forEach((category) => {
    const row = document.createElement("div");
    row.className = "solved-group";
    const title = document.createElement("strong");
    title.textContent = category.name;
    const words = document.createElement("span");
    words.textContent = category.words.join(" · ");
    row.append(title, words);
    solvedGroups.appendChild(row);
  });
}

function beginConnectionGuess(category) {
  pendingCategory = category;
  triesLeft = 2;
  pendingWordIds = new Set(selected);
  selected.clear();
  roundFeedback.textContent = "That's the group! Name the connection for a point.";
  connectionAnswer.value = "";
  connectionTries.textContent = "2 tries";
  connectionForm.hidden = false;
  connectionAnswer.focus();
  renderTiles();
}

submitButton.addEventListener("click", () => {
  if (selected.size !== 4 || !game) return;

  const selectedIds = [...selected];
  const categoryIndex = tiles.find((tile) => selected.has(tile.id))?.categoryIndex;
  const match = categoryIndex !== undefined &&
    selectedIds.every((id) => tiles.some((tile) => tile.id === id && tile.categoryIndex === categoryIndex));

  if (!match) {
    mistakes++;
    const oneAway = game.categories.some((category, index) =>
      !solved.some((item) => item.index === index) &&
      tiles.filter((tile) => selected.has(tile.id) && tile.categoryIndex === index).length === 3
    );
    roundFeedback.textContent = oneAway ? "One away..." : "Those words don't make a group. Try again.";
    selected.clear();
    renderTiles();
    return;
  }

  const category = game.categories[categoryIndex];
  points += 1;
  beginConnectionGuess({ ...category, index: categoryIndex });
});

connectionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!pendingCategory) return;

  const answer = connectionAnswer.value.trim().toLocaleLowerCase();
  if (answer === pendingCategory.name.trim().toLocaleLowerCase()) {
    points += solved.length === game.categories.length - 1 ? 2 : 1;
    solved.push(pendingCategory);
    tiles = tiles.filter((tile) => tile.categoryIndex !== pendingCategory.index);
    roundFeedback.textContent = solved.length === game.categories.length
      ? "All four connections found!"
      : `Correct! ${pendingCategory.name} is the connection.`;
    pendingCategory = null;
    pendingWordIds.clear();
    connectionForm.hidden = true;
    renderSolvedGroups();
    renderTiles();

    if (solved.length === game.categories.length) {
      completeRound();
    }
    return;
  }

  triesLeft--;
  if (triesLeft > 0) {
    connectionTries.textContent = `${triesLeft} try left`;
    roundFeedback.textContent = "Not quite. Try the connection one more time.";
    connectionAnswer.select();
  } else {
    solved.push(pendingCategory);
    tiles = tiles.filter((tile) => tile.categoryIndex !== pendingCategory.index);
    roundFeedback.textContent = `The connection was ${pendingCategory.name}.`;
    pendingCategory = null;
    pendingWordIds.clear();
    connectionForm.hidden = true;
    renderSolvedGroups();
    renderTiles();

    if (solved.length === game.categories.length) {
      completeRound();
    }
  }
});

finalScore.addEventListener("input", () => {
  if (finalScore.value === "") return;
  points = Math.max(0, Math.floor(Number(finalScore.value) || 0));
  finalScore.value = String(points);
  const scoreDisplay = document.querySelector(".round-score");
  scoreDisplay.textContent = `${team.name} scored ${points} ${points === 1 ? "point" : "points"} this round.`;
});

shuffleButton.addEventListener("click", shuffleTiles);

function saveRoundScore() {
  if (!game || !team || solved.length !== game.categories.length || scoreSaved) return;

  const scores = JSON.parse(sessionStorage.getItem("bibleConnectionsScores") || "{}");
  const scoreKey = String(teamIndex);
  const existingScore = scores[scoreKey] ?? scores[team.name] ?? 0;
  scores[scoreKey] = Number(existingScore) + points;
  sessionStorage.setItem("bibleConnectionsScores", JSON.stringify(scores));
  scoreSaved = true;
}

nextRoundButton.addEventListener("click", () => {
  saveRoundScore();
  window.location.href = "play.html";
});

endGameButton.addEventListener("click", () => {
  saveRoundScore();
  window.location.href = "results.html";
});

showProofButton.addEventListener("click", () => {
  proofVerses.replaceChildren();
  const verses = Array.isArray(game?.verses)
    ? game.verses.filter((verse) => verse.reference && verse.text)
    : [];

  if (verses.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "proof-empty";
    emptyMessage.textContent = "No verses have been added to this game yet.";
    proofVerses.appendChild(emptyMessage);
  } else {
    verses.forEach((verse) => {
      const card = document.createElement("article");
      card.className = "proof-verse";
      const reference = document.createElement("h3");
      reference.textContent = verse.reference;
      const text = document.createElement("p");
      text.textContent = verse.text;
      card.append(reference, text);
      proofVerses.appendChild(card);
    });
  }

  proofDialog.showModal();
});

document.getElementById("closeProofDialog").addEventListener("click", () => proofDialog.close());
