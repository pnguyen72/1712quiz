// REQUIRES
const express = require("express");
var session = require("express-session");
const fs = require("fs");
const SQL = require("mysql2")
  .createConnection({
    host: "localhost",
    user: "REDACTED",
    password: "REDACTED",
    database: "REDACTED",
  })
  .promise();

const modulesName = { midterm: {}, final: {} };

const app = express();
app.use(express.json());
app.use(
  session({
    secret: "REDACTED",
    cookie: { maxAge: 90000000 },
  })
);
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));

// requests
app.get("/", function (req, res) {
  let doc = fs.readFileSync("./app/html/index.html", "utf8");
  res.send(doc);
});

app.get("/modules", (req, res) => {
  res.send(JSON.stringify(modulesName));
});

app.get("/quiz", (req, res) => {
  const MODULES = [];
  const examModules = Object.entries(modulesName)[req.query.exam][1];
  const encodedModules = req.query.modules.split("");
  Object.keys(examModules).forEach((module, index) => {
    if (encodedModules[index] == 1) {
      MODULES.push(module);
    }
  });

  const BANKS = [];
  const encodedBanks = req.query.banks.split("");
  ["LH", "AI"].forEach((bank, index) => {
    if (encodedBanks[index] == 1) {
      BANKS.push(`'${bank}'`);
    }
  });

  const COUNT = req.query.count;

  SQL.execute(
    `
    SELECT * FROM (
      SELECT * FROM (
        SELECT
          id,
          question,
          bank,
          has_image as hasImage,
          multi_select as multiSelect,
          session.is_known as isKnown
        FROM question
        LEFT JOIN (
          SELECT
            question_id,
            is_known
          FROM known
          WHERE
            session_id = '${req.sessionID}'
        ) session
        ON
          question.id = session.question_id
        WHERE
          module IN (${MODULES.join(",")}) AND 
          bank IN (${BANKS.join(",")})
        ORDER BY session.is_known, RAND()
        LIMIT ${COUNT}
      ) question
      ORDER BY RAND()
    ) question 
    INNER JOIN (
      SELECT
        id as choiceId,
        question_id as id,
        choice
      FROM choice
    ) choice
    ON question.id = choice.id
    `
  ).then(([query]) => {
    res.send(JSON.stringify(query));
  });
});

app.get("/size", function (req, res) {
  const MODULES = [];
  const examModules = Object.entries(modulesName)[req.query.exam][1];
  const encodedModules = req.query.modules.split("");
  Object.keys(examModules).forEach((module, index) => {
    if (encodedModules[index] == 1) {
      MODULES.push(module);
    }
  });

  if (MODULES.length == 0) {
    res.send(JSON.stringify({ size: 1 }));
    return;
  }

  SQL.execute(
    `
    SELECT true
    FROM question
    WHERE
      module IN (${MODULES.join(",")}) AND 
      bank = '${req.query.bank}'
    `
  ).then(([query]) => res.send(JSON.stringify({ size: query.length })));
});

app.get("/coverage", function (req, res) {
  const MODULE = req.query.module;
  const BANKS = [];
  const encodedBanks = req.query.banks.split("");
  ["LH", "AI"].forEach((bank, index) => {
    if (encodedBanks[index] == 1) {
      BANKS.push(`'${bank}'`);
    }
  });

  const knownQuery = SQL.execute(
    `
    SELECT true
    FROM question
    LEFT JOIN (
      SELECT
        question_id,
        is_known
      FROM known
      WHERE
        session_id = '${req.sessionID}'
    ) session
    ON
      question.id = session.question_id
    WHERE
      question.module = ${MODULE} AND
      question.bank IN (${BANKS.join(",")}) AND
      session.is_known = true
    `
  ).then(([query]) => query);

  const totalQuery = SQL.execute(
    `
    SELECT true
    FROM question
    WHERE
      module = ${MODULE} AND
      bank IN (${BANKS.join(",")})
    `
  ).then(([query]) => query);

  Promise.all([knownQuery, totalQuery]).then(([known, total]) => {
    const result = { known: known.length, total: total.length };
    res.send(JSON.stringify(result));
  });
});

app.post("/submit", function (req, res) {
  const questions = [];
  for (const obj of req.body) {
    questions.push(`'${obj.questionId}'`);
  }

  SQL.execute(
    `
    SELECT
      id as choiceId,
      question_id as questionId,
      is_correct as isCorrect
    from choice
    WHERE
      question_id IN (${questions.join(",")})
    `
  ).then(([query]) => {
    res.send(JSON.stringify(query));
  });
});

app.post("/resolve", function (req) {
  for (const question of req.body) {
    SQL.execute(
      `
      INSERT INTO known
      (question_id, session_id, is_known)
      VALUES
      ('${question.id}', '${req.sessionID}', ${question.isKnown}) 
      ON DUPLICATE KEY
      UPDATE is_known=${question.isKnown}
      `
    );
  }
});

app.post("/reset", function (req) {
  SQL.execute(
    `
    DELETE FROM known
    WHERE session_id = '${req.sessionID}'
    `
  );
});

function loadData() {
  return SQL.execute(`SELECT * FROM module`).then(([res]) => {
    for (const { id, exam, name } of Object.values(res)) {
      modulesName[exam][id] = name;
    }
  });
}

function startServer() {
  let port = 8000;
  app.listen(port, function () {
    console.log(`http://localhost:${port}/`);
  });
}

loadData().then(startServer);
