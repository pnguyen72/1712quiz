if (!matchMedia("(hover: none)").matches) {
    document
        .querySelectorAll(".bx")
        .forEach((icon) => icon.classList.add("bx-tada-hover"));
}

const urlParams = new URLSearchParams(window.location.search);
const urlSelectedUser = urlParams.get("user");

(() => {
    if (!isLeaderboardPage()) {
        loadStorage();
        updateAttemptsTable();
        loadMetadata().then(initalizeSelections).then(licenseLock);
        return;
    }

    const urlAttemptID = urlParams.get("attempt");
    if (urlAttemptID) {
        visitLeaderboardAttempt(urlAttemptID);
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
    } else if (urlSelectedUser) {
        filterByUser(urlSelectedUser);
    }

    form.removeEventListener("input", refreshAttemptsTable);
    form.addEventListener("input", updateLeaderboard);
    loadMetadata().then(initalizeSelections);
})();
