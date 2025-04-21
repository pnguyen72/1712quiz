function generateExamSelection() {
    const selections = document.createElement("ul");
    selections.className = "menu-choices";

    examSelection.appendChild(selections);
    if (Object.keys(metadata.modules).length < 2) {
        hide(examSelection);
    } else {
        unhide(examSelection);
    }

    let indexOffset = 1;
    for (const examId in metadata.modules) {
        const examInput = document.createElement("input");
        examInput.id = examId;
        examInput.type = "radio";
        examInput.name = "exam";
        examInput.setAttribute("indexOffset", indexOffset);
        indexOffset += metadata.modules[examId].length;

        const examText = document.createElement("span");
        examText.innerText = examId;

        const examLabel = document.createElement("label");
        examLabel.appendChild(examInput);
        examLabel.appendChild(examText);

        const exam = document.createElement("li");
        exam.appendChild(examLabel);
        selections.appendChild(exam);
    }
}

function generateModuleSelection() {
    const selectedExam = examSelection.querySelector("input:checked");
    let indexOffset;
    let selectedModules;
    if (metadata.cumulative) {
        indexOffset = 1;
        selectedModules = [];
        for (const module in metadata.modules) {
            selectedModules = selectedModules.concat(metadata.modules[module]);
            if (module == selectedExam.id) {
                break;
            }
        }
    } else {
        indexOffset = parseInt(selectedExam.getAttribute("indexOffset"));
        selectedModules = metadata.modules[selectedExam.id];
    }

    const selections = document.createElement("ul");
    selections.id = "modules";
    selections.className = "menu-choices";
    document.getElementById("modules").replaceWith(selections);

    const loadPromises = [];
    selectedModules.forEach((name, index) => {
        const moduleId = `${String(index + indexOffset).padStart(2, "0")}`;
        loadPromises.push(questionsData.load(moduleId));

        const module = document.createElement("li");
        const moduleLabel = document.createElement("label");
        const moduleInput = document.createElement("input");
        const moduleTitle = document.createElement("span");
        const ongoingLabel = document.createElement("span");
        const moduleCoverage = document.createElement("span");

        moduleTitle.innerHTML = `${index + indexOffset}. ${name}`;
        ongoingLabel.className = "ongoing";
        ongoingLabel.innerText = "*";
        moduleCoverage.className = "coverage";
        moduleInput.className = "module-input";
        moduleInput.id = moduleId;
        moduleInput.type = "checkbox";
        moduleInput.addEventListener("input", () => {
            document.getElementById("module-all").checked =
                !selections.querySelector(".module-input:not(:checked)");
        });

        moduleLabel.appendChild(moduleInput);
        moduleLabel.appendChild(moduleTitle);
        moduleLabel.appendChild(ongoingLabel);
        module.appendChild(moduleLabel);
        module.appendChild(moduleCoverage);
        selections.appendChild(module);
    });

    const allModules = document.createElement("li");
    const allModulesLabel = document.createElement("label");
    const allModulesInput = document.createElement("input");
    const allModulesTitle = document.createElement("b");
    const allModulesCoverage = document.createElement("span");

    allModulesTitle.innerText = "All of them!";
    allModulesCoverage.className = "coverage";
    allModulesInput.type = "checkbox";
    allModulesInput.id = "module-all";
    allModulesInput.addEventListener("click", () =>
        document
            .querySelectorAll(".module-input")
            .forEach((box) => (box.checked = allModulesInput.checked))
    );

    allModulesLabel.appendChild(allModulesInput);
    allModulesLabel.appendChild(allModulesTitle);
    allModules.appendChild(allModulesLabel);
    allModules.appendChild(allModulesCoverage);
    selections.appendChild(allModules);

    (localStorage.getItem("modules") ?? "")
        .split(" ")
        .forEach((module) => document.getElementById(module)?.click());

    const ongoingLabel = document.createElement("li");
    ongoingLabel.className = "ongoing";
    ongoingLabel.innerText = "* ongoing attempt";
    selections.appendChild(ongoingLabel);

    updateOngoingLabels();
    updateCoverage();
}

