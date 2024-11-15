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
  return _getModules().then((data) => {
    modulesName = data;
    const promises = [];

    const midtermOffset = 1;
    for (let i = 0; i < data.midterm.length; ++i) {
      promises.push(
        _getQuestions(i + midtermOffset, "LH").then(
          (questions) => (modulesData.LH[i + midtermOffset] = _data(questions))
        )
      );
      promises.push(
        _getQuestions(i + midtermOffset, "AI").then(
          (questions) => (modulesData.AI[i + midtermOffset] = _data(questions))
        )
      );
    }

    const finalOffset = 1 + data.midterm.length;
    for (let i = 0; i < data.final.length; ++i) {
      promises.push(
        _getQuestions(i + finalOffset, "LH").then(
          (questions) => (modulesData.LH[i + finalOffset] = _data(questions))
        )
      );
      promises.push(
        _getQuestions(i + finalOffset, "AI").then(
          (questions) => (modulesData.AI[i + finalOffset] = _data(questions))
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
  for (question of questions) {
    const bank = question.getAttribute("bank");
    const module = question.getAttribute("module");
    const questionText = question.querySelector(".question-body").innerHTML;
    modulesData[bank][module].resolve(questionText);
  }
}

function getExplanation(questionText) {
  db.collection("explanations")
    .doc(questionText.replaceAll("/", "#"))
    .onSnapshot((doc) => {
      const explanationText = doc.data()?.explanation ?? "";
      const editing = doc.data()?.editing;

      for (question of quizPage.getElementsByClassName("question")) {
        const questionBody = question.querySelector(".question-body");
        if (questionBody.innerHTML == questionText) {
          const explanation = question.querySelector(".explanation");
          if (explanation.tagName.toLowerCase() == "textarea") {
            break;
          }
          if (editing == null) explanation.classList.remove("editing");
          else {
            const expiring = editing + 90000; // 90 seconds timeout
            const now = Date.now();
            if (expiring <= now) editSignal(questionText, false);
            else {
              explanation.classList.add("editing");
              setTimeout(() => editSignal(questionText, false), expiring - now);
            }
          }
          explanation.write(explanationText);
          giveExplanationDisclaimer(explanationText);
          break;
        }
      }
    });
}

function submitExplanation(questionText, explanationText) {
  const doc = db
    .collection("explanations")
    .doc(questionText.replaceAll("/", "#"));
  if (explanationText) {
    return doc.set({ explanation: explanationText });
  } else {
    return doc.delete();
  }
}

function editSignal(questionText, isEditing) {
  const doc = db
    .collection("explanations")
    .doc(questionText.replaceAll("/", "#"));
  if (isEditing) {
    doc.set({ editing: Date.now() }, { merge: true });
  } else {
    doc.update({ editing: firebase.firestore.FieldValue.delete() });
  }
}

function _getModules() {
  return fetch("./data/modules.json").then((response) => response.json());
}

function _getQuestions(moduleNum, bank) {
  return fetch(`./data/${bank}/module${moduleNum}.json`).then((response) => {
    if (!response.ok) return {};
    return response.json();
  });
}

function _data(questions) {
  return {
    _origin: questions,
    _data: { ...questions },
    _pull: function (count) {
      if (count == undefined) {
        this._data = { ...this._origin };
        return;
      }
      const origin = Object.entries(this._origin);
      shuffle(origin);
      const slicedOrigin = origin.slice(0, count);
      this._data = { ...this._data, ...Object.fromEntries(slicedOrigin) };
    },
    get: function (count, position) {
      // pull data from origin if necessary
      const length = Object.keys(this._data).length;
      if (length == 0) {
        this._pull();
      } else if (length < count) {
        this._pull(count - length);
      }
      // slice data to specified amount, either from the beginning or end of the pool
      let data = [];
      let entries = Object.entries(this._data);
      if (position == "end") entries.reverse();
      for (const [question, questionData] of entries) {
        data.push({ question: question, ...questionData });
        if (data.length >= count) break;
      }
      return data;
    },
    resolve: function (question) {
      delete this._data[question];
    },
    size: Object.keys(questions).length,
  };
}
