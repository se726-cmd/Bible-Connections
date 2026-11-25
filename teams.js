const namesInput = document.getElementById("namesInput");
const groupCount = document.getElementById("groupCount");
const decreaseGroups = document.getElementById("decreaseGroups");
const increaseGroups = document.getElementById("increaseGroups");
const assignButton = document.getElementById("assignButton");
const continueButton = document.getElementById("continueButton");
const teamGrid = document.getElementById("teamGrid");
const playerCount = document.getElementById("playerCount");
const groupNames = new Map();

function clampGroups() {
  const value = Number.parseInt(groupCount.value, 10) || 1;
  groupCount.value = Math.min(20, Math.max(1, value));
}

decreaseGroups.addEventListener("click", () => {
  clampGroups();
  groupCount.value = Math.max(1, Number(groupCount.value) - 1);
});

increaseGroups.addEventListener("click", () => {
  clampGroups();
  groupCount.value = Math.min(20, Number(groupCount.value) + 1);
});

groupCount.addEventListener("change", clampGroups);

assignButton.addEventListener("click", () => {
  clampGroups();

  const names = namesInput.value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    continueButton.hidden = true;
    sessionStorage.removeItem("bibleConnectionsTeams");
    namesInput.focus();
    namesInput.classList.remove("shake");
    void namesInput.offsetWidth;
    namesInput.classList.add("shake");
    teamGrid.innerHTML = '<p class="empty-state">Add at least one name first.</p>';
    playerCount.textContent = "0 players";
    return;
  }

  const uniqueNames = [...new Map(names.map((name) => [name.toLowerCase(), name])).values()];
  const shuffled = [...uniqueNames];
  sessionStorage.removeItem("bibleConnectionsFirstTeamIndex");
  sessionStorage.removeItem("bibleConnectionsCurrentTeam");
  sessionStorage.removeItem("bibleConnectionsScores");

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  const count = Math.min(Number(groupCount.value), shuffled.length);
  const teams = Array.from({ length: count }, () => []);

  shuffled.forEach((name, index) => {
    teams[index % count].push(name);
  });

  playerCount.textContent = `${shuffled.length} ${shuffled.length === 1 ? "player" : "players"}`;
  teamGrid.innerHTML = "";
  teamGrid.style.setProperty("--team-count", count);

  teams.forEach((team, index) => {
    const card = document.createElement("article");
    card.className = "team-card";

    const heading = document.createElement("h2");
    const nameInput = document.createElement("input");
    nameInput.className = "team-name-input";
    nameInput.type = "text";
    nameInput.maxLength = 40;
    nameInput.value = groupNames.get(index) || `Group ${String(index + 1).padStart(2, "0")}`;
    nameInput.setAttribute("aria-label", `Name for group ${index + 1}`);
    nameInput.addEventListener("input", () => {
      groupNames.set(index, nameInput.value);
    });

    const memberCount = document.createElement("strong");
    memberCount.textContent = String(team.length);
    heading.append(nameInput, memberCount);

    const list = document.createElement("ul");
    team.forEach((name) => {
      const item = document.createElement("li");
      item.textContent = name;
      list.appendChild(item);
    });

    card.append(heading, list);
    teamGrid.appendChild(card);
  });

  const assignedTeams = teams.map((team, index) => ({
    name: groupNames.get(index) || `Group ${String(index + 1).padStart(2, "0")}`,
    players: team
  }));
  sessionStorage.setItem("bibleConnectionsTeams", JSON.stringify(assignedTeams));
  continueButton.hidden = false;
});

continueButton.addEventListener("click", () => {
  window.location.href = "coinflip.html";
});

document.getElementById("previousPageButton").addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = `rules.html?refresh=${Date.now()}`;
});
