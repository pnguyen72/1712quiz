# HTML to JSON script

`QuizHTMLToJSON.py` is a python script that takes all `.html` files in this directory, combine and convert them to the app's JSON format.

## How to use

1. Get 0% on a quiz, then navigate to its feedback page.

2. Open inspect element and find the `<form>` element with a `method` attribute. (There should be only one.)

3. Copy the outer HTML of the `<form>` element, and paste it to a `.html` file in this directory. The file name does not matter.

4. (Optional) You can take multiple attempts of the quiz and have multiple `.html` files, one for each attempt.

5. Edit the python script to update the module number. **Do not commit this change.**

6. Run the script. The data will be written to `/data/modules/{module number}.json`. If the file already exists, the old and new data will be combined.

## Credit

Thanks [Szymon](https://github.com/SzymZem) for the wonderful script.
