// House style for the four public content sections.
//
// This is the part of a content system that usually lives in a Google Doc
// nobody opens. It is here instead, beside the editor that uses it, because the
// difference between a company blog that reads as written by people who do the
// work and one that reads as filler is almost entirely FORM: what goes in the
// first paragraph, whether a figure states its baseline, whether a press release
// can be lifted verbatim by a journalist. Those are rules, and rules belong in
// the tool.
//
// Three things per kind:
//   structure  the sections a finished piece has, in order, and what each is for
//   rules      the conventions, each with the failure it prevents
//   template   an empty skeleton the author can drop into the body and fill in
//
// Conventions are the standard ones: inverted-pyramid press releases (AP / PR
// Newswire), challenge-approach-results case studies (the format every
// consultancy and staffing firm files under), and quote-led customer stories.
// Nothing here is invented for this codebase.
//
// Pure: no React, no AWS. Templates are plain HTML in exactly the subset the
// rich editor and `sanitizeRichText` allow (p / strong / em / ul / ol / li / a).

import type { ArticleKind } from "@/lib/aws/dynamodb";

export interface EditorialStep {
  /** The section's name, as an editor would refer to it. */
  name: string;
  /** What it is for, in one line. */
  purpose: string;
  /** The concrete rule, usually with the failure it prevents attached. */
  rule?: string;
}

export interface EditorialGuide {
  /** One line on what this kind IS, before any of the mechanics. */
  premise: string;
  /** Target length. A range, because a floor and a ceiling both matter. */
  length: string;
  /** Who signs it off before it goes out. */
  signoff: string;
  structure: EditorialStep[];
  rules: string[];
  /** A headline in the right shape, next to one in the wrong shape. */
  headline: { good: string; bad: string; why: string };
  /** Skeleton for the body field. */
  template: string;
}

/**
 * The About paragraph that closes every release.
 *
 * Boilerplate is boilerplate on purpose: it is identical in every release so a
 * journalist can lift it without checking, and so the company is described the
 * same way in every outlet. Fill the bracketed facts once, then never edit them
 * per release, if they change, change them here.
 */
export const PRESS_BOILERPLATE =
  "<p><strong>About Ocean Blue Corporation</strong><br>" +
  "Ocean Blue Corporation is an IT staffing and enterprise services firm that places " +
  "engineers, consultants and delivery teams with organisations across [industries]. " +
  "Founded in [year] and headquartered in [city, state], the company supports clients " +
  "through contract, direct-hire and managed-team engagements. Learn more at " +
  "<a href=\"https://oceanbluecorp.com\">oceanbluecorp.com</a>.</p>";

