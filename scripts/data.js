const app = firebase.initializeApp({
  apiKey: "AIzaSyDV3TrfynzF0c_L-GYsG1Wd9NrIOjNvKJI",
  authDomain: "project-2830218475636260000.firebaseapp.com",
  projectId: "project-2830218475636260000",
  storageBucket: "project-2830218475636260000.firebasestorage.app",
  messagingSenderId: "85405487202",
  appId: "1:85405487202:web:208def2286c1f22c03c13b",
});
const db = firebase.firestore();

let modulesName;
let modulesData = {};
let modulesCoverage = {};
if (localStorage.getItem("coverage")) {
  modulesCoverage = JSON.parse(localStorage.getItem("coverage"));
}

function loadData() {
  return _loadModulesName().then((modules) => {
    modulesName = modules;
    const promises = [];
    const midtermOffset = 1;
    for (let i = 0; i < modules.midterm.length; ++i) {
      promises.push(_loadModule(String(i + midtermOffset).padStart(2, "0")));
    }
    const finalOffset = 1 + modules.midterm.length;
    for (let i = 0; i < modules.final.length; ++i) {
      promises.push(_loadModule(String(i + finalOffset).padStart(2, "0")));
    }
    return Promise.all(promises);
  });
}

function getQuiz(modules, count) {
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
    const getAmount = Math.floor((count * size) / totalSize);
    const data = modulesData[module].get(getAmount, "beginning");
    quizData = quizData.concat(data);
  }

  const selectedModules = Object.keys(modulesSize);
  if (quizData.length < count) {
    shuffle(selectedModules);
    for (const module of selectedModules) {
      quizData.push(...modulesData[module].get(1, "end"));
      if (quizData.length >= count) break;
    }
  }

  shuffle(quizData);
  return quizData;
}

function learnQuiz(quiz) {
  const learned = quiz.querySelectorAll(".question:not(.wrong-answer)");
  for (const question of learned) {
    const id = question.id;
    const module = id.split(".")[1];
    modulesData[module].learn(id);
  }
  const mistakes = quiz.querySelectorAll(".question.wrong-answer");
  for (const question of mistakes) {
    const id = question.id;
    const module = id.split(".")[1];
    modulesData[module].unlearn(id);
  }
  localStorage.setItem("coverage", JSON.stringify(modulesCoverage));
}

function explain(question) {
  if (!explainChoice.checked) return;

  const questionId = question.id;
  const doc = db.collection("explain").doc(questionId);
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
  const doc = db.collection("explain").doc(questionId);
  if (explanationText) {
    return doc.set({ question: questionText, explanation: explanationText });
  } else {
    return doc.delete();
  }
}

function editSignal(questionId, isEditing) {
  const doc = db.collection("explain").doc(questionId);
  if (isEditing) {
    doc.set({ editing: Date.now() }, { merge: true });
  } else {
    doc.update({ editing: firebase.firestore.FieldValue.delete() });
  }
}

function _loadModulesName() {
  return fetch("./data/modules.json").then((response) => response.json());
}

function _loadModule(module) {
  return fetch(`./data/modules/module${module}.json`)
    .then((response) => {
      if (!response.ok) return {};
      return response.json();
    })
    .then((questions) => (modulesData[module] = _data(module, questions)));
}

function _data(module, questions) {
  return {
    _origin: Object.entries(questions),
    _data: {},
    _pull: function (count) {
      let origin = [...this._origin];
      if (!learnedQuestionsChoice.checked) {
        origin = origin.filter(([id]) => !this.isLearned(id));
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
    get: function (count, position) {
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
        return this.isLearned(id1) - this.isLearned(id2);
      });

      // slice
      if (position == "end") {
        return entries.slice(-count);
      } else {
        return entries.slice(0, count);
      }
    },
    learn: function (questionId) {
      delete this._data[questionId];
      this.covered.add(questionId);
      modulesCoverage[module] = Array.from(this.covered);
    },
    unlearn: function (quesitonId) {
      this.covered.delete(quesitonId);
      modulesCoverage[module] = Array.from(this.covered);
    },
    isLearned: function (questionId) {
      return this.covered.has(questionId);
    },
    size: Object.keys(questions).length,
    covered: new Set(modulesCoverage[module] ?? []),
  };
}
