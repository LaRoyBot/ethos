// ═══ ETHOS GROUPS (ἤθη — character-forming disciplines) ═══
// Each routine contains ethe (ἤθη) — individual practices

const ETHOS_GROUPS = [
  { id: 'math', label: '[math]', color: '#00ff88', streak: 0 },
  { id: 'body', label: '[body]', color: '#ffb700', streak: 0 },
  { id: 'mind', label: '[mind]', color: '#4488ff', streak: 0 },
  { id: 'build', label: '[build]', color: '#aa77ff', streak: 0 },
  { id: 'hair', label: '[hair]', color: '#22d3ee', streak: 0 },
  { id: 'skin', label: '[skin]', color: '#f472b6', streak: 0 },
  { id: 'nutrition', label: '[nutrition]', color: '#ff8c00', streak: 0 },
];

const DEFAULT_ROUTINES = [
  // ═══ LLM MATH STUDY ═══
  {
    id: 'g1',
    title: 'Morning Study',
    icon: '🌅',
    color: '#ffb700',
    subtitle: '// before the world wakes up',
    collapsed: false,
    ethe: [
      { id: 1, name: 'Review yesterday\'s notes', icon: '📝', color: '#00ff88', note: '// spaced repetition active recall', xp: 20, done: false, streak: 0, groupId: 'math', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 2, name: 'Read core theory / derivations', icon: '📖', color: '#4488ff', note: '// 30 min minimum deep-dive', xp: 20, done: false, streak: 0, groupId: 'math', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 3, name: 'Work through proofs', icon: '✏️', color: '', note: '// pen and paper derivation drills', xp: 30, done: false, streak: 0, groupId: 'math', days: [0, 1, 2, 3, 4, 5, 6] },
    ]
  },
  {
    id: 'g2',
    title: 'Deep Work',
    icon: '💻',
    color: '#4488ff',
    subtitle: '// during focus hours',
    collapsed: false,
    ethe: [
      { id: 4, name: 'Implement core algorithms / code', icon: '🐍', color: '#00ff88', note: '// focus block, zero distractions', xp: 30, done: false, streak: 0, groupId: 'build', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 5, name: 'Solve daily practice question', icon: '🎯', color: '#ff4444', note: '// test conceptual understanding', xp: 20, done: false, streak: 0, groupId: 'math', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 6, name: 'Deep-read research publication', icon: '📄', color: '', note: '// understand methodology & results', xp: 20, done: false, streak: 0, groupId: 'mind', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 7, name: 'Refactor code & write tests', icon: '🧮', color: '#aa77ff', note: '// ensure correctness and quality', xp: 20, done: false, streak: 0, groupId: 'build', days: [0, 1, 2, 3, 4, 5, 6] },
    ]
  },
  {
    id: 'g3',
    title: 'Evening Review',
    icon: '🌙',
    color: '#aa77ff',
    subtitle: '// consolidate before sleep',
    collapsed: false,
    ethe: [
      { id: 8, name: 'Journal learnings & blockers', icon: '📓', color: '#ffb700', note: '// brutal honesty builds growth', xp: 10, done: false, streak: 0, groupId: 'mind', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 9, name: 'Active recall & summary cards', icon: '🃏', color: '', note: '// review today\'s key takeaways', xp: 10, done: false, streak: 0, groupId: 'mind', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 10, name: 'Plan tomorrow\'s priorities', icon: '📋', color: '#00ff88', note: '// pre-load tomorrow\'s focus area', xp: 10, done: false, streak: 0, groupId: 'math', days: [0, 1, 2, 3, 4, 5, 6] },
    ]
  },

  // ═══ MORNING SKINCARE ═══
  {
    id: 'g4',
    title: 'Morning Skincare',
    icon: '🧴',
    color: '#f472b6',
    subtitle: '// protect + hydrate only — no actives in AM',
    collapsed: false,
    ethe: [
      { id: 101, name: 'Wash with gentle cleanser', icon: '🧼', color: '#f472b6', note: '// cleanse face gently to remove nighttime buildup', xp: 10, done: false, streak: 0, groupId: 'skin', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 102, name: 'Apply light moisturizer', icon: '💧', color: '#f472b6', note: '// restore skin barrier hydration', xp: 10, done: false, streak: 0, groupId: 'skin', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 103, name: 'Apply broad-spectrum sunscreen', icon: '🌞', color: '#f472b6', note: '// SPF 30+ · face + neck · reapply as needed', xp: 15, done: false, streak: 0, groupId: 'skin', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 104, name: 'Allow sunscreen to set (10 min)', icon: '⏱️', color: '#f472b6', note: '// let protective barrier fully form', xp: 5, done: false, streak: 0, groupId: 'skin', days: [0, 1, 2, 3, 4, 5, 6] },
    ]
  },

  // ═══ MORNING HAIR CARE ═══
  {
    id: 'g5',
    title: 'Morning Hair Care',
    icon: '💇',
    color: '#22d3ee',
    subtitle: '// daily health · wash on designated days',
    collapsed: false,
    ethe: [
      { id: 201, name: 'Gentle scalp massage (60s)', icon: '🟢', color: '#22d3ee', note: '// stimulates circulation and hair follicles', xp: 10, done: false, streak: 0, groupId: 'hair', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 202, name: 'Apply revitalizing scalp mist / tonic', icon: '🔵', color: '#22d3ee', note: '// lightweight hydration for the scalp', xp: 10, done: false, streak: 0, groupId: 'hair', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 203, name: 'Shampoo & wash (as needed)', icon: '🚿', color: '#22d3ee', note: '// Tue/Thu/Sat · towel-dry gently to damp', xp: 10, done: false, streak: 0, groupId: 'hair', days: [2, 4, 6] },
    ]
  },

  // ═══ EXERCISE ═══
  {
    id: 'g6',
    title: 'Exercise',
    icon: '🏋️',
    color: '#ffb700',
    subtitle: '// daily movement · strength + conditioning',
    collapsed: false,
    ethe: [
      { id: 301, name: 'Strength / resistance training', icon: '💪', color: '#ffb700', note: '// Mon: Upper · Wed: Lower · Fri: Full Body', xp: 30, done: false, streak: 0, groupId: 'body', days: [1, 3, 5] },
      { id: 302, name: 'Pre-workout healthy snack', icon: '🍌', color: '#ff8c00', note: '// high-quality carbs for training fuel', xp: 5, done: false, streak: 0, groupId: 'nutrition', days: [0, 1, 2, 4, 5, 6] },
      { id: 303, name: 'Cardio / aerobic conditioning', icon: '🏊', color: '#22d3ee', note: '// swim, run, or cycle · active recovery on Sun', xp: 30, done: false, streak: 0, groupId: 'body', days: [0, 1, 2, 4, 5, 6] },
      { id: 304, name: 'Post-workout hydration & protein', icon: '🥤', color: '#ff8c00', note: '// fuel muscle recovery after exercise', xp: 10, done: false, streak: 0, groupId: 'nutrition', days: [0, 1, 2, 3, 4, 5, 6] },
    ]
  },

  // ═══ NUTRITION & SUPPLEMENTS ═══
  {
    id: 'g7',
    title: 'Nutrition & Supplements',
    icon: '🍽️',
    color: '#ff8c00',
    subtitle: '// daily fuel and balanced nutrition',
    collapsed: false,
    ethe: [
      { id: 401, name: 'Nutrient-dense balanced breakfast', icon: '🍳', color: '#ff8c00', note: '// primary fuel source for the day', xp: 10, done: false, streak: 0, groupId: 'nutrition', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 402, name: 'Water target (3.5-4.5L)', icon: '💧', color: '#4488ff', note: '// keep hydration optimal for physical & cognitive performance', xp: 10, done: false, streak: 0, groupId: 'nutrition', days: [0, 1, 2, 3, 4, 5, 6], isWater: true },
      { id: 403, name: 'Daily multivitamins / essential minerals', icon: '💊', color: '#ff8c00', note: '// take with healthy fats to optimize absorption', xp: 15, done: false, streak: 0, groupId: 'nutrition', days: [2] },
      { id: 404, name: 'Light balanced dinner by 8 PM', icon: '🍽️', color: '#ff8c00', note: '// avoid heavy meals close to sleep', xp: 5, done: false, streak: 0, groupId: 'nutrition', days: [0, 1, 2, 3, 4, 5, 6] },
    ]
  },

  // ═══ NIGHT SKINCARE ═══
  {
    id: 'g8',
    title: 'Night Skincare',
    icon: '🌙',
    color: '#f472b6',
    subtitle: '// deep recovery and nighttime hydration',
    collapsed: false,
    ethe: [
      { id: 501, name: 'Cleanse face with warm water', icon: '🧼', color: '#f472b6', note: '// remove SPF, dust, and environmental buildup', xp: 10, done: false, streak: 0, groupId: 'skin', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 502, name: 'Apply nourishing night cream', icon: '🔬', color: '#f472b6', note: '// deep hydration to support skin regeneration', xp: 15, done: false, streak: 0, groupId: 'skin', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 503, name: 'Apply spot treatment / active serum', icon: '🔬', color: '#f472b6', note: '// thin layer only · seek dermatological review if using prescription actives', xp: 15, done: false, streak: 0, groupId: 'skin', days: [0, 1, 2, 3, 4, 5, 6], isTriluma: true },
    ]
  },

  // ═══ NIGHT HAIR CARE ═══
  {
    id: 'g9',
    title: 'Night Hair Care',
    icon: '🌙',
    color: '#22d3ee',
    subtitle: '// evening scalp care · oil on select nights',
    collapsed: false,
    ethe: [
      { id: 601, name: 'Apply nourishing scalp oil', icon: '🟡', color: '#22d3ee', note: '// Mon/Wed/Fri nights only · part hair into sections first', xp: 10, done: false, streak: 0, groupId: 'hair', days: [1, 3, 5] },
      { id: 602, name: 'Deep scalp massage (5 min)', icon: '💆', color: '#22d3ee', note: '// thorough massage to support oil absorption', xp: 10, done: false, streak: 0, groupId: 'hair', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 603, name: 'Brush hair to distribute natural oils', icon: '😴', color: '#22d3ee', note: '// protect hair during sleep with a satin cap or pillowcase', xp: 5, done: false, streak: 0, groupId: 'hair', days: [0, 1, 2, 3, 4, 5, 6] },
    ]
  },
];

