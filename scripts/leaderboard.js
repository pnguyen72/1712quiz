const appTitle = document.querySelector(".app-title span");

function isLeaderboardPage() {
    return location.pathname.endsWith("leaderboard.html");
}

if (isLeaderboardPage()) {
    const stopFilterButton = appTitle.parentElement.querySelector(".bx");
    stopFilterButton.addEventListener("click", stopFilterByUser);
}

async function submitToLeaderboard(attemptData) {
    await loadFirebase();
    if (!leaderboardDB) return;

    function betterThan(attempt1, attempt2) {
        if (attempt1.score != attempt2.score)
            return attempt1.score > attempt2.score;

        if (attempt1.outOf != attempt2.outOf)
            return attempt1.outOf < attempt2.outOf;

        if (attempt1.speed != attempt2.speed)
            return attempt1.speed > attempt2.speed;

        return attempt1.timestamp > attempt2.timestamp;
    }

    leaderboardDB
        .where("user", "==", attemptData.user)
        .where("modules", "==", attemptData.modules)
        .limit(1)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                // user + timestamp is just a convenient way to create a unique ID,
                // it's does not necessarily reflect the actual user or timestamp of the attempt
                const attemptID = `${attemptData.user}_${attemptData.timestamp}`;
                leaderboardDB.doc(attemptID).set(attemptData);
            } else {
                snapshot.forEach(
                    (doc) =>
                        betterThan(attemptData, doc.data()) &&
                        doc.ref.set(attemptData)
                );
            }
        });
}

async function updateLeaderboard() {
    await loadFirebase();
    if (!leaderboardDB) return;

    const exam = getSelectedExam();
    const modules = getSelectedModules();

    let query = leaderboardDB;
    if (modules.length > 0) {
        query = query.where(
            "modules",
            "==",
            modules.map((x) => parseInt(x)).join(", ")
        );
    } else {
        query = query.where("exam", "==", exam);
    }
    if (selectedUser) {
        query = query.where("user", "==", selectedUser);
    }
    query
        .orderBy("score", "desc")
        .orderBy("outOf", "asc")
        .orderBy("speed", "desc")
        .limit(20)
        .onSnapshot((snapshot) => {
            attemptsTable
                .querySelectorAll(".row")
                .forEach((row) => row.remove());
            document.getElementById("leaderboard-empty").style.display = "";

            snapshot.forEach((doc) => {
                const attempt = doc.data();

                const score = attempt.score;
                const outOf = attempt.outOf;
                const accuracy = score / (outOf + Number.EPSILON);
                const roundedAccuracy = Math.round(
                    (accuracy + Number.EPSILON) * 100
                );
                const [H, S, L] = getColor(accuracy);

                const row = document.createElement("tr");
                const user = document.createElement("td");
                const timestamp = document.createElement("td");
                const modules = document.createElement("td");
                const duration = document.createElement("td");
                const result = document.createElement("td");
                const resultScore = document.createElement("span");
                const resultPercentage = document.createElement("span");

                user.className = "user";
                user.innerText = attempt.user;
                user.addEventListener("click", () =>
                    filterByUser(attempt.user)
                );

                timestamp.className = "timestamp";
                timestamp.setAttribute("value", attempt.timestamp);
                timestamp.addEventListener("click", () => {
                    toQuizPage();
                    generatePastAttempt(attempt);
                });

                modules.className = "modules";
                modules.innerText = attempt.modules;

                duration.className = "duration";
                duration.innerText = attempt.duration;

                resultScore.className = "score";
                resultScore.innerText = `${score}/${outOf}`;

                resultPercentage.className = "percentage";
                resultPercentage.innerText = ` (${roundedAccuracy}%)`;

                result.className = "result";
                result.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
                if (darkModeToggle.checked) {
                    result.style.color = L < 61 ? "#eee" : "#000";
                }
                result.appendChild(resultScore);
                result.appendChild(resultPercentage);

                row.className = "row";
                row.setAttribute("exam", attempt.exam);
                row.setAttribute("modules", attempt.modules);
                row.appendChild(user);
                row.appendChild(timestamp);
                row.appendChild(modules);
                row.appendChild(duration);
                row.appendChild(result);
                attemptsTable.querySelector("tbody").appendChild(row);
            });

            refreshAttemptsTable();
        });
}

function filterByUser(username) {
    selectedUser = username;
    appTitle.innerHTML = `
    COMP 1712: <span class="username">${username}</span>`;
    updateLeaderboard();
}

function stopFilterByUser() {
    selectedUser = null;
    appTitle.innerHTML = "COMP 1712 Leaderboard";
    updateLeaderboard();
}

async function visitLeaderboardAttempt(id) {
    toQuizPage();

    await loadFirebase();
    if (!leaderboardDB) return;

    const attemptDoc = await leaderboardDB.doc(id).get();
    generatePastAttempt(attemptDoc.data());
}
