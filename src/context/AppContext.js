import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoalPlan } from '../utils/goalPlans';

const AppContext = createContext(null);
const STORAGE_KEY = '@bloom_v2';

const uid = () => Date.now() + Math.floor(Math.random() * 10000);
const makeTask = (text, priority) => ({ id: uid(), text, priority, done: false });
const makeGoal = (text) => {
  const plan = getGoalPlan(text);
  return { id: uid(), text, step: 0, nextAction: plan[0] ?? '', progress: 0 };
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = () => new Date().toISOString().slice(0, 7);

function rotateDailyPoints(dp, days) {
  let result = [...dp];
  for (let i = 0; i < Math.min(days, 7); i++) {
    result = [...result.slice(1), 0];
  }
  return result;
}

export function AppProvider({ children }) {
  const [loaded, setLoaded]           = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [tasks, setTasks]             = useState([]);
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [hobbyProgress, setHobbyProgress] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [dailyPoints, setDailyPoints] = useState([0,0,0,0,0,0,0]);
  const [goals, setGoals]             = useState([]);
  const [userName, setUserName]       = useState('');
  const [lastJournalDate, setLastJournalDate] = useState('');
  const [lastActiveDay, setLastActiveDay] = useState(todayStr());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const s = JSON.parse(raw);
            if (s.hasOnboarded)    setHasOnboarded(true);
            if (s.tasks)           setTasks(s.tasks);
            if (s.selectedHobbies) setSelectedHobbies(s.selectedHobbies);
            if (s.hobbyProgress)   setHobbyProgress(s.hobbyProgress);
            if (s.totalPoints)     setTotalPoints(s.totalPoints);
            if (s.userName)        setUserName(s.userName);
            if (s.goals)           setGoals(s.goals);
            if (s.lastJournalDate) setLastJournalDate(s.lastJournalDate);
            const today = todayStr();
            if (s.lastActiveDay && s.lastActiveDay !== today) {
              const diff = Math.floor((new Date(today) - new Date(s.lastActiveDay)) / 86400000);
              setDailyPoints(rotateDailyPoints(s.dailyPoints ?? [0,0,0,0,0,0,0], diff));
            } else if (s.dailyPoints) {
              setDailyPoints(s.dailyPoints);
            }
            setLastActiveDay(today);
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
        hasOnboarded, tasks, selectedHobbies, hobbyProgress,
        totalPoints, dailyPoints, goals, userName, lastJournalDate,
        lastActiveDay: todayStr(), lastActiveMonth: monthStr(),
      })).catch(() => {});
    }, 600);
  }, [loaded, hasOnboarded, tasks, selectedHobbies, hobbyProgress,
      totalPoints, dailyPoints, goals, userName, lastJournalDate]);

  const addPoints = useCallback((pts) => {
    setTotalPoints(prev => prev + pts);
    setDailyPoints(prev => {
      const next = [...prev];
      next[6] = (next[6] || 0) + pts;
      return next;
    });
  }, []);

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

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearDoneTasks = useCallback(() => {
    setTasks(prev => prev.filter(t => !t.done));
  }, []);

  const processBrainDump = useCallback((items) => {
    const taskItems = items.filter(i => i.category !== 'goal');
    const goalItems = items.filter(i => i.category === 'goal');
    const newTasks = taskItems.map(({ text, priority }) => makeTask(text, priority ?? 'medium'));
    if (newTasks.length > 0) setTasks(newTasks);
    goalItems.forEach(g => {
      setGoals(prev => {
        if (prev.some(x => x.text.toLowerCase() === g.text.toLowerCase())) return prev;
        return [...prev, makeGoal(g.text)];
      });
    });
    setLastJournalDate(todayStr());
    return newTasks;
  }, []);

  const toggleHobby = useCallback((id) => {
    setSelectedHobbies(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  }, []);

  const completeHobbyStep = useCallback((hobbyId, stepIndex) => {
    setHobbyProgress(prev => ({ ...prev, [hobbyId]: stepIndex + 1 }));
  }, []);

  const addGoal = useCallback((text) => {
    setGoals(prev => [...prev, makeGoal(text)]);
  }, []);

  const advanceGoalStep = useCallback((id) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const plan = getGoalPlan(g.text);
      const nextStep = (g.step ?? 0) + 1;
      const nextAction = plan[nextStep] ?? "You've completed the initial plan. Set your own next step from here.";
      const progress = Math.min(100, Math.round((nextStep / plan.length) * 100));
      return { ...g, step: nextStep, nextAction, progress };
    }));
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const finishOnboarding = useCallback((hobbyIds, name, goalText) => {
    setSelectedHobbies(hobbyIds);
    if (name) setUserName(name);
    if (goalText) setGoals([makeGoal(goalText)]);
    setTasks([]);
    setHasOnboarded(true);
  }, []);

  return (
    <AppContext.Provider value={{
      loaded,
      hasOnboarded, finishOnboarding,
      hasDoneJournalToday: lastJournalDate === todayStr(),
      processBrainDump,
      tasks, addTask, toggleTask, deleteTask, clearDoneTasks,
      selectedHobbies, toggleHobby,
      hobbyProgress, completeHobbyStep,
      totalPoints, dailyPoints, addPoints,
      goals, addGoal, advanceGoalStep, deleteGoal,
      userName, setUserName,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
