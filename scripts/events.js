window.addEventListener("beforeunload", saveProgress);
document.addEventListener("scroll", () => (questionsScroller.current = null));

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
    generateQuestionBankSelection();
});
moduleSelection.addEventListener("input", () => {
    localStorage.setItem("modules", getSelectedModules().join(" "));
    updateCoverage();
});
questionsCountChoice.addEventListener("input", () => {
    localStorage.setItem("questions", questionsCountChoice.value);
});
questionBankSelection.addEventListener("input", () => {
    localStorage.setItem("bank", getSelectedQuestionBanks().join(" "));
});
excludeLearnedQuestions.addEventListener("input", () => {
    localStorage.setItem("excludeLearned", excludeLearnedQuestions.checked);
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

homeButton.addEventListener("click", tohomePage);
nextButton.addEventListener("click", toNextPage);

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
