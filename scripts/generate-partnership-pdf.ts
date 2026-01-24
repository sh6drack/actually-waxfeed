import PDFDocument from "pdfkit";
import * as fs from "fs";

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  bufferPages: true,
  info: {
    Title: "Partnership Agreement - WBRU and Polarity Lab LLC",
    Author: "Polarity Lab LLC",
    Subject: "Partnership Agreement Version 2.2",
  },
});

const outputPath = "./scripts/WBRU_POLARITY_PARTNERSHIP_AGREEMENT_FINAL.pdf";
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const NAVY = "#1a365d";
const BLACK = "#000000";

// Simple helper functions that let PDFKit handle page breaks naturally
const title = (text: string) => {
  doc.font("Helvetica-Bold").fontSize(24).fillColor(NAVY).text(text, { align: "center" });
  doc.moveDown();
};

const section = (text: string) => {
  doc.moveDown();
  doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY).text(text);
  doc.moveDown(0.5);
};

const subsection = (text: string) => {
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY).text(text);
  doc.moveDown(0.3);
};

const p = (text: string) => {
  doc.font("Helvetica").fontSize(10).fillColor(BLACK).text(text, { align: "justify", lineGap: 2 });
  doc.moveDown(0.4);
};

const b = (text: string) => {
  doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK).text(text);
  doc.moveDown(0.3);
};

const bullet = (text: string) => {
  doc.font("Helvetica").fontSize(10).fillColor(BLACK).text(`• ${text}`, { indent: 15, lineGap: 1 });
};

const letter = (l: string, text: string) => {
  doc.font("Helvetica").fontSize(10).fillColor(BLACK).text(`(${l}) ${text}`, { indent: 15, lineGap: 1 });
};

// ============ COVER PAGE ============
doc.moveDown(5);
title("PARTNERSHIP AGREEMENT");
doc.moveDown();
doc.font("Helvetica").fontSize(14).fillColor(BLACK).text("BETWEEN", { align: "center" });
doc.moveDown();
doc.font("Helvetica-Bold").fontSize(16).fillColor(NAVY).text("Brown Broadcasting Service, Inc.", { align: "center" });
doc.font("Helvetica").fontSize(12).fillColor(BLACK).text("(d/b/a WBRU)", { align: "center" });
doc.moveDown();
doc.font("Helvetica").fontSize(14).fillColor(BLACK).text("AND", { align: "center" });
doc.moveDown();
doc.font("Helvetica-Bold").fontSize(16).fillColor(NAVY).text("Polarity Lab LLC", { align: "center" });
doc.moveDown(4);
doc.font("Helvetica").fontSize(11).fillColor(BLACK).text("Version 2.2 — January 2026", { align: "center" });
doc.font("Helvetica").fontSize(10).text("Reviewed By: Adwoa Hinson, Esq.", { align: "center" });

// ============ PARTIES ============
doc.addPage();
section("PARTIES");
p('This Partnership Agreement ("Agreement") is entered into as of January ____, 2026 (the "Effective Date") by and between:');

b("BROWN BROADCASTING SERVICE, INC.");
doc.font("Helvetica").fontSize(10).text("d/b/a WBRU\n(\"WBRU\")\na 501(c)(3) nonprofit corporation\n88 Benevolent St\nProvidence, RI 02906");
doc.moveDown();
doc.text("and");
doc.moveDown();

b("POLARITY LAB LLC");
doc.font("Helvetica").fontSize(10).text("(\"Contractor\")\na Delaware limited liability company\n409 Benefit Street\nProvidence, Rhode Island 02903");
doc.moveDown();

p('WBRU and Contractor are each a "Party" and collectively the "Parties".');

section("RECITALS");
p('WHEREAS, Contractor has developed and operates the WaxFeed platform (the "Platform"), a social music discovery and DJ booking platform;');
p("WHEREAS, WBRU desires to engage Contractor to further develop, operate, and maintain the Platform as WBRU's flagship digital product;");
p("WHEREAS, Contractor desires to provide such services to WBRU on the terms set forth herein;");
p("NOW, THEREFORE, in consideration of the mutual covenants and agreements herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:");

// ============ SECTION 1 ============
doc.addPage();
section("SECTION 1: SERVICES AND SCOPE");

subsection("1.1 Services");
p('Contractor shall provide the services described and set forth in Exhibit A (Scope of Work) (the "Services"), including but not limited to:');
bullet("Platform development, operation, and maintenance;");
bullet("iOS mobile application development and launch;");
bullet("Content production, including 360 Sound integration and global content tour;");
bullet("Community management and DJ relations;");
bullet("WBRU-specific feature development and integration;");
bullet("Alignment algorithm and taste profiling technology; and");
bullet("Backend infrastructure and CCX integration.");
doc.moveDown(0.5);

