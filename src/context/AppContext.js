import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractTokenFromHash, saveCalendarToken } from '../services/calendar';

const AppContext = createContext(null);
const STORAGE_KEY = '@bloom_v3';

const uid = () => Date.now() + Math.floor(Math.random() * 10000);
const makeTask = (text, priority, category) => ({
  id: uid(), text, priority, done: false,
  category: category ?? priorityToCategory(priority),
});
const makeGoal = (text, firstAction) => ({ id: uid(), text, currentAction: firstAction ?? '', completedActions: [] });

function priorityToCategory(p) {
  if (p === 'high') return 'school';
  if (p === 'low')  return 'leisure';
  return 'task';
}

const makeHobby = (name, skillLevel, milestones) => {
  const mArr = Array.isArray(milestones) ? milestones : (milestones ? [milestones] : []);
  return {
    id: uid(), name, skillLevel: skillLevel ?? 'beginner',
    milestones: mArr,
    milestoneIndex: 0,
    currentMilestone: mArr[0] ?? '',
    completedMilestones: [],
  };
};

function migrateHobby(h) {
  if (!h.milestones) {
    const mArr = h.currentMilestone ? [h.currentMilestone] : [];
    return { ...h, milestones: mArr, milestoneIndex: h.completedMilestones?.length ?? 0 };
  }
  if (h.milestoneIndex === undefined) {
    return { ...h, milestoneIndex: h.completedMilestones?.length ?? 0 };
  }
  return h;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const DEFAULT_ND_TOGGLES = {
  autoBreakTasks:   false,
  ideaCapture:      false,
  timeBuffers:      false,
  reducedClutter:   false,
  gentlerLanguage:  false,
};

export function AppProvider({ children }) {
  const [loaded, setLoaded]             = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [tasks, setTasks]               = useState([]);
  const [hobbies, setHobbies]           = useState([]);
  const [goals, setGoals]               = useState([]);
  const [userName, setUserName]         = useState('');
  const [userAge, setUserAge]           = useState('');
  const [userOccupation, setUserOccupation] = useState('');
  const [lastDumpDate, setLastDumpDate] = useState('');
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Daily check-in (not persisted — resets each session/day)
  const [checkIn, setCheckIn] = useState(null); // { mood, sleep, energy, date }
  const [checkInDone, setCheckInDone] = useState(false);

  const saveCheckIn = useCallback((data) => {
    setCheckIn({ ...data, date: todayStr() });
    setCheckInDone(true);
  }, []);

  // Neurodivergent support
  const [ndSupport, setNdSupport]   = useState(null); // null | 'yes' | 'no' | 'skip'
  const [ndToggles, setNdToggles]   = useState(DEFAULT_ND_TOGGLES);

  // Tutorial
  const [tutorialSeen, setTutorialSeen]           = useState(false);
  const [showTutorialReplay, setShowTutorialReplay] = useState(false);

  const openTutorial  = useCallback(() => setShowTutorialReplay(true),  []);
  const closeTutorial = useCallback(() => setShowTutorialReplay(false), []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tokenData = extractTokenFromHash();
      if (tokenData) {
        saveCalendarToken(tokenData.token, tokenData.expiry)
          .then(() => setCalendarConnected(true))
          .catch(() => {});
        if (window.sessionStorage) {
          window.sessionStorage.setItem('bloomOAuthReturn', 'CalendarTab');
        }
      }
    }

    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const s = JSON.parse(raw);
            if (s.hasOnboarded)    setHasOnboarded(true);
            if (s.tasks)           setTasks(s.tasks);
            if (s.hobbies)         setHobbies(s.hobbies.map(migrateHobby));
            if (s.goals)           setGoals(s.goals);
            if (s.userName)        setUserName(s.userName);
            if (s.userAge)         setUserAge(s.userAge);
            if (s.userOccupation)  setUserOccupation(s.userOccupation);
            if (s.lastDumpDate)    setLastDumpDate(s.lastDumpDate);
            if (s.ndSupport)       setNdSupport(s.ndSupport);
            if (s.ndToggles)       setNdToggles({ ...DEFAULT_ND_TOGGLES, ...s.ndToggles });
            // Existing users who were already onboarded skip the tutorial
            setTutorialSeen(s.tutorialSeen ?? !!s.hasOnboarded);
          } catch (_) {}
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const saveTimer = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        hasOnboarded, tasks, hobbies, goals,
        userName, userAge, userOccupation, lastDumpDate,
        ndSupport, ndToggles, tutorialSeen,
      })).catch(() => {});
    }, 600);
  }, [loaded, hasOnboarded, tasks, hobbies, goals,
      userName, userAge, userOccupation, lastDumpDate,
      ndSupport, ndToggles, tutorialSeen]);

  // Tasks
  const addTask = useCallback((text, priority = 'medium', category) => {
    const t = makeTask(text, priority, category);
    setTasks(prev => [...prev, t]);
    return t;
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      return { ...t, done: nowDone, completedAt: nowDone ? Date.now() : undefined };
    }));
  }, []);

  const deleteTask = useCallback((id) => setTasks(prev => prev.filter(t => t.id !== id)), []);
  const clearDoneTasks = useCallback(() => setTasks(prev => prev.filter(t => !t.done)), []);

  const updateTask = useCallback((id, changes) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  }, []);

  const processBrainDump = useCallback((items, goalActions = {}) => {
    const taskItems = items.filter(i => i.category !== 'goal');
    const goalItems = items.filter(i => i.category === 'goal');
    const newTasks  = taskItems.map(({ text, priority }) => makeTask(text, priority ?? 'medium'));
    if (newTasks.length > 0) setTasks(newTasks);
    goalItems.forEach(g => {
      const firstAction = goalActions[g.text] ?? '';
      setGoals(prev => {
        if (prev.some(x => x.text.toLowerCase() === g.text.toLowerCase())) return prev;
        return [...prev, makeGoal(g.text, firstAction)];
      });
    });
    setLastDumpDate(todayStr());
    return newTasks;
  }, []);

  // Hobbies
  const addHobby = useCallback((name, skillLevel, milestones) => {
    const h = makeHobby(name, skillLevel, milestones);
    setHobbies(prev => [...prev, h]);
    return h;
  }, []);

  const completeMilestone = useCallback((hobbyId, nextMilestone) => {
    setHobbies(prev => prev.map(h => {
      if (h.id !== hobbyId) return h;
      const newIndex = (h.milestoneIndex ?? 0) + 1;
      const next = h.milestones?.[newIndex] ?? nextMilestone ?? '';
      return {
        ...h,
        milestoneIndex: newIndex,
        currentMilestone: next,
        completedMilestones: [...(h.completedMilestones ?? []), h.currentMilestone],
      };
    }));
  }, []);

  const removeHobby = useCallback((id) => setHobbies(prev => prev.filter(h => h.id !== id)), []);

  const updateHobby = useCallback((id, changes, newMilestones) => {
    setHobbies(prev => prev.map(h => {
      if (h.id !== id) return h;
      const updated = { ...h, ...changes };
      if (newMilestones) {
        updated.milestones = newMilestones;
        updated.milestoneIndex = 0;
        updated.currentMilestone = newMilestones[0] ?? '';
        updated.completedMilestones = [];
      }
      return updated;
    }));
  }, []);

  // Goals
  const addGoal = useCallback((text, firstAction = '') => {
    setGoals(prev => [...prev, makeGoal(text, firstAction)]);
  }, []);

  const advanceGoalAction = useCallback((id, nextAction) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      return {
        ...g,
        completedActions: [...g.completedActions, g.currentAction],
        currentAction: nextAction,
      };
    }));
  }, []);

  const deleteGoal = useCallback((id) => setGoals(prev => prev.filter(g => g.id !== id)), []);

  const updateGoal = useCallback((id, changes) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...changes } : g));
  }, []);

  const finishOnboarding = useCallback((name, age, occupation, goalText, firstGoalAction, initialHobbies, ndSupportChoice, ndToggleChoices) => {
    if (name)       setUserName(name);
    if (age)        setUserAge(age);
    if (occupation) setUserOccupation(occupation);
    if (goalText)   setGoals([makeGoal(goalText, firstGoalAction ?? '')]);
    if (ndSupportChoice) setNdSupport(ndSupportChoice);
    if (ndToggleChoices) setNdToggles({ ...DEFAULT_ND_TOGGLES, ...ndToggleChoices });
    setTasks([]);
    setHobbies([]);
    setHasOnboarded(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    setHasOnboarded(false);
    setUserName('');
    setUserAge('');
    setUserOccupation('');
    setTutorialSeen(false);
    setNdSupport(null);
    setNdToggles(DEFAULT_ND_TOGGLES);
  }, []);

  const updateNdToggles = useCallback((changes) => {
    setNdToggles(prev => ({ ...prev, ...changes }));
  }, []);

  return (
    <AppContext.Provider value={{
      loaded,
      hasOnboarded, finishOnboarding, resetOnboarding,
      processBrainDump,
      tasks, addTask, toggleTask, deleteTask, clearDoneTasks, updateTask,
      hobbies, addHobby, completeMilestone, removeHobby, updateHobby,
      goals, addGoal, advanceGoalAction, deleteGoal, updateGoal,
      userName, setUserName,
      userAge, setUserAge,
      userOccupation, setUserOccupation,
      lastDumpDate,
      calendarConnected, setCalendarConnected,
      ndSupport, setNdSupport,
      ndToggles, setNdToggles, updateNdToggles,
      tutorialSeen, setTutorialSeen,
      showTutorialReplay, openTutorial, closeTutorial,
      checkIn, checkInDone, saveCheckIn,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
