const loginToggle = document.getElementById("login-toggle");
const leaderboardToggle = document.getElementById("leaderboard-toggle");
const loginPopup = document.getElementById("login-popup");
const loginForm = document.getElementById("login-form");
const leaderboardSlider = footer.querySelector("#leaderboard-toggle + .slider");
const cancelLogin = loginPopup.querySelector(".bxs-x-circle");
const registerTab = document.getElementById("register-tab");
const loginTab = document.getElementById("login-tab");
const usernameField = loginForm.querySelector(".username");
const passwordField = loginForm.querySelector(".password");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");

leaderboardToggle.addEventListener("input", () => {
    localStorage.setItem("leaderboard", leaderboardToggle.checked);
    if (leaderboardToggle.checked && !isLoggedIn()) {
        attemptLogin();
    }
});

loginToggle.addEventListener("input", () => logout());

cancelLogin.addEventListener("click", () => {
    stopAttemptLogin();
    leaderboardToggle.checked = false;
});

registerTab.addEventListener("click", () => {
    loginForm.classList.replace("login", "register");
    usernameField.focus();
});
loginTab.addEventListener("click", () => {
    loginForm.classList.replace("register", "login");
    passwordField.focus();
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (loginForm.classList.contains("register")) {
        register();
    } else {
        login();
    }
});

function isLoggedIn() {
    return footer.classList.contains("logged-in");
}

function attemptLogin() {
    leaderboardToggle.disabled = true;
    leaderboardSlider.style.backgroundColor = "gray";
    unhide(loginPopup);
    if (loginForm.classList.contains("register")) {
        usernameField.focus();
        usernameField.required = true;
        passwordField.required = false;
    } else {
        passwordField.focus();
        passwordField.required = true;
        usernameField.required = false;
    }
}

function stopAttemptLogin() {
    leaderboardToggle.disabled = false;
    leaderboardSlider.style.backgroundColor = "";
    hide(loginPopup);
}

function register() {
    // TODO

    login();
}

function login() {
    // TODO

    footer.classList.add("logged-in");
    loginToggle.checked = true;
    localStorage.setItem("login", "true");
    stopAttemptLogin();
}

function logout() {
    footer.classList.remove("logged-in");
    leaderboardToggle.checked = false;
    localStorage.removeItem("login");
}
