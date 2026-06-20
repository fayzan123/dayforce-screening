# Org Hierarchy Explorer — Dayforce Product Engineer Intern Assessment

## Objective

Build a responsive web app (Vue.js + Tailwind) that visualizes an organization's reporting hierarchy from a CSV of 40,000 employees. Nodes must be expandable/collapsible and each node must display its descendant count and non-leaf descendant count, along with several derived cost metrics.

Bonus: a second view for organization-wide cost analytics (treat this like a product manager scoping a new feature, not just a chart).

## Source Files (in this repo)

- `/Users/fayzanmalik/Documents/GitHub/dayforce-screening/assets/SCR-20241127-slfy-2.png` — reference screenshot from the assessment showing the expected node card layout, field labels, and visual hierarchy. Use this as the design baseline, not a strict spec.
- `/Users/fayzanmalik/Documents/GitHub/dayforce-screening/data/Giga_Corp_(40k)_-_Sheet1_(2).csv` — the assessment's provided dataset, "Giga Corp (40k)".

## Required Node Data (per the assessment)

For each node, calculate and display:

- **Descendant count** (all reports, recursive)
- **Non-leaf descendant count** (descendants who themselves have reports)
- **Management cost** — recursive sum of salary for descendants who have subordinates
- **IC cost** — recursive sum of salary for descendants with no subordinates
- **Total cost** — sum of salary across all descendants
- **Management cost ratio** — ratio between IC and manager cost

## Performance Constraint (explicit ask from the assessment)

This is the part they're actually grading. Don't recompute descendant trees on every expand/collapse. Roll the metrics up once via a single post-order traversal (bottom-up) when the hierarchy is built, store the computed values on each node, then expand/collapse is just a UI state toggle with zero recomputation. `d3-hierarchy` (`d3.stratify` + `.sum()` / `.eachAfter()`) is built for exactly this and is referenced directly in the assessment doc: https://d3js.org/d3-hierarchy

## Bonus View — Cost Analytics

Reference: https://docs.agentnoon.com/hub/chart-library

Brief is intentionally open: "imagine you're a PM, come up with your own feature set." Don't just reskin the org chart as a bar chart — think about what a PM analyzing 40k headcount would actually want to know (cost concentration by department/location, manager-to-IC ratio outliers, span-of-control distribution, cost per layer, etc).

## What They're Grading On (stated directly in the assessment)

- Efficient calculation of the values, done per path — this is the Performance Constraint above.
- Clean UI. They provide the example screenshot as a starting point only, not a spec to replicate — they explicitly want to see your own visual taste, not a copy of their layout.

## Stack

- Vue 3 (Composition API)
- Tailwind CSS
- d3-hierarchy for tree construction and rollups
- Vite for scaffolding

## Deliverable

A live hosted link (CodeSandbox, CodePen, or similar) — needs to be something a reviewer can click open and have it just run, with the code visible alongside the live preview. That's the literal submission format requested, so don't let the final step become an afterthought.

## Deadline

Tuesday, June 23, 12:00 PM EST.

## Assessment Source

"Engineering role — Coding test" (v2024.06.22), authored by Saahil Jaffer, Dave Kim, Oskar Szulc.

# Raw information text

Email:

Ramijha Puspanathan <Ramijha.Puspanathan@dayforce.com>
Attachments

Jun 18, 2026, 12:30 PM (1 day ago)
to Ramijha

Hi there,

Thank you for your interest in the Fall 2026 Product Engineer Intern (4 or 8 Months) position at Dayforce.

We are pleased to let you know that after reviewing your application, we would like to move forward with your candidacy and invite you to complete the next stage of our recruitment process.

As part of this stage, please complete the attached screening assessment. The assessment outlines the requirements, instructions, expectations, and submission guidelines. Please review the document carefully before you begin.

Submission Instructions

Complete the assessment according to the instructions provided in the attached document.
Share your completed submission with me, Ramijha Puspanathan (Ramijha.Puspanathan@dayforce.com)
Deadline
Tuesday, June 23 at 12:00 PM EST

Late submissions may not be considered, so we encourage you to begin as soon as possible.

If you have any questions regarding the assessment or submission process, please feel free to reach out.

Once the submission deadline has passed, we will review all completed assessments and contact candidates who are selected to move forward in the interview process. Please note that at least one interview round will take place in person at our Dayforce office in Toronto. Additional details regarding the interview process will be provided to selected candidates at a later stage.

We look forward to reviewing your work and learning more about your skills and experience.

Doc:
Engineering role

Coding test
Created by

Saahil Jaffer Dave Kim Oskar Szulc
Version: 2024.06.22

Given a CSV file containing people data, create a responsive layout using Vue.js and
Tailwind to display the hierarchy of people’s reporting lines. The interface should allow
nodes to be expanded and collapsed and display each node’s number of descendants
and non-leaf descendants.
Note

- When counting descendants, think how you can optimize the calculation so that
  the performance is optimal and does not use too much research.
- Fields like Management cost, IC (individual contributor) cost, management cost
  ratio, and total cost are calculated based on the salary field.
- Management Cost is the recursive sum of the salary of descendants who
  have subordinates reporting to them.
- IC Cost is the recursive sum of the salary of descendants who do not have
  anyone reporting to them
- Total cost is the sum of the salary of every descendant.
- Management cost ratio is the ratio between individual contributors and
  managers.

Example

Download link: SCR-20241127-slfy-2.png

Bonus Point
Once the analysis of the hierarchy is done, create another view that helps users analyze
the organization’s cost. Imagine you are a product manager and you need to come up with
your own set of features. You can reference our help doc
https://docs.agentnoon.com/hub/chart-library to get started. Feel free to imagine what
other types of analytics you’d add to make it easier for people to visualize the data in
different ways other than the org chart.

Data

- Giga Corp (40k)
  What we look for
- Efficient calculation of the values. Ensure optimal value calculation is done per
  path.
- You may find https://d3js.org/d3-hierarchy helpful.
- Clean UI. We are providing the example, but feel free to make adjustments. We
  want to see your taste ;)
  How to send back

Share link to the hosted project via a product like https://codepen.io/ or
https://codesandbox.io/ or similar. Something that we can click to open and just runs with
the code on the side.

Looking forward to your submission :)
