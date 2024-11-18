# HTML to JSON script

`QuizHTMLToJSON.py` is a python script that takes all `.html` files in this directory, combine and convert them to the app's JSON format.

## How to use

1. Get 0% on a quiz, then navigate to its feedback page.

2. Open inspect element and find a `<form>` element with a `method` attribute.

3. Right-click the `<form>` element, hit copy > copy element.

4. Paste what you copied to an `.html` file in this directory. The name does not matter.

5. (Optional) You can take multiple attempts of the quiz and have multiple `.html` files, one for each attempt.

6. Edit the python script to update the module number. **Do not commit this change.**

7. Run the script. The data will be written to `/data/LH/module{module number}.json`. If the file already exists, the old and new data will be combined.

## Credit

Thanks [Szymon](https://github.com/SzymZem) for the wonderful script.
