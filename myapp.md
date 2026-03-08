Bring Coffee? — Full MVP Product Spec

1. Product summary

Bring Coffee? is a mobile-first web app that helps users decide whether a short city-to-city trip is worth attempting right now.

It turns alert and shelter data into one clear, funny, easy-to-share answer:
	•	Send it
	•	Probably fine
	•	A bit spicy
	•	Bring coffee
	•	Shelter vibes

The product is designed to feel:
	•	light
	•	fast
	•	premium
	•	witty
	•	low-friction

It is not an “alert dashboard.”
It is a decision app.

The core user question is:

“Should I go now, or is this trip likely to become a shelter story?”

⸻

2. Product goal

The MVP should achieve four things:
	1.	Give one immediate answer
The user should understand the verdict in under one second.
	2.	Feel fun without becoming a joke
Humor should make the app memorable, but never undermine safety.
	3.	Be useful even with city-level data
The first version should work well using city pressure, recent alert activity, and shelter data at both ends.
	4.	Be naturally shareable
The verdict card should look screenshot-worthy and viral.

⸻

3. Target user

Primary users
	•	delivery riders
	•	buyers waiting for handoff
	•	people doing short errands
	•	anyone asking whether it is a good moment to leave now

Secondary users
	•	small businesses
	•	pickup/dropoff coordinators
	•	families doing quick runs
	•	curious social users sharing funny verdicts

User mindset

The user is not opening the app for deep analysis.
They want:
	•	speed
	•	confidence
	•	one recommendation
	•	nearby shelter information
	•	a little personality

⸻

4. Core product positioning

This app should be positioned as:

A witty route decision tool

Not:
	•	civil defense portal
	•	military dashboard
	•	analytics console
	•	generic alert app

The tone should be:
	•	dry
	•	smart
	•	local-feeling
	•	restrained
	•	confident

⸻

5. MVP scope

Included in MVP
	1.	from city input
	2.	to city input
	3.	trip duration selector
	4.	travel mode selector
	5.	route risk verdict
	6.	explanation card
	7.	shelter card for origin
	8.	shelter card for destination
	9.	shareable result card
	10.	animated premium UI

Not in MVP
	1.	exact address geocoding
	2.	turn-by-turn routing
	3.	route polylines from map APIs
	4.	exact route segment risk
	5.	live map navigation
	6.	multi-stop trips
	7.	user accounts
	8.	saved history backend
	9.	push notifications
	10.	real-time collaborative features

⸻

6. User flow

Main flow
	1.	user opens app
	2.	user sees hero section and route form
	3.	user selects:
	•	from city
	•	to city
	•	trip duration
	•	travel mode
	4.	user taps Should I go?
	5.	app shows:
	•	verdict
	•	punchline
	•	route score
	•	shelter cards
	•	city pressure context
	6.	user optionally shares result

Key UX principle

There should be no dead end in the flow.

At every point, the user should know:
	•	what to enter
	•	what to press
	•	what the answer means

⸻

7. Information architecture

Single-screen structure

A. Hero section

Purpose:
	•	explain the product instantly
	•	make the app feel polished and premium
	•	establish brand tone

Contains:
	•	product label
	•	main headline
	•	short description
	•	small feature pills

B. Route input card

Purpose:
	•	collect the minimum possible data
	•	keep form friction low

Contains:
	•	from city autocomplete
	•	to city autocomplete
	•	trip duration tabs
	•	travel mode buttons
	•	main CTA

C. Quick context stats

Purpose:
	•	reinforce trust without overwhelming the user

Contains:
	•	origin pressure
	•	most recent alert window
	•	shelter reach speed

D. Verdict card

Purpose:
	•	serve as the emotional and functional center of the app

Contains:
	•	verdict label
	•	status icon
	•	subtitle
	•	punchline
	•	route score
	•	stress meter
	•	route metadata
	•	share button
	•	save button

E. Shelter cards

Purpose:
	•	give useful fallback action
	•	make the app more than a joke