subsection("1.2 Scope Limitations");
p("The Services are strictly limited to those described in Exhibit A. Any services, features, deliverables, or work not explicitly listed in Exhibit A are out of scope and not included in the fees set forth herein.");
p('The following (hereafter, the "Explicit Exclusions") are expressly excluded from the Scope of Work and, if desired, require separate Change Orders with additional fees:');
bullet("Advanced Analytics: Real-time dashboards, predictive analytics, custom reporting tools, business intelligence integrations beyond basic platform metrics");
bullet("AI/ML Features: Personalized recommendation engine, automated content curation, predictive booking algorithms, sentiment analysis (beyond core alignment algorithm included in base scope)");
bullet("Additional Mobile Applications: Android native app, iPad-optimized app, Apple Watch app, smart TV apps");
bullet("Third-Party Integrations: Spotify API deep integration, Apple Music integration, social media auto-posting, CRM system connections, payment processor beyond base Stripe");
bullet("Blockchain/Web3: NFT minting, cryptocurrency payments, token-gated content, smart contracts");
bullet("White-Label/Licensing: Platform white-labeling for third parties, API access for external developers, SaaS multi-tenancy");
bullet("Hardware: Physical installations, kiosk development, IoT device integration");
bullet("Localization: Multi-language support, currency localization, regional compliance");
bullet("Enterprise Features: Single sign-on (SSO), advanced user permissions, audit logging, enterprise SLAs");
bullet("Custom Event Tools: Virtual event hosting platform, live streaming infrastructure beyond basic integration, interactive audience features");
doc.moveDown(0.5);

p("Any request for services beyond the Scope of Work—including any of the Explicit Exclusions listed above—requires a written Change Order signed by authorized representatives of both Parties. Each Change Order shall include:");
bullet("A detailed description of the additional work requested;");
bullet("Quotes of additional fees and payment terms;");
bullet("Timeline and milestone adjustments; and");
bullet("Any modifications to existing deliverables or milestones.");
doc.moveDown(0.5);

p("Verbal requests, emails, text messages, or other informal communications do not constitute authorization for additional work. Contractor is under no obligation to perform any work outside the Scope of Work without a fully executed Change Order.");

subsection("1.3 Performance Standards");
p("Contractor shall perform the Services in a professional and workmanlike manner consistent with industry standards for software development, digital platform operation, and content production.");
p("Contractor does not guarantee and shall not be liable for:");
bullet("Specific user growth, engagement, or retention numbers;");
bullet("Revenue, profit, or financial outcomes;");
bullet("Third-party behavior, including users, DJs, artists, or partners;");
bullet("Platform availability beyond commercially reasonable uptime efforts;");
bullet("Compatibility with third-party systems, APIs, or technologies not yet released; or");
bullet("Achievement of any specific business objectives.");
doc.moveDown(0.5);

subsection("1.4 WBRU Cooperation");
p("WBRU shall provide reasonable cooperation, information, access, and resources necessary for Contractor to perform the Services. Any delays caused by WBRU's failure to cooperate will extend Contractor's deadlines by at least the duration of such delay.");

// ============ SECTION 2 ============
doc.addPage();
section("SECTION 2: FEES AND PAYMENT");

subsection("2.1 Year One Fees");
p("WBRU shall pay Contractor the following fees for the first twelve (12) months or first year of the Term:");
doc.moveDown(0.3);

doc.font("Helvetica-Bold").fontSize(9).text("Component                                    Expected Date of Payment                           Amount");
doc.font("Helvetica").fontSize(9);
doc.text("Platform development                         Upon execution of this Agreement                   $110,000");
doc.text("Monthly operations (×11)                     1st day of each calendar month (months 2–12)       $50,000/month");
doc.text("iOS launch milestone                         Within 15 days of App Store approval               $25,000");
doc.text("User milestone (500 MAU)                     Within 15 days of achievement                      $25,000");
doc.text("Advisory Fee (annual)                        Quarterly ($37,500 × 4)                            $150,000");
doc.font("Helvetica-Bold").fontSize(9).text("TOTAL                                                                                           $860,000");
doc.moveDown();

doc.font("Helvetica").fontSize(8).text("The Advisory Fee compensates Contractor for strategic advisory services provided by Contractor, including but not limited to: Strategic technology planning and roadmap development; Music industry insights and DJ ecosystem navigation; Digital transformation consultation; Business development guidance and partnership strategy; and Access to Contractor's research network and innovation pipeline.", { align: "justify" });
doc.moveDown(0.3);
doc.text("For context, comparable advisory arrangements in media and technology range from $80,000 to $150,000 annually for a single advisor. Contractor provides access to three senior principals with complementary expertise (cognitive computing, music industry, full-stack development), plus proprietary technology and execution capability. The $150,000 collective fee represents significant value at below-market rates. Advisory services are separate from and in addition to platform development and operations. Advisory Fee is nonrefundable and payable regardless of platform usage or development status.", { align: "justify" });
doc.moveDown();

subsection("2.2 Year Two");
p("For the second year of the Term and each subsequent year, WBRU shall pay Contractor:");
doc.font("Helvetica-Bold").fontSize(9).text("Component                                    Expected Date of Payment                           Amount");
doc.font("Helvetica").fontSize(9);
doc.text("Monthly Operations (×12)                     1st day of each month                              $46,666.67/month");
doc.text("Advisory Fee (annual)                        Quarterly ($37,500 × 4)                            $150,000");
doc.font("Helvetica-Bold").fontSize(9).text("TOTAL                                                                                           $710,000");
doc.moveDown();

subsection("2.3 Annual Fee Increase");
p("Beginning in the third year of the Term (the second anniversary of the Effective Date) and each year thereafter, all fees (Operations and Advisory) shall increase by 3% over the prior year's rates. For clarity: Year Two fees are $710,000 as stated above; Year Three fees shall be $731,300; and so forth.");

