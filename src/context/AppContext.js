import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUDDIES, POINTS } from '../constants/data';

const AppContext = createContext(null);
const STORAGE_KEY = '@bloom_v1';

const uid = () => Date.now() + Math.floor(Math.random() * 10000);
const makeTask = (text, priority) => ({ id: uid(), text, priority, done: false });
const makeIdea = (text, returnCondition) => ({ id: uid(), text, returnCondition, surfaced: false });
const makeGoal = (text) => ({ id: uid(), text });

const todayStr  = () => new Date().toISOString().slice(0, 10);
const monthStr  = () => new Date().toISOString().slice(0, 7);

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000);
}

function rotateDailyPoints(dp, days) {
  let result = [...dp];
  for (let i = 0; i < Math.min(days, 7); i++) {
    result = [...result.slice(1), 0];
  }
  return result;
}

const DEFAULT_TASKS = [
  { id: 1, text: 'Work on my passion project', priority: 'high', done: false },
  { id: 2, text: 'Go for a 20-minute walk', priority: 'medium', done: false },
  { id: 3, text: 'Read for 15 minutes', priority: 'low', done: false },
];

export function AppProvider({ children }) {
  const [loaded, setLoaded]                 = useState(false);
  const [hasOnboarded, setHasOnboarded]     = useState(false);
  const [buddy, setBuddy]                   = useState(BUDDIES[0]);
  const [tasks, setTasks]                   = useState(DEFAULT_TASKS);
  const [ideas, setIdeas]                   = useState([]);
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [hobbyProgress, setHobbyProgress]   = useState({});
  const [totalPoints, setTotalPoints]       = useState(0);
  const [monthlyPoints, setMonthlyPoints]   = useState(0);
  const [dailyPoints, setDailyPoints]       = useState([0, 0, 0, 0, 0, 0, 0]);
  const [goals, setGoals]                   = useState([]);
  const [monthlyGoalTarget, setMonthlyGoalTarget] = useState(250);
  const [userName, setUserName]             = useState('');
  const [lastActiveDay, setLastActiveDay]   = useState(todayStr());
  const [currentStreak, setCurrentStreak]   = useState(0);
  const streakRef                           = useRef({ lastDay: '', count: 0 });
  const sessionTaskCount                    = useRef(0);

  // ── Load from storage on mount ────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const s = JSON.parse(raw);
            if (s.hasOnboarded)     setHasOnboarded(true);
            if (s.buddy)            setBuddy(BUDDIES.find(b => b.id === s.buddy) ?? BUDDIES[0]);
            if (s.tasks)            setTasks(s.tasks);
            if (s.ideas)            setIdeas(s.ideas);
            if (s.selectedHobbies)  setSelectedHobbies(s.selectedHobbies);
            if (s.hobbyProgress)    setHobbyProgress(s.hobbyProgress);
            if (s.totalPoints)      setTotalPoints(s.totalPoints);
            // Reset monthly points if a new month has started
            if (s.lastActiveMonth && s.lastActiveMonth !== monthStr()) {
              setMonthlyPoints(0);
            } else if (s.monthlyPoints) {
              setMonthlyPoints(s.monthlyPoints);
            }
            if (s.userName)         setUserName(s.userName);
            if (s.goals)            setGoals(s.goals);
            if (s.monthlyGoalTarget) setMonthlyGoalTarget(s.monthlyGoalTarget);
            if (s.currentStreak) {
              setCurrentStreak(s.currentStreak);
              streakRef.current = { lastDay: s.lastStreakDay ?? '', count: s.currentStreak };
            }

            // Roll over daily points if new day(s) have passed
            const today = todayStr();
            if (s.lastActiveDay && s.lastActiveDay !== today) {
              const diff = daysBetween(s.lastActiveDay, today);
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

  // ── Persist to storage (debounced) ────────────────────────────────────────
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        hasOnboarded,
        buddy: buddy?.id,
        tasks, ideas, selectedHobbies, hobbyProgress,
        totalPoints, monthlyPoints, dailyPoints, goals,
        monthlyGoalTarget, userName, currentStreak,
        lastStreakDay: streakRef.current.lastDay,
        lastActiveDay: todayStr(), lastActiveMonth: monthStr(),
      })).catch(() => {});
    }, 600);
  }, [loaded, hasOnboarded, buddy, tasks, ideas, selectedHobbies, hobbyProgress,
      totalPoints, monthlyPoints, dailyPoints, goals, monthlyGoalTarget, userName, currentStreak]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const momentum = Math.min(100, Math.round(
    dailyPoints.reduce((a, b) => a + b, 0) / (7 * 40) * 100
  ));

  // ── Actions ───────────────────────────────────────────────────────────────
  const addPoints = useCallback((pts) => {
    setTotalPoints(p => p + pts);
    setMonthlyPoints(p => p + pts);
    setDailyPoints(prev => {
      const next = [...prev];
      next[6] = (next[6] || 0) + pts;
      return next;
    });
  }, []);

  const addTask = useCallback((text, priority) => {
    setTasks(prev => [...prev, makeTask(text, priority)]);
    sessionTaskCount.current += 1;
    return sessionTaskCount.current;
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      if (nowDone) {
        addPoints(POINTS[t.priority] ?? 10);
        const today = todayStr();
        if (streakRef.current.lastDay !== today) {
          const diff = streakRef.current.lastDay
            ? daysBetween(streakRef.current.lastDay, today)
            : 999;
          const newCount = diff === 1 ? streakRef.current.count + 1 : 1;
          streakRef.current = { lastDay: today, count: newCount };
          setCurrentStreak(newCount);
        }
      }
      return { ...t, done: nowDone };
    }));
  }, [addPoints]);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearDoneTasks = useCallback(() => {
    setTasks(prev => prev.filter(t => !t.done));
  }, []);

  const saveIdea = useCallback((text, returnCondition) => {
    setIdeas(prev => [makeIdea(text, returnCondition), ...prev]);
  }, []);

  const promoteIdea = useCallback((idea) => {
    setTasks(prev => [...prev, makeTask(idea.text, 'medium')]);
    setIdeas(prev => prev.filter(i => i.id !== idea.id));
  }, []);

  const deleteIdea = useCallback((id) => {
    setIdeas(prev => prev.filter(i => i.id !== id));
  }, []);

  const dismissSurfacedIdea = useCallback((id) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, surfaced: true } : i));
  }, []);

  const toggleHobby = useCallback((id) => {
    setSelectedHobbies(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  }, []);

  const completeHobbyStep = useCallback((hobbyId, stepIndex) => {
    setHobbyProgress(prev => ({ ...prev, [hobbyId]: stepIndex + 1 }));
    addPoints(POINTS.hobbyStep);
  }, [addPoints]);

  const addGoal = useCallback((text) => {
    setGoals(prev => [...prev, makeGoal(text)]);
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const finishOnboarding = useCallback((buddyId, hobbyIds, name) => {
    setBuddy(BUDDIES.find(b => b.id === buddyId) ?? BUDDIES[0]);
    setSelectedHobbies(hobbyIds);
    if (name) setUserName(name);
    setHasOnboarded(true);
  }, []);

  return (
    <AppContext.Provider value={{
      loaded,
      hasOnboarded, finishOnboarding,
      buddy, setBuddy,
      tasks, addTask, toggleTask, deleteTask, clearDoneTasks,
      ideas, saveIdea, promoteIdea, deleteIdea, dismissSurfacedIdea,
      selectedHobbies, toggleHobby,
      hobbyProgress, completeHobbyStep,
      totalPoints, monthlyPoints, dailyPoints, momentum, addPoints,
      currentStreak,
      goals, addGoal, deleteGoal, monthlyGoalTarget, setMonthlyGoalTarget,
      userName, setUserName,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