async function generateQuestionBankSelection() {
    if (Object.keys(metadata.questionBanks).length < 2) {
        hide(questionBankSelection);
    }

    const selections = document.createElement("ul");
    selections.id = "banks";
    selections.className = "menu-choices";
    document.getElementById("banks").replaceWith(selections);

    for (const [bankId, bankName] of Object.entries(metadata.questionBanks)) {
        let size = 0;
        for (const moduleInput of document.querySelectorAll(".module-input")) {
            size += await questionsData.sizeOf(moduleInput.id, bankId);
        }
        if (size == 0) {
            continue;
        }

        const bankInput = document.createElement("input");
        bankInput.id = bankId;
        bankInput.className = "bank-input";
        bankInput.type = "checkbox";
        bankInput.name = "bank";

        const bankText = document.createElement("span");
        bankText.innerText = bankName;

        const bankLabel = document.createElement("label");
        bankLabel.appendChild(bankInput);
        bankLabel.appendChild(bankText);

        const bank = document.createElement("li");
        bank.appendChild(bankLabel);
        selections.appendChild(bank);
    }

    const onlyBank = selections.querySelector(
        "li:first-child:last-child input"
    );
    if (onlyBank) {
        onlyBank.checked = onlyBank.disabled = true;
    } else {
        const bankInputs = selections.querySelectorAll(".bank-input");

        const allBanks = document.createElement("li");
        const allBanksInput = document.createElement("input");
        const allBanksLabel = document.createElement("label");
        const allBanksText = document.createElement("b");

        allBanksInput.id = "bank-all";
        allBanksInput.type = "checkbox";
        allBanksInput.addEventListener("click", () =>
            bankInputs.forEach((box) => (box.checked = allBanksInput.checked))
        );

        allBanksText.innerText = "All of them!";
        allBanksLabel.appendChild(allBanksInput);
        allBanksLabel.appendChild(allBanksText);

        allBanks.appendChild(allBanksLabel);
        selections.appendChild(allBanks);
        bankInputs.forEach((input) => {
            input.addEventListener("input", () => {
                allBanksInput.checked = !selections.querySelector(
                    ".bank-input:not(:checked)"
                );
            });
        });
    }

    if (localStorage.getItem("bank")) {
        localStorage
            .getItem("bank")
            .split(" ")
            .forEach((bankId) => document.getElementById(bankId)?.click());
    } else {
        document.getElementById("bank-all")?.click();
    }
}

async function generateQuiz(questionsIds, callback = null) {
    const quiz = document.createElement("div");
    document.getElementById("quiz").replaceWith(quiz);
    quiz.id = "quiz";
    if (enableExplanations.checked) {
        quiz.classList.add("explained");
    }

    function addQuestion(index) {
        const questionId = questionsIds[index];
        return generateQuestion(questionId, index).then((question) =>
            quiz.appendChild(question)
        );
    }

    const total_count = questionsIds.length;
    const first_round_count = Math.min(5, total_count);
    for (let i = 0; i < first_round_count; ++i) {
        addQuestion(i);
    }
    setTimeout(() => {
        const promises = [];
        for (let i = first_round_count; i < total_count; ++i) {
            promises.push(addQuestion(i));
        }
        if (callback) {
            Promise.all(promises).then(() => callback(quiz));
        }
    }, Math.min(150, total_count / 2));
}

