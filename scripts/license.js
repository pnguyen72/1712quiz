const licenseNotice = document.getElementById("license-notice");
const licenseText = document.getElementById("license-text");
const licenceAgreeBtn = document.getElementById("license-agree-btn");
const licenseDisagreeBtn = document.getElementById("license-disagree-btn");

licenseText.addEventListener(
    "animationend",
    () => (licenseText.style.animation = "")
);

licenceAgreeBtn.addEventListener("click", licenseUnlock);

let disagreeNum = localStorage.getItem("disagree") ?? 0;
const disagreeTarget = 8;

licenseDisagreeBtn.addEventListener("click", () => {
    if (++disagreeNum < disagreeTarget) {
        alert("You can't disagree, dummy!");
        localStorage.setItem("disagree", disagreeNum);
    } else {
        licenseGrantException("Fine. 🙄");
        localStorage.removeItem("disagree");
    }
});

form.addEventListener("click", () => {
    if (licenseNotice.matches(".visible")) {
        licenseText.style.animation = "blink 1s";
        window.scrollTo(0, 0);
    }
});

function licenseLock() {
    if (
        sessionStorage.getItem("licenseAgreed") == "true" ||
        localStorage.getItem("licenseException") == "true"
    ) {
        return;
    }
    unhide(licenseNotice);
    hide(navbar);
}

function licenseUnlock() {
    sessionStorage.setItem("licenseAgreed", true);
    hide(licenseNotice);
    for (input of form.querySelectorAll("input,select")) {
        input.disabled = false;
    }
    unhide(navbar);
}

function licenseGrantException(prompt) {
    if (localStorage.getItem("licenseException")) return;

    let alertText = "You don't have to wear a Hawaiian shirt to the exam.";
    if (prompt) alertText = `${prompt}\n${alertText}`;

    alert(alertText);
    licenseUnlock();
    localStorage.setItem("licenseException", true);
}
