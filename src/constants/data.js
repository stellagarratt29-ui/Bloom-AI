export const HOBBIES = [
  {
    id: 'guitar', name: 'Guitar', emoji: '🎸',
    steps: [
      'Hold the guitar correctly and tune it by ear',
      'Learn and memorise G, C, and D chords',
      'Transition smoothly between those 3 chords',
      'Learn your first full song start to finish',
      'Play along to a recording in real time',
    ],
  },
  {
    id: 'drawing', name: 'Drawing', emoji: '✏️',
    steps: [
      'Draw basic shapes and straight lines confidently',
      'Sketch simple everyday objects from life',
      'Learn shading using hatching and cross-hatching',
      'Draw a portrait or figure from a reference photo',
      'Complete a full illustration from your imagination',
    ],
  },
  {
    id: 'coding', name: 'Coding', emoji: '💻',
    steps: [
      'Understand variables, loops, and functions',
      'Build a simple calculator or quiz app',
      'Learn arrays, objects, and basic data structures',
      'Create a small project entirely from scratch',
      'Share your project with someone else',
    ],
  },
  {
    id: 'writing', name: 'Writing', emoji: '📝',
    steps: [
      'Write 3 sentences about your day — no editing',
      'Write a 1-page short story or scene',
      'Rewrite something you wrote and make it better',
      'Write something you\'d share with a friend',
      'Finish a complete piece: story, essay, or poem',
    ],
  },
  {
    id: 'fitness', name: 'Fitness', emoji: '🏃',
    steps: [
      'Do 10 minutes of movement today',
      'Complete a 20-minute beginner workout',
      'Go for a 30-minute walk or jog',
      'Do 3 workouts in one week',
      'Complete a full 4-week beginner programme',
    ],
  },
  {
    id: 'cooking', name: 'Cooking', emoji: '🍳',
    steps: [
      'Cook one full meal entirely from scratch',
      'Learn 3 basic knife skills safely',
      'Make a dish you\'ve never cooked before',
      'Cook a full meal for someone else',
      'Make the same dish twice and improve it',
    ],
  },
];

export const BUDDIES = [
  { id: 'fern',   name: 'Fern',   subtitle: 'Forest spirit',    emoji: '🌿', color: '#7B9E87' },
  { id: 'blob',   name: 'Blob',   subtitle: 'Friendly shape',   emoji: '🫧', color: '#A8C5A0' },
  { id: 'sprout', name: 'Sprout', subtitle: 'Little seedling',  emoji: '🌱', color: '#5C8A6A' },
  { id: 'quill',  name: 'Quill',  subtitle: 'Curious hedgehog', emoji: '🦔', color: '#C8795E' },
];

export const SPRINT_SOUNDS = [
  { id: 'none',       label: 'Silence',    emoji: '🔇' },
  { id: 'rain',       label: 'Rain',       emoji: '🌧️' },
  { id: 'forest',     label: 'Forest',     emoji: '🌲' },
  { id: 'whitenoise', label: 'White noise', emoji: '〰️' },
  { id: 'cafe',       label: 'Café',       emoji: '☕' },
];

export const SPRINT_DURATION = 15 * 60; // 15 minutes in seconds

export const ENCOURAGEMENTS = [
  "You started. That's the hardest part — you already won.",
  "One minute at a time. You've got this.",
  "This is exactly what growth looks like.",
  "I'm so proud of you for showing up today.",
  "Focus is a muscle. You're building it right now.",
  "Almost there — stay with it!",
  "You're doing something your future self will thank you for.",
];

export const NUDGE_MESSAGES = [
  'You said this was important to you — want a little help getting started?',
  'Progress, not perfection. Even one small step counts today.',
  'Your future self will thank you for starting now, not later.',
  "What's one tiny thing you can do in the next five minutes?",
];

export const POINTS = { low: 5, medium: 10, high: 20, hobbyStep: 15, sprint: 10 };

export const DAILY_TIPS = [
  { emoji: '🎯', text: 'Pick just ONE thing that really matters today. Do that first — everything else is a bonus.' },
  { emoji: '⏱️', text: "Set a timer for 10 minutes and just start. You'll almost always keep going once you're in it." },
  { emoji: '💧', text: 'Drink a glass of water before you open any apps. Hydration is the cheapest performance upgrade.' },
  { emoji: '🧠', text: "Your brain is at its sharpest in the morning. Use that window for your hardest task." },
  { emoji: '🌿', text: 'Rest is productive. A short break now makes the next hour sharper — not lazier.' },
  { emoji: '📵', text: 'Try keeping your phone face-down for the first 30 minutes. Watch how much calmer you feel.' },
  { emoji: '✍️', text: 'Write one sentence about why today matters to you. It takes 10 seconds and sets your whole tone.' },
];
