# /screens — Compare UI Design Options

When the user provides a description of a UI they want, generate multiple HTML mockup variations so they can visually compare before committing to code.

If no description is provided after `/screens`, use AskUserQuestion to ask: "What UI do you want to compare designs for?"

## Steps

### 1. Generate 2-4 HTML Mockup Variations

Create 2-4 distinct visual approaches for the described UI. Each should take a meaningfully different direction, for example:
- Minimal vs bold
- Card-based vs list-based
- Dark vs light
- Compact vs spacious
- Playful vs professional

### 2. Write Each as a Self-Contained HTML File

Each mockup must be:
- A complete, standalone HTML file with inline CSS (no external dependencies)
- Production-quality — looks like a real app screen, not a wireframe
- Uses realistic placeholder content (real names, real numbers, real copy — NOT lorem ipsum)
- Uses modern CSS: flexbox, grid, CSS variables, smooth transitions
- Responsive and polished

Save each file with a descriptive name:
```
screens/option-a-minimal.html
screens/option-b-bold.html
screens/option-c-dark.html
```

### 3. Create a Comparison Page

Create `screens/compare.html` that:
- Uses iframes to display all options side by side
- Labels each option with a name and 1-line description of the design approach
- Is itself well-styled and easy to scan
- Works well at typical laptop screen widths

### 4. Open in Browser

```bash
open screens/compare.html
```

So the user can see all options at once and pick their favorite before any real code gets written.
