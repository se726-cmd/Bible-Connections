const teamPicker = document.getElementById("teamPicker");
const gameChoices = document.getElementById("gameChoices");
const playEmpty = document.getElementById("playEmpty");

const teams = JSON.parse(sessionStorage.getItem("bibleConnectionsTeams") || "[]");
const games = JSON.parse(localStorage.getItem("bibleConnectionsGames") || "[]");

if (teams.length === 0) {
  playEmpty.textContent = "Assign your teams before choosing a game.";
  playEmpty.hidden = false;
  const assignLink = document.createElement("a");
  assignLink.className = "play-button";
  assignLink.href = "game.html";
  assignLink.textContent = "Set up teams";
  gameChoices.appendChild(assignLink);
} else if (games.length === 0) {
  playEmpty.textContent = "There are no saved puzzles yet. Create your games first.";
  playEmpty.hidden = false;
  const createLink = document.createElement("a");
  createLink.className = "play-button";
  createLink.href = "create.html?verses=1";
  createLink.textContent = "Create games";
  gameChoices.appendChild(createLink);
} else {
  const selectedTeam = document.createElement("select");
  selectedTeam.className = "play-team-select";
  selectedTeam.setAttribute("aria-label", "Choose which team is playing this round");

  teams.forEach((team, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = team.name;
    selectedTeam.appendChild(option);
  });

  teamPicker.append(selectedTeam);

  const currentTeamIndex = sessionStorage.getItem("bibleConnectionsCurrentTeam");
  const firstTeamIndex = sessionStorage.getItem("bibleConnectionsFirstTeamIndex");
  const savedTeamIndex = Number(currentTeamIndex ?? firstTeamIndex ?? 0);
  if (Number.isInteger(savedTeamIndex) && savedTeamIndex >= 0 && savedTeamIndex < teams.length) {
    selectedTeam.value = String(savedTeamIndex);
  }
  if (firstTeamIndex !== null && teams[Number(firstTeamIndex)]) {
    document.getElementById("gamePickerKicker").lastChild.textContent =
      ` ${teams[Number(firstTeamIndex)].name} goes first`;
  }

  selectedTeam.addEventListener("change", () => {
    sessionStorage.setItem("bibleConnectionsCurrentTeam", selectedTeam.value);
  });

  games.forEach((game, index) => {
    const card = document.createElement("article");
    card.className = "game-choice-card";

    const indexLabel = document.createElement("span");
    indexLabel.className = "game-choice-number";
    indexLabel.textContent = index === 4 ? "BONUS GAME" : `GAME ${String(index + 1).padStart(2, "0")}`;

    const title = document.createElement("h2");
    title.textContent = game.title;

    const groups = document.createElement("p");
    groups.textContent = "16 words · 4 connections";

    const chooseButton = document.createElement("button");
    chooseButton.className = "play-button choose-game-button";
    chooseButton.type = "button";
    chooseButton.innerHTML = "<span>Play this game</span><span class=\"arrow\" aria-hidden=\"true\">↗</span>";
    chooseButton.addEventListener("click", () => {
      sessionStorage.setItem("bibleConnectionsCurrentTeam", selectedTeam.value);
      window.location.href = `round.html?gameId=${encodeURIComponent(game.id)}`;
    });

    card.append(indexLabel, title, groups, chooseButton);
    gameChoices.appendChild(card);
  });
}
