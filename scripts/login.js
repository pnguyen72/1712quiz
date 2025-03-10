leaderboardToggle.addEventListener("input", () => {
    localStorage.setItem("leaderboard", leaderboardToggle.checked);
    if (leaderboardToggle.checked && !isLoggedIn()) {
        login();
    }
});

loginToggle.addEventListener("input", () => logout());

function isLoggedIn() {
    return footer.classList.contains("logged-in");
}

function login() {
    footer.classList.add("logged-in");
    loginToggle.checked = true;
    localStorage.setItem("login", "true");
}

function logout() {
    footer.classList.remove("logged-in");
    leaderboardToggle.checked = false;
    localStorage.removeItem("login");
}
