# Website requirements: oceanbluecorp.com

A brief for anyone designing or building the Oceanblue Solutions, Inc. website. Who we are and what we do is in `brand.md`; this file covers what the site must achieve and how it must be built.

## 1. Goals

1. A first-time buyer understands within five seconds what we do, who it is for and what to do next.
2. Buyers start a conversation ("Talk to us"). This is the primary conversion.
3. Candidates find and apply for jobs ("Find a job"). This is the secondary conversion.
4. Public-sector and enterprise buyers can verify our certifications, partners and references without asking.

## 2. Audiences

| Audience | What they need | Their action |
|---|---|---|
| Enterprise and agency buyers (IT, engineering, procurement leads) | What we do, proof, certifications, how to engage | Talk to us |
| Procurement and supplier-diversity teams | Certifications, legal entity, contact details | Talk to us, download or verify credentials |
| Candidates | Open roles, what working here is like | Find a job, apply |
| Staff | Sign in to the recruiting console and HR portal | Staff sign in, HR portal |

## 3. Site map

- **Home**
- **Solutions:** overview plus one page per practice (IT staffing, engineering, cloud, cybersecurity, ERP, Salesforce, AI and data, managed services, training, digital transformation)
- **Resources:** case studies, customer stories, blog, news, developer docs, products
- **Company:** about us, our team, careers, contact us, HR portal, staff sign in
- **Careers:** working here, job search, job detail with apply
- **Footer and legal:** privacy and legal, security, accessibility, site map, cookie choices, media kit

## 4. Home page, in order

1. **Hero.** The motto as the headline, on two lines, a one-sentence summary, and two buttons: "Talk to us" (primary) and "Explore solutions" (secondary). Headline, summary and buttons must all be visible on a 1280 × 551 laptop screen without scrolling.
2. **Client logos.** "Trusted by enterprises, public agencies and growing brands", logos in their own colours, evenly spaced.
3. **Solutions.** The three areas (Talent, Technology, Operations) with every practice one click away.
4. **Certifications and partners.** The four certifications and three technology partners, each with a plain caption.
5. **Industries.** The four industries, with real photography.
6. **Testimonials.** The three attributed quotes, all visible at once.
7. **Closing call to action.** "Tell us the problem. We will come back with a plan." with "Talk to us" and "Find a job".
8. **Footer.** Contact details, link columns, social links, copyright.

## 5. Visual direction

**Colour.** Built from the two blues in the logo.

| Role | Colour | Use |
|---|---|---|
| Action (ocean blue) | `#0763a6` | Buttons, links, focus, selection. About 10% of a page. |
| Action hover | `#06578f` | Hover and pressed states |
| Logo blue | `#0975c1` | Brand moments, illustration |
| Aqua | `#0cacCF` | Fills and marks only, never text |
| Ink (navy) | `#0a1c32` | Headings, dark bands, footer |
| Body text | `#364a61` | Running text |
| Subtle text | `#526377` | Captions, metadata |
| Paper | `#f2f6fa` | Alternating sections |
| Line | `#dde6ee` | Hairlines and borders |
| Coral (accent) | `#ff9a78` | Atmosphere in gradients only, never on controls or text |

Proportions follow 60-30-10: about 60% white and light blue-grey surfaces, 30% navy for type and dark bands, 10% ocean blue for actions. Success is green, warning amber and danger red, used only for status.

**Typography.** One clean sans-serif family with a monospace companion for figures. A light display weight for headlines (about 60px at most), regular for body text. Body text at 16px or larger, with lines of 45 to 75 characters.

**Imagery.** Real photography of people, places and work. Product interfaces only when they are real. No stock-looking illustrations, no generic icon grids, no gradient blobs standing in for content.

**Layout.** A 1240px content width, a 12-column grid on desktop, generous spacing, one idea per section, and one primary action per view.

**Motion.** Subtle and purposeful: content fades in once, hovers respond within 100ms, nothing loops forever without a pause control, and all motion stops when the visitor prefers reduced motion.

## 6. Content rules

- Every claim must be provable. No invented statistics, client counts or retention rates.
- Never show open-role counts.
- No announcement banner unless the CMS turns one on.
- Calls to action name the action ("Talk to us", "Find a job"), never "Learn more" or "Get started".
- The same action keeps the same name everywhere.
- Headline, summary and button text on the home page are editable from the admin CMS.

## 7. Quality bar

- **Accessibility:** WCAG 2.2 AA. Text contrast at least 4.5:1, keyboard access to everything, visible focus, alt text on every meaningful image.
- **Responsive:** designed for phones first (375px), then tablet and desktop. Touch targets at least 44px. No sideways scrolling.
- **Performance:** fast first load on mobile, optimized images, no layout shift as the page loads.
- **SEO:** a unique title and description per page, structured data for the organization, jobs and breadcrumbs, a sitemap, and clean redirects or 410 responses for retired URLs.
- **Privacy:** cookie consent before any optional storage, and a clear privacy page.

## 8. Technical constraints

- Next.js 16, React 19, TypeScript and Tailwind CSS 4, hosted on AWS Amplify.
- Content (home page text, articles, jobs) comes from the admin console, so layouts must handle longer or shorter text gracefully.
- Design tokens (colours, type sizes, spacing) live in one stylesheet. Pages use the tokens, never raw values.

## 9. Facts to confirm before publishing

The site currently shows these figures, but they need confirmation before they appear as claims:

- Team size ("50+ team members")
- Number of offices ("4 global offices")
- The "48-hour shortlist" standard, stated as a commitment
