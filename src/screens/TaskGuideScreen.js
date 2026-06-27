import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import { C } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { callClaude, getApiKey } from '../services/ai';

export default function TaskGuideScreen({ route, navigation }) {
  const { task } = route.params ?? {};
  const { toggleTask } = useApp();

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [taskDone, setTaskDone] = useState(task?.done ?? false);
  const scrollRef  = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => { loadInitialGuide(); }, []);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  const loadInitialGuide = async () => {
    setThinking(true);
    try {
      const key = await getApiKey();
      if (!key) throw new Error('no key');
      const reply = await callClaude({
        system: `You are Bloom, a warm and practical productivity coach. The user has tapped on ONE specific task and wants to know how to do it.

YOUR ENTIRE RESPONSE must be about this exact task: "${task?.text}"

Rules:
- Every step must be directly about THIS task — the words in your response should only make sense for this specific thing
- If someone read your response without seeing the task name, they should still know exactly what they're doing
- Never use generic steps like "decide when to do this" or "set a timer" — those apply to any task and are useless
- Start immediately with actual how-to steps for this specific task
- 3–6 numbered steps, matched to how complex this task actually is
- Name specific apps, websites, tools, or methods that genuinely help with this particular task
- End with one short question about a specific aspect of this task
- No markdown headers. Warm but direct.`,
        messages: [{ role: 'user', content: `Task: "${task?.text}"` }],
        maxTokens: 650,
      });
      const msg = { id: 1, from: 'bloom', text: reply };
      setMessages([msg]);
      historyRef.current = [{ role: 'assistant', content: reply }];
    } catch {
      const guide = getTaskGuideFallback(task?.text);
      const msg = { id: 1, from: 'bloom', text: guide };
      setMessages([msg]);
      historyRef.current = [{ role: 'assistant', content: guide }];
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg = { id: Date.now(), from: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    scrollToEnd();
    historyRef.current = [...historyRef.current, { role: 'user', content: trimmed }];

    setThinking(true);
    try {
      const key = await getApiKey();
      if (!key) throw new Error('no key');
      const reply = await callClaude({
        system: `You are Bloom, a practical productivity coach. The user is working on: "${task?.text}". Answer their follow-up question helpfully and specifically. Keep replies to 3–5 sentences. Be direct.`,
        messages: historyRef.current,
        maxTokens: 350,
      });
      const msg = { id: Date.now() + 1, from: 'bloom', text: reply };
      setMessages(prev => [...prev, msg]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
    } catch {
      const m = trimmed.toLowerCase();
      let reply;
      if (/how long|time|take/.test(m)) reply = `It depends on your focus, but set a 25-minute timer to start — you can always do more.`;
      else if (/what do i need|materials|tools|supplies/.test(m)) reply = `Write down everything you think you'll need before starting. Better to gather it upfront than stop mid-task.`;
      else if (/can'?t|don't know|stuck|help/.test(m)) reply = `Start with the very first physical action — even something tiny. Momentum builds from there.`;
      else if (/why|should i|worth it/.test(m)) reply = `You added this for a reason. What made you want to do it?`;
      else reply = `For "${task?.text}": break it into smaller pieces and do one at a time. Which part feels most manageable right now?`;
      const msg = { id: Date.now() + 1, from: 'bloom', text: reply };
      setMessages(prev => [...prev, msg]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const handleMarkDone = () => {
    if (task && !taskDone) {
      toggleTask(task.id);
      setTaskDone(true);
    }
    navigation.goBack();
  };

  const PRIORITY_COLOR = { high: '#C0392B', medium: C.moss, low: C.muted };
  const priorityColor = PRIORITY_COLOR[task?.priority] ?? C.moss;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={22} color={C.ink} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={[s.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={s.headerTask} numberOfLines={2}>{task?.text ?? 'Task'}</Text>
          </View>
          <TouchableOpacity
            style={[s.doneBtn, taskDone && s.doneBtnDone]}
            onPress={handleMarkDone}
          >
            <Icon name="check" size={15} color={taskDone ? C.sage : C.white} />
            <Text style={[s.doneBtnText, taskDone && s.doneBtnTextDone]}>
              {taskDone ? 'Done ✓' : 'Mark done — +5 pts'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {thinking && messages.length === 0 && (
            <View style={s.loadingWrap}>
              <ActivityIndicator color={C.sage} size="small" />
              <Text style={s.loadingText}>Working out how to do this…</Text>
            </View>
          )}

          {messages.map(m => (
            m.from === 'bloom' ? (
              <View key={m.id} style={s.bloomBubble}>
                <Text style={s.bloomText}>{m.text}</Text>
              </View>
            ) : (
              <View key={m.id} style={s.userRow}>
                <View style={s.userBubble}>
                  <Text style={s.userText}>{m.text}</Text>
                </View>
              </View>
            )
          ))}

          {thinking && messages.length > 0 && (
            <View style={[s.bloomBubble, { paddingVertical: 16 }]}>
              <ActivityIndicator color={C.sage} size="small" />
            </View>
          )}
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Ask Bloom anything about this task…"
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            editable={!thinking}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || thinking) && s.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || thinking}
          >
            <Icon name="send" size={16} color={C.white} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getTaskGuideFallback(text) {
  const t = (text || '').toLowerCase();
  const taskName = (text || 'this').trim();

  if (/coffee|tea|brew|kettle|espresso|latte|cappuccino|matcha/.test(t))
    return `Here's how to make a great cup:\n\n1. Fill and boil the kettle — don't skip the boil even if it feels obvious\n2. While it boils: get your mug, your coffee or teabag, and milk if you want it\n3. For coffee: 1 heaped teaspoon of grounds or instant per mug; brew 1–2 min then stir\n4. For tea: pour water just off the boil (not full rolling boil for green/herbal), steep 2–4 min\n5. Add milk last so it doesn't cool the drink too fast\n\nBonus: if you're using a cafetière, let it bloom — pour a little hot water first, wait 30 seconds, then fill.\n\nAny specific brew you're making?`;

  if (/paint.*nail|nail.*paint/.test(t))
    return `Here's how to get a clean nail paint:\n\n1. Remove old polish with acetone remover\n2. File and shape your nails — do all 10 before painting\n3. Apply a clear base coat and let it dry fully (2 min)\n4. Apply colour in 2 thin coats — thin is key, thick coats peel\n5. Wait 2 minutes between each coat\n6. Finish with a clear top coat\n7. Clean up edges with a cotton bud dipped in remover\n\nTip: do it while watching something so you don't fidget!\n\nWhat colour are you going for?`;

  if (/shower|bath|wash hair|wash your hair/.test(t))
    return `Here's how to make this actually happen:\n\n1. Put a towel out and get your products ready before you get in — removes friction\n2. Set the water temperature before stepping in\n3. If it's hair wash day: shampoo from root, not the ends; rinse fully before conditioning\n4. Conditioner goes on the ends only, leave it for 2 minutes\n5. Finish with a cooler rinse — closes the hair cuticle, reduces frizz\n\nIf getting started is the hard bit: just go stand in the bathroom. That's the first step.\n\nAnything specific about this you want help with?`;

  if (/get up|wake up|out of bed|alarm|morning routine/.test(t))
    return `Here's how to actually get up:\n\n1. Put your phone or alarm on the other side of the room tonight — you can't snooze what you have to stand up to turn off\n2. When the alarm goes, sit up immediately before your brain has time to negotiate\n3. Turn on a light straight away — it signals your brain to stop producing melatonin\n4. Have something waiting: a glass of water or a specific podcast cued up\n5. First task of the morning should be something tiny and satisfying — not your inbox\n\nWhat time are you trying to get up?`;

  if (/exercise|gym|workout|run|jog|walk|yoga|stretch|pilates/.test(t))
    return `Here's how to actually do the workout:\n\n1. Lay out your kit tonight — clothes, shoes, water bottle already ready removes the biggest friction\n2. Start with a 3–5 minute warmup: easy walking, arm circles, leg swings\n3. If you planned a run: first 5 minutes are always the worst — commit to those and reassess after\n4. If you planned a workout: do the hardest exercise first, when energy is highest\n5. End with a proper cooldown stretch: hold each stretch for 20–30 seconds\n\nFor tracking: Nike Run Club (free) for running, FitBod for gym sessions.\n\nWhat kind of workout are you doing?`;

  if (/grocery|shopping|supermarket|buy food|food shop/.test(t))
    return `Here's how to shop efficiently:\n\n1. Before you leave: check your fridge and cupboards — write a list organised by section (produce, dairy, meat, etc.)\n2. Eat before you go — shopping hungry is expensive\n3. Go straight to the non-negotiables first before anything else catches your eye\n4. Stick to the perimeter of the store for fresh food; aisles for everything else\n5. Check your list one final time before the checkout\n\nTip: a notes app list synced across devices means you can add things when you think of them at home.\n\nWhat do you need to pick up?`;

  if (/doctor|dentist|hospital|appointment|clinic|gp|optician/.test(t))
    return `Here's how to prepare:\n\n1. Confirm the time, date, and location — add it to your calendar with a 1-hour reminder\n2. Write down your symptoms, questions, or concerns before you go\n3. Bring: insurance card, previous test results, list of medications you take\n4. Arrive 10–15 minutes early if it's a new clinic\n5. During the appointment: take notes on what they say — even on your phone\n6. After: write down next steps while it's fresh\n\nWhat's the appointment for? I can help you prepare specific questions.`;

  if (/homework|essay|assignment|study|revision|exam|test/.test(t))
    return `Here's how to actually get through it:\n\n1. Clear your space first — a messy desk means a distracted brain\n2. Write down exactly what you need to produce in one sentence\n3. Set a 25-minute timer and work on only that\n4. Take a 5-minute break when it goes off, then go again\n5. Start with the hardest part while your brain is fresh\n\nFree tools: Grammarly for writing, Khan Academy for maths and science, Quizlet for revision cards.\n\nWhat subject is it? I can give more specific help.`;

  if (/clean|tidy|organise|organize|hoover|vacuum|mop|dust|dishes|washing up/.test(t))
    return `Here's how to make cleaning actually happen:\n\n1. Set a 15-minute timer — commit to stopping when it goes off (you'll usually keep going)\n2. Pick ONE area to start, not the whole space\n3. Clear surfaces first: everything goes into a pile\n4. Sort the pile: put away, bin, or donate\n5. Wipe surfaces after they're clear\n6. Vacuum or sweep last\n\nSecret: put on a podcast or playlist you love. Cleaning goes 10x faster.\n\nWhich area are you starting with?`;

  if (/laundry|washing|wash clothes|tumble dry|hang.*clothes/.test(t))
    return `Here's how to get through the laundry:\n\n1. Sort into piles: darks, lights, whites — or just one load if it's small\n2. Check labels on anything you're unsure about\n3. Load the machine: don't overfill (two-thirds full is ideal for clean results)\n4. Use the right amount of detergent — more doesn't mean cleaner\n5. Set a timer for when it finishes so it doesn't sit wet and smell\n6. Hang or fold immediately — the longer you leave it, the worse the wrinkles\n\nWhich bit are you doing — washing, drying, or putting away?`;

  if (/cook|bake|recipe|meal|dinner|lunch|breakfast|make.*food/.test(t))
    return `Here's how to cook it well:\n\n1. Read the entire recipe before starting — no surprises mid-cook\n2. Prep everything first (chop, measure) before you turn on any heat\n3. Taste as you go — season in layers, not all at the end\n4. Heat the pan before adding oil, add oil before adding food\n5. Don't crowd the pan — things steam instead of browning\n\nResources: "Basics with Babish" on YouTube, BBC Good Food for reliable recipes.\n\nWhat are you making?`;

  if (/email|message|reply|respond|write.*to/.test(t))
    return `Here's how to write and actually send it:\n\n1. Open a draft and write the subject line first — it focuses your whole email\n2. Write a bad first draft with no editing — just get words out\n3. Three-part structure: why you're emailing → what you need → thanks\n4. Read it once out loud, fix anything that sounds odd\n5. Hit send — don't overthink it\n\nTip: if you're stuck, start with "I'm writing to…" and just finish the sentence.\n\nWho's it to and what do you need to say?`;

  if (/call|phone|ring/.test(t))
    return `Here's how to make the call without dreading it:\n\n1. Write down the 2–3 things you need to say or ask before dialling\n2. Call when you have good signal and a quiet spot\n3. Introduce yourself: "Hi, my name is [name], I'm calling about…"\n4. It's always shorter than you think it'll be\n5. Write down anything important immediately after\n\nWho are you calling and what do you need to sort out?`;

  if (/pay|bill|invoice|bank|transfer|rent|utilities/.test(t))
    return `Here's how to get the payment done:\n\n1. Log in to your bank or the relevant app — don't delay this step\n2. Check the exact amount and payment reference (especially for bills)\n3. Set up the payment, double-check the account number before confirming\n4. Screenshot or save the confirmation\n5. If it's a recurring bill: set it as a direct debit so you never have to remember it again\n\nIs it a one-off payment or something you need to set up regularly?`;

  if (/book|reserve|ticket|hotel|flight|travel|trip|holiday|vacation/.test(t))
    return `Here's how to book it properly:\n\n1. Decide on your dates and budget first — before you open any booking site\n2. Check a few options: Google Flights for flights, Booking.com or Airbnb for accommodation\n3. Read cancellation policies before committing — especially for non-refundable deals\n4. Book direct with the hotel if possible — often cheaper and easier to change\n5. Screenshot confirmation details and add dates to your calendar\n\nWhat are you booking?`;

  if (/pack|suitcase|bag|travel prep/.test(t))
    return `Here's how to pack without forgetting anything:\n\n1. Start with a list: clothes per day, toiletries, documents (passport, tickets, insurance), chargers, medication\n2. Lay everything out before putting it in — you'll see what you're missing\n3. Pack shoes in a bag inside your suitcase — they're the dirtiest and heaviest things\n4. Roll clothes instead of folding — more space, fewer creases\n5. Toiletries and liquids in a clear bag on top for security\n\nWhere are you going and how long for?`;

  if (/read|reading|book|chapter/.test(t))
    return `Here's how to actually read consistently:\n\n1. Set a time and place that's always the same — habit stacks to environment\n2. Start with just one page, or one chapter — the goal is to open the book\n3. Put your phone in another room for the reading block\n4. Use a physical bookmark so you never lose your place\n5. If you lose focus, reread the last paragraph — don't skim forward\n\nWhat are you reading?`;

  if (/apply|application|job|cv|resume|cover letter/.test(t))
    return `Here's how to work through the application:\n\n1. Read the job description carefully — note the 3–5 key things they want\n2. Tailor your CV to match those specific points — not a generic version\n3. Cover letter structure: why this company → why you're right → one specific example\n4. Use the exact words from the job ad — many companies use keyword filtering\n5. Read everything out loud before submitting — you'll catch errors your eyes skip\n\nWhat's the role? I can help with specific points.`;

  const firstWord = taskName.split(' ')[0];
  const taskRef = taskName.length > 50 ? firstWord : taskName;

  return `Here's how to tackle "${taskRef}":\n\n1. Before anything else: spend 2 minutes writing down what "done" actually looks like for this — be specific\n2. Identify the very first physical action (open a tab, pick up an object, write one sentence)\n3. Do that first action right now — it takes less than a minute\n4. Once you've started, work in 25-minute focused blocks with short breaks between\n5. If you get stuck mid-way, write down exactly where you are so you can pick it up easily next time\n\nWhat's the trickiest part of "${taskRef}" for you?`;
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  backBtn: { padding: 4, flexShrink: 0 },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  headerTask: { flex: 1, fontSize: 15, fontWeight: '700', color: C.ink, lineHeight: 22 },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.moss, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, flexShrink: 0,
  },
  doneBtnDone: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.moss },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: C.white },
  doneBtnTextDone: { color: C.moss },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 32 },

  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, color: C.muted },

  bloomBubble: {
    backgroundColor: C.white, borderRadius: 18, borderBottomLeftRadius: 6,
    padding: 16, borderWidth: 1, borderColor: C.border,
  },
  bloomText: { fontSize: 15, color: C.ink, lineHeight: 26 },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: C.moss, borderRadius: 18, borderBottomRightRadius: 6,
    paddingVertical: 12, paddingHorizontal: 16, maxWidth: '80%',
  },
  userText: { fontSize: 15, color: C.white, lineHeight: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.cream,
  },
  input: {
    flex: 1, backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 24, paddingVertical: 11, paddingHorizontal: 18,
    fontSize: 15, color: C.ink,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.moss, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
});
