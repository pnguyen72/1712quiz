window.addEventListener("beforeunload", saveProgress);
document.addEventListener("scroll", () => (questionsScroller.current = null));

licenseText.addEventListener(
    "animationend",
    () => (licenseText.style.animation = "")
);

moduleSelection.addEventListener(
    "animationend",
    () => (moduleSelection.style.animation = "")
);

form.addEventListener("click", () => {
    if (homePage.querySelector("#license-notice.visible")) {
        licenseText.style.animation = "blink 1s";
        window.scrollTo(0, 0);
    }
});
form.addEventListener("input", refreshAttemptsTable);
examSelection.addEventListener("input", () => {
    localStorage.setItem(
        "exam",
        examSelection.querySelector("input:checked").id
    );
    generateModuleSelection();
    if (localStorage.getItem("modules")) {
        localStorage
            .getItem("modules")
            .split(" ")
            .forEach((module) => document.getElementById(module)?.click());
    }
});
moduleSelection.addEventListener("input", () => {
    localStorage.setItem("modules", getSelectedModules().join(" "));
    updateCoverage();
});
questionsCountChoice.addEventListener("input", () => {
    localStorage.setItem("questions", questionsCountChoice.value);
});
includeLearnedQuestions.addEventListener("input", () => {
    localStorage.setItem("learnedQuestions", includeLearnedQuestions.checked);
});
discardUnansweredQuestions.addEventListener("input", () => {
    localStorage.setItem(
        "discardUnanswered",
        discardUnansweredQuestions.checked
    );
});
enableExplanations.addEventListener("input", () => {
    const enabled = enableExplanations.checked;
    if (enabled) loadExplanationResources();
    localStorage.setItem("explain", enabled);
});

licenceAgreeBtn.addEventListener("click", licenseUnlock);
licenseDisagreeBtn.addEventListener("click", () => {
    if (++disagreeNum < disagreeTarget) {
        alert("You can't disagree, dummy!");
        localStorage.setItem("disagree", disagreeNum);
    } else {
        licenseGrantException("Fine. 🙄");
        localStorage.removeItem("disagree");
    }
});

homeButon.addEventListener("click", tohomePage);
nextButton.addEventListener("click", () => {
    if (nextButton.disabled) return;
    if (document.querySelector("#quiz-page.visible #quiz:not(.submitted)")) {
        submit();
    } else {
        nextQuiz();
    }
});

prevQuest.addEventListener("click", () => questionsScroller.previous());
nextQuest.addEventListener("click", () => questionsScroller.next());

attemptsTableContainer.querySelector(".bx").addEventListener("click", () => {
    if (
        confirm(
            "Delete attempts history? " +
                "You will also lose track of which questions you have learned."
        )
    ) {
        localStorage.removeItem("attempts");
        localStorage.removeItem("knowledge");
        location.reload();
    }
});

window.addEventListener("beforeprint", () => {
    const quiz = document.querySelector(
        "#quiz-page.visible #quiz.submitted.explained"
    );
    if (!quiz) return;
    // Normally, to save firebase reads,
    // only questions that were answered incorrectly or marked unsure are explained.
    // This forces explaining all questions.
    for (question of quiz.getElementsByClassName("question")) {
        explain(question);
        // No need to hide the explanation after printing; it's already hidden by css.
    }
});
