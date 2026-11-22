# Motion QA

- Build: `8e26ee745953ec8d`
- Viewport: 1536x736, headless Edge
- Expected: 13
- Passed: 13
- Failed: 0

- [x] home entry animates on load: 15 animations
- [x] home entry animations are finite and end before cleanup
- [x] home entry ends with content fully visible
- [x] answer pick pops only the chosen choice: ["button.gx-choice.is-selected.is-popping","button.gx-choice.is-selected.is-popping","button.gx-choice.is-selected.is-popping","button.gx-choice.is-selected.is-popping","button.gx-choice.is-selected.is-popping","button.gx-choice.is-selected.is-popping","span.gx-key"]
- [x] answer pick does not replay the page entry
- [x] next question slides in the question column: Question 43 -> Question 44
- [x] next question does not replay the page entry
- [x] pause opens its modal with an entry animation
- [x] exam motion ends with no running animations
- [x] reduced motion home uses short fades only
- [x] reduced motion home ends with content fully visible
- [x] reduced motion next question uses short fades only
- [x] no runtime errors
