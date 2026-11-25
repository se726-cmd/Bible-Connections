const playButton = document.getElementById("playButton");

playButton.addEventListener("click", () => {
  playButton.classList.add("clicked");
  setTimeout(() => {
    window.location.href = `rules.html?refresh=${Date.now()}`;
  }, 220);
});
