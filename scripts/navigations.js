function hide(element) {
    element.style.display = "none";
    element.classList.remove("visible");
}

function unhide(element) {
    element.style.display = "";
    element.classList.add("visible");
}

function blink(element) {
    element.classList.add("blink");
    setTimeout(() => {
        element.classList.remove("blink");
    }, 1000);
}

function initalizeSelections() {
    generateExamSelection();

    const defaultExam = Object.keys(metadata.modules)[0];
    const exam = localStorage.getItem("exam") ?? defaultExam;
    if (document.getElementById(exam)) {
        document.getElementById(exam).click();
    } else {
        document.getElementById(defaultExam).click();
    }

    if (licenseNotice?.matches(".visible")) {
        form
            .querySelectorAll("input,select")
            .forEach((input) => (input.disabled = true));
    }

    const questionsCount = localStorage.getItem("questions");
    if (questionsCount) {
        questionsCountChoice.value = questionsCount;
    }

    if (!isLeaderboardPage()) {
        passwordField.value = localStorage.getItem("password");
        if (passwordField.value) {
            tologinMode();
            if (localStorage.getItem("leaderboard")) {
                login({ interactive: false });
            }
        } else {
            toRegisterMode();
        }
    }

    if (localStorage.getItem("learnedQuestionsExplained")) {
        unhide(excludeLearnedSelection);
        const excludeLearned = localStorage.getItem("excludeLearned");
        excludeLearnedQuestions.checked = excludeLearned == "true";
    }
    if (localStorage.getItem("unansweredQuestionsExplained")) {
        unhide(discardUnansweredSelection);
        const ignore = localStorage.getItem("discardUnanswered");
        discardUnansweredQuestions.checked = ignore == "true";
    }
    if (localStorage.getItem("explanationWarned")) {
        unhide(explainSelection);
        const enabled =
            localStorage.getItem("explain") == "true" && !isLeaderboardPage();
        enableExplanations.checked = enabled;
        if (!enabled) return;
    }
    loadResources();
}

function getSelectedExam() {
    return examSelection.querySelector("input:checked")?.id;
}

function getSelectedModules() {
    const checkedBoxes = [
        ...document.querySelectorAll(".module-input:checked"),
    ];
    return checkedBoxes.map((box) => box.id);
}

function getSelectedQuestionBanks() {
    const inputs = document.querySelectorAll(".bank-input");
    if (inputs.length == 1) {
        return [inputs[0].id];
    }

    const checkedInputs = [...inputs].filter((input) => input.checked);
    return checkedInputs.map((box) => box.id);
}

function refreshAttemptsTable() {
    const selectedExam = getSelectedExam();
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
    if (isLeaderboardPage()) {
        hide(navbar);
    } else {
        updateAttemptsTable();
        updateCoverage();
        updateOngoingLabels();
        navText.style.visibility = "hidden";
        saveProgress();
    }
    hide(quizPage);
    unhide(homePage);
}

function toNextPage() {
    if (nextButton.disabled) {
        return;
    }
    if (isLeaderboardPage()) {
        tohomePage();
        return;
    }
    if (document.querySelector("#quiz-page.visible #quiz:not(.submitted)")) {
        submit();
    } else {
        nextQuiz();
    }
}

function toQuizPage() {
    if (isLeaderboardPage()) {
        unhide(navbar);
    }
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
        blink(moduleSelection);
        return;
    }
    const banks = getSelectedQuestionBanks();
    if (banks.length == 0) {
        tohomePage();
        blink(questionBankSelection);
        return;
    }

    getQuiz(modules, banks, questionsCount).then((questionsIds) => {
        generateQuiz(questionsIds, (quiz) => {
            recoverAttempt(quiz);
            explainLearnedQuestions();
            quiz.addEventListener("input", saveProgress);
            nextButton.disabled = false;
        });
    });
    toQuizPage();
    startTimer();
    nextButton.disabled = true;
    setTimeout(explainSavingProgress, 10 * 60 * 1000); // 10 minutes
}

function submit() {
    const quiz = document.getElementById("quiz");
    const questions = quiz.querySelectorAll(".question");
    const unansweredQuestions = quiz.querySelectorAll(
        ".question:not(.answered)"
    );

    if (unansweredQuestions.length > 0) {
        if (!confirm("There are unanswered questions. Submit anyway?")) {
            unansweredQuestions[0].scrollTo();
            blink(unansweredQuestions[0]);
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
        if (leaderboardToggle.checked && getUsername() && score > 0) {
            attemptData.speed = outOf / quizTimer.getTime();
            attemptData.user = getUsername();
            if (!discardUnansweredQuestions.checked) {
                attemptData.data = getAttemptData(
                    quiz.querySelectorAll(".question.answered")
                );
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