subsection("2.4 Payment Terms");
letter("a", "Due Date. All payments are due on the dates specified above. Monthly payments are due on the 1st of each month.");
letter("b", "Late Payment Interest. Any payment not received within thirty (30) days of its due date shall accrue interest at the rate of one and one-half percent (1.5%) per month from the due date until paid in full.");
letter("c", "Suspension of Services. If any payment remains outstanding for more than forty-five (45) days after its due date, Contractor may, upon ten (10) days written notice, suspend all Services until payment is received in full, including all accrued interest.");
letter("d", "Collection Costs. WBRU shall reimburse Contractor for all costs incurred in collecting overdue amounts, including reasonable attorney fees, collection agency fees, and court costs.");
letter("e", "Right of Offset. Contractor may offset any amounts owed by WBRU against any amounts Contractor may owe to WBRU under this Agreement or otherwise.");
doc.moveDown(0.5);

subsection("2.5 Taxes");
p("All fees are exclusive of taxes. WBRU is responsible for all sales, use, value-added, withholding, and similar taxes arising from this Agreement, excluding taxes based on Contractor's income.");

subsection("2.6 Payment Methods and Mechanics");
b("(a) Payments from WBRU to Contractor:");
p("All payments from WBRU to Contractor shall be made by wire transfer, ACH transfer, or check (with prior written approval). Contractor shall provide bank account details in Exhibit D (Payment Instructions). WBRU shall bear all wire transfer fees charged by WBRU's bank.");

b("(b) Payments from Contractor to WBRU (Revenue Sharing):");
p("All revenue share payments from Contractor to WBRU under Section 5 shall be made by ACH transfer, wire transfer, or check. WBRU shall provide bank account details in Exhibit D. Each payment shall be accompanied by a remittance statement showing calculation.");

b("(c) Invoicing:");
doc.font("Helvetica").fontSize(9);
doc.text("Payment Type          Invoice Timing                Due");
doc.text("Signing Payment       Upon execution                Immediate");
doc.text("Monthly Payments      5 days before due             1st of month");
doc.text("Milestone Payments    Upon achievement              Net 15");
doc.text("Revenue Share         Within 15 days of quarter     Net 45");
doc.moveDown();

b("(d) Payment Disputes:");
p("If WBRU disputes any invoice in good faith, WBRU shall pay all undisputed amounts by the due date, provide written notice of the disputed amount and specific reasons within fifteen (15) days, and work in good faith to resolve within thirty (30) days. Failure to timely dispute constitutes acceptance.");

// ============ SECTION 3 ============
doc.addPage();
section("SECTION 3: TECHNOLOGY PARTNERSHIP AND FUTURE OPPORTUNITIES");

subsection("3.1 Technology-Enabled Revenue Royalty (Platform)");
p("In recognition of Contractor's ongoing technology partnership and the value created by the Platform, WBRU shall pay Contractor a royalty on all Technology-Enabled Revenue (defined below) generated through or enabled by the Platform.");

subsection("3.1.1 Definition of Technology-Enabled Revenue");
p('"Technology-Enabled Revenue" means all gross revenue derived from or enabled by the Platform, including but not limited to:');

b("(a) Streaming Revenue:");
bullet("Pay-per-view streaming fees and virtual ticket sales;");
bullet("Subscription or membership fees for streaming access;");
bullet("Advertising revenue from streams (pre-roll, mid-roll, display, overlay); and");
bullet("Sponsorship revenue attributable to streaming content or digital broadcasts.");
doc.moveDown(0.3);

b("(b) Platform Revenue:");
bullet("In-app purchases and premium feature access fees;");
bullet('Digital tipping, donations, or "virtual gifts" through the Platform;');
bullet("API access fees charged to third parties; and");
bullet("Platform transaction fees beyond payment processor costs.");
doc.moveDown(0.3);

b("(c) Digital Commerce:");
bullet("Digital merchandise sales (downloads, NFTs, digital collectibles);");
bullet("Affiliate or referral revenue generated through the Platform; and");
bullet("E-commerce revenue from Platform-integrated storefronts.");
doc.moveDown(0.3);

b("(d) Data and Licensing:");
bullet("Analytics or data licensing revenue;");
bullet("Content licensing enabled by Platform infrastructure; and");
bullet("White-label or sublicensing revenue (if authorized).");
doc.moveDown(0.3);

b("(e) Community Revenue:");
bullet("DJ or artist membership/subscription fees collected through the Platform;");
bullet("Community access or premium tier fees; and");
bullet("Virtual workshop, masterclass, or educational content revenue through the Platform.");
doc.moveDown(0.5);

subsection("3.1.2 Exclusions from Technology-Enabled Revenue");
p("Technology-Enabled Revenue explicitly EXCLUDES:");
bullet("Physical event ticket sales (live, in-person attendance at physical venues)");
bullet("Physical merchandise sold at physical locations");
bullet("In-person sponsorship activations (physical banners, booths, on-site branding)");
bullet("Bar, concession, or food/beverage revenue at physical events");
bullet("Charitable donations not processed through the Platform");
bullet("Revenue from activities that do not use or flow through the Platform");
doc.moveDown(0.5);

subsection("3.1.3 Royalty Rate (Performance-Based Ladder)");
p("WBRU shall pay Contractor royalties on Technology-Enabled Revenue in accordance with the following royalty rates:");
doc.font("Helvetica").fontSize(9);
doc.text("Annual Technology-Enabled Revenue     Royalty Rate     Applied To");
doc.text("$0 – $500,000                         15%              All revenue in tier");
doc.text("$500,001 – $1,000,000                 18%              Revenue above $500,000");
doc.text("Above $1,000,000                      20%              Revenue above $1,000,000");
doc.moveDown();

