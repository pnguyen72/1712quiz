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
  return _loadModulesName().then((modules) => {
    modulesName = modules;
    const promises = [];
    for (let i = 1; i <= modules.midterm.length + modules.final.length; ++i) {
      promises.push(_loadModule(String(i).padStart(2, "0")));
    }
    return Promise.all(promises);
  });
}

function getQuestionData(id) {
  const module = id.split("_")[0];
  return modulesData[module].questions[id];
}

function getQuiz(modules, count) {
  let attemptData = unfinishedAttempts.get(modules, count);
  if (attemptData.length > 0) {
    if (
      !confirm(
        "You have unsubmitted questions from previous attempts. Do you want to recover them?"
      )
    ) {
      unfinishedAttempts.delete(Object.keys(Object.fromEntries(attemptData)));
      attemptData = [];
    }
  }
  count -= attemptData.length;
  if (count == 0) return reconstructQuizData(attemptData);

  const modulesSize = {};
  for (const module of modules) {
    let size = modulesData[module].size;
    if (!learnedQuestionsChoice.checked) {
      size -= modulesData[module].covered.size;
    }
    modulesSize[module] = size;
  }
  const totalSize = sum(Object.values(modulesSize));
  count = Math.min(totalSize, count);

  let quizData = [];
  for (const [module, size] of Object.entries(modulesSize)) {
    const getAmount = Math.ceil((count * size) / totalSize);
    const data = modulesData[module].get(getAmount);
    quizData = quizData.concat(data);
  }
  shuffle(quizData);
  if (attemptData.length > 0) {
    quizData = Object.entries({
      ...Object.fromEntries(reconstructQuizData(attemptData)),
      ...Object.fromEntries(quizData),
    });
  }
  return quizData.slice(0, count);
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

function learnQuiz(quiz) {
  const corrects = quiz.querySelectorAll(".question:not(.wrong-answer)");
  const errors = quiz.querySelectorAll(".question.wrong-answer");
  corrects.forEach((question) => knowledge.learn(question.id));
  errors.forEach((question) => knowledge.unlearn(question.id));
  localStorage.setItem("knowledge", JSON.stringify(knowledge));
}

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

unfinishedAttempts.get = function (modules, count) {
  if (typeof modules == "string") {
    let entries = Object.entries(this[modules] ?? {});
    const out = entries.splice(-count);
    this[modules] = Object.fromEntries(entries);
    return out;
  }

  const modulesSize = {};
  for (const module of modules) {
    modulesSize[module] = Object.keys(this[module] ?? {}).length;
  }
  const totalSize = sum(Object.values(modulesSize));
  count = Math.min(totalSize, count);

  let attemptData = [];
  for (const [module, size] of Object.entries(modulesSize)) {
    const getAmount = Math.ceil((count * size) / totalSize);
    attemptData = attemptData.concat(this.get(module, getAmount));
  }
  const out = attemptData.splice(-count);
  this.set(attemptData);
  return out;
};

unfinishedAttempts.set = function (attemptData) {
  attemptData.forEach(([questionId, choices]) => {
    const module = questionId.split("_")[0];
    if (!Object.hasOwn(this, module)) this[module] = {};
    this[module][questionId] = choices;
  });
  localStorage.setItem("unfinished", JSON.stringify(this));
};

unfinishedAttempts.delete = function (questionIds) {
  for (const questionId of questionIds) {
    const module = questionId.split("_")[0];
    delete this[module]?.[questionId];
    const choicesData = getQuestionData(questionId).choices;
    for (const id in choicesData) {
      choicesData[id].isChecked = false;
    }
  }
  localStorage.setItem("unfinished", JSON.stringify(this));
};

function reconstructQuizData(attemptData) {
  const quizData = {};
  attemptData.forEach(([questionId, choicesData]) => {
    const questionData = getQuestionData(questionId);
    Object.entries(choicesData).forEach(([choiceId, isChecked]) => {
      questionData.choices[choiceId].isChecked = isChecked;
    });
    quizData[questionId] = questionData;
  });
  return Object.entries(quizData);
}

function _loadModulesName() {
  return fetch("./data/modules.json").then((response) => response.json());
}

function _loadModule(module) {
  return fetch(`./data/modules/${module}.json`)
    .then((response) => {
      if (!response.ok) return {};
      return response.json();
    })
    .then((questions) => (modulesData[module] = _data(questions)));
}

function _data(questions) {
  return {
    questions: questions,
    _data: {},
    _pull: function (count) {
      let origin = Object.entries(questions);
      if (!learnedQuestionsChoice.checked) {
        origin = origin.filter(([id]) => !knowledge.hasLearned(id));
      }
      shuffle(origin);

      if (count == undefined) {
        this._data = Object.fromEntries(origin);
        return;
      }
      let pulled = 0;
      for (const [key, value] of origin) {
        if (!Object.hasOwn(this._data, key)) {
          this._data[key] = value;
          if (++pulled == count) break;
        }
      }
    },
    get: function (count) {
      // pull data from origin if there's not enough
      const currentSize = Object.keys(this._data).length;
      if (currentSize == 0) {
        this._pull();
      } else if (currentSize < count) {
        this._pull(count - currentSize);
      }

      // prioritize unlearned questions
      let entries = Object.entries(this._data);
      entries.sort((entry1, entry2) => {
        const [id1, id2] = [entry1[0], entry2[0]];
        return knowledge.hasLearned(id2) - knowledge.hasLearned(id1);
      });

      // slice
      return entries.slice(-count);
    },
    size: Object.keys(questions).length,
  };
}
