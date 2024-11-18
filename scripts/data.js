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

function getQuestions(banks, modules, count) {
  let result = [];
  const selectionSize = {};
  for (const bank of banks) {
    for (const module of modules) {
      selectionSize[`${bank}.${module}`] = modulesData[bank][module].size;
    }
  }
  const selections = Object.keys(selectionSize);
  const totalSize = Object.values(selectionSize).reduce((a, b) => a + b, 0);
  const effectiveSize = Math.min(totalSize, count);
  for (const [selection, size] of Object.entries(selectionSize)) {
    const [bank, module] = selection.split(".");
    const getAmount = Math.floor((effectiveSize * size) / totalSize);
    const data = modulesData[bank][module].get(getAmount, "beginning");
    result = result.concat(data);
  }
  if (result.length < effectiveSize) {
    shuffle(selections);
    for (const selection of selections) {
      const [bank, module] = selection.split(".");
      result.push(...modulesData[bank][module].get(1, "end"));
      if (result.length >= effectiveSize) break;
    }
  }
  shuffle(result);
  return result;
}

function resolveQuestions(questions) {
  for (const question of questions) {
    const id = question.id;
    const [bank, module, _] = id.split(".");
    modulesData[bank][module].resolve(id);
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
    _data: questions,
    _pull: function (count) {
      shuffle(this._origin);
      this._data = {
        ...this._data,
        ...Object.fromEntries(this._origin.slice(0, count)),
      };
    },
    get: function (count, position) {
      // pull data from origin if necessary
      const length = Object.keys(this._data).length;
      if (length == 0) {
        this._pull();
      } else if (length < count) {
        this._pull(count - length);
      }
      // slice data to specified amount, either from beginning or end of the pool
      let result = [];
      let entries = Object.entries(this._data);
      if (position == "end") entries.reverse();
      for (const [id, questionData] of entries) {
        result.push({ id: id, ...questionData });
        if (result.length >= count) break;
      }
      return result;
    },
    resolve: function (question) {
      delete this._data[question];
    },
    size: Object.keys(questions).length,
  };
}