p("For example: If Technology-Enabled Revenue is $1,200,000 in a calendar year, WBRU shall pay to Contractor:");
bullet("First $500,000 × 15% = $75,000");
bullet("Next $500,000 × 18% = $90,000");
bullet("Remaining $200,000 × 20% = $40,000");
bullet("Total Royalty: $205,000");
doc.moveDown(0.5);

subsection("3.1.4 Royalty Payment Terms");
letter("a", "Payment Frequency. Royalties shall be calculated and paid quarterly, within forty-five (45) days of each calendar quarter end.");
letter("b", "Reporting. WBRU shall provide Contractor with a detailed Technology-Enabled Revenue report within thirty (30) days of each quarter end, itemizing revenue by category.");
letter("c", "Minimum Reporting. WBRU shall provide such Technology-Enabled Revenue reports even when Technology-Enabled Revenue is zero.");
letter("d", "Late Payment. Late royalty payments shall accrue interest at 1.5% per month.");
doc.moveDown(0.5);

subsection("3.2 First Right of Refusal");
p("For any technology project WBRU undertakes during the Term and for 36 months following, WBRU shall first offer such project to Contractor.");

subsection("3.3 Additional Technology Partnership Royalties");
p("In addition to the Platform royalty above, Contractor shall receive royalties on:");
doc.font("Helvetica").fontSize(9);
doc.text("WBRU Activity                                          Royalty Rate");
doc.text("Future digital products (beyond WaxFeed)               15% of net revenue");
doc.text("Technology licensing to third parties                  20% of licensing fees");
doc.text("Digital sponsorships and partnerships                  10% of sponsorship value");
doc.moveDown();

subsection("3.4 Success Bonus");
doc.font("Helvetica").fontSize(9);
doc.text("WBRU Asset Threshold                    Bonus");
doc.text("Assets exceed $10,000,000               $50,000");
doc.text("Assets exceed $12,500,000               Additional $50,000");
doc.text("Assets exceed $15,000,000               Additional $75,000");
doc.text("Maximum Total                           $175,000");
doc.moveDown();

subsection("3.5 Structure Change Protection");
p("If WBRU converts to for-profit, merges with for-profit, or creates equity during Term or within 5 years following, Contractor entitled to: (i) right to acquire up to 10% equity at FMV; (ii) 3% transaction fee; (iii) all rights survive to successor.");

subsection("3.6 Audit Rights");
letter("a", "Right to Audit: Contractor shall have the right, upon reasonable notice (not less than fifteen (15) days), to audit WBRU's books, records, and accounts to verify Technology-Enabled Revenue and other amounts payable under this Agreement.");
letter("b", "Frequency: Contractor may conduct one (1) audit per calendar year during regular business hours.");
letter("c", "Scope: Audits may cover any period within the preceding three (3) years.");
letter("d", "Audit Costs: Contractor shall bear the cost of audits; provided, however, if an audit reveals underpayment of five percent (5%) or more for any audited period, WBRU shall reimburse Contractor's reasonable audit costs.");
letter("e", "Underpayment: Any underpayment discovered shall be paid within thirty (30) days, plus interest at 1.5% per month from the original due date.");
letter("f", "Record Retention: WBRU shall maintain complete and accurate records of all Technology-Enabled Revenue for at least five (5) years following each calendar year.");
doc.moveDown(0.5);

subsection("3.7 Assignment and Survival");
letter("a", "WBRU Assignment Restricted: WBRU may not assign, transfer, or delegate this Agreement or any rights or obligations hereunder without Contractor's prior written consent, which may be withheld in Contractor's sole discretion.");
letter("b", "Contractor Assignment Permitted: Contractor may freely assign this Agreement to any affiliate, successor, or acquirer without WBRU's consent.");
letter("c", "Binding on Successors: This Agreement shall be binding upon and inure to the benefit of the Parties and their respective successors and permitted assigns.");
letter("d", "Change of Control: Any change of control of WBRU (including merger, acquisition, sale of substantially all assets, or change in majority ownership) shall be deemed an attempted assignment requiring Contractor's consent.");
letter("e", "Royalty Survival: The Technology-Enabled Revenue royalty obligations under Section 3.1 shall survive termination or expiration of this Agreement and shall continue in perpetuity for so long as WBRU (or any successor or assign) continues to operate the Platform or any derivative thereof.");
letter("f", "Royalty Runs With Platform: The royalty obligation is attached to the Platform itself, not merely to this Agreement. Any sale, transfer, license, or other disposition of the Platform or its operation shall include assumption of the royalty obligation by the transferee.");
doc.moveDown(0.5);

subsection("3.8 Quarterly Business Review");
p("The Parties shall conduct quarterly business reviews to discuss:");
bullet("Platform performance and metrics");
bullet("Technology-Enabled Revenue and royalty calculations");
bullet("Upcoming development priorities");
bullet("Strategic opportunities and expansion discussions");
doc.moveDown(0.3);
p("Reviews shall occur within thirty (30) days of each quarter end. Contractor shall provide an agenda at least five (5) days in advance.");

// ============ SECTION 4 ============
doc.addPage();
section("SECTION 4: INTELLECTUAL PROPERTY");