// ═══ DAILY PROTOCOL — CHRONOLOGICAL EXECUTION ORDER ═══
// Sequential phases with time-of-day context for guided step-by-step flow

const PROTOCOL_PHASES = [
  { id: 'wake',      label: 'WAKE',      icon: '🌅', time: '~6:00 AM',  order: 1 },
  { id: 'study',     label: 'STUDY',     icon: '📖', time: '~8:00 AM',  order: 2 },
  { id: 'deep_work', label: 'DEEP WORK', icon: '💻', time: '~11:00 AM', order: 3 },
  { id: 'train',     label: 'TRAIN',     icon: '🏋️', time: '~5:00 PM',  order: 4 },
  { id: 'wind_down', label: 'WIND DOWN', icon: '🌙', time: '~9:30 PM',  order: 5 },
];

const PROTOCOL_ORDER = [
  { phase: 'wake',      ids: [101, 102, 201, 202, 203, 103, 104, 401, 403] },
  { phase: 'study',     ids: [1, 2, 3] },
  { phase: 'deep_work', ids: [4, 5, 7, 6] },
  { phase: 'train',     ids: [302, 301, 304, 303, 402] },
  { phase: 'wind_down', ids: [404, 8, 9, 10, 501, 502, 503, 601, 602, 603] },
];

