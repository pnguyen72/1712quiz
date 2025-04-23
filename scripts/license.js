const licenseNotice = document.getElementById("license-notice");
const licenseText = document.getElementById("license-text");
const licenceAgreeBtn = document.getElementById("license-agree-btn");
const licenseDisagreeBtn = document.getElementById("license-disagree-btn");

licenceAgreeBtn.addEventListener("click", licenseUnlock);

let disagreeNum = localStorage.getItem("disagree") ?? 0;
const disagreeTarget = 4;
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
        blink(licenseText);
        window.scrollTo(0, 0);
    }
});

let disabledInputs = [];
function licenseLock() {
    if (
        sessionStorage.getItem("licenseAgreed") == "true" ||
        localStorage.getItem("licenseException") == "true"
    ) {
        return;
    }
    disabledInputs = form.querySelectorAll(":is(input,select):not(:disabled)");
    disabledInputs.forEach((input) => (input.disabled = true));
    unhide(licenseNotice);
    hide(navbar);
}

function licenseUnlock() {
    sessionStorage.setItem("licenseAgreed", true);
    hide(licenseNotice);
    disabledInputs.forEach((input) => (input.disabled = false));
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