subsection("4.1 Contractor Intellectual Property");
p('All intellectual property rights in and to the Platform, including but not limited to all source code, object code, algorithms, software, databases, user interfaces, designs, documentation, trade secrets, know-how, methodologies, processes, inventions, and any improvements, modifications, enhancements, or derivative works thereof (collectively, "Contractor IP"), are and shall remain the sole and exclusive property of Contractor.');
p("This includes, without limitation:");
bullet("All code written before, during, or after this Agreement");
bullet("Alignment algorithms and taste profiling technology");
bullet("Conversational Connectomics (CCX) derived features and methodologies");
bullet("User interface designs and user experience flows");
bullet("Backend architecture, APIs, and data structures");
bullet("Any work product created under this Agreement");
doc.moveDown(0.3);
b("WBRU acquires NO ownership interest whatsoever in any Contractor IP.");

subsection("4.2 Pre-Existing Intellectual Property");
p("Contractor's pre-existing intellectual property, including but not limited to technology covered by U.S. Provisional Patent Application Nos. 63/940,728 (filed December 15, 2025) and 63/960,633 (filed January 14, 2026), and any continuations, divisionals, reissues, or foreign counterparts thereof, remains Contractor's sole and exclusive property.");
p("Nothing in this Agreement shall be construed to grant WBRU any rights to Contractor's patents or patent applications, except for the limited license to use the Platform expressly granted in Section 4.3.");

subsection("4.3 License Grant to WBRU");
p("Subject to WBRU's payment of all fees due under this Agreement, Contractor hereby grants to WBRU a:");
bullet("Non-exclusive (Contractor may grant similar licenses to others)");
bullet("Non-transferable (WBRU may not transfer to third parties)");
bullet("Non-sublicensable (WBRU may not sublicense to third parties)");
bullet("Perpetual (subject to Section 4.4)");
bullet("Limited");
doc.moveDown(0.3);
p('license to USE the Platform solely for WBRU\'s own programming, initiatives, and operations (the "License").');

b("Restrictions: The License does not include the right to:");
bullet("Access, view, copy, or receive source code");
bullet("Modify, adapt, or create derivative works of the platform");
bullet("Sublicense, rent, lease, or lend the platform to any third party");
bullet("Reverse engineer, decompile, or disassemble any part of the platform");
bullet('Use Contractor\'s trademarks except as "Founding Partner" designation');
doc.moveDown(0.5);

subsection("4.4 License Termination and Data Ownership");
p("The license granted herein is a license to access and use, not a license to own. WBRU is paying for platform access, development services, and operational support—not for ownership of any data, content, technology, or user relationships.");

letter("a", "Termination of Access: Upon termination or expiration of this Agreement for any reason, the License shall terminate and WBRU's access to the Platform shall cease within thirty (30) days. There is NO perpetual license. There is NO continued access post-termination.");

letter("b", "Data Ownership and Retention: Contractor owns and retains ALL data on the platform, including but not limited to:");
bullet("User accounts, profiles, and user-generated content");
bullet("DJ profiles, booking histories, and engagement data");
bullet("Analytics, metrics, and usage data");
bullet("All CCX-derived data, cognitive metrics, Polarity Points, memory structures, and any outputs of Contractor's proprietary algorithms");
bullet("Content, media, and information uploaded to or generated by the platform");
doc.moveDown(0.3);
b("WBRU has NO ownership interest in any platform data. WBRU has NO right to export, copy, or retain any data upon termination.");

letter("c", "User Relationships: Users (DJs, fans, organizations) who create accounts on WaxFeed have relationships with WaxFeed and Contractor, not with WBRU. Upon termination, these user relationships continue with Contractor. WBRU has no claim to user accounts, user data, or user relationships.");

letter("d", "CCX and Proprietary Data: All cognitive data, including Polarity Points, memory graphs, associative strength calculations, cognitive state classifications, and any other outputs derived from Contractor's Conversational Connectomics (CCX) technology, are and shall remain the sole and exclusive property of Contractor. This data is generated using Contractor's patented methodologies and constitutes Contractor's trade secrets. WBRU shall have NO access to, ownership of, or rights in CCX-derived data, during or after the Term.");

letter("e", "What WBRU Loses Upon Termination:");
bullet("Access to the Platform");
bullet('"Founding Partner" designation and branding rights');
bullet("Revenue share on WBRU-attributed transactions");
bullet("Advisory services and strategic consultation");
bullet("All benefits of this Agreement");

letter("f", "What WBRU Does Not Get Upon Termination:");
bullet("Any data export or data portability");
bullet("Any continued platform access");
bullet("Any perpetual license or ongoing rights");
bullet("Any user accounts, user data, or user relationships");
bullet("Any CCX-derived insights, analytics, or cognitive data");
bullet("Any source code, algorithms, or technology");

letter("g", "Upon WBRU Insolvency: The License shall terminate immediately, regardless of payment status.");
doc.moveDown(0.5);
b("WBRU ACKNOWLEDGES AND AGREES that it is paying for the privilege of access to and development of the Platform, and that termination of this Agreement—for any reason—results in complete termination of that access with no residual rights, data ownership, or ongoing claims of any kind.");

// ============ SECTION 5 ============
doc.addPage();
section("SECTION 5: REVENUE SHARING");

subsection("5.1 WBRU-Attributed Revenue Share");
p("Contractor shall pay WBRU the following revenue shares on WBRU-attributed revenue:");
doc.font("Helvetica").fontSize(9);
doc.text("Revenue Type                                 WBRU Share    Definition");
doc.text("DJ Bookings (WBRU-Affiliated DJs)            20%           Bookings of WBRU-affiliated DJs");
doc.text("DJ Bookings (WBRU-Introduced Users)          15%           Bookings via WBRU channels");
doc.text("Organization Licenses (WBRU-Introduced)     10%           Licenses from WBRU intros");
doc.text("WBRU-Branded Events                          20%           Co-branded event revenue");
doc.moveDown();

