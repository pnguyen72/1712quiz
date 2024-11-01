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

function getModuleNames() {
  return db
    .collection("modules")
    .doc("names")
    .get()
    .then((doc) => doc.data());
}

function getModuleQuestions(moduleNum) {
  return db
    .collection("modules")
    .doc(`module${moduleNum}`)
    .get()
    .then((doc) => doc.data());
}
