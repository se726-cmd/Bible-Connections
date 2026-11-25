const teams = JSON.parse(sessionStorage.getItem("bibleConnectionsTeams") || "[]");
const matchup = document.getElementById("matchup");
const matchStatus = document.getElementById("matchStatus");
const coinControls = document.getElementById("coinControls");
const callingTeam = document.getElementById("callingTeam");
const coin = document.getElementById("coin");
const coinFace = document.getElementById("coinFace");
const flipResult = document.getElementById("flipResult");
const flipButton = document.getElementById("flipButton");
const nextButton = document.getElementById("coinNextButton");
const continueButton = document.getElementById("coinContinueButton");
const sideButtons = [...document.querySelectorAll(".side-choice")];

let activeTeams = teams.map((team, index) => ({ ...team, index }));
let winners = [];
let matches = [];
let matchIndex = 0;
let roundNumber = 1;
let calledSide = "heads";
let completed = false;
let byeTeam = null;

function showMissingTeams() {
  matchStatus.textContent = "Assign your teams before flipping for first.";
  flipButton.hidden = true;
  const backButton = document.createElement("a");
  backButton.className = "play-button";
  backButton.href = "game.html";
  backButton.textContent = "Set up teams";
  matchStatus.after(backButton);
}

function prepareRound() {
  winners = [];
  matches = [];
  byeTeam = null;
  for (let index = 0; index + 1 < activeTeams.length; index += 2) {
    matches.push([activeTeams[index], activeTeams[index + 1]]);
  }
  if (activeTeams.length % 2 === 1) {
    byeTeam = activeTeams[activeTeams.length - 1];
    winners.push(byeTeam);
  }
  matchIndex = 0;
  if (matches.length === 0) {
    finishTournament(winners[0]);
    return;
  }
  showMatch();
}

function showMatch() {
  const [teamA, teamB] = matches[matchIndex];
  const byeNotice = byeTeam ? ` · ${byeTeam.name} has a bye` : "";
  matchStatus.textContent = `Round ${roundNumber} · Match ${matchIndex + 1} of ${matches.length}${byeNotice}`;
  document.getElementById("teamAName").textContent = teamA.name;
  document.getElementById("teamBName").textContent = teamB.name;
  document.getElementById("teamASide").textContent = "";
  document.getElementById("teamBSide").textContent = "";

  callingTeam.replaceChildren();
  [teamA, teamB].forEach((team) => {
    const option = document.createElement("option");
    option.value = String(team.index);
    option.textContent = team.name;
    callingTeam.appendChild(option);
  });

  calledSide = "heads";
  sideButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.side === calledSide);
  });
  updateSideLabels();
  matchup.hidden = false;
  coinControls.hidden = false;
  coin.hidden = false;
  flipButton.hidden = false;
  flipButton.disabled = false;
  flipButton.querySelector("span").textContent = "Flip the coin";
  nextButton.hidden = true;
  continueButton.hidden = true;
  coinFace.textContent = "?";
  coin.classList.remove("flipping", "heads", "tails");
  flipResult.textContent = "";
}

function updateSideLabels() {
  const [teamA, teamB] = matches[matchIndex];
  const callerIndex = Number(callingTeam.value);
  const otherSide = calledSide === "heads" ? "tails" : "heads";
  document.getElementById("teamASide").textContent =
    callerIndex === teamA.index ? `Calls ${calledSide}` : `Gets ${otherSide}`;
  document.getElementById("teamBSide").textContent =
    callerIndex === teamB.index ? `Calls ${calledSide}` : `Gets ${otherSide}`;
}

function finishTournament(winner) {
  if (!winner) {
    matchStatus.textContent = "No teams are available to flip.";
    flipButton.hidden = true;
    return;
  }
  completed = true;
  sessionStorage.setItem("bibleConnectionsFirstTeamIndex", String(winner.index));
  sessionStorage.setItem("bibleConnectionsCurrentTeam", String(winner.index));
  matchStatus.textContent = `${winner.name} wins the flip and goes first!`;
  matchup.hidden = true;
  coinControls.hidden = true;
  coin.hidden = false;
  flipButton.hidden = true;
  nextButton.hidden = true;
  continueButton.hidden = false;
  coinFace.textContent = "★";
  coin.classList.remove("flipping");
  flipResult.textContent = `First up: ${winner.name}`;
  document.getElementById("coinflipIntro").textContent = "The coin-flip winner will be up first when you choose a game.";
}

function finishMatch(winner) {
  winners.push(winner);
  const [teamA, teamB] = matches[matchIndex];
  document.getElementById("teamASide").textContent = winner.index === teamA.index ? "WINNER" : "OUT";
  document.getElementById("teamBSide").textContent = winner.index === teamB.index ? "WINNER" : "OUT";
  matchStatus.textContent = `${winner.name} advances.`;
  flipButton.hidden = true;

  const hasMoreMatches = matchIndex < matches.length - 1;
  if (hasMoreMatches || winners.length > 1 || activeTeams.length > 2) {
    nextButton.querySelector("span").textContent = hasMoreMatches ? "Next matchup" : "Next round";
    nextButton.hidden = false;
  } else {
    finishTournament(winner);
  }
}

callingTeam.addEventListener("change", updateSideLabels);

sideButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (flipButton.hidden || flipButton.disabled) return;
    calledSide = button.dataset.side;
    sideButtons.forEach((sideButton) => {
      sideButton.classList.toggle("active", sideButton === button);
    });
    updateSideLabels();
  });
});

flipButton.addEventListener("click", () => {
  if (completed) return;
  const [teamA, teamB] = matches[matchIndex];
  const selectedCaller = Number(callingTeam.value);
  const caller = selectedCaller === teamA.index ? teamA : teamB;
  const otherTeam = caller.index === teamA.index ? teamB : teamA;
  const result = Math.random() < 0.5 ? "heads" : "tails";
  const winner = result === calledSide ? caller : otherTeam;

  flipButton.disabled = true;
  flipButton.hidden = true;
  coin.classList.remove("heads", "tails");
  coin.classList.add("flipping");
  coinFace.textContent = result === "heads" ? "H" : "T";

  setTimeout(() => {
    coin.classList.remove("flipping");
    coin.classList.add(result);
    flipResult.textContent = `${result === "heads" ? "Heads" : "Tails"}! ${winner.name} advances.`;
    finishMatch(winner);
  }, 750);
});

nextButton.addEventListener("click", () => {
  matchIndex++;
  if (matchIndex < matches.length) {
    showMatch();
    return;
  }

  if (winners.length === 1) {
    finishTournament(winners[0]);
    return;
  }

  activeTeams = winners;
  roundNumber++;
  prepareRound();
});

continueButton.addEventListener("click", () => {
  window.location.href = "play.html";
});

if (teams.length === 0) {
  showMissingTeams();
} else if (teams.length === 1) {
  finishTournament({ ...teams[0], index: 0 });
} else {
  prepareRound();
}
