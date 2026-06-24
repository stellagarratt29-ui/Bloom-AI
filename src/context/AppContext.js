import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractTokenFromHash, saveCalendarToken } from '../services/calendar';

const AppContext = createContext(null);
const STORAGE_KEY = '@bloom_v3';

const uid = () => Date.now() + Math.floor(Math.random() * 10000);
const makeTask = (text, priority) => ({ id: uid(), text, priority, done: false });
const makeGoal = (text, firstAction) => ({ id: uid(), text, currentAction: firstAction ?? '', completedActions: [] });

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
  // Migrate v3 hobbies (single currentMilestone) to v4 format (milestones array)
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

export function AppProvider({ children }) {
  const [loaded, setLoaded]           = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [tasks, setTasks]             = useState([]);
  const [hobbies, setHobbies]         = useState([]);
  const [goals, setGoals]             = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [userName, setUserName]       = useState('');
  const [lastDumpDate, setLastDumpDate] = useState('');
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    // Capture Google OAuth token from URL hash if this is a redirect
    if (typeof window !== 'undefined') {
      const tokenData = extractTokenFromHash();
      if (tokenData) {
        saveCalendarToken(tokenData.token, tokenData.expiry)
          .then(() => setCalendarConnected(true))
          .catch(() => {});
      }
    }

    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const s = JSON.parse(raw);
            if (s.hasOnboarded)  setHasOnboarded(true);
            if (s.tasks)         setTasks(s.tasks);
            if (s.hobbies)       setHobbies(s.hobbies.map(migrateHobby));
            if (s.goals)         setGoals(s.goals);
            if (s.totalPoints)   setTotalPoints(s.totalPoints);
            if (s.userName)      setUserName(s.userName);
            if (s.lastDumpDate)  setLastDumpDate(s.lastDumpDate);
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
        hasOnboarded, tasks, hobbies, goals, totalPoints, userName, lastDumpDate,
      })).catch(() => {});
    }, 600);
  }, [loaded, hasOnboarded, tasks, hobbies, goals, totalPoints, userName, lastDumpDate]);

  const addPoints = useCallback((pts) => setTotalPoints(p => p + pts), []);

  // Tasks
  const addTask = useCallback((text, priority = 'medium') => {
    const t = makeTask(text, priority);
    setTasks(prev => [...prev, t]);
    return t;
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      if (nowDone) addPoints(5);
      return { ...t, done: nowDone };
    }));
  }, [addPoints]);

  const deleteTask = useCallback((id) => setTasks(prev => prev.filter(t => t.id !== id)), []);
  const clearDoneTasks = useCallback(() => setTasks(prev => prev.filter(t => !t.done)), []);

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

  // Hobbies — now accept full milestones array
  const addHobby = useCallback((name, skillLevel, milestones) => {
    const h = makeHobby(name, skillLevel, milestones);
    setHobbies(prev => [...prev, h]);
    return h;
  }, []);

  const completeMilestone = useCallback((hobbyId, nextMilestone) => {
    setHobbies(prev => prev.map(h => {
      if (h.id !== hobbyId) return h;
      const newIndex = (h.milestoneIndex ?? 0) + 1;
      // Prefer pre-generated next milestone; fall back to provided one
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

  const finishOnboarding = useCallback((name, goalText, firstGoalAction) => {
    if (name) setUserName(name);
    if (goalText) setGoals([makeGoal(goalText, firstGoalAction ?? '')]);
    setTasks([]);
    setHobbies([]);
    setHasOnboarded(true);
  }, []);

  return (
    <AppContext.Provider value={{
      loaded,
      hasOnboarded, finishOnboarding,
      processBrainDump,
      tasks, addTask, toggleTask, deleteTask, clearDoneTasks,
      hobbies, addHobby, completeMilestone, removeHobby,
      totalPoints, addPoints,
      goals, addGoal, advanceGoalAction, deleteGoal,
      userName, setUserName,
      lastDumpDate,
      calendarConnected, setCalendarConnected,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
