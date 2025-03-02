const darkModeLink = document.getElementById("dark-mode-css");
const darkModeToggle = document.getElementById("dark-mode-toggle");

initializeDarkMode();

function initializeDarkMode() {
    let darkMode;
    if (localStorage.getItem("dark-mode")) {
        darkMode = localStorage.getItem("dark-mode") == "true";
    } else {
        darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    darkModeLink.disabled = !darkMode;
    darkModeToggle.checked = darkMode;
}

darkModeToggle.addEventListener("input", () => {
    darkModeLink.disabled = !darkModeToggle.checked;
    localStorage.setItem("dark-mode", !darkModeLink.disabled);

    // recolor
    updateCoverage();
    for (const result of attemptsTable.querySelectorAll("td.result")) {
        const backgroundColor = getComputedStyle(result).backgroundColor;
        const [R, G, B] = backgroundColor.replace(/[^\d,]/g, "").split(",");
        const L = (Math.max(R, G, B) + Math.min(R, G, B)) / 255 / 2;
        if (darkModeToggle.checked) {
            result.style.color = L < 0.61 ? "#eee" : "#000";
        } else {
            result.style.color = "";
        }
    }
});
