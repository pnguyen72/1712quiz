if (!matchMedia("(hover: none)").matches) {
    document
        .querySelectorAll(".bx")
        .forEach((icon) => icon.classList.add("bx-tada-hover"));
}

const urlParams = new URLSearchParams(window.location.search);
let selectedUser = urlParams.get("user");
const attemptID = urlParams.get("attempt");

(() => {
    if (!isLeaderboardPage()) {
        loadStorage();
        updateAttemptsTable();
        loadModulesNames().then(initalizeSelections).then(licenseLock);
        return;
    }

    if (attemptID) {
        visitLeaderboardAttempt(attemptID);
        homeButton.removeEventListener("click", tohomePage);
        homeButton.addEventListener(
            "click",
            () => (location = "/leaderboard.html")
        );
        nextButton.removeEventListener("click", toNextPage);
        nextButton.addEventListener(
            "click",
            () => (location = "/leaderboard.html")
        );
    }

    form.removeEventListener("input", refreshAttemptsTable);
    form.addEventListener("input", updateLeaderboard);
    loadModulesNames().then(initalizeSelections);
})();
