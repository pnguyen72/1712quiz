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

function getData() {
  return _getModules().then((data) => {
    modulesName = data;
    const promises = [];

    const midtermOffset = 1;
    for (let i = 0; i < data.midterm.length; ++i) {
      promises.push(
        _getQuestions(i + midtermOffset, "LH").then(
          (questions) => (modulesData.LH[i + midtermOffset] = questions)
        )
      );
      promises.push(
        _getQuestions(i + midtermOffset, "AI").then(
          (questions) => (modulesData.AI[i + midtermOffset] = questions)
        )
      );
    }

    const finalOffset = 1 + data.midterm.length;
    for (let i = 0; i < data.final.length; ++i) {
      promises.push(
        _getQuestions(i + finalOffset, "LH").then(
          (questions) => (modulesData.LH[i + finalOffset] = questions)
        )
      );
      promises.push(
        _getQuestions(i + finalOffset, "AI").then(
          (questions) => (modulesData.AI[i + finalOffset] = questions)
        )
      );
    }

    return Promise.all(promises);
  });
}

function getExplanation(questionText) {
  db.collection("explanations")
    .doc(questionText.replaceAll("/", "#"))
    .onSnapshot((doc) => {
      const explanationText = doc.data()?.explanation ?? "";
      const editing = doc.data()?.editing;

      for (question of quizPage.getElementsByClassName("question")) {
        const questionBody =
          question.getElementsByClassName("question-body")[0];
        if (questionBody.innerHTML == questionText) {
          const explanation = question.getElementsByClassName("explanation")[0];
          if (explanation.tagName.toLowerCase() == "textarea") {
            if (explanation.getAttribute("key") != randomKey) {
              explanation.parentElement.reset();
            }
            break;
          }
          if (editing != null) {
            const expire = editing + 90000; // 90 seconds timeout
            const now = Date.now();
            if (expire > now) {
              explanation.classList.add("editing");
              setTimeout(() => editSignal(questionText, false), expire - now);
            } else {
              editSignal(questionText, false);
            }
          } else {
            explanation.classList.remove("editing");
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
  return fetch(`./data/${bank}/module${moduleNum}.json`)
    .then((response) => response.json())
    .catch(() => new Object());
}
