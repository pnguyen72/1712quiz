from typing import Any
from bs4 import BeautifulSoup
import json
import os

_script_dir = os.path.dirname(os.path.abspath(__file__))


def import_existing_data():
    try:
        with open(OUT_PATH, "r") as f:
            quiz_data: dict[str, dict[str, Any]] = json.load(f)
    except FileNotFoundError:
        return {}

    formatted_data = {}
    for question_data in quiz_data.values():
        question = question_data.pop("question")
        formatted_data[question] = question_data
    return formatted_data


def get_new_data(quiz_data: dict[str, dict[str, Any]]):
    def extract_between(text: str, start: str, end: str):
        start_index = text.find(start)
        if start_index == -1:
            return "Start string not found"

        end_index = text.find(end, start_index + len(start))
        if end_index == -1:
            return "End string not found"

        return text[start_index + len(start) : end_index]

    # Get all HTML files in the directory
    html_files = [f for f in os.listdir(IN_PATH) if f.endswith(".html")]

    new_questions_count = 0

    for html_file in html_files:
        htmlPath = os.path.join(IN_PATH, html_file)

        # Load and parse the HTML file
        with open(htmlPath, "r", encoding="utf-8") as file:
            soup = BeautifulSoup(file, "html.parser")

        questionBlocks = soup.find_all(
            "div", style="text-align:left;margin:0em 0em 0.9em 0.9em;"
        )

        if len(questionBlocks) == 0:
            print(f"{html_file}: no questions.")
            continue
        else:
            print(f"{html_file}: {len(questionBlocks)} questions", end="")

        skipped = 0
        for i in range(len(questionBlocks)):
            questionParent = questionBlocks[i].find(
                "div",
                style="text-align:left;width:100%;margin-top:0.5em;margin-bottom:0.5em;",
            )
            question = questionParent.find("d2l-html-block")
            questionTitle = question["html"]

            # check if the question is already in the dictionary
            if questionTitle in quiz_data:
                skipped += 1
                continue

            answerOptions = questionBlocks[i].find_all("tr")
            choices = {}

            for j in range(len(answerOptions)):
                answerParent = answerOptions[j].find(
                    "div", class_="d2l-htmlblock-untrusted d2l-htmlblock-inline"
                )
                answer = extract_between(
                    str(answerParent),
                    'td style="width: 100%;"&gt;',
                    "&lt;/td&gt;&lt;/tr&gt;&lt;",
                )

                if "Start string not found" in answer:
                    answer = extract_between(
                        str(answerParent), '<d2l-html-block html="', '" inline='
                    )
                    answer = answer[3:]

                is_correct = (
                    answerOptions[j].find("img", alt="Correct Answer") is not None
                )
                # append this: answer: is_correct
                choices[answer] = is_correct

            quiz_data[questionTitle] = {"choices": choices}

        block_questions = len(questionBlocks) - skipped
        print(f", {block_questions} of them new.")
        new_questions_count += block_questions

    print(f"TOTAL: {new_questions_count} questions added to data.")


def save_data(quiz_data: dict[str, dict[str, Any]]):
    formatted_data = {}
    for i, (question, question_data) in enumerate(quiz_data.items()):
        question_id = f"LH.{str(MODULE).zfill(2)}.{str(i+1).zfill(2)}"
        formatted_data[question_id] = {"question": question} | question_data

    # Save the parsed data to a JSON file
    with open(OUT_PATH, "w") as f:
        json.dump(formatted_data, f, indent=2)


def main():
    quiz_data = import_existing_data()
    get_new_data(quiz_data)
    save_data(quiz_data)


# edit before running the script, but DO NOT COMMIT the change
MODULE: int = MODULE_NUMBER_GOES_HERE
IN_PATH = _script_dir
OUT_PATH = os.path.join(_script_dir, "../data/LH", f"module{MODULE}.json")

if __name__ == "__main__":
    main()