const DEFAULT_PAPERS = [
  { id: 1, name: 'Attention Is All You Need', status: 'queued', note: '' },
  { id: 2, name: 'LoRA: Low-Rank Adaptation of LLMs', status: 'queued', note: '' },
  { id: 3, name: 'Chinchilla Scaling Laws', status: 'queued', note: '' },
  { id: 4, name: 'GPT-2: Language Models are Unsupervised Multitask Learners', status: 'queued', note: '' },
  { id: 5, name: 'Flash Attention', status: 'queued', note: '' },
];

const LEVELS = [
  { title: 'Calculus Initiate', next: 500 },
  { title: 'Linear Algebra Apprentice', next: 1200 },
  { title: 'Gradient Descent Adept', next: 2500 },
  { title: 'Backprop Engineer', next: 4500 },
  { title: 'Attention Architect', next: 7000 },
  { title: 'Transformer Sage', next: 10000 },
  { title: 'LLM Oracle', next: Infinity },
];

const SKILLS = [
  { key: 'linear_algebra', name: 'linear algebra', color: '#00ff88' },
  { key: 'mv_calc', name: 'multivariable calc', color: '#4488ff' },
  { key: 'probability', name: 'probability / stats', color: '#aa77ff' },
  { key: 'optimization', name: 'optimization theory', color: '#ffb700' },
  { key: 'backprop', name: 'backprop / autodiff', color: '#00ff88' },
  { key: 'attention', name: 'attention mechanism', color: '#4488ff' },
  { key: 'transformer', name: 'transformer arch', color: '#aa77ff' },
  { key: 'lora', name: 'fine-tuning / LoRA', color: '#ffb700' },
];

