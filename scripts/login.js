const username = document.getElementById("username");
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
    if (leaderboardToggle.checked) {
        attemptLogin();
        localStorage.setItem("leaderboard", true);
    } else {
        logout();
    }
});

cancelLogin.addEventListener("click", () => {
    stopAttemptLogin();
    leaderboardToggle.checked = false;
});

registerTab.addEventListener("click", toRegisterMode);
loginTab.addEventListener("click", tologinMode);

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (loginForm.matches(".register")) {
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
    usernameField.value = "";
}

function toRegisterMode() {
    loginForm.classList.replace("login", "register");
    usernameField.focus();
    usernameField.required = true;
    passwordField.required = false;
}

function isLoggedIn() {
    return footer.matches(".logged-in");
}

function getUsername() {
    return username.innerText;
}

function setUsername(name) {
    username.innerText = name;
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

async function usernameExists(username) {
    await loadFirebase();
    if (!userDB) return;

    const docs = await userDB.where("name", "==", username).limit(1).get();
    return docs.size > 0;
}

async function register() {
    await loadFirebase();
    if (!userDB) return;

    const username = usernameField.value.trim();
    if (await usernameExists(username)) {
        alert("Username already exists.");
        usernameField.focus();
        return false;
    }

    const password = getRandomPassword();
    userDB.doc(password).set({ name: username });
    localStorage.setItem("password", password);
    alert(`Your password is: ${password}\n\nKeep it safe and don't lose it.`);
    passwordField.value = password;
    loginSuccess(username);
    tologinMode();
    return true;
}

async function login(option = { interactive: true }) {
    await loadFirebase();
    if (!userDB) return;

    const password = passwordField.value.trim();
    const userDoc = await userDB.doc(password).get();
    const username = userDoc.data()?.name;
    if (!username) {
        if (option.interactive) {
            alert("Incorrect password.");
            passwordField.focus();
        } else {
            leaderboardToggle.checked = false;
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
        return;
    }

    localStorage.setItem("password", password);
    loginSuccess(username);
}

function stopAttemptLogin() {
    leaderboardToggle.disabled = false;
    if (leaderboardSlider.style.backgroundColor) {
        leaderboardSlider.style.backgroundColor = "";
        localStorage.setItem("leaderboard", true);
    }
    hide(loginPopup);
}

function loginSuccess(name) {
    setUsername(name);
    footer.classList.add("logged-in");
    stopAttemptLogin();
    leaderboardToggle.checked = true;
}

function logout() {
    footer.classList.remove("logged-in");
    leaderboardToggle.checked = false;
    localStorage.removeItem("leaderboard");
    setUsername(null);
}
