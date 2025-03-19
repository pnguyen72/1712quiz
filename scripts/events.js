window.addEventListener("beforeunload", saveProgress);
document.addEventListener("scroll", () => (questionsScroller.current = null));

document
    .querySelectorAll(".app-title")
    .forEach((title) =>
        title.addEventListener("click", () => (location = location.pathname))
    );

moduleSelection.addEventListener(
    "animationend",
    () => (moduleSelection.style.animation = "")
);

navbar.addEventListener("click", () => {
    if (loginPopup.matches(".visible")) {
        cancelLogin.click();
    }
});
form.addEventListener("click", () => {
    if (loginPopup.matches(".visible")) {
        cancelLogin.click();
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
    if (enabled) loadResources();
    localStorage.setItem("explain", enabled);
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

document
    .getElementById("attempts-table-delete")
    ?.addEventListener("click", () => {
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
