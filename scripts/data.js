firebase.initializeApp({
  apiKey: "AIzaSyDV3TrfynzF0c_L-GYsG1Wd9NrIOjNvKJI",
  authDomain: "project-2830218475636260000.firebaseapp.com",
  projectId: "project-2830218475636260000",
  storageBucket: "project-2830218475636260000.firebasestorage.app",
  messagingSenderId: "85405487202",
  appId: "1:85405487202:web:208def2286c1f22c03c13b",
});
const db = firebase.firestore();

function loadData() {
  return _loadmodulesNamess().then((modules) => {
    modulesNames = modules;
    const promises = [];
    for (let i = 1; i <= modules.midterm.length + modules.final.length; ++i) {
      promises.push(_loadModule(String(i).padStart(2, "0")));
    }
    return Promise.all(promises);
  });
}

questionsData.get = function (id) {
  const module = id.split("_")[0];
  return questionsData[module][id];
};

function getQuiz(modules, count) {
  let recoveredQuestions = unfinishedAttempts.get(modules, count);
  if (recoveredQuestions.length >= count) {
    return recoveredQuestions;
  }

  let newQuestions = [];
  for (const module of modules) {
    newQuestions = newQuestions.concat(Object.keys(questionsData[module]));
  }
  if (!learnedQuestionsChoice.checked) {
    newQuestions = newQuestions.filter((id) => !knowledge.hasLearned(id));
    shuffle(newQuestions);
  } else {
    newQuestions = newQuestions.sort(
      (q1, q2) =>
        // prettier-ignore
        // unlearned questions first
        (knowledge.hasLearned(q1) - knowledge.hasLearned(q2)) +
        // then, sort by random
        (Math.random() - 0.5)
    );
  }
  newQuestions = shuffle(newQuestions.slice(0, count));

  if (recoveredQuestions.length == 0) {
    return newQuestions;
  }
  return [...new Set([...recoveredQuestions, ...newQuestions])].slice(0, count);
}

knowledge.learn = function (questionId) {
  const module = questionId.split("_")[0];
  if (!Object.hasOwn(this, module)) {
    this[module] = {};
  }
  this[module][questionId] = true;
};

knowledge.unlearn = function (questionId) {
  const module = questionId.split("_")[0];
  delete this[module]?.[questionId];
};

knowledge.hasLearned = function (questionId) {
  const module = questionId.split("_")[0];
  return Boolean(this[module]?.[questionId]);
};

knowledge.sizeOf = function (module) {
  if (!Object.hasOwn(this, module)) {
    return 0;
  }
  return Object.keys(this[module]).length;
};

knowledge.update = function (quiz) {
  const corrects = quiz.querySelectorAll(".question:not(.wrong-answer)");
  const errors = quiz.querySelectorAll(".question.wrong-answer");
  corrects.forEach((question) => this.learn(question.id));
  errors.forEach((question) => this.unlearn(question.id));
  localStorage.setItem("knowledge", JSON.stringify(this));
};

function explain(question) {
  if (!explainChoice.checked) return;

  const questionId = question.id;
  const doc = db.collection("explanations").doc(questionId);
  doc.onSnapshot((snapshot) => {
    const explanation = question.querySelector(".explanation");
    if (explanation.tagName.toLowerCase() == "textarea") return;

    const explanationText = snapshot.data()?.explanation ?? "";
    const editing = snapshot.data()?.editing;

    if (editing == null) explanation.classList.remove("editing");
    else {
      const expiring = editing + 90000; // 90 seconds timeout
      const now = Date.now();
      if (expiring <= now) editSignal(questionId, false);
      else {
        explanation.classList.add("editing");
        setTimeout(() => editSignal(questionId, false), expiring - now);
      }
    }
    explanation.write(explanationText);
    giveExplanationsWarning();
  });
}

function submitExplanation(questionId, questionText, explanationText) {
  const doc = db.collection("explanations").doc(questionId);
  if (explanationText) {
    return doc.set({ question: questionText, explanation: explanationText });
  } else {
    return doc.delete();
  }
}

function editSignal(questionId, isEditing) {
  const doc = db.collection("explanations").doc(questionId);
  if (isEditing) {
    doc.set({ editing: Date.now() }, { merge: true });
  } else {
    doc.update({ editing: firebase.firestore.FieldValue.delete() });
  }
}

unfinishedAttempts.get = function () {
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
};

unfinishedAttempts.set = function (attemptData) {
  Object.entries(attemptData).forEach(([questionId, questionData]) => {
    const module = questionId.split("_")[0];
    if (!Object.hasOwn(this, module)) {
      this[module] = {};
    }
    this[module][questionId] = questionData;
  });
  this.save();
};

unfinishedAttempts.delete = function (questionIds) {
  for (const questionId of questionIds) {
    const module = questionId.split("_")[0];
    delete this[module]?.[questionId];
  }
  this.save();
};

unfinishedAttempts.save = function () {
  localStorage.setItem("unfinished", JSON.stringify(this));
};

function _loadmodulesNamess() {
  return fetch("./data/modules.json").then((response) => response.json());
}

function _loadModule(module) {
  return fetch(`./data/modules/${module}.json`)
    .then((response) => {
      if (!response.ok) return {};
      return response.json();
    })
    .then((questions) => (questionsData[module] = questions));
}