export const EDITORIAL_GUIDES: Record<ArticleKind, EditorialGuide> = {
  // ── Blog ───────────────────────────────────────────────────────────────────
  blog: {
    premise:
      "Something we learned by doing the work, written by the person who did it. It should be useful to a reader who will never buy from us.",
    length: "900–1,600 words. Under 700 usually means nothing was said; past 2,000 nobody finishes.",
    signoff: "One other person reads it. That is the whole review.",
    structure: [
      {
        name: "Headline",
        purpose: "Promises one specific thing.",
        rule: "Name the subject and the payoff. If it would fit any company's blog, it is not a headline yet.",
      },
      {
        name: "Deck",
        purpose: "One sentence: who this is for, and what they leave with.",
        rule: "This is also the card text and the search-result description. Write it deliberately.",
      },
      {
        name: "Opening, 2–3 sentences",
        purpose: "The reader's problem, in their words.",
        rule: "Start at the problem. No history of the industry, no “in today's fast-moving market”.",
      },
      {
        name: "Body, 3–6 sections",
        purpose: "One idea per section, 150–300 words each, under its own subheading.",
        rule: "Someone skimming only the subheadings should still get the argument.",
      },
      {
        name: "Evidence",
        purpose: "A figure, a real example, or a named tool behind every claim.",
        rule: "An unsourced claim is an opinion. Either back it or cut it.",
      },
      {
        name: "Takeaway",
        purpose: "What the reader can do differently on Monday.",
      },
      {
        name: "Close",
        purpose: "A next step that matches the post.",
        rule: "A technical post ends in a link or a repo, not a sales call. Mismatched CTAs are why people stop trusting a blog.",
      },
    ],
    rules: [
      "Write to one named reader, a hiring manager at a 500-person insurer, not “businesses”.",
      "First person. The byline is a real colleague with a real job title, never “the team”.",
      "Cut any sentence that would survive unchanged on a competitor's blog.",
      "Numbers beat adjectives. “Filled 12 of 12 in six weeks” beats “rapid delivery”.",
      "Link out to sources. Refusing to link to anyone else reads as insecurity.",
      "Say the unflattering part. What went wrong is the reason anyone believes the rest.",
    ],
    headline: {
      good: "What we learned filling 40 SAP roles in 90 days",
      bad: "The importance of IT staffing in the modern enterprise",
      why: "The first names a real thing that happened and implies specifics. The second could have been written by anyone, about nothing.",
    },
    template:
      "<p><em>Opening: the problem this reader has, in their words. Two or three sentences. Delete this line.</em></p>" +
      "<p><strong>The situation</strong></p><p>What was in front of us, with the constraint that made it hard.</p>" +
      "<p><strong>What we tried first</strong></p><p>Including the part that did not work.</p>" +
      "<p><strong>What actually worked</strong></p><p>The approach, concretely enough to copy.</p>" +
      "<p><strong>What we would do differently</strong></p><p>One honest paragraph.</p>" +
      "<p><strong>The takeaway</strong></p><ul><li>First thing to do differently.</li><li>Second.</li><li>Third.</li></ul>",
  },

  // ── Case study ─────────────────────────────────────────────────────────────
  "case-study": {
    premise:
      "One engagement, argued with figures. A buyer should finish it knowing whether we have solved their problem before.",
    length: "600–1,000 words. It is a proof document, not an essay.",
    signoff: "The client sponsor signs off in writing before it is published. No exceptions.",
    structure: [
      {
        name: "Title",
        purpose: "Outcome plus who it was for.",
        rule: "Lead with the result: “38% faster time-to-fill for a Fortune 500 payer”.",
      },
      {
        name: "At a glance",
        purpose: "Client, industry, service line, engagement length.",
        rule: "Fill the fields above the body. A buyer scans this before reading a word.",
      },
      {
        name: "The figures",
        purpose: "Two or three headline numbers, up top.",
        rule: "Every figure states its baseline and its window. “38% faster” alone is not a fact, it is a hope.",
      },
      {
        name: "The challenge",
        purpose: "The business problem and what it was costing them.",
        rule: "Cost, delay, risk, or attrition. Not “they needed developers”, that is a requisition, not a challenge.",
      },
      {
        name: "The approach",
        purpose: "What we did, in order, including the decisions and the trade-offs.",
        rule: "Specific enough that a competitor could copy it. If it isn't, it says nothing.",
      },
      {
        name: "The results",
        purpose: "The same figures again, in prose, against the baseline.",
        rule: "Same metrics as the top. Introducing new ones here looks like moving the goalposts.",
      },
      {
        name: "The client's words",
        purpose: "One quote from the person who signed the contract.",
        rule: "A named sponsor with their title. An anonymous quote is worth nothing.",
      },
      { name: "What happened next", purpose: "Renewal, expansion, or the work still running." },
    ],
    rules: [
      "The client is the protagonist. We are the instrument. Count the sentences whose subject is “we”, if it is most of them, rewrite.",
      "No name without written approval. Anonymise instead: “a Fortune 500 healthcare payer”, with the industry and scale kept.",
      "Never round a figure in our favour, and never present a projection as a result.",
      "Say what it cost, in time or scope. A case study with no constraints reads as fiction.",
      "One quote is persuasive. Three is a testimonial page pretending to be a case study.",
    ],
    headline: {
      good: "Filling 12 hard-to-source SAP roles in six weeks for a Fortune 500 payer",
      bad: "Ocean Blue delivers exceptional staffing solutions for healthcare client",
      why: "The first is checkable and states the scale, the difficulty and the window. The second is an adjective with a logo attached.",
    },
    template:
      "<p><em>Use the Challenge, Approach and Results fields above for the main narrative. This body is the framing around them, delete what you do not need.</em></p>" +
      "<p><strong>Background</strong></p><p>Who the client is, at the scale that matters (headcount, revenue band, footprint), and where this work sat in their year.</p>" +
      "<p><strong>Why they came to us</strong></p><p>What they had already tried, and why it had not worked.</p>" +
      "<p><strong>What happened next</strong></p><p>Renewal, expansion, or the work still running today.</p>",
  },

  // ── News ───────────────────────────────────────────────────────────────────
  news: {
    premise:
      "A dated announcement in press-release form, written so a journalist can publish it unedited and a customer can understand it in one read.",
    length: "Under 500 words. A release that needs a second page is two releases.",
    signoff:
      "Anyone named or quoted approves their own words first. On a partnership, both companies approve the whole release.",
    structure: [
      {
        name: "Headline",
        purpose: "The announcement, in one line.",
        rule: "Under 100 characters, present tense, active voice. No jargon a customer would not use.",
      },
      { name: "Subhead", purpose: "One line of supporting detail the headline had no room for." },
      {
        name: "Dateline",
        purpose: "CITY, State — Month D, YYYY —",
        rule: "Set the city in the field above; the date comes from the publish date, so they can never disagree.",
      },
      {
        name: "Lead paragraph",
        purpose: "Who, what, when, where and why, in 40 words or fewer.",
        rule: "If an editor published only this paragraph, the announcement would still be intact.",
      },
      {
        name: "Body, 2–4 paragraphs",
        purpose: "Detail in descending order of importance.",
        rule: "Inverted pyramid: an editor cuts from the bottom, so nothing essential may live at the end.",
      },
      {
        name: "Executive quote",
        purpose: "One named leader, saying something a person would actually say.",
        rule: "Quotes carry opinion and significance. Facts belong in the body, never buried in a quote.",
      },
      { name: "Partner or client quote", purpose: "Optional. Only with their written approval." },
      { name: "Boilerplate", purpose: "The About paragraph, identical in every release." },
      {
        name: "Media contact",
        purpose: "A name, an email and a phone number that will be answered.",
        rule: "A journalist on deadline who cannot reach anyone writes the story without you.",
      },
    ],
    rules: [
      "No adjective you cannot source. “Leading”, “world-class”, “innovative” and “best-in-class” are not claims, they are noise.",
      "Every fact must be checkable by someone outside the company.",
      "Name the awarding body, the certifying auditor, or the partner. An unattributed award is not news.",
      "Write for a reader who has never heard of us. Expand every acronym on first use.",
      "Publish it the day it is true. A release dated three weeks after the event is an archive entry.",
      "If it is someone else's story about us, file it as “In the press” and link out rather than restating it.",
    ],
    headline: {
      good: "Ocean Blue Corporation earns ISO 27001 certification for information security",
      bad: "Ocean Blue Corporation is proud to announce an exciting new milestone",
      why: "The first states the fact and names the standard, so it can be verified and quoted. The second announces that an announcement exists.",
    },
    template:
      "<p><strong>[Lead paragraph]</strong> Ocean Blue Corporation today announced [what], [the one detail that makes it matter]. Keep this under 40 words and make it able to stand alone.</p>" +
      "<p>[Second paragraph] The context: why now, what it changes, and for whom.</p>" +
      "<p>[Third paragraph] The supporting detail, scope, scale, dates, or the standard being met.</p>" +
      "<p>“[Quote from a named executive: what this means, in the voice of a person, not a brochure],” said [Name], [Title] at Ocean Blue Corporation. “[Second sentence, forward-looking].”</p>" +
      "<p>“[Optional partner or client quote, approved in writing by them],” said [Name], [Title] at [Company].</p>" +
      PRESS_BOILERPLATE +
      "<p>###</p>",
  },

  // ── Customer story ─────────────────────────────────────────────────────────
  "customer-story": {
    premise:
      "The client's account, in their words. Where a case study argues, a story testifies, so the quote does the work and we stay out of the way.",
    length: "350–600 words. Longer and it becomes a case study with the numbers taken out.",
    signoff:
      "The person quoted reads the final draft and approves it in writing. Send them the live link too.",
    structure: [
      {
        name: "The quote",
        purpose: "One or two sentences that could only have come from them.",
        rule: "This is the hero of the page. If the quote is bland, the story is not ready, go back and ask a better question.",
      },
      { name: "Who they are", purpose: "One line: the company, the person, their job." },
      {
        name: "The problem, in their words",
        purpose: "What their week looked like before.",
        rule: "Their vocabulary, not ours. If they said “drowning in CVs”, print that.",
      },
      { name: "What changed", purpose: "The difference, concretely, day to day." },
      {
        name: "Two or three figures",
        purpose: "Light proof, not a full metrics table.",
        rule: "Only figures they are happy to say out loud. This is their page, not our scoreboard.",
      },
      {
        name: "Their advice",
        purpose: "What they would tell someone in the same position.",
        rule: "The most-read line on the page, and the only one a competitor cannot write.",
      },
    ],
    rules: [
      "Edit for length, never for meaning. Reshaping someone's words into marketing copy is how you lose a reference customer.",
      "Keep the hesitation. “We were sceptical at first” makes everything after it believable.",
      "One person, named, with their title and their employer, and permission for all three.",
      "No adjectives we chose. If “seamless” is not in the transcript, it does not appear.",
      "Get the interview recorded and keep it. A quote you cannot produce a source for is a liability.",
    ],
    headline: {
      good: "“We stopped interviewing people who were never going to say yes”",
      bad: "Customer success story: a great partnership",
      why: "A story is titled with its quote. The first is a sentence a real person said; the second is a category label.",
    },
    template:
      "<p><em>Put the pull quote in the Quote field above, it renders as the hero. This body is the story around it.</em></p>" +
      "<p><strong>Who they are</strong></p><p>[Company], [what they do], [scale]. [Name] is [title] and owns [what].</p>" +
      "<p><strong>Before</strong></p><p>What their week looked like, in their words.</p>" +
      "<p><strong>What changed</strong></p><p>The difference day to day, not the features.</p>" +
      "<p><strong>Their advice</strong></p><p>“[What they would tell someone in the same position.]”</p>",
  },
};

/** The guide for a kind. */
export const editorialGuide = (kind: ArticleKind): EditorialGuide => EDITORIAL_GUIDES[kind];