async function generatePastAttempt(attempt, option = { learnedTags: true }) {
    showResult(attempt.score, attempt.outOf);
    navText.innerText = attempt.duration;

    const questionsIds = Object.keys(attempt.data);
    unfinishedAttempts.set(attempt.data);
    if (option.learnedTags) {
        questionsIds.forEach((id) => {
            if (attempt.data[id].learned) {
                knowledge.learn(id);
            } else {
                knowledge.unlearn(id);
            }
        });
    }

    const quiz = document.createElement("div");
    document.getElementById("quiz").replaceWith(quiz);
    quiz.id = "quiz";
    if (enableExplanations.checked) {
        quiz.classList.add("explained");
    }
    quiz.classList.add("submitted");

    function addQuestion(index) {
        const questionId = questionsIds[index];
        return generateQuestion(questionId, index).then((question) => {
            recoverQuestion(question);
            gradeQuestion(question);
            quiz.appendChild(question);
        });
    }

    const total_count = questionsIds.length;
    const first_round_count = Math.min(5, total_count);
    for (let i = 0; i < first_round_count; ++i) {
        addQuestion(i);
    }
    setTimeout(() => {
        const promises = [];
        for (let i = first_round_count; i < total_count; ++i) {
            promises.push(addQuestion(i));
        }
        Promise.all(promises).then(() => {
            unfinishedAttempts.load();
            if (option.learnedTags) {
                knowledge.load();
            }
        });
    }, Math.min(150, total_count / 2));
}