Contains:
	•	nearest shelter at pickup side
	•	nearest shelter at dropoff side
	•	ETA to shelter
	•	recent local stats

F. Share-card preview

Purpose:
	•	visually encourage virality
	•	make the result feel polished

Contains:
	•	large verdict
	•	route
	•	duration
	•	punchline
	•	screenshot-friendly layout

⸻

8. UX principles

Principle 1: one-screen clarity

The app should work without forcing the user into multiple pages.

Principle 2: answer first, explanation second

The verdict must be larger and more prominent than all supporting data.

Principle 3: humor is garnish, not structure

The app is useful first, funny second.

Principle 4: safety content must remain serious

If the app later includes active live alerts, emergency mode must remove humor.

Principle 5: mobile-first always

This product should feel native on a phone.

⸻

9. Visual design direction

Chosen style

Playful utility

This means:
	•	minimal layout
	•	strong typography
	•	premium white space
	•	rounded cards
	•	soft gradients
	•	subtle motion
	•	witty copy
	•	modern utility feel

Emotional target

The design should make the user feel:
	•	this is easy
	•	this is smart
	•	this is fast
	•	this is calm
	•	this is shareable

⸻

10. Color system

The color system is critical because the app has to balance:
	•	trust
	•	clarity
	•	humor
	•	semantic risk states

Base palette

Background

#F7F6F3

Use for:
	•	app background
	•	large neutral surfaces

Why:
	•	warmer than pure gray
	•	softer than cold white
	•	creates a lifestyle/product feel instead of enterprise dashboard feel

⸻

Surface / cards

#FFFFFF

Use for:
	•	main cards
	•	modals
	•	sheets
	•	input surfaces

Why:
	•	gives visual contrast against warm app background
	•	keeps the app crisp and premium

⸻

Primary text

#1F2937

Use for:
	•	main headings
	•	body text
	•	labels

Why:
	•	deep charcoal reads softer than black
	•	feels modern and trustworthy

⸻

Secondary text

#6B7280

Use for:
	•	helper text
	•	descriptions
	•	metadata
	•	UI support labels

Why:
	•	enough contrast without pulling focus from the main verdict

⸻

Border / divider

#E5E7EB

Use for:
	•	soft card edges
	•	chip borders
	•	section separators

Why:
	•	keeps the UI structured without harsh outlines

⸻

Brand accent

Primary brand blue

#2563EB

Use for:
	•	primary CTA
	•	interactive active states
	•	links
	•	selected controls
	•	premium accent moments

Why:
	•	trustworthy
	•	crisp
	•	not overly corporate
	•	works well with warm neutrals
	•	modern consumer app feel

Blue is the brand color because it signals confidence without turning the app into a warning interface.

⸻

Semantic state colors

Safe

#22C55E

Use for:
	•	positive verdicts
	•	reassuring confirmation states
	•	safe status accents

Meaning:
	•	trip looks fine
	•	low disruption
	•	low route pressure

⸻

Caution

#F59E0B

Use for:
	•	medium uncertainty
	•	mild concern
	•	“watch this” states

Meaning:
	•	route is not clearly bad, but not fully clean

⸻

Risk

#F97316

Use for:
	•	higher friction
	•	elevated route risk
	•	humorous but warning-oriented verdicts like “Bring coffee”

Meaning:
	•	notable interruption potential
	•	more likely shelter disruption

⸻

Alert / critical

#DC2626

Use for:
	•	future active-alert emergency mode
	•	hard interruptions
	•	urgent action prompts

Meaning:
	•	live disruption
	•	immediate action needed

Important:
This color must be used sparingly in normal app mode.
If red appears everywhere, the product feels stressful and visually cheap.

⸻

Supporting accent

Optional soft purple

#8B5CF6

Use for:
	•	delight moments
	•	product sparkle accents
	•	premium decorative highlights
	•	share-card flair

Do not use this as a safety color.

⸻

11. Gradient usage

Gradients should be soft and atmospheric, not loud.

Approved usage
	•	hero background glows
	•	verdict card top highlight bar
	•	subtle decorative orbs
	•	preview surfaces

