export function getGoalPlan(goalText) {
  const t = (goalText || '').toLowerCase();

  if (/10k|make money|earn|income|sell|business|freelance|revenue|profit/.test(t))
    return [
      'List 3 realistic ways you could earn money based on what you already know how to do — include freelancing, selling things, and service work. Pick the one that feels most doable.',
      'Research how real people make money from your top idea. Find 2 specific examples — a Reddit thread, a YouTube video, or someone who actually does it.',
      'Set a small, specific first income target for this month only (not the year). Write what achieving it would look like concretely.',
      'Take one concrete action: create a profile on a platform, list a service, message a potential client, or make a prototype of what you\'re selling.',
      'After one month: compare what you actually earned vs your target. Write what worked, what didn\'t, and what you\'d do differently.',
    ];

  if (/vet|veterinarian|doctor|nurse|medicine|medical|dentist|surgeon/.test(t))
    return [
      'Research the exact qualifications required to become a vet/doctor in your country. Write them down as a concrete checklist.',
      'Identify which school subjects matter most for this career (Biology, Chemistry, etc). Check honestly how you\'re currently tracking in those subjects.',
      'Find one work experience opportunity — a local vet, hospital, or clinic. Write a short, polite email or make a call to ask about shadowing or volunteering.',
      'Set up a focused study plan for your most important science subject — even 20 minutes per day is meaningful over a term.',
      'Look up which universities or courses align with your goal and what grades you\'ll need. Write down a specific academic target to work toward.',
    ];

  if (/fit|gym|run|marathon|weight|workout|exercise|healthy|stronger|lose|gain muscle/.test(t))
    return [
      'Do 10 minutes of movement today — a walk, a stretch, anything. The habit forms before the intensity does.',
      'Complete 3 workouts this week (20–30 minutes each). Schedule the exact times now — don\'t leave it to chance.',
      'Try one type of exercise you\'ve never done before. Notice what felt good and what you\'d change.',
      'Complete 4 weeks of consistent movement (3+ days per week). Track every session — even just a tick in your notes.',
      'Set one specific physical challenge for next month: run 5K, do 20 push-ups, hold a plank for 1 minute. Train toward it.',
    ];

  if (/book|write|novel|blog|publish|author|story|poem/.test(t))
    return [
      'Write one paragraph today — it doesn\'t matter how bad it is. Starting is the entire challenge.',
      'Write every day for one week, even just 10 minutes. Goal: 500 words by the end of the week.',
      'Finish one complete short piece — a scene, a chapter, a short story. Something with an actual beginning and end.',
      'Share that draft with one other person and get their honest, specific feedback.',
      'Revise based on the feedback. Then publish or share the improved version somewhere — a blog, a friend, a writing community.',
    ];

  if (/learn|language|code|programming|skill|course|fluent|speak/.test(t))
    return [
      'Find one structured resource today: a free course, YouTube series, or app specifically for what you want to learn. Don\'t just browse — pick one and bookmark it.',
      'Complete the first full lesson or module. Write down 3 specific things you understood from it.',
      'Build a 20-minutes-per-day habit for 2 weeks. The first two weeks is when it either becomes real or disappears.',
      'Build or produce something small using what you\'ve learned — a short script, a basic conversation, a mini project.',
      'Apply your new skill in a real-world context once this week — outside of practice conditions.',
    ];

  if (/travel|trip|move|abroad|visit|explore|holiday/.test(t))
    return [
      'Pick a specific destination and look up the realistic cost: flights, accommodation, and average daily expenses.',
      'Work out how much you\'d need to save per month to get there in 6–12 months. Open a separate savings pot for it.',
      'Research 3 specific things you\'d genuinely want to do there — this makes the goal feel real, not abstract.',
      'Set up a small automatic transfer to your travel fund, even if it\'s tiny. Removing the decision makes saving happen.',
      'Book one concrete thing — a flight, accommodation, or tour, even if it\'s refundable. Commitment changes how seriously you save.',
    ];

  if (/save|invest|budget|house|property|mortgage|wealth|financial|money/.test(t))
    return [
      'Open your bank app and look at last month\'s actual spending. Write down the top 3 categories where your money went.',
      'Set a specific savings target: a number and a date. "Save more" doesn\'t work — "£300 by August 1st" does.',
      'Set up an automatic transfer on payday into a separate savings account. Make it automatic so it happens without a decision.',
      'Find one recurring expense you could cut or reduce this month — a subscription, takeaways, or impulse purchases. Cut it now.',
      'After 30 days: how much did you actually save vs your target? Adjust the amount for next month based on what\'s realistic.',
    ];

  // Generic — specific and actionable even without knowing the goal category
  return [
    'Write down the single most important next action you could take this week. Make it specific enough that you\'d know immediately whether it\'s done or not.',
    'Do that action. Even imperfectly. Write a sentence about what actually happened.',
    'Based on what you learned, write the next most important action. What does the previous step tell you about what comes next?',
    'Tell one other person about this goal. Saying it out loud to someone makes it real in a way that a note to yourself doesn\'t.',
    'Set a specific date to review your progress. On that date, write: what worked, what didn\'t, and what the next step is.',
  ];
}
