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
let modulesData = { LH: {}, AI: {} };

function loadData() {
  return _loadModules().then((data) => {
    modulesName = data;
    const promises = [];

    const midtermOffset = 1;
    for (let i = 0; i < data.midterm.length; ++i) {
      const moduleNum = String(i + midtermOffset).padStart(2, "0");
      promises.push(
        _loadQuestions(i + midtermOffset, "LH").then(
          (questions) => (modulesData.LH[moduleNum] = _data(questions))
        )
      );
      promises.push(
        _loadQuestions(i + midtermOffset, "AI").then(
          (questions) => (modulesData.AI[moduleNum] = _data(questions))
        )
      );
    }

    const finalOffset = 1 + data.midterm.length;
    for (let i = 0; i < data.final.length; ++i) {
      const moduleNum = String(i + finalOffset).padStart(2, "0");
      promises.push(
        _loadQuestions(i + finalOffset, "LH").then(
          (questions) => (modulesData.LH[moduleNum] = _data(questions))
        )
      );
      promises.push(
        _loadQuestions(i + finalOffset, "AI").then(
          (questions) => (modulesData.AI[moduleNum] = _data(questions))
        )
      );
    }

    return Promise.all(promises);
  });
}

function getQuiz(banks, modules, count) {
  const selectionSize = {};
  for (const bank of banks) {
    for (const module of modules) {
      selectionSize[`${bank}.${module}`] = modulesData[bank][module].size;
    }
  }
  const totalSize = sum(Object.values(selectionSize));
  count = Math.min(totalSize, count);

  let quizData = [];
  for (const [selection, size] of Object.entries(selectionSize)) {
    const [bank, module] = selection.split(".");
    const getAmount = Math.floor((count * size) / totalSize);
    const data = modulesData[bank][module].get(getAmount, "beginning");
    quizData = quizData.concat(data);
  }

  const selections = Object.keys(selectionSize);
  if (quizData.length < count) {
    shuffle(selections);
    for (const selection of selections) {
      const [bank, module] = selection.split(".");
      quizData.push(...modulesData[bank][module].get(1, "end"));
      if (quizData.length >= count) break;
    }
  }

  shuffle(quizData);
  return quizData;
}

function resolveQuiz(quiz) {
  const learned = quiz.querySelectorAll(".question:not(.wrong-answer,.unsure)");
  for (const question of learned) {
    const id = question.id;
    const [bank, module, _] = id.split(".");
    modulesData[bank][module].resolve(id);
  }
  const mistakes = quiz.querySelectorAll(".question.wrong-answer");
  for (const question of mistakes) {
    const id = question.id;
    const [bank, module, _] = id.split(".");
    modulesData[bank][module].unresolve(id);
  }
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
    giveExplanationDisclaimer(explanationText);
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

function _loadModules() {
  return fetch("./data/modules.json").then((response) => response.json());
}

function _loadQuestions(moduleNum, bank) {
  return fetch(`./data/${bank}/module${moduleNum}.json`).then((response) => {
    if (!response.ok) return {};
    return response.json();
  });
}

function _data(questions) {
  return {
    _origin: Object.entries(questions),
    _data: {},
    _pull: function (count) {
      shuffle(this._origin);
      if (count == undefined) {
        this._data = Object.fromEntries(this._origin);
        return;
      }
      let pulled = 0;
      for (const [key, value] of this._origin) {
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
      // slice data to specified amount, either from beginning or end of the pool
      let entries = Object.entries(this._data);
      if (position == "end") {
        return entries.slice(-count);
      } else {
        return entries.slice(0, count);
      }
    },
    resolve: function (questionId) {
      delete this._data[questionId];
      this.covered.add(questionId);
    },
    unresolve: function (quesitonId) {
      this.covered.delete(quesitonId);
    },
    isKnown: function (questionId) {
      return this.covered.has(questionId);
    },
    size: Object.keys(questions).length,
    covered: new Set(),
  };
}