p('"Net" means gross revenue less direct costs, payment processing fees, refunds, and chargebacks.');
p("Revenue share payments shall be made quarterly, within forty-five (45) days of each calendar quarter end.");

subsection("5.2 Revenue Not Subject to Sharing");
p("WBRU shall have NO revenue share, royalty, or other interest in:");
bullet("Artist Premium subscription revenue");
bullet("Superfan Premium subscription revenue");
bullet("Non-WBRU DJ bookings");
bullet("Non-WBRU organization licenses");
bullet("Advertising and sponsorship revenue (except WBRU-branded)");
bullet("Investment proceeds, fundraising, or capital contributions");
bullet("Acquisition or exit proceeds");
bullet("Any revenue not explicitly listed in Section 5.1");

// ============ SECTION 6 ============
doc.addPage();
section("SECTION 6: TERM AND TERMINATION");

subsection("6.1 Initial Term");
p('This Agreement shall commence on the Effective Date and continue for an initial term of twenty-four (24) months (the "Initial Term"), unless earlier terminated as provided herein.');

subsection("6.2 Renewal");
p('After the Initial Term, this Agreement shall automatically renew for successive twelve (12) month periods (each, a "Renewal Term"), unless either Party provides written notice of non-renewal at least ninety (90) days prior to the end of the then-current term.');

subsection("6.3 Termination for Cause");
p("Either Party may terminate this Agreement immediately upon written notice if the other Party:");
letter("a", "Materially breaches this Agreement and fails to cure such breach within thirty (30) days of written notice");
letter("b", "Files for bankruptcy protection or has an involuntary bankruptcy petition filed against it");
letter("c", "Becomes insolvent or unable to pay debts as they become due");
letter("d", "Ceases to operate or conduct business in the ordinary course");
doc.moveDown(0.5);

subsection("6.4 Termination for Convenience by WBRU");
p("WBRU may terminate this Agreement for convenience by providing ninety (90) days prior written notice AND paying a termination fee:");
doc.font("Helvetica").fontSize(9);
doc.text("Timing of Termination         Termination Fee");
doc.text("During Year 1                 50% of fees remaining in Year 1");
doc.text("During Year 2                 35% of fees remaining in Year 2");
doc.text("Year 3 and beyond             25% of fees remaining in current term");
doc.moveDown();

subsection("6.5 Termination for Convenience by Contractor");
p("Contractor may terminate this Agreement for convenience by providing one hundred eighty (180) days prior written notice. No termination fee shall apply.");

subsection("6.6 Effect of Termination");
p("Upon termination: (a) all fees owed become immediately due; (b) license rights determined per Section 4.4; (c) Sections 3, 4, 5, 7, 8, 9, 10, 11, 12, and 13 survive; (d) Technology-Enabled Revenue royalty obligations under Section 3.1 survive in perpetuity.");

// ============ SECTION 7 ============
doc.addPage();
section("SECTION 7: LIMITATION OF LIABILITY");

subsection("7.1 Liability Cap");
p("To the maximum extent permitted by applicable law, Contractor's total cumulative liability under this Agreement, whether in contract, tort, negligence, strict liability, or otherwise, shall not exceed the total fees actually paid by WBRU to Contractor in the twelve (12) months immediately preceding the event giving rise to the claim.");

subsection("7.2 Exclusion of Consequential Damages");
p("In no event shall either Party be liable to the other Party for any:");
bullet("INDIRECT DAMAGES");
bullet("CONSEQUENTIAL DAMAGES");
bullet("INCIDENTAL DAMAGES");
bullet("SPECIAL DAMAGES");
bullet("PUNITIVE DAMAGES");
bullet("EXEMPLARY DAMAGES");
bullet("LOST PROFITS OR REVENUE");
bullet("LOST DATA OR CONTENT");
bullet("LOSS OF GOODWILL OR REPUTATION");
bullet("COST OF SUBSTITUTE SERVICES");
bullet("BUSINESS INTERRUPTION DAMAGES");
doc.moveDown(0.3);
p("arising out of or relating to this Agreement, even if such Party has been advised of the possibility of such damages.");

subsection("7.3 Essential Basis of Bargain");
b("THE LIMITATIONS SET FORTH IN THIS SECTION 7 ARE FUNDAMENTAL ELEMENTS OF THE BASIS OF THE BARGAIN BETWEEN THE PARTIES. THE FEES CHARGED UNDER THIS AGREEMENT REFLECT AND ARE SET IN RELIANCE UPON THIS ALLOCATION OF RISK.");

subsection("7.4 Exceptions");
p("The limitations in this Section 7 shall not apply to: (a) WBRU's obligation to pay fees; (b) breach of confidentiality; (c) IP infringement; (d) gross negligence or willful misconduct; (e) indemnification obligations; (f) WBRU's breach of Section 10 (non-solicitation).");

// ============ SECTION 8 ============
doc.addPage();
section("SECTION 8: INDEMNIFICATION");

subsection("8.1 Contractor Indemnification");
p("Contractor shall indemnify, defend, and hold harmless WBRU from third-party claims arising from Contractor's gross negligence, willful misconduct, or IP infringement in code solely created by Contractor. Contractor's indemnification shall not exceed the liability cap in Section 7.1.");