async function generateQuestion(questionId, questionIndex) {
    const questionData = await questionsData.get(questionId);
    const choices = Object.entries(questionData.choices);
    const attemptData = unfinishedAttempts.get(questionId);
    shuffleChoices(choices);

    // header
    const questionHeader = document.createElement("div");
    const questionTitleContainter = document.createElement("span");
    const questionTitle = document.createElement("b");
    const learnedTag = document.createElement("span");
    const unsureLabel = document.createElement("label");
    const unsureCheck = document.createElement("input");
    const imNotSure = document.createElement("span");
    const showExplanation = document.createElement("span");

    questionHeader.className = "question-header";
    questionTitle.className = "question-title";
    questionTitle.innerText = `Question ${questionIndex + 1}.`;
    learnedTag.className = "learned-tag";
    learnedTag.innerText = "already learned";
    unsureLabel.className = "unsure-label";
    unsureCheck.className = "unsure-check";
    unsureCheck.addEventListener("input", () => toggleUnsure(question));
    imNotSure.className = "im-not-sure";
    imNotSure.innerText = "I'm not sure";
    showExplanation.className = "show-explanation";
    showExplanation.innerText = "Show explanation";
    unsureCheck.type = "checkbox";

    unsureLabel.appendChild(unsureCheck);
    unsureLabel.appendChild(imNotSure);
    unsureLabel.appendChild(showExplanation);
    questionTitleContainter.appendChild(questionTitle);
    if (knowledge.hasLearned(questionId))
        questionTitleContainter.appendChild(learnedTag);
    questionHeader.appendChild(questionTitleContainter);
    questionHeader.appendChild(unsureLabel);

    // body
    const questionBody = document.createElement("p");
    questionBody.className = "question-body";
    questionBody.innerHTML = questionData.question;

    // image (if exists)
    const questionImage = document.createElement("figure");
    if (questionData.hasImage) {
        const img = document.createElement("img");
        img.setAttribute(
            "src",
            getImagePath(questionId, questionData.hasImage.transparent)
        );
        questionImage.appendChild(img);
    }

    // choices
    const questionChoices = document.createElement("ul");
    questionChoices.className = "question-choices";
    choices.forEach(([choiceId, choiceData]) => {
        const choice = document.createElement("li");
        const choiceLabel = document.createElement("label");
        const choiceInput = document.createElement("input");
        const choiceText = document.createElement("span");
        let choiceImage = document.createElement("img");

        if (choiceData.correct) {
            choice.classList.add("correct");
        }
        choiceInput.id = `${choiceId}_${questionId}`;
        choiceInput.className = "choice-input";
        choiceInput.type = questionData.multiSelect ? "checkbox" : "radio";
        choiceInput.name = questionId;

        if (choiceData.choice) {
            choiceText.innerHTML = choiceData.choice;
        }

        if (choiceData.hasImage) {
            choiceImage.className = "choice-image";
            choiceImage.setAttribute(
                "src",
                getImagePath(
                    `${questionId}_${choiceId}`,
                    choiceData.hasImage.transparent
                )
            );
        }

        choiceLabel.appendChild(choiceInput);
        if (choiceData.choice) {
            choiceLabel.appendChild(choiceText);
        }
        choice.appendChild(choiceLabel);
        if (choiceData.hasImage) {
            choiceLabel.appendChild(choiceImage);
        }
        questionChoices.appendChild(choice);
    });

    // explanation
    const explanationContainer = document.createElement("div");
    const explanation = document.createElement("div");
    const editBtn = document.createElement("i");
    const editingIndicator = document.createElement("i");

    explanationContainer.className = "explanation-container";
    explanation.className = "explanation";
    explanation.write = (value) => {
        if (!converter) return;

        explanation.value = value ?? "";
        if (value) {
            explanation.classList.remove("empty");
            explanation.innerHTML = converter.makeHtml(value);
        } else {
            explanation.classList.add("empty");
            explanation.innerHTML = `No explanation available.
            <span id="placeholder-expansion">Why don't you add one?</span>`;
        }
    };
    explanation.write(questionData.explanation);
    editBtn.className = "bx bx-edit";
    editBtn.title = "edit";
    if (matchMedia("not all and (hover: none)").matches) {
        editBtn.classList.add("bx-tada-hover");
    }
    editBtn.addEventListener("click", () => editExplanation(explanation));
    editingIndicator.className = "bx bx-loader bx-spin";
    editingIndicator.title = "someone is typing";

    explanationContainer.appendChild(explanation);
    if (typeof firebaseConfig != "undefined") {
        explanationContainer.appendChild(editBtn);
        explanationContainer.appendChild(editingIndicator);
    }

    // question
    const question = document.createElement("div");
    question.id = questionId;
    question.className = "question";
    if (questionData.joke) {
        question.classList.add("joke");
    }
    if (attemptData) {
        question.classList.add("recoverable");
    }
    // the selector is cursed because the question id starts with a number
    // it's too inconvenient to change it now
    const questionSelector = `#\\3${questionId[0]} ${questionId.slice(1)}`;
    question.next = function (selector = "") {
        return quizPage.querySelector(
            `${questionSelector} ~ .question${selector}`
        );
    };
    question.previous = function (selector = "") {
        if (!selector) {
            return quizPage.querySelector(
                `.question:has(+${questionSelector})`
            );
        }
        const candidates = quizPage.querySelectorAll(
            `.question${selector}:has(~${questionSelector})`
        );
        return candidates[candidates.length - 1];
    };
    question.scrollTo = () => {
        const margin = 32;
        question.scrollIntoView(true);
        scrollBy(0, -margin);
        if (getComputedStyle(reviewPanel).display != "none") {
            scrollBy(0, -navbar.offsetHeight);
        }
        // scrolling sets questionsScroller.current = null
        // so we wait for the scroll to finish first
        // 100ms should be enough?
        setTimeout(() => (questionsScroller.current = question), 100);
    };

    question.appendChild(questionHeader);
    question.appendChild(questionBody);
    if (questionData.hasImage) {
        question.appendChild(questionImage);
    }
    question.appendChild(questionChoices);
    question.appendChild(explanationContainer);
    return question;
}

