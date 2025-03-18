function hide(element) {
    element.style.display = "none";
    element.classList.remove("visible");
}

function unhide(element) {
    element.style.display = "";
    element.classList.add("visible");
}

function initalizeSelections() {
    generateExamSelection();

    const defaultExam = Object.keys(modulesNames)[0];
    const exam = localStorage.getItem("exam") ?? defaultExam;
    if (document.getElementById(exam)) {
        document.getElementById(exam).click();
    } else {
        document.getElementById(defaultExam).click();
    }

    const questionsCount = localStorage.getItem("questions");
    if (questionsCount) {
        questionsCountChoice.value = questionsCount;
    }

    passwordField.value = localStorage.getItem("password");
    if (passwordField.value) {
        tologinMode();
        if (localStorage.getItem("login")) {
            login({ interactive: false }).then((success) => {
                if (success) {
                    leaderboardToggle.checked =
                        localStorage.getItem("leaderboard") == "true";
                }
            });
        }
    } else {
        toRegisterMode();
    }

    if (localStorage.getItem("learnedQuestionsExplained")) {
        unhide(learnedQuestionsSelection);
        const learnedQuestions = localStorage.getItem("learnedQuestions");
        includeLearnedQuestions.checked = learnedQuestions == "true";
    }
    if (localStorage.getItem("unansweredQuestionsExplained")) {
        unhide(discardUnansweredSelection);
        const ignore = localStorage.getItem("discardUnanswered");
        discardUnansweredQuestions.checked = ignore == "true";
    }
    if (localStorage.getItem("explanationWarned")) {
        unhide(explainSelection);
        const enabled = localStorage.getItem("explain") == "true";
        enableExplanations.checked = enabled;
        if (!enabled) return;
    }
    loadResources();
}

function getSelectedModules() {
    const checkedBoxes = [
        ...document.querySelectorAll(".module-input:checked"),
    ];
    return checkedBoxes.map((box) => box.id);
}

function refreshAttemptsTable() {
    const selectedExam = examSelection.querySelector("input:checked")?.id;
    const selectedModules = getSelectedModules()
        .map((x) => parseInt(x))
        .join(", ");

    const rows = attemptsTable.querySelectorAll(".row");
    const modulesColumns = attemptsTable.querySelectorAll(".modules");

    rows.forEach((row) => {
        if (row.getAttribute("exam") != selectedExam) {
            hide(row);
        } else {
            unhide(row);
        }
    });

    if (selectedModules.length > 0) {
        rows.forEach((row) => {
            if (row.getAttribute("modules") != selectedModules) {
                hide(row);
            }
        });
        modulesColumns.forEach(hide);
    } else {
        modulesColumns.forEach(unhide);
    }

    attemptsTable
        .querySelectorAll(".row.visible .timestamp")
        .forEach((td) => (td.innerText = humanize(td.getAttribute("value"))));
}

function tohomePage() {
    updateAttemptsTable();
    updateCoverage();
    updateOngoingLabels();
    navText.style.visibility = "hidden";
    saveProgress();
    hide(quizPage);
    unhide(homePage);
}

function toQuizPage() {
    navText.style.visibility = "visible";
    quizTimer.stop();
    reviewPanel.style.backgroundColor = "";
    reviewPanel.style.color = "";
    resultText.innerText = "Review";
    hide(homePage);
    unhide(quizPage);
    scrollTo(0, 0);
}

function nextQuiz() {
    const questionsCount = questionsCountChoice.value;
    const modules = getSelectedModules();
    if (modules.length == 0) {
        tohomePage();
        moduleSelection.style.animation = "blink 1s";
        return;
    }
    const questionsIds = getQuiz(modules, questionsCount);
    generateQuiz(questionsIds, (quiz) => {
        recoverAttempt(quiz);
        explainLearnedQuestions();
        quiz.addEventListener("input", saveProgress);
        nextButton.disabled = false;
    });
    toQuizPage();
    startTimer();
    nextButton.disabled = true;
    setTimeout(explainSavingProgress, 5 * 60 * 1000); // 5 minutes
}

function submit() {
    const quiz = document.getElementById("quiz");
    const questions = quiz.querySelectorAll(".question");
    const unansweredQuestions = quiz.querySelectorAll(
        ".question:not(.answered)"
    );

    if (unansweredQuestions.length > 0) {
        if (!confirm("There are unanswered questions. Submit anyway?")) {
            unansweredQuestions[0].scrollTo().blink();
            return;
        }
        if (
            discardUnansweredQuestions.checked &&
            unansweredQuestions.length < questions.length
        ) {
            setTimeout(explainUnansweredQuestions, 400);
            unansweredQuestions.forEach((question) => question.remove());
        } else {
            unansweredQuestions.forEach(
                (question) => question.matches(".joke") && question.remove()
            );
        }
    }

    const score = grade(quiz);
    const filteredQuestions = quiz.querySelectorAll(".question");
    const outOf = filteredQuestions.length;

    if (unansweredQuestions.length < questions.length) {
        const modules = getSelectedModules();
        const attemptData = {
            timestamp: Date.now(),
            exam: examSelection.querySelector("input:checked").id,
            modules: modules.map((x) => parseInt(x)).join(", "),
            duration: navText.innerText,
            score: score,
            outOf: outOf,
            data: getAttemptData(filteredQuestions),
        };
        pastAttempts.push(attemptData);
        if (leaderboardToggle.checked && score > 0) {
            attemptData.outOf = sum(modules.map(questionsData.sizeOf));
            attemptData.grade = score / attemptData.outOf;
            attemptData.user = getUsername();
            if (!discardUnansweredQuestions.checked) {
                const answeredQuestions =
                    quiz.querySelectorAll(".question.answered");
                attemptData.data = getAttemptData(answeredQuestions);
            }
            submitToLeaderboard(attemptData);
        }
        localStorage.setItem("attempts", JSON.stringify(pastAttempts));
        knowledge.update(quiz);
    }

    unfinishedAttempts.delete(questions);
    unfinishedAttempts.save();
    quizTimer.stop();
    showResult(score, outOf);
    scrollTo(0, 0);
}

const questionsScroller = {
    current: null,
    getQuestions: function () {
        return quizPage.querySelectorAll(".question:is(.incorrect,.unsure)");
    },
    next: function () {
        const target = this.current
            ? this.current.next(":is(.incorrect,.unsure)")
            : nearestElement(this.getQuestions()).next();
        (target ?? this.current).scrollTo().blink();
    },
    previous: function () {
        const target = this.current
            ? this.current.previous(":is(.incorrect,.unsure)")
            : nearestElement(this.getQuestions()).previous();
        (target ?? this.current).scrollTo().blink();
    },
};