subsection("8.2 WBRU Indemnification");
p("WBRU shall indemnify, defend, and hold harmless Contractor, Contractor Personnel (including Theodore Addo, Nathan Amankwah, and Shadrack Annor individually), and their respective agents from any and all claims arising from:");
letter("a", "WBRU's use of the Platform");
letter("b", "WBRU content integrated into the platform");
letter("c", "WBRU's breach of this Agreement");
letter("d", "WBRU's violation of applicable law");
letter("e", "Any claim by WBRU personnel related to WaxFeed");
letter("f", "Any third-party claim from WBRU's operations");
letter("g", "Any claim alleging Contractor Personnel are employees of WBRU");
letter("h", "Any attempt to pierce the corporate veil or hold Contractor Personnel personally liable");
doc.moveDown(0.5);
b("WBRU's indemnification of Contractor Personnel shall be unlimited and shall survive termination indefinitely.");

// ============ SECTION 9 ============
doc.addPage();
section("SECTION 9: DISPUTE RESOLUTION");

subsection("9.1 Informal Resolution");
p("Before initiating formal proceedings, the Parties shall attempt to resolve disputes through good-faith negotiation for at least thirty (30) days.");

subsection("9.2 Mandatory Binding Arbitration");
p("Any dispute not resolved informally shall be finally resolved by binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules.");
b("Arbitration Terms:");
letter("a", "Location: Providence, Rhode Island");
letter("b", "Arbitrator: Single arbitrator mutually selected");
letter("c", "Governing Law: Rhode Island law");
letter("d", "Confidentiality: All aspects confidential");
letter("e", "Final and Binding: Judgment may be entered in any court");
letter("f", "No punitive damages: Arbitrator may not award punitive damages");
letter("g", "Attorney fees: Prevailing party recovers fees");
doc.moveDown(0.5);

subsection("9.3 Waiver of Jury Trial");
p("Each Party hereby irrevocably waives any right to a trial by jury.");

subsection("9.4 Waiver of Class Action");
p("All disputes shall be resolved on an individual basis. Neither Party may bring a claim as a plaintiff or class member in any class, consolidated, or representative proceeding.");

subsection("9.5 Statute of Limitations");
p("Any claim must be brought within twelve (12) months after the Party knew or should have known of the facts giving rise to the claim. Claims not brought within this period are waived.");

subsection("9.6 Prevailing Party Fees");
p("The prevailing party shall recover its reasonable attorney fees, expert fees, and costs.");

// ============ SECTION 10 ============
doc.addPage();
section("SECTION 10: NON-SOLICITATION");

subsection("10.1 WBRU Non-Solicitation Covenant");
p("During the Term and for eighteen (18) months following termination, WBRU shall not:");
letter("a", "Solicit, recruit, hire, or engage any Contractor Personnel");
letter("b", "Encourage or induce any Contractor Personnel to leave Contractor");
letter("c", "Hire any person who was Contractor Personnel within the preceding 12 months");
letter("d", "Assist any third party in doing any of the foregoing");
doc.moveDown(0.5);

subsection("10.2 Liquidated Damages");
p("If WBRU breaches Section 10.1, WBRU shall pay Contractor:");
doc.moveDown(0.3);
doc.font("Helvetica-Bold").fontSize(14).fillColor(NAVY).text("$150,000 per person", { align: "center" });
doc.moveDown(0.3);
p("solicited, recruited, hired, or engaged in violation of this Section.");
p("This liquidated damages provision shall not limit Contractor's right to seek injunctive relief.");

subsection("10.3 No Contractor Non-Solicitation");
p("Contractor shall not be subject to any non-solicitation restriction with respect to WBRU's personnel.");

subsection("10.4 Injunctive Relief");
p("Contractor shall be entitled to seek injunctive relief, without posting bond, to prevent any breach of this Section 10.");

// ============ SECTION 11 ============
doc.addPage();
section("SECTION 11: GENERAL PROVISIONS");

subsection("11.1 Entire Agreement");
p("This Agreement constitutes the entire agreement between the Parties and supersedes all prior negotiations.");

subsection("11.2 Amendments");
p("This Agreement may only be amended by written instrument signed by both Parties.");

subsection("11.3 Assignment");
p("WBRU may not assign without Contractor's consent. Contractor may freely assign to affiliates or successors.");

subsection("11.4 Governing Law");
p("This Agreement shall be governed by Rhode Island law.");

subsection("11.5 Severability");
p("If any provision is invalid, it shall be modified to the minimum extent necessary.");

subsection("11.6 Waiver");
p("No failure to exercise any right shall operate as a waiver.");

subsection("11.7 Notices");
p("All notices shall be in writing to the addresses above.");

subsection("11.8 Force Majeure");
p("Neither Party liable for delays beyond reasonable control.");

subsection("11.9 Third-Party Beneficiaries");
p("Contractor Personnel are express third-party beneficiaries of Sections 8.2 and 10.");

subsection("11.10 Counterparts");
p("May be executed in counterparts. Electronic signatures valid.");

// ============ SECTION 12 ============
doc.addPage();
section("SECTION 12: CONFIDENTIALITY");

subsection("12.1 Definition of Confidential Information");
p('"Confidential Information" means any non-public information disclosed by one Party to the other that is designated as confidential or would reasonably be understood to be confidential.');
b("Contractor Confidential Information includes: source code, algorithms, software architecture, CCX methodology, pricing models, customer lists, business plans, patent applications, trade secrets, security procedures, and user data.");
b("WBRU Confidential Information includes: budget details, endowment information, Form 990 drafts, content schedules, artist contracts, alumni contact information, and board discussions.");

