const username = document.getElementById("username");
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

registerTab.addEventListener("click", toRegisterMode);
loginTab.addEventListener("click", tologinMode);

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (loginForm.classList.contains("register")) {
        register();
    } else {
        login();
    }
});

function tologinMode() {
    loginForm.classList.replace("register", "login");
    passwordField.focus();
    passwordField.required = true;
    usernameField.required = false;
}

function toRegisterMode() {
    loginForm.classList.replace("login", "register");
    usernameField.focus();
    usernameField.required = true;
    passwordField.required = false;
}

function isLoggedIn() {
    return footer.classList.contains("logged-in");
}

function attemptLogin() {
    loadFirebase();
    leaderboardToggle.disabled = true;
    leaderboardSlider.style.backgroundColor = "gray";
    unhide(loginPopup);
}

function getRandomPassword() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2);
    let result = "";
    for (let i = 0; i < Math.min(random.length, timestamp.length); ++i) {
        result += random.slice(i, i + 1) + timestamp.slice(i, i + 1);
    }
    return result;
}

async function register() {
    await loadFirebase();
    const username = usernameField.value.trim();

    const usrDoc = await leaderboard.doc("users").get();
    if (usrDoc.data()?.[username]) {
        alert("Username already exists.");
        usernameField.focus();
        return false;
    }

    const password = getRandomPassword();
    leaderboard.doc("passwords").set({ [password]: username }, { merge: true });
    leaderboard.doc("users").set({ [username]: true }, { merge: true });
    localStorage.setItem("password", password);
    alert(`Your password is: ${password}\n\nKeep it safe and don't lose it.`);
    passwordField.value = password;
    loginSuccess(username);
    tologinMode();
    return true;
}

async function login(option = { interactive: true }) {
    await loadFirebase();
    const password = passwordField.value.trim();

    const pwdDoc = await leaderboard.doc("passwords").get();
    const username = pwdDoc.data()?.[password];
    if (!username) {
        if (option.interactive) {
            alert("Incorrect password.");
            passwordField.focus();
        }
        const storedPassword = localStorage.getItem("password");
        if (password == storedPassword) {
            if (!option.interactive) {
                passwordField.value = "";
            }
            localStorage.removeItem("password");
        } else if (storedPassword) {
            passwordField.value = storedPassword;
        }
        return false;
    }

    localStorage.setItem("password", password);
    loginSuccess(username);
    return true;
}

function stopAttemptLogin() {
    leaderboardToggle.disabled = false;
    leaderboardSlider.style.backgroundColor = "";
    hide(loginPopup);
}

function loginSuccess(name) {
    username.innerText = name;
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