const THEMES = [
  { id: 'default', name: 'nephrite', color: '#00ff88' },
  { id: 'aureate', name: 'aureate', color: '#ffb700' },
  { id: 'cerulean', name: 'cerulean', color: '#22d3ee' },
  { id: 'rosewood', name: 'rosewood', color: '#f472b6' },
  { id: 'amethyst', name: 'amethyst', color: '#aa77ff' },
  { id: 'vermillion', name: 'vermillion', color: '#ff4444' },
  { id: 'sapphire', name: 'sapphire', color: '#4488ff' },
  { id: 'ivory', name: 'ivory', color: '#16a34a' },
  { id: 'solaris', name: 'solaris', color: '#b58900' },
  { id: 'obsidian', name: 'obsidian', color: '#50fa7b' },
  { id: 'carmine', name: 'carmine', color: '#f92672' },
  { id: 'cmd', name: 'cmd console', color: '#ffffff' },
];

// Seed exact swim history (March 22 - May 19)
const DEFAULT_SWIM_HISTORY = [
  { date: '2026-03-22', status: 'Swam', sessions: [{ time: '7:56 pm – 8:36 pm', duration: 40, comment: 'Initial session' }] },
  // Mar 23 - Apr 11: 20 days missed (represented implicitly or explicitly. Let's make it explicit for perfect math!)
  ...Array.from({ length: 20 }, (_, i) => {
    const d = new Date('2026-03-23');
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().split('T')[0], status: 'Missed', sessions: [] };
  }),
  { date: '2026-04-12', status: 'Swam', sessions: [{ time: '8:14 pm – 9:31 pm', duration: 77, comment: 'Post gap swim' }] },
  { date: '2026-04-13', status: 'Swam', sessions: [{ time: '8:19 pm – 9:25 pm', duration: 66, comment: 'Back to daily' }] },
  {
    date: '2026-04-14',
    status: 'Swam',
    sessions: [
      { time: '8:14 am – 9:26 am', duration: 72, comment: 'Morning session' },
      { time: '7:50 pm – 10:00 pm', duration: 130, comment: 'Evening session' }
    ]
  },
  { date: '2026-04-15', status: 'Missed', sessions: [] },
  { date: '2026-04-16', status: 'Swam', sessions: [{ time: '8:21 am – 9:54 am', duration: 93, comment: '' }] },
  {
    date: '2026-04-17',
    status: 'Swam',
    sessions: [
      { time: '9:04 am – 10:16 am', duration: 71, comment: 'Morning session' },
      { time: '8:43 pm – 9:52 pm', duration: 69, comment: 'Evening session' }
    ]
  },
  { date: '2026-04-18', status: 'Swam', sessions: [{ time: '8:15 am – 9:25 am', duration: 70, comment: '' }] },
  { date: '2026-04-19', status: 'Swam', sessions: [{ time: '6:43 pm – 8:20 pm', duration: 97, comment: 'Machaxi Centre' }] },
  { date: '2026-04-20', status: 'Swam', sessions: [{ time: '7:53 pm – 10:06 pm', duration: 133, comment: '' }] },
  { date: '2026-04-21', status: 'Missed', sessions: [] },
  { date: '2026-04-22', status: 'Missed', sessions: [] },
  {
    date: '2026-04-23',
    status: 'Swam',
    sessions: [
      { time: '8:12 am – 10:15 am', duration: 123, comment: 'Morning session' },
      { time: '8:25 pm – 9:19 pm', duration: 54, comment: 'Evening session' }
    ]
  },
  {
    date: '2026-04-24',
    status: 'Swam',
    sessions: [
      { time: '8:21 am – 10:04 am', duration: 103, comment: 'Morning session' },
      { time: '8:34 pm – 9:41 pm', duration: 67, comment: 'Evening session' }
    ]
  },
  { date: '2026-04-25', status: 'Missed', sessions: [] },
  { date: '2026-04-26', status: 'Swam', sessions: [{ time: '8:14 pm – 9:56 pm', duration: 102, comment: '' }] },
  { date: '2026-04-27', status: 'Swam', sessions: [{ time: '8:34 pm – 9:59 pm', duration: 85, comment: '' }] },
  {
    date: '2026-04-28',
    status: 'Swam',
    sessions: [
      { time: '9:34 am – 11:06 am', duration: 92, comment: 'Morning session' },
      { time: '8:08 pm – 9:45 pm', duration: 97, comment: 'Evening session' }
    ]
  },
  { date: '2026-04-29', status: 'Missed', sessions: [] },
  { date: '2026-04-30', status: 'Swam', sessions: [{ time: '8:20 pm – 10:04 pm', duration: 104, comment: '' }] },
  { date: '2026-05-01', status: 'Missed', sessions: [] },
  { date: '2026-05-02', status: 'Swam', sessions: [{ time: '8:23 am – 10:08 am', duration: 105, comment: '' }] },
  { date: '2026-05-03', status: 'Swam', sessions: [{ time: '8:05 pm – 9:44 pm', duration: 99, comment: '' }] },
  { date: '2026-05-04', status: 'Swam', sessions: [{ time: '8:11 pm – 9:19 pm', duration: 69, comment: '' }] },
  { date: '2026-05-05', status: 'Missed', sessions: [] },
  { date: '2026-05-06', status: 'Missed', sessions: [] },
  { date: '2026-05-07', status: 'Swam', sessions: [{ time: '8:28 pm – 9:56 pm', duration: 88, comment: '' }] },
  { date: '2026-05-08', status: 'Missed', sessions: [] },
  { date: '2026-05-09', status: 'Swam', sessions: [{ time: '8:10 pm – 10:04 pm', duration: 114, comment: '' }] },
  { date: '2026-05-10', status: 'Swam', sessions: [{ time: '8:45 pm – 9:49 pm', duration: 64, comment: '' }] },
  { date: '2026-05-11', status: 'Swam', sessions: [{ time: '8:42 pm – 10:11 pm', duration: 89, comment: '' }] },
  { date: '2026-05-12', status: 'Swam', sessions: [{ time: '8:07 pm – 9:55 pm', duration: 108, comment: '' }] },
  { date: '2026-05-13', status: 'Missed', sessions: [] },
  { date: '2026-05-14', status: 'Swam', sessions: [{ time: '1:35 pm – 3:31 pm', duration: 117, comment: '' }] },
  { date: '2026-05-15', status: 'Swam', sessions: [{ time: '7:47 pm – 10:16 pm', duration: 149, comment: '' }] },
  {
    date: '2026-05-16',
    status: 'Swam',
    sessions: [
      { time: '12:07 pm – 12:25 pm', duration: 18, comment: 'Morning session' },
      { time: '12:36 pm – 1:58 pm', duration: 81, comment: 'Olympia' }
    ]
  },
  { date: '2026-05-17', status: 'Swam', sessions: [{ time: '8:25 pm – 9:40 pm', duration: 75, comment: '' }] },
  { date: '2026-05-18', status: 'Missed', sessions: [] },
  { date: '2026-05-19', status: 'Swam', sessions: [{ time: '8:06 pm – 9:55 pm', duration: 109, comment: '' }] }
];

// Seed water logs since March 22 (minimum 4L per day)
const DEFAULT_WATER_LOGS = {};
const startWaterDate = new Date('2026-03-22');
const endWaterDate = new Date('2026-05-20');
for (let d = new Date(startWaterDate); d <= endWaterDate; d.setDate(d.getDate() + 1)) {
  const dateStr = d.toISOString().split('T')[0];
  const day = d.getDate();
  const liters = 4.0 + (day % 8) * 0.1; // realistic variation between 4.0L and 4.7L
  DEFAULT_WATER_LOGS[dateStr] = parseFloat(liters.toFixed(1));
}
