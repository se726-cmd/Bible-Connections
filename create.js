const STORAGE_KEY = "bibleConnectionsGames";
const gameForm = document.getElementById("gameForm");
const categoryFields = document.getElementById("categoryFields");
const savedGamesList = document.getElementById("savedGamesList");
const savedCount = document.getElementById("savedCount");
const formError = document.getElementById("formError");
const saveGameButton = document.getElementById("saveGameButton");
const verseEditorDialog = document.getElementById("verseEditorDialog");
const verseEditorForm = document.getElementById("verseEditorForm");
const verseEditorEntries = document.getElementById("verseEditorEntries");
const verseEditorTitle = document.getElementById("verseEditorTitle");
const verseEditorError = document.getElementById("verseEditorError");
let editingGameId = null;

const categoryColors = ["yellow", "pink", "blue", "cream"];

categoryColors.forEach((color, index) => {
  const fieldset = document.createElement("fieldset");
  fieldset.className = `category-field ${color}`;

  const legend = document.createElement("legend");
  legend.textContent = `Group ${String(index + 1).padStart(2, "0")}`;

  const categoryName = document.createElement("input");
  categoryName.className = "text-field category-name";
  categoryName.type = "text";
  categoryName.placeholder = "Connection name";
  categoryName.required = true;
  categoryName.setAttribute("aria-label", `Group ${index + 1} connection name`);

  const words = document.createElement("input");
  words.className = "text-field category-words";
  words.type = "text";
  words.placeholder = "Four words, separated by commas";
  words.required = true;
  words.setAttribute("aria-label", `Four words for group ${index + 1}`);

  fieldset.append(legend, categoryName, words);
  categoryFields.appendChild(fieldset);
});

function getSavedGames() {
  const storedGames = localStorage.getItem(STORAGE_KEY);
  if (!storedGames) return [];

  const games = JSON.parse(storedGames);
  if (!Array.isArray(games)) {
    throw new Error("Saved games data is invalid.");
  }
  return games;
}

function addVerseEntry(verse = {}) {
  const entry = document.createElement("fieldset");
  entry.className = "verse-editor-entry";

  const entryHeading = document.createElement("legend");
  entryHeading.textContent = `Verse ${verseEditorEntries.children.length + 1}`;

  const referenceLabel = document.createElement("label");
  referenceLabel.textContent = "Reference";
  const referenceInput = document.createElement("input");
  referenceInput.className = "verse-reference-input";
  referenceInput.type = "text";
  referenceInput.placeholder = "e.g. John 3:16";
  referenceInput.value = verse.reference || "";
  referenceLabel.appendChild(referenceInput);

  const textLabel = document.createElement("label");
  textLabel.textContent = "Verse text";
  const textInput = document.createElement("textarea");
  textInput.className = "verse-text-input";
  textInput.rows = 3;
  textInput.placeholder = "Enter or paste the verse";
  textInput.value = verse.text || "";
  textLabel.appendChild(textInput);

  const removeButton = document.createElement("button");
  removeButton.className = "verse-remove-button";
  removeButton.type = "button";
  removeButton.textContent = "Remove verse";
  removeButton.addEventListener("click", () => {
    entry.remove();
    [...verseEditorEntries.querySelectorAll(".verse-editor-entry")].forEach((verseEntry, index) => {
      verseEntry.querySelector("legend").textContent = `Verse ${index + 1}`;
    });
  });

  entry.append(entryHeading, referenceLabel, textLabel, removeButton);
  verseEditorEntries.appendChild(entry);
}

function openVerseEditor(gameId) {
  try {
    const game = getSavedGames().find((item) => item.id === gameId);
    if (!game) {
      throw new Error("This saved game could not be found.");
    }

    editingGameId = gameId;
    verseEditorTitle.textContent = `Add verses to ${game.title}`;
    verseEditorError.textContent = "";
    verseEditorEntries.replaceChildren();
    const verses = Array.isArray(game.verses) ? game.verses : [];
    if (verses.length) {
      verses.forEach(addVerseEntry);
    } else {
      addVerseEntry();
    }
    verseEditorDialog.showModal();
    verseEditorEntries.querySelector(".verse-reference-input").focus();
  } catch (error) {
    formError.textContent = error instanceof Error ? error.message : "Could not open this game's verses.";
  }
}

