from bs4 import BeautifulSoup
import json
import os

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Update paths to be relative to the script's location
htmlDir = os.path.join(script_dir, "Input HTML")
outputPath = os.path.join(script_dir, "Output JSON", "quiz.json")


def extract_between(text, start, end):
    start_index = text.find(start)
    if start_index == -1:
        return "Start string not found"
    
    end_index = text.find(end, start_index + len(start))
    if end_index == -1:
        return "End string not found"
    
    return text[start_index + len(start):end_index]

# Dictionary to hold quiz data in the desired JSON structure
quiz_data = {}

# Get all HTML files in the directory
html_files = [f for f in os.listdir(htmlDir) if f.endswith('.html')]

for html_file in html_files:
    htmlPath = os.path.join(htmlDir, html_file)
    
    # Load and parse the HTML file
    with open(htmlPath, "r", encoding="utf-8") as file:
        soup = BeautifulSoup(file, "html.parser")

    questionBlocks = soup.find_all("div", style="text-align:left;margin:0em 0em 0.9em 0.9em;")

    if len(questionBlocks) == 0:
        print(f"No questionBlocks found in {html_file}")
        continue
    else:
        print(f"{len(questionBlocks)} questionBlocks found in {html_file}")

    for i in range(len(questionBlocks)):
        questionParent = questionBlocks[i].find("div", style="text-align:left;width:100%;margin-top:0.5em;margin-bottom:0.5em;")
        question = questionParent.find("d2l-html-block")
        questionTitle = question['html']

        # check if the question is already in the dictionary
        if questionTitle in quiz_data:
            print("Question already in dictionary! Skipping... " + questionTitle)
            continue

        answerOptions = questionBlocks[i].find_all("tr")
        choices = {}

        for j in range(len(answerOptions)):
            answerParent = answerOptions[j].find("div", class_="d2l-htmlblock-untrusted d2l-htmlblock-inline")
            answer = extract_between(str(answerParent), 'td style="width: 100%;"&gt;', '&lt;/td&gt;&lt;/tr&gt;&lt;')

            if "Start string not found" in answer:
                answer = extract_between(str(answerParent), '<d2l-html-block html="', '" inline=')
                answer = answer[3:]

            is_correct = answerOptions[j].find("img", alt="Correct Answer") is not None
            # append this: answer: is_correct
            choices[answer] = is_correct    

        quiz_data[questionTitle] = {
            "choices": choices,
            "multi_select": False
        }

# Save the parsed data to a JSON file
with open(outputPath, "w", encoding="utf-8") as outfile:
    json.dump(quiz_data, outfile, indent=4)