# Contributing Guide

I cannot do this all by myself. **If you want to help, let me know and I'll give you commit right.** Let's make this not *my* website, but *our* website.

Good thing is, you don't have to touch my crappy code. Just add the data in the correct format, and everything should just work. (If it doesn't, let me know, that will be my responsibility.)

## Data Format

The top-level data file is `modules.json`, which is in this format:

```yaml
{
    "midterm": [ # names of pre-midterm modules
        "The Life Cycle",
        "Methodologies",
        # etc.
    ],
    "final": [ # names of post-midterm modules
        "Normalization",
        # etc.
    ]
}
```

Note that this website is organized by lecture modules, not textbook chapters.

The questions for each module are stored in `LH/module{#}.json` if they are from Learning Hub, or `AI/module{#}.json` if they are AI-generated. The file is in this format:

```yaml
{
    "Question 1 text": {
        "img": "image_file_name", # optional, only if the question includes an image
        "multi_select": true/false, # whether the question is multi-select
        "choices": {
            "choice 1 text": true/false, # whether the choice is correct
            # etc. for choice 2, 3,...
        },
        "explanation": "a brief explanation for this question's answer" # optional
    },
    # etc. for question 2, 3,...
}

```

Some questions include an image. Question images are stored in `resources`. The file names don't matter, as long as the question data refers to them by the correct name.

### Explanation

If the question is fact-based (e.g. T/F question), quote the textbook/slides/chapter summary with a page/slide number. If the question is understanding-based (e.g. "what's the most appropriate methodology if..."), give a simple explanation in your own words, no need to quote or cite sources.

These are just suggestions to get you started. Ultimately, do what makes the most sense to you and you think is most helpful to your classmates.

**Experimental**: You can use html, but don't go too crazy with it. `<b>`, `<i>`, `<br>` have been tested to work. Do not use block-level elements.
