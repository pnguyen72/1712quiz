## Warnings
**AS OF OCT 29, 2024 THIS SCRIPT DOES NOT DEAL WITH MULTI-SELECT OPTIONS**

## Preamble
`QuizHTMLToJSON.py` is a python script that attempts to take all `.html` files in the `Input HTML` directory, and rip all questions, along with their answers, to format them in felistacios wonderful `JSON` format

the `JSON` is outputted to `Output JSON` directory, named `quiz.json` by default

this script also deals with all duplicate entries.


i whipped this up really quickly this morning so I'm sorry its so bad
100% inefficiency guarantee

## How to use
Navigate to the feedback of any 1712 quiz
	*note: for the script to work, you must have gotten 0% on the quiz*
Open inspect element, and use `ctrl + f` to find `method` (there should only be one `method` attribute, inside a `<form>` element)
Right-click the `<form>` element, hit copy > copy element
Next, create a new `.html` file in the `Input HTML` directory (the name does not matter, as long as its a `.html` file)
Paste what you copied, save, and run the program

Once you've looked over the `.json` file and are happy with it, name it `module[MODULE NUMER]` and put it in the correct folder

:)