Avoid
	•	full neon backgrounds
	•	aggressive rainbow gradients
	•	heavy game-like visual treatment

Reason:
The product should remain polished and intelligent.

⸻

12. Typography

Recommended font

Primary: Inter

Why:
	•	excellent readability
	•	modern web standard
	•	versatile for both UI and big headlines
	•	neutral enough to let the product voice come from copy and layout

Optional pairing
	•	Inter for body/UI
	•	Manrope for hero headings and verdicts

For MVP, one font is enough:

Use Inter only

⸻

Type scale

Hero headline
	•	size: 48–56px desktop
	•	size: 36–42px mobile
	•	weight: 800–900
	•	line-height: tight

Purpose:
	•	create immediate impact
	•	anchor the product’s personality

Section titles
	•	size: 24–30px
	•	weight: 700–800

Verdict headline
	•	size: 40–52px
	•	weight: 900

This is the most important text in the app.

Body
	•	size: 16–18px
	•	weight: 400–500

Labels / metadata
	•	size: 12–14px
	•	weight: 500–600

⸻

13. Layout system

Container
	•	max width: 1280px
	•	centered
	•	horizontal padding:
	•	16px mobile
	•	24px tablet
	•	32px desktop

Spacing rhythm

Use a generous spacing system:
	•	8
	•	12
	•	16
	•	24
	•	32
	•	48

The UI should breathe.
Crowding will ruin the premium feel.

⸻

14. Border radius

Rounded corners are essential to the personality.

Sizes
	•	chips: 999px
	•	buttons: 16–20px
	•	small cards: 24–28px
	•	major cards: 30–36px

Reason:
This creates softness and approachability while still feeling premium.

⸻

15. Shadows

Shadows should be soft and diffused.

Use
	•	main cards
	•	floating result card
	•	autocomplete panel
	•	sheet surfaces

Avoid
	•	harsh dark shadows
	•	heavy offset shadows
	•	obvious material-style stacking

Reason:
The app should feel airy, not chunky.

⸻

16. Icons

Recommended icon set

Lucide

Why:
	•	clean
	•	lightweight
	•	consistent
	•	modern
	•	works well with minimal UI

Icon style
	•	outline first
	•	limited filled usage
	•	medium stroke
	•	no cartoon iconography

Core icons
	•	coffee
	•	shield
	•	map pin
	•	clock
	•	route
	•	bike
	•	car
	•	footprints
	•	alert triangle
	•	package
	•	share

⸻

17. Imagery strategy

Best approach

No stock photography

Do not use:
	•	missiles
	•	panic scenes
	•	emergency vehicles
	•	dramatic people photography
	•	dark shelter imagery

Use instead
	•	iconography
	•	abstract vector illustration
	•	route objects
	•	atmospheric gradient shapes
	•	clean product graphics

Reason:
Photos would make the experience too heavy, too literal, and less shareable.

⸻

18. Motion and animation system

Animations are important here because they help the app feel premium and alive.

Motion goals
	1.	make the app feel polished
	2.	make transitions readable
	3.	make verdict changes satisfying
	4.	support emotional tone without becoming flashy

⸻

Motion rules

Allowed
	•	fade + slide on load
	•	spring-in verdict icon
	•	subtle floating blobs
	•	autocomplete dropdown reveal
	•	card transitions between verdict states
	•	gentle progress bar updates

Avoid
	•	big bouncy cartoon movement
	•	excessive parallax
	•	spinning icons
	•	over-animated buttons
	•	constant pulsing alerts in normal mode

⸻

Motion timing
	•	micro interactions: 150–220ms
	•	card transitions: 250–400ms
	•	decorative background motion: 6–10s loops
	•	spring interactions: medium stiffness, medium damping

⸻

Specific animation behaviors

Hero reveal
	•	initial fade in
	•	slight upward motion
	•	duration around 400–500ms

Verdict card transition
	•	fade + upward motion + slight scale
	•	when route parameters change, card should feel refreshed, not replaced harshly

