let modulesNames = null;
let questionsData = { __loader: {} };
const pastAttempts = localStorage.getItem("attempts")
    ? JSON.parse(localStorage.getItem("attempts"))
    : [];
const modulesSize = localStorage.getItem("modulesSize")
    ? JSON.parse(localStorage.getItem("modulesSize"))
    : {};

function loadStorage() {
    unfinishedAttempts.load();
    knowledge.load();
}

questionsData.load = function (module) {
    if (Object.hasOwn(this, module)) {
        return Promise.resolve(this[module]);
    }
    if (Object.hasOwn(this.__loader, module)) {
        return this.__loader[module];
    }
    this.__loader[module] = fetch(`./data/modules/${module}.json`)
        .then((response) => response.json())
        .catch(() => new Object())
        .then((questions) => {
            this[module] = questions;
            modulesSize[module] = Object.keys(questions).length;
            return questions;
        });
    return this.__loader[module];
};

questionsData.get = async function (id) {
    const module = id.split("_")[0];
    const moduleQuestions = await this.load(module);
    return moduleQuestions[id];
};

questionsData.sizeOf = async function (module) {
    if (
        !Object.hasOwn(questionsData, module) &&
        Object.hasOwn(modulesSize, module)
    ) {
        return modulesSize[module];
    }
    return Object.keys((await this.load(module)) ?? {}).length;
};

modulesSize.save = function () {
    localStorage.setItem("modulesSize", JSON.stringify(modulesSize));
};

async function getQuiz(modules, count) {
    let recoveredQuestions = unfinishedAttempts.get(modules, count);
    if (recoveredQuestions.length >= count) {
        return recoveredQuestions;
    }

    let newQuestions = [];
    for (const module of modules) {
        newQuestions = newQuestions.concat(
            Object.keys(await questionsData.load(module))
        );
    }
    if (!includeLearnedQuestions.checked) {
        newQuestions = newQuestions.filter((id) => !knowledge.hasLearned(id));
        shuffle(newQuestions);
    } else {
        newQuestions = newQuestions.sort(
            (q1, q2) =>
                // prettier-ignore
                // order by knowledge (ascending, meaning unlearned questions first)
                (knowledge.hasLearned(q1) - knowledge.hasLearned(q2)) +
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

function loadModulesNames() {
    return fetch("./data/modules.json")
        .then((response) => response.json())
        .then((data) => (modulesNames = data));
}
