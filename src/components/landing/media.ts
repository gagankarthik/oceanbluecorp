/* ============================================================
   Central image map for the landing + marketing pages.
   All URLs are verified Unsplash CDN links (business / tech /
   team). Swap any of these to rebrand — it's the single place
   to change site imagery. Rendered via <Photo>, which falls
   back to a clean Ocean-Blue gradient if a URL ever fails.
   ============================================================ */

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  heroSlides: [
    u("1497215728101-856f4ea42174"), // modern open office
    u("1522071820081-009f0129c71c"), // team meeting
    u("1558494949-ef010cbdcc31"), // server room / infrastructure
  ],
  serviceTalent: u("1521737604893-d14cc237f11d"), // team collaborating
  serviceSolutions: u("1504384308090-c894fdcc538d"), // server racks
  serviceManaged: u("1451187580459-43490279c0fa"), // network / earth
  serviceEngineering: u("1581091226825-a6a2a5aee158"), // engineer at work
  insightHiring: u("1497366811353-6870744d04b2"), // meeting room
  insightCloud: u("1454165804606-c3d57bc86b40"), // analytics on screen
  insightSupport: u("1573164713988-8665fc963095"), // working at computer
  caseStudy: u("1486406146926-c627a92ad1ab"), // modern building
  cta: u("1600880292089-90a7e086ee0c"), // business meeting
  servicesHero: u("1519389950473-47ba0277781c"), // team on laptops
  aboutHero: u("1556761175-5973dc0f32e7"), // office interior
  aboutTeam: u("1542744173-8e7e53415bb0"), // team meeting
  contactHero: u("1497032628192-86f99bcd76bc"), // office workspace
  teamHero: u("1522071820081-009f0129c71c"), // team meeting
  auth: u("1521791136064-7986c2920216"), // team handshake
  productsHero: u("1531973576160-7125cd663d86"), // tech / code
  productAts: u("1454165804606-c3d57bc86b40"), // analytics dashboard
  productPortal: u("1497366754035-f200968a6e72"), // workspace
  productApi: u("1504384308090-c894fdcc538d"), // servers
};