function renderSavedGames() {
  const games = getSavedGames();
  savedCount.textContent = String(games.length);
  savedGamesList.replaceChildren();

  if (games.length === 0) {
    const empty = document.createElement("p");
    empty.className = "saved-empty";
    empty.textContent = "Your created games will show up here.";
    savedGamesList.appendChild(empty);
  }

  games.forEach((game, index) => {
    const card = document.createElement("article");
    card.className = "saved-game-card";

    const number = document.createElement("span");
    number.className = "saved-game-number";
    number.textContent = `GAME ${String(index + 1).padStart(2, "0")}`;

    const title = document.createElement("h3");
    title.textContent = game.title;

    const groupSummary = document.createElement("p");
    groupSummary.textContent = game.categories.map((category) => category.name).join(" · ");

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-game-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Remove";
    deleteButton.setAttribute("aria-label", `Remove ${game.title}`);
    deleteButton.addEventListener("click", () => {
      const currentGames = getSavedGames();
      currentGames.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentGames));
      renderSavedGames();
    });

    const actions = document.createElement("div");
    actions.className = "saved-game-actions";

    const versesButton = document.createElement("button");
    versesButton.className = "verse-edit-button";
    versesButton.type = "button";
    versesButton.textContent = "Add verses";
    versesButton.setAttribute("aria-label", `Add verses for ${game.title}`);
    versesButton.addEventListener("click", () => openVerseEditor(game.id));

    actions.append(versesButton, deleteButton);
    card.append(number, title, groupSummary, actions);
    savedGamesList.appendChild(card);
  });

  saveGameButton.disabled = false;
  saveGameButton.querySelector("span").textContent = "Save this game";
}

gameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";

  try {
    const games = getSavedGames();
    const title = document.getElementById("gameTitle").value.trim();
    const categoryInputs = [...categoryFields.querySelectorAll(".category-field")];
    const categories = categoryInputs.map((fieldset) => ({
      name: fieldset.querySelector(".category-name").value.trim(),
      words: fieldset.querySelector(".category-words").value
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean)
    }));

    if (categories.some((category) => category.words.length !== 4)) {
      formError.textContent = "Every group needs exactly four comma-separated words.";
      return;
    }

    const allWords = categories.flatMap((category) => category.words);
    const uniqueWords = new Set(allWords.map((word) => word.toLocaleLowerCase()));
    if (uniqueWords.size !== 16) {
      formError.textContent = "All 16 words must be unique within a game.";
      return;
    }

    if (categories.some((category) => !category.name)) {
      formError.textContent = "Give each group a connection name.";
      return;
    }

    games.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      categories,
      verses: []
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    gameForm.reset();
    renderSavedGames();
    document.getElementById("gameTitle").focus();
  } catch (error) {
    formError.textContent = error instanceof Error ? error.message : "Could not save this game.";
  }
});

document.getElementById("addVerseEntry").addEventListener("click", () => addVerseEntry());
document.getElementById("closeVerseEditor").addEventListener("click", () => verseEditorDialog.close());
document.getElementById("cancelVerseEditor").addEventListener("click", () => verseEditorDialog.close());

verseEditorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  verseEditorError.textContent = "";

  const verses = [...verseEditorEntries.querySelectorAll(".verse-editor-entry")].map((entry) => ({
    reference: entry.querySelector(".verse-reference-input").value.trim(),
    text: entry.querySelector(".verse-text-input").value.trim()
  }));
  const completedVerses = verses.filter((verse) => verse.reference || verse.text);

  if (completedVerses.some((verse) => !verse.reference || !verse.text)) {
    verseEditorError.textContent = "Enter both a reference and verse text, or remove the empty verse.";
    return;
  }

  try {
    const games = getSavedGames();
    const game = games.find((item) => item.id === editingGameId);
    if (!game) {
      throw new Error("This saved game could not be found.");
    }
    game.verses = completedVerses;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    verseEditorDialog.close();
    renderSavedGames();
  } catch (error) {
    verseEditorError.textContent = error instanceof Error ? error.message : "Could not save these verses.";
  }
});

renderSavedGames();