Verdict icon
	•	slight spring pop
	•	rotate/settle effect acceptable

Dropdown suggestions
	•	soft opacity + translate-y entrance
	•	quick dismissal on blur

Decorative glows
	•	very slow ambient drift
	•	low amplitude
	•	low opacity

⸻

19. Component specs

A. Hero card

Purpose:
	•	brand introduction
	•	emotional framing
	•	first impression

Must include:
	•	small label pill
	•	strong headline
	•	supporting description
	•	small feature tiles

Should feel:
	•	premium
	•	airy
	•	immediately understandable

⸻

B. City autocomplete

Purpose:
	•	fast city entry
	•	low-error selection

States:
	•	idle
	•	focus
	•	suggestions open
	•	selected
	•	invalid text fallback

Behavior:
	•	show top city suggestions on focus
	•	filter by name and region
	•	click fills input
	•	input should remain forgiving

⸻

C. Trip duration selector

Purpose:
	•	keep time selection fast

Form:
	•	pill tabs
	•	5 preset durations

Reason:
This is faster and better than a raw numeric input for MVP.

⸻

D. Travel mode buttons

Modes:
	•	foot
	•	bike
	•	scooter
	•	car

Behavior:
	•	clear active state
	•	icon + label
	•	compact but touch-friendly

⸻

E. Main CTA

Text:

Should I go?

Style:
	•	primary blue
	•	large
	•	strong contrast
	•	rounded
	•	slight shadow

Reason:
This button is the emotional trigger of the entire app.

⸻

F. Verdict card

This is the core component.

Must contain:
	1.	status pill
	2.	icon block
	3.	verdict title
	4.	subtitle
	5.	punchline
	6.	route score
	7.	stress meter
	8.	route metadata
	9.	share button
	10.	save button

Design goals:
	•	highest visual priority
	•	emotionally satisfying
	•	screenshot-ready
	•	premium

⸻

G. Shelter card

Must show:
	•	pickup/dropoff context
	•	nearest shelter
	•	ETA
	•	local stats

Purpose:
	•	utility
	•	credibility
	•	actionability

⸻

H. Share card preview

Purpose:
	•	encourage virality
	•	make sharing feel built-in, not secondary

Visual style:
	•	darker premium card
	•	large verdict typography
	•	simplified route info
	•	clean screenshot composition

⸻

20. Verdict system

The verdict labels are central to the product identity.

Approved labels
	1.	Send it
	2.	Probably fine
	3.	A bit spicy
	4.	Bring coffee
	5.	Shelter vibes

These work because they are:
	•	short
	•	clear
	•	memorable
	•	screenshot-friendly
	•	tonally distinct

⸻

Tone explanation

Send it

Meaning:
	•	low route pressure
	•	low recent disruption

Emotional tone:
	•	light confidence

Probably fine

Meaning:
	•	generally acceptable, slight caution

Emotional tone:
	•	pragmatic confidence

A bit spicy

Meaning:
	•	moderate uncertainty
	•	route could become inconvenient

Emotional tone:
	•	playful warning

Bring coffee

Meaning:
	•	elevated interruption risk
	•	likely enough friction to justify waiting or preparing mentally

Emotional tone:
	•	witty but cautionary

Shelter vibes

Meaning:
	•	high route pressure
	•	user should strongly reconsider timing

Emotional tone:
	•	strongest humorous risk signal short of true emergency mode

⸻

21. Copywriting system

Voice attributes
	•	dry
	•	concise
	•	clever
	•	never loud
	•	never goofy
	•	never chaotic

Good copy examples
	•	“No bunker networking expected.”
	•	“Coffee is optional, confidence is not.”
	•	“This one could develop a plot.”
	•	“This trip has shared-shelter small-talk energy.”
	•	“Less quick errand, more character-building episode.”

Avoid copy that is
	•	slapstick
	•	childish
	•	meme-spammy
	•	disrespectful
	•	overexplained

⸻

22. Accessibility spec

Even with humor, the app must remain accessible.

