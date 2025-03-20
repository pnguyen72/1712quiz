if (!matchMedia("(hover: none)").matches) {
    document
        .querySelectorAll(".bx")
        .forEach((icon) => icon.classList.add("bx-tada-hover"));
}

const urlParams = new URLSearchParams(window.location.search);
const filterByUser = urlParams.get("user");
const attemptID = urlParams.get("attempt");

async function init() {
    if (!isLeaderboardPage()) {
        loadStorage();
        updateAttemptsTable();
        loadModulesNames().then(initalizeSelections).then(licenseLock);
        return;
    }
    if (!attemptID) {
        form.removeEventListener("input", refreshAttemptsTable);
        form.addEventListener("input", updateLeaderboard);
        loadModulesNames().then(initalizeSelections);
    } else {
        toQuizPage();
        generatePastAttempt(await getLeaderboardAttempt(attemptID));
    }
}

init();
