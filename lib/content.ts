// Event content. English verses: King James Version. Telugu verses: Telugu Bible (BSI, 1880).

export const EVENT = {
  church: "Christalaya Telugu Church",
  short: "CTC",
  title: "ONENESS",
  subtitle: "Family Retreat 2026",
  tagline: ["Connected in Faith", "United in Love", "Fellowship in Christ"],
  // 10 October 2026, 8:00 AM India Standard Time
  startISO: "2026-10-10T08:00:00+05:30",
  dateLabel: "Saturday, 10 October 2026",
  timeLabel: "Report by 8:00 AM sharp",
  venue: "Khedda Resorts",
  venueArea: "Kanakapura Road, Bengaluru",
  mapsUrl: "https://maps.app.goo.gl/6DPyLEiGGSoqdyxk8",
  provided: ["Breakfast", "Lunch", "Hi-Tea"],
};

export interface Verse {
  ref: string;
  refTe: string;
  en: string;
  te: string;
}

export const VERSES: Verse[] = [
  {
    ref: "Psalm 133:1",
    refTe: "కీర్తనలు 133:1",
    en: "Behold, how good and how pleasant it is for brethren to dwell together in unity!",
    te: "సహోదరులు ఐక్యత కలిగి నివసించుట ఎంత మేలు! ఎంత మనోహరము!",
  },
  {
    ref: "John 13:35",
    refTe: "యోహాను 13:35",
    en: "By this shall all men know that ye are my disciples, if ye have love one to another.",
    te: "మీరు ఒకనియెడల ఒకడు ప్రేమగలవారైనయెడల దీనిబట్టి మీరు నా శిష్యులని అందరును తెలిసికొందురనెను.",
  },
  {
    ref: "Colossians 3:14",
    refTe: "కొలొస్సయులకు 3:14",
    en: "And above all these things put on charity, which is the bond of perfectness.",
    te: "వీటన్నిటిపైన పరిపూర్ణతకు అను బంధమైన ప్రేమను ధరించుకొనుడి.",
  },
  {
    ref: "Ecclesiastes 4:9",
    refTe: "ప్రసంగి 4:9",
    en: "Two are better than one; because they have a good reward for their labour.",
    te: "ఇద్దరి కష్టముచేత ఉభయులకు మంచిఫలముకలుగును గనుక ఒంటిగాడై యుండుటకంటె ఇద్దరు కూడి యుండుట మేలు.",
  },
  {
    ref: "Romans 12:10",
    refTe: "రోమీయులకు 12:10",
    en: "Be kindly affectioned one to another with brotherly love; in honour preferring one another.",
    te: "సహోదర ప్రేమ విషయములో ఒకనియందొకడు అనురాగముగల వారై, ఘనతవిషయములో ఒకని నొకడు గొప్పగా ఎంచుకొనుడి.",
  },
  {
    ref: "Philippians 2:2",
    refTe: "ఫిలిప్పీయులకు 2:2",
    en: "Fulfil ye my joy, that ye be likeminded, having the same love, being of one accord, of one mind.",
    te: "మీరు ఏకమనస్కులగునట్లుగా ఏకప్రేమకలిగి, యేక భావముగలవారుగా ఉండి, ఒక్కదానియందే మనస్సుంచుచు నా సంతోషమును సంపూర్ణము చేయుడి.",
  },
  {
    ref: "1 Corinthians 12:27",
    refTe: "1 కొరింథీయులకు 12:27",
    en: "Now ye are the body of Christ, and members in particular.",
    te: "అటువలె, మీరు క్రీస్తుయొక్క శరీరమైయుండి వేరు వేరుగా అవయవములై యున్నారు",
  },
  {
    ref: "Galatians 6:2",
    refTe: "గలతీయులకు 6:2",
    en: "Bear ye one another's burdens, and so fulfil the law of Christ.",
    te: "ఒకని భారముల నొకడుభరించి, యీలాగు క్రీస్తు నియమమును పూర్తిగా నెర వేర్చుడి.",
  },
];

export type IconName =
  | "clock" | "car" | "shirt" | "water" | "umbrella" | "medkit" | "snack"
  | "listen" | "cheer" | "baby" | "gem" | "trash" | "exit" | "team" | "trophy";

export interface Rule {
  icon: IconName;
  title: string;
  body: string;
  bullets?: string[];
}

export const DOS: Rule[] = [
  {
    icon: "clock",
    title: "Follow the tour timings",
    body: "Kindly follow the timings as per the tour plan. Everyone should be present at 8:00 AM sharp at Khedda Resorts, Kanakapura Road.",
  },
  {
    icon: "car",
    title: "Car allocation & travel plan",
    body: "Members allocated to each car are requested to discuss among themselves before 10th October and finalise the meeting location and travel time for 10th October.",
  },
  {
    icon: "shirt",
    title: "Dress code: resort activities",
    body: "Casual wear for the day.",
    bullets: [
      "Nylon / synthetic wear is mandatory for the swimming area.",
      "Cotton clothing is not allowed in the swimming area.",
    ],
  },
  {
    icon: "water",
    title: "Water",
    body: "Water filling cans will be available at the resort. Please carry your own water bottle for refilling.",
  },
  {
    icon: "umbrella",
    title: "Umbrellas",
    body: "Please carry an umbrella depending on the weather conditions.",
  },
  {
    icon: "medkit",
    title: "Medicines",
    body: "Carry any personal medicines you need. An emergency medical kit will also be available.",
  },
  {
    icon: "snack",
    title: "Snacks",
    body: "Carry individual snacks as required. Breakfast, lunch and hi-tea will be provided at the resort.",
  },
  {
    icon: "listen",
    title: "Follow game instructions",
    body: "Kindly listen carefully to the coordinators during the games and follow the instructions and timings.",
  },
  {
    icon: "cheer",
    title: "Encourage your team",
    body: "Encourage your team members and actively participate to lift and motivate the team spirit.",
  },
  {
    icon: "baby",
    title: "Baby feeding facility",
    body: "A separate room is available for baby-feeding mothers. Please contact the coordinator for room details and keys.",
  },
];

export const DONTS: Rule[] = [
  {
    icon: "gem",
    title: "Don't carry precious items",
    body: "Such as jewellery, excess cash or other valuables.",
  },
  {
    icon: "trash",
    title: "Don't litter",
    body: "Please don't throw plastic bottles, wrappers or other waste around the resort. Kindly use the dustbins provided.",
  },
  {
    icon: "exit",
    title: "Don't leave games midway",
    body: "If you need a break or are not feeling well, please inform your team coordinator before leaving the game area.",
  },
  {
    icon: "team",
    title: "Maintain team spirit",
    body: "Please don't argue with team coordinators or other members in case of a game loss.",
  },
  {
    icon: "trophy",
    title: "Prioritise participation",
    body: "Winning or losing is not the priority. Participation, teamwork and enjoyment are what matter most.",
  },
];