subsection("12.2 Exclusions");
p("Confidential Information does not include information that: (a) is or becomes publicly available; (b) was already known to the Receiving Party; (c) is independently developed; (d) is rightfully obtained from a third party; or (e) is required to be disclosed by law.");

subsection("12.3 Confidentiality Obligations");
p("Each Party agrees to: (a) use at least reasonable care to protect Confidential Information; (b) use Confidential Information solely for purposes of this Agreement; (c) disclose only to those with need to know who are bound by confidentiality; (d) not copy except as necessary; and (e) not reverse engineer.");

subsection("12.4 Information Sharing Framework");
b("Contractor WILL share with WBRU: Platform usage analytics (aggregate), user growth metrics, feature roadmap, marketing materials, technical support, bug/issue status.");
b("Contractor will not share with WBRU: Source code, algorithm details, CCX methodology, raw user data, other client information, security architecture, pricing for other clients.");

subsection("12.5 Return or Destruction");
p("Upon termination or request, the Receiving Party shall return or destroy all Confidential Information and certify in writing. Receiving Party may retain one archival copy for legal compliance, subject to ongoing confidentiality.");

subsection("12.6 Duration");
p("Confidentiality obligations remain in effect during the Term and for five (5) years following termination. For trade secrets (including source code and algorithms), obligations remain indefinitely.");

subsection("12.7 Injunctive Relief");
p("Each Party may seek injunctive relief to prevent breach, without posting bond.");

subsection("12.8 No Separate NDA Required");
p("This Section 12 constitutes a comprehensive confidentiality framework. No separate NDA is required. If any separate NDA exists, this Section controls.");

// ============ SECTION 13 ============
doc.addPage();
section("SECTION 13: TRADEMARK AND BRAND USE LICENSE");

subsection("13.1 Contractor Trademarks");
p('"Contractor Marks" means the trademarks owned by Contractor, including: WaxFeed, Polarity, Polarity Lab, and associated logos. CCX and Conversational Connectomics are not licensed to WBRU.');

subsection("13.2 Limited Trademark License to WBRU");
p("Subject to compliance with this Agreement, Contractor grants WBRU a non-exclusive, non-transferable, non-sublicensable, revocable, royalty-free license to use Contractor Marks solely as follows:");
b("Permitted Uses:");
bullet('"WaxFeed Founding Partner" designation (exact phrase)');
bullet("WaxFeed logo on WBRU website (per brand guidelines)");
bullet("WaxFeed logo in marketing (with prior approval)");
bullet('Reference to "powered by Polarity Lab" (per brand guidelines)');
bullet("Press releases about partnership (with prior approval)");
doc.moveDown(0.3);

b("Restrictions — WBRU shall not:");
bullet("Alter, modify, or distort any Contractor Mark");
bullet('Use "CCX" or "Conversational Connectomics"');
bullet("White-label, rebrand, or co-brand WaxFeed without consent");
bullet("Register or attempt to register any Contractor Mark");
bullet("Use Contractor Marks after termination (except as permitted)");
doc.moveDown(0.5);

subsection("13.3 WBRU Trademarks");
p("WBRU grants Contractor a non-exclusive, royalty-free license to use WBRU Marks (WBRU, 360 Sound, HomeBRU, logos) in connection with operating WaxFeed, marketing, and promotional materials.");

subsection("13.4 Quality Control");
p("Each Party shall use the other's marks only per brand guidelines, submit samples upon request, and maintain quality and reputation of associated products.");

subsection("13.5 Brand Guidelines");
p("Contractor shall provide brand guidelines within thirty (30) days of the Effective Date. WBRU shall provide brand guidelines within thirty (30) days.");

subsection("13.6 Approval Process");
p("Pre-approved uses listed above do not require additional consent. Other uses require written request with mockup; Contractor shall respond within ten (10) business days; no response constitutes denial.");

subsection("13.7 Ownership and Goodwill");
p("All rights in Contractor Marks remain Contractor's property. All rights in WBRU Marks remain WBRU's property. Goodwill from use inures to the mark owner.");

subsection("13.8 Survival");
p('Upon termination: all trademark licenses terminate (except as permitted under perpetual license); each Party shall cease use within thirty (30) days; WBRU may retain historical references (e.g., "Former Founding Partner") without logos.');

// ============ SIGNATURES ============
doc.addPage();
section("SIGNATURES");
p("IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.");
doc.moveDown(2);

b("BROWN BROADCASTING SERVICE, INC. (d/b/a WBRU)");
doc.moveDown();
doc.font("Helvetica").fontSize(10);
doc.text("By: ________________________________________");
doc.moveDown(0.5);
doc.text("Name: ______________________________________");
doc.moveDown(0.5);
doc.text("Title: _______________________________________");
doc.moveDown(0.5);
doc.text("Date: _______________________________________");
doc.moveDown(2);

b("POLARITY LAB LLC");
doc.moveDown();
doc.font("Helvetica").fontSize(10);
doc.text("By: ________________________________________");
doc.moveDown(0.5);
doc.text("Name: Theodore Addo");
doc.moveDown(0.5);
doc.text("Title: Manager");
doc.moveDown(0.5);
doc.text("Date: _______________________________________");
doc.moveDown(3);

doc.font("Helvetica").fontSize(11).fillColor(BLACK).text("EXHIBITS FOLLOW", { align: "center" });

// Finalize
doc.end();

stream.on("finish", () => {
  console.log(`PDF generated successfully: ${outputPath}`);
});

stream.on("error", (err) => {
  console.error("Error generating PDF:", err);
});
