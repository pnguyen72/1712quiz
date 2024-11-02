const app = firebase.initializeApp({
  apiKey: "AIzaSyDV3TrfynzF0c_L-GYsG1Wd9NrIOjNvKJI",
  authDomain: "project-2830218475636260000.firebaseapp.com",
  projectId: "project-2830218475636260000",
  storageBucket: "project-2830218475636260000.firebasestorage.app",
  messagingSenderId: "85405487202",
  appId: "1:85405487202:web:208def2286c1f22c03c13b",
});
const db = firebase.firestore();
const storage = firebase.storage();

function getModulesData() {
  return _getModuleNames().then((data) => {
    const promises = [];

    let indexOffset = 1;
    for (let i = 0; i < data.midterm.length; ++i) {
      promises.push(
        _getModuleQuestions(i + indexOffset).then((questions) =>
          modulesData.midterm.push({ name: data.midterm[i], ...questions })
        )
      );
    }

    indexOffset += data.midterm.length;
    for (let i = 0; i < data.final.length; ++i) {
      promises.push(
        _getModuleQuestions(i + indexOffset).then((questions) =>
          modulesData.final.push({ name: data.final[i], ...questions })
        )
      );
    }

    return Promise.all(promises);
  });
}

function submitExplanation(explanation) {
  const questionText =
    explanation.parentElement.getElementsByClassName("questionBody")[0]
      .innerText;
  const explanationText = explanation.innerHTML;

  const data = _findQuestion(questionText);
  const module = `module${data.index}`;
  const bank = data.bank;

  return db
    .collection("modules")
    .doc(module)
    .set(
      { [bank]: { [questionText]: { explanation: explanationText } } },
      { merge: true }
    );
}

function _getModuleNames() {
  return db
    .collection("modules")
    .doc("names")
    .get()
    .then((doc) => doc.data());
}

function _getModuleQuestions(moduleNum) {
  return db
    .collection("modules")
    .doc(`module${moduleNum}`)
    .get()
    .then((doc) => doc.data());
}

function _findQuestion(question) {
  let section;
  let indexOffset;
  if (midtermChoice.checked) {
    section = "midterm";
    indexOffset = 1;
  } else {
    section = "final";
    indexOffset = 1 + modulesData.midterm.length;
  }

  for (let i = 0; i < moduleSelectBoxes.length; ++i) {
    if (!moduleSelectBoxes[i].checked) {
      continue;
    }
    if (
      LHChoice.checked &&
      modulesData[section][i].LH != null &&
      Object.hasOwn(modulesData[section][i].LH, question)
    ) {
      return {
        section: section,
        index: i + indexOffset,
        bank: "LH",
      };
    }
    if (
      AIChoice.checked &&
      modulesData[section][i].AI != null &&
      Object.hasOwn(modulesData[section][i].AI, question)
    ) {
      return {
        section: section,
        index: i + indexOffset,
        bank: "AI",
      };
    }
  }
}