Requirements
	1.	sufficient text contrast
	2.	touch targets at least 44px high
	3.	keyboard navigation for form controls
	4.	visible focus states
	5.	verdict not conveyed by color alone
	6.	icons paired with text labels
	7.	body copy readable at standard zoom
	8.	reduced motion support in future production build

⸻

23. Mobile behavior

This product should be designed mobile-first.

Mobile priorities
	•	single column
	•	CTA always visible after inputs
	•	verdict card immediately below fold
	•	shelter cards stacked
	•	share card easy to screenshot

Mobile experience target

The user should be able to:
	•	fill the form with one thumb
	•	read the verdict instantly
	•	share in seconds

⸻

24. Desktop behavior

Desktop should feel enhanced, not separate.

Desktop layout
	•	two-column main layout
	•	left side: input and context
	•	right side: verdict and shelter details

Reason:
This keeps the verdict visible while allowing form exploration.

⸻

25. MVP data model

Inputs
	•	from city
	•	to city
	•	travel mode
	•	duration

Derived values
	•	route score
	•	verdict label
	•	verdict subtitle
	•	punchline
	•	origin pressure
	•	recent alert timing
	•	shelter ETA at both ends

Outputs
	•	verdict card
	•	shelter cards
	•	share card text

⸻

26. Backend/data integration plan

Your existing Red Alert data can support a strong first version.

Use these sources for MVP
	•	data/cities for city list/autocomplete
	•	stats/cities for city-level pressure/ranking
	•	stats/history for recency and recent trend
	•	stats/summary for broad high-level context
	•	shelter/search for nearest shelter per city or location
	•	alert-types for filtering/metadata later
	•	quick-start for future live alert state

⸻

27. Trust model

This app works because it combines:
	•	a clear answer
	•	visible supporting logic
	•	real shelter information

The user does not need full mathematical transparency, but they do need enough explanation to trust the result.

That is why the app should always show:
	•	route score
	•	origin/destination context
	•	shelter access

⸻

28. Viral mechanics

The app can go viral for three reasons:

1. The verdict labels are inherently postable

“Bring coffee” is funny and readable.

2. The UI looks premium in screenshots

The app should produce images users want to share.

3. The humor is situational

It feels specific, not generic.

⸻

29. What makes this the best MVP

This concept is the strongest because it balances all four:
	1.	Easy to understand
	2.	Useful with current data
	3.	Funny enough to spread
	4.	Simple enough to build well

Many ideas are more complex.
This one is more likely to be executed beautifully.

⸻

30. Next implementation phases

Phase 1

Current MVP:
	•	front-end prototype
	•	local scoring
	•	polished UI
	•	interactions and motion

Phase 2

Real API hookup:
	•	fetch cities
	•	fetch stats
	•	fetch shelter info
	•	compute score from live data

Phase 3

Smarter decision engine:
	•	route-aware integration
	•	geocoding
	•	routing polyline
	•	exact shelter-on-route logic

Phase 4

Growth layer:
	•	share-card export
	•	saved favorite routes
	•	live cooldown logic
	•	buyer mode / courier mode split

⸻

31. Final design recommendation

Use this exact design direction

Style

Playful utility

Palette
	•	Background: #F7F6F3
	•	Surface: #FFFFFF
	•	Text: #1F2937
	•	Secondary text: #6B7280
	•	Border: #E5E7EB
	•	Primary: #2563EB
	•	Safe: #22C55E
	•	Caution: #F59E0B
	•	Risk: #F97316
	•	Alert: #DC2626
	•	Optional delight accent: #8B5CF6

Typography

Inter

Radius

24–36px major surfaces

Icons

Lucide

Images

No photography, no realistic crisis imagery

Motion

Soft, premium, restrained

⸻

32. Final product statement

Bring Coffee? should feel like a smart, beautiful, slightly cheeky route-checking app that gives one confident answer and makes users want to screenshot the result.

If you want, next I’ll turn this into a production-ready PRD with:
	1.	user stories
	2.	acceptance criteria
	3.	API contract
	4.	component inventory
	5.	implementation phases