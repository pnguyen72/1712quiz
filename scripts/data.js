let metadata = {};
const questionsData = { __loader: {} };
const questionBanks = {};
const pastAttempts = localStorage.getItem("attempts")
    ? JSON.parse(localStorage.getItem("attempts"))
    : [];

function loadStorage() {
    unfinishedAttempts.load();
    knowledge.load();
}

function getImagePath(id, transparent = false) {
    let parentDir = `./data/images`;
    if (transparent) {
        if (darkModeLink.disabled) {
            parentDir += "/light";
        } else {
            parentDir += "/dark";
        }
    }
    return `${parentDir}/${id}.png`;
}

questionsData.load = function (module) {
    if (Object.hasOwn(this, module)) {
        return Promise.resolve(this[module]);
    }
    if (Object.hasOwn(this.__loader, module)) {
        return this.__loader[module];
    }
    this.__loader[module] = fetch(`./data/questions/${module}.json`)
        .then((response) => response.json())
        .catch(() => new Object())
        .then((questions) => {
            questionBanks[module] = {};
            for (const bank in metadata.questionBanks) {
                questionBanks[module][bank] = [];
            }
            const defaultBank = Object.keys(metadata.questionBanks)[0];
            for (const [questionId, question] of Object.entries(questions)) {
                if (!question.bank) {
                    questionBanks[module][defaultBank].push(questionId);
                } else {
                    for (const bank in metadata.questionBanks) {
                        if (question.bank.includes(bank)) {
                            questionBanks[module][bank].push(questionId);
                        }
                    }
                }
            }
            this[module] = questions;
            return questions;
        });
    return this.__loader[module];
};

questionsData.get = async function (id) {
    const module = id.split("_")[0];
    const moduleQuestions = await this.load(module);
    return moduleQuestions[id];
};

questionsData.sizeOf = async function (module, bank = null) {
    await this.load(module);
    if (bank) {
        return questionBanks[module]?.[bank]?.length ?? 0;
    }
    return Object.keys(this[module] ?? {}).length;
};

async function getQuiz(modules, banks, count) {
    let recoveredQuestions = unfinishedAttempts.get(modules, count);
    if (recoveredQuestions.length >= count) {
        return recoveredQuestions;
    }

    let newQuestions = new Set();
    for (const module of modules) {
        await questionsData.load(module);
        for (const bank of banks) {
            newQuestions = new Set([
                ...newQuestions,
                ...questionBanks[module][bank],
            ]);
        }
    }
    if (excludeLearnedQuestions.checked) {
        newQuestions = Array.from(newQuestions).filter(
            (id) => !knowledge.hasLearned(id)
        );
        shuffle(newQuestions);
    } else {
        newQuestions = Array.from(newQuestions).sort(
            (q1, q2) =>
                // order by knowledge (unlearned questions first)
                knowledge.hasLearned(q1) -
                knowledge.hasLearned(q2) +
                // then by random
                (Math.random() - 0.5)
        );
    }
    newQuestions = shuffle(newQuestions.slice(0, count));

    if (recoveredQuestions.length == 0) {
        return newQuestions;
    }
    return [...new Set([...recoveredQuestions, ...newQuestions])].slice(
        0,
        count
    );
}

const knowledge = {
    load: function () {
        const storedData = localStorage.getItem("knowledge");
        if (storedData) {
            Object.assign(this, JSON.parse(storedData));
        }
    },

    learn: function (questionId) {
        const module = questionId.split("_")[0];
        if (!Object.hasOwn(this, module)) {
            this[module] = {};
        }
        this[module][questionId] = true;
    },

    unlearn: function (questionId) {
        const module = questionId.split("_")[0];
        delete this[module]?.[questionId];
    },

    hasLearned: function (questionId) {
        const module = questionId.split("_")[0];
        return Boolean(this[module]?.[questionId]);
    },

    sizeOf: function (module) {
        if (!Object.hasOwn(this, module)) {
            return 0;
        }
        return Object.keys(this[module]).length;
    },

    update: function (quiz) {
        const corrects = quiz.querySelectorAll(".question:not(.incorrect)");
        const incorrects = quiz.querySelectorAll(".question.incorrect");
        corrects.forEach((question) => this.learn(question.id));
        incorrects.forEach((question) => this.unlearn(question.id));
        localStorage.setItem("knowledge", JSON.stringify(this));
    },
};

function explain(question) {
    if (!enableExplanations.checked || !db) {
        return;
    }

    const questionId = question.id;
    const explanation = question.querySelector(".explanation");

    db.doc(questionId).onSnapshot((snapshot) => {
        if (explanation.tagName.toLowerCase() == "textarea") return;

        const editing = snapshot.data()?.editing;
        if (editing == null) {
            explanation.classList.remove("editing");
        } else {
            const expiring = editing + 90000; // 90 seconds timeout
            const now = Date.now();
            if (expiring <= now) {
                editSignal(questionId, false);
            } else {
                explanation.classList.add("editing");
            }
        }

        let explanationText;
        if (question.matches(".joke")) {
            const choice = question.querySelector(".choice-input:checked");
            explanationText = snapshot.data()?.[choice.id] ?? "";
        } else {
            explanationText = snapshot.data()?.explanation ?? "";
        }
        explanation.write(explanationText);
        explainExplanations();
    });
}

function submitExplanation(question, explanationText) {
    if (!db) {
        return Promise.resolve();
    }

    const questionId = question.id;
    const questionText = question.querySelector(".question-body").innerHTML;
    const doc = db.doc(questionId);

    if (!question.matches(".joke")) {
        if (!explanationText) return doc.delete();
        return doc.set({
            question: questionText,
            explanation: explanationText,
        });
    }

    const data = { question: questionText };
    const choice = question.querySelector(".choice-input:checked");
    data[choice.id] = explanationText;
    return editSignal(questionId, false).then(() =>
        doc.set(data, { merge: true })
    );
}

function editSignal(questionId, isEditing) {
    if (!db) {
        return Promise.resolve();
    }

    const doc = db.doc(questionId);
    if (isEditing) {
        return doc.set({ editing: Date.now() }, { merge: true });
    } else {
        return doc.update({ editing: firebase.firestore.FieldValue.delete() });
    }
}

const unfinishedAttempts = {
    load: function () {
        const storedData = localStorage.getItem("unfinished");
        if (storedData) {
            Object.assign(this, JSON.parse(storedData));
        }
    },

    save: function () {
        localStorage.setItem("unfinished", JSON.stringify(this));
    },

    get: function () {
        if (arguments.length < 2) {
            const questionId = arguments[0];
            const module = questionId.split("_")[0];
            return this[module]?.[questionId];
        }

        const modules = arguments[0];
        const count = arguments[1];

        let candidates = [];
        for (const module of modules) {
            candidates = candidates.concat(Object.keys(this[module] ?? {}));
        }
        return candidates.slice(0, count);
    },

    set: function (attemptData) {
        Object.entries(attemptData).forEach(([questionId, questionData]) => {
            const module = questionId.split("_")[0];
            if (!Object.hasOwn(this, module)) {
                this[module] = {};
            }
            this[module][questionId] = questionData;
        });
    },

    delete: function (questions) {
        for (const question of questions) {
            const module = question.id.split("_")[0];
            delete this[module]?.[question.id];
        }
    },
};

function loadMetadata() {
    return fetch("./data/metadata.json")
        .then((response) => response.json())
        .then((data) => {
            if (!data.questionBanks) {
                data.questionBanks = { LH: "LH" };
            }
            metadata = data;
        });
}
