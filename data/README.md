# Contributing Guide

I cannot do this all by myself. **If you want to help, let me know and I'll give you commit right.** Let's make this not *my* website, but *our* website.

Good thing is, you don't have to touch my crappy code. Just add the data in the correct format, and everything should just work. (If it doesn't, let me know, that will be my responsibility.)

## Data Format

The top-level data file is `modules.json`, which is in this format:

```json
{
    "midterm": [
        "names of pre-midterm modules"
    ],
    "final": [
        "names of post-midterm modules"
    ]
}
```

Note that this website is organized by lecture modules, not textbook chapters.

The questions for each module are stored in `LH/module#.json` if they are from Learning Hub, or `AI/module#.json` if they are AI-generated. The file is in this format:

```yaml
{
    "Question 1 text": {
        "img": "image_file_name", # optional, only if the question includes an image
        "select_all_that_apply": true/false, # whether the question is multi-select
        "choices": {
            "choice 1 text": {
                "isCorrect": true/false, # whether the choice is correct
                "reason": "a brief explanation of why this choice is true/false" # optional
            },
            # etc. for choice 2, 3,...
        }
    },
    # etc. for question 2, 3,...
}

```

Some questions contain an image. Question images are stored in `resources`. The file names don't matter, as long as the question data refers to them by the correct name.

### Reason

You don't have to give reason for every choice (although you may, if you have nothing else to do). Usually, a reason for the correct choice is sufficient.

Keep it short, like 1 or 2 sentences. If the question is fact-based (e.g. T/F question), quote the textbook/slides/chapter summary with a page/slide number. If the question is understanding-based (e.g. "what's the most appropriate methodology if..."), give a simple explanation in your own words, no need to quote or cite sources.

These are just suggestions. Ultimately, do what makes the most sense to you and what you think is most helpful to your classmates.