function updateAttemptsTable() {
    const tableRows = attemptsTable.querySelectorAll(".row");

    if (tableRows.length >= pastAttempts.length) {
        if (tableRows.length > pastAttempts.length) {
            Array.from(tableRows)
                .slice(pastAttempts.length - tableRows.length)
                .forEach((row) => row.remove());
        }
        return;
    }

    pastAttempts
        .slice(tableRows.length - pastAttempts.length)
        .forEach((attempt) => {
            const score = attempt.score;
            const outOf = attempt.outOf;
            const accuracy = score / (outOf + Number.EPSILON);
            const roundedAccuracy = Math.round(
                (accuracy + Number.EPSILON) * 100
            );
            const [H, S, L] = getColor(accuracy);

            const row = document.createElement("tr");
            const timestamp = document.createElement("td");
            const modules = document.createElement("td");
            const duration = document.createElement("td");
            const result = document.createElement("td");
            const resultScore = document.createElement("span");
            const resultPercentage = document.createElement("span");

            timestamp.className = "timestamp";
            timestamp.setAttribute("value", attempt.timestamp);
            timestamp.addEventListener("click", () => {
                toQuizPage();
                generatePastAttempt(attempt);
            });

            modules.className = "modules";
            modules.innerText = attempt.modules;

            duration.className = "duration";
            duration.innerText = attempt.duration;

            resultScore.className = "score";
            resultScore.innerText = `${score}/${outOf}`;

            resultPercentage.className = "percentage";
            resultPercentage.innerText = ` (${roundedAccuracy}%)`;

            result.className = "result";
            result.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
            if (darkModeToggle.checked) {
                result.style.color = L < 61 ? "#eee" : "#000";
            }
            result.appendChild(resultScore);
            result.appendChild(resultPercentage);

            row.className = "row";
            row.setAttribute("exam", attempt.exam);
            row.setAttribute("modules", attempt.modules);
            row.appendChild(timestamp);
            row.appendChild(modules);
            row.appendChild(duration);
            row.appendChild(result);
            attemptsTable.querySelector("tbody").appendChild(row);
        });
    refreshAttemptsTable();
}

async function updateCoverage() {
    if (isLeaderboardPage()) return;

    const modules = document.getElementById("modules");
    if (!modules.querySelector("li")) return; // if module list hasn't been generated

    let coveredTotal = 0;
    let sizeTotal = 0;

    // stat for each module
    for (const module of modules.querySelectorAll("li:has(.module-input)")) {
        const moduleNum = module.querySelector("input").id;
        const moduleCoverage = module.querySelector(".coverage");

        const covered = knowledge.sizeOf(moduleNum);
        const size = await questionsData.sizeOf(moduleNum);
        coveredTotal += covered;
        sizeTotal += size;

        if (covered == 0 || size == 0) {
            hide(moduleCoverage);
            continue;
        }

        const coverage = covered / (size + Number.EPSILON);
        const roundedCoverage = Math.round((coverage + Number.EPSILON) * 100);
        const [H, S, L] = getColor(coverage);

        moduleCoverage.innerText = `${roundedCoverage}%`;
        moduleCoverage.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
        if (darkModeToggle.checked) {
            moduleCoverage.style.color = L < 61 ? "#eee" : "#000";
        } else {
            moduleCoverage.style.color = "";
        }
        unhide(moduleCoverage);
    }

    // stat for "All of them!"
    const moduleAllCoverage = modules.querySelector(
        "li:has(#module-all) .coverage"
    );

    if (
        modules.querySelector("li:has(.module-input) .coverage:not(.visible)")
    ) {
        hide(moduleAllCoverage);
        return;
    }

    const coverage = coveredTotal / (sizeTotal + Number.EPSILON);
    const roundedCoverage = Math.round((coverage + Number.EPSILON) * 100);
    const [H, S, L] = getColor(coverage);

    moduleAllCoverage.innerText = `${roundedCoverage}%`;
    moduleAllCoverage.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
    if (darkModeToggle.checked) {
        moduleAllCoverage.style.color = L < 61 ? "#eee" : "#000";
    } else {
        moduleAllCoverage.style.color = "";
    }
    unhide(moduleAllCoverage);

    if (roundedCoverage == 100) {
        licenseGrantException(
            "Congrats, you've learned 100% of the question bank! 🥳"
        );
    }
}

function updateOngoingLabels() {
    if (isLeaderboardPage()) return;

    document.querySelectorAll(".module-input").forEach((input) => {
        const ongoingLabel = input.parentElement.querySelector(".ongoing");
        if (Object.keys(unfinishedAttempts[input.id] ?? {}).length > 0) {
            unhide(ongoingLabel);
        } else {
            hide(ongoingLabel);
        }
    });
}
