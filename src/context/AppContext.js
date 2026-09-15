import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractTokenFromHash, saveCalendarToken } from '../services/calendar';
import { restoreGoogleSession, getGoogleUser, signOutGoogle } from '../services/google';

const AppContext = createContext(null);
const STORAGE_KEY = '@bloom_v3';

const uid = () => Date.now() + Math.floor(Math.random() * 10000);

const makeTask = (text, priority = 'medium', category, urgency) => ({
  id: uid(), text, priority, done: false,
  urgency: urgency ?? priorityToUrgency(priority),
  category: category ?? 'task',
});

const makeGoal = (text, firstAction) => ({ id: uid(), text, currentAction: firstAction ?? '', completedActions: [] });

const makeProject = (name, guidance = '', category = 'general') => ({
  id: uid(), name, guidance, category,
  notes: [], createdAt: Date.now(),
});

function priorityToUrgency(p) {
  if (p === 'high')   return 'tonight';
  if (p === 'low')    return 'whenever';
  return 'thisweek';
}

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
  dyslexiaMode:     false,
  textSize:         'normal', // 'normal' | 'large' | 'xl'
};

export function AppProvider({ children }) {
  const [loaded, setLoaded]             = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [tasks, setTasks]               = useState([]);
  const [finishedTasks, setFinishedTasks] = useState([]);
  const [points, setPoints]             = useState(0);
  const [hobbies, setHobbies]           = useState([]);
  const [goals, setGoals]               = useState([]);
  const [lifeProjects, setLifeProjects] = useState([]);
  const [userName, setUserName]         = useState('');
  const [userAge, setUserAge]           = useState('');
  const [userOccupation, setUserOccupation] = useState('');
  const [lastDumpDate, setLastDumpDate] = useState('');
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [googleUser, setGoogleUserState] = useState(null); // {name,email,picture}

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

  // Screen time
  const [screenTimeLogs, setScreenTimeLogs]   = useState([]); // [{date:'YYYY-MM-DD', minutes}]
  const [screenTimeGoal, setScreenTimeGoalState] = useState(120); // minutes, default 2h
  const [bloomTimeLogs, setBloomTimeLogs]     = useState([]); // auto-tracked time in Bloom

  const logScreenTime = useCallback((minutes) => {
    const today = todayStr();
    setScreenTimeLogs(prev => {
      const filtered = prev.filter(l => l.date !== today);
      return [{ date: today, minutes }, ...filtered].slice(0, 30);
    });
  }, []);

  const setScreenTimeGoal = useCallback((minutes) => {
    setScreenTimeGoalState(minutes);
  }, []);

  const addBloomTime = useCallback((minutes) => {
    if (minutes <= 0) return;
    const today = todayStr();
    setBloomTimeLogs(prev => {
      const existing = prev.find(l => l.date === today);
      const newMins = Math.round(((existing?.minutes ?? 0) + minutes) * 10) / 10;
      const filtered = prev.filter(l => l.date !== today);
      return [{ date: today, minutes: newMins }, ...filtered].slice(0, 30);
    });
  }, []);

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

    // Restore Google session if browser kept it
    if (restoreGoogleSession()) {
      const u = getGoogleUser();
      if (u) setGoogleUserState(u);
    }

    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const s = JSON.parse(raw);
            if (s.hasOnboarded)    setHasOnboarded(true);
            if (s.tasks) {
              // Task rollover: overnight, 'tonight' tasks become 'thisweek'
              const today = todayStr();
              const rolled = (s.lastDumpDate && s.lastDumpDate !== today)
                ? s.tasks.map(t => t.urgency === 'tonight' && !t.done ? { ...t, urgency: 'thisweek' } : t)
                : s.tasks;
              const active = rolled.filter(t => !t.done);
              setTasks(active);
              // Migrate legacy done tasks to finishedTasks on first load
              if (!s.finishedTasks && s.tasks.some(t => t.done)) {
                setFinishedTasks(s.tasks.filter(t => t.done).map(t => ({
                  id: t.id, text: t.text, priority: t.priority,
                  finishedAt: t.completedAt ?? Date.now(),
                })));
              }
            }
            if (s.finishedTasks)   setFinishedTasks(s.finishedTasks);
            if (s.points)          setPoints(s.points);
            if (s.hobbies)         setHobbies(s.hobbies.map(migrateHobby));
            if (s.goals)           setGoals(s.goals);
            if (s.lifeProjects)    setLifeProjects(s.lifeProjects);
            if (s.userName)        setUserName(s.userName);
            if (s.userAge)         setUserAge(s.userAge);
            if (s.userOccupation)  setUserOccupation(s.userOccupation);
            if (s.lastDumpDate)    setLastDumpDate(s.lastDumpDate);
            if (s.ndSupport)         setNdSupport(s.ndSupport);
            if (s.ndToggles)         setNdToggles({ ...DEFAULT_ND_TOGGLES, ...s.ndToggles });
            if (s.screenTimeLogs)    setScreenTimeLogs(s.screenTimeLogs);
            if (s.screenTimeGoal)    setScreenTimeGoalState(s.screenTimeGoal);
            if (s.bloomTimeLogs)     setBloomTimeLogs(s.bloomTimeLogs);
            // Existing users who were already onboarded skip the tutorial
            setTutorialSeen(s.tutorialSeen ?? !!s.hasOnboarded);
          } catch (_) {}
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const saveTimer = useRef(null);
  const sessionStartRef = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        hasOnboarded, tasks, hobbies, goals, lifeProjects,
        userName, userAge, userOccupation, lastDumpDate,
        ndSupport, ndToggles, tutorialSeen, finishedTasks, points,
        screenTimeLogs, screenTimeGoal, bloomTimeLogs,
      })).catch(() => {});
    }, 600);
  }, [loaded, hasOnboarded, tasks, hobbies, goals, lifeProjects,
      userName, userAge, userOccupation, lastDumpDate,
      ndSupport, ndToggles, tutorialSeen, finishedTasks, points,
      screenTimeLogs, screenTimeGoal, bloomTimeLogs]);

  // Auto-track time in Bloom via Page Visibility API (web only)
  useEffect(() => {
    if (!loaded) return;
    if (typeof document === 'undefined') return;
    const flush = () => {
      if (sessionStartRef.current !== null) {
        const elapsed = (Date.now() - sessionStartRef.current) / 60000;
        sessionStartRef.current = null;
        if (elapsed >= 0.05) addBloomTime(elapsed);
      }
    };
    const onVisibility = () => {
      if (document.hidden) flush();
      else sessionStartRef.current = Date.now();
    };
    if (!document.hidden) sessionStartRef.current = Date.now();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', flush);
    return () => {
      flush();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', flush);
    };
  }, [loaded, addBloomTime]);

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

  const FINISHED_MAX_AGE = 3 * 24 * 60 * 60 * 1000; // 3 days
  const FINISHED_MAX     = 5;

  const finishTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const now   = Date.now();
      const entry = { id: task.id, text: task.text, priority: task.priority, finishedAt: now };
      setFinishedTasks(finished =>
        [entry, ...finished]
          .filter(f => now - f.finishedAt < FINISHED_MAX_AGE)
          .slice(0, FINISHED_MAX)
      );
      setPoints(p => p + 5);
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const clearFinishedTask = useCallback((id) => {
    setFinishedTasks(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateTask = useCallback((id, changes) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  }, []);

  const processBrainDump = useCallback((taskItems = [], projectItems = []) => {
    const newTasks = taskItems.map(({ text, priority, urgency }) =>
      makeTask(text, priority ?? 'medium', 'task', urgency)
    );
    if (newTasks.length > 0) setTasks(newTasks);

    // Add life projects (deduplicate by name)
    projectItems.forEach(p => {
      if (!p.name) return;
      setLifeProjects(prev => {
        if (prev.some(x => x.name.toLowerCase() === p.name.toLowerCase())) return prev;
        return [...prev, makeProject(p.name, p.guidance ?? '')];
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

  // Life projects
  const addLifeProject = useCallback((name, guidance = '', category = 'general') => {
    const p = makeProject(name, guidance, category);
    setLifeProjects(prev => [...prev, p]);
    return p;
  }, []);
  const removeLifeProject = useCallback((id) => setLifeProjects(prev => prev.filter(p => p.id !== id)), []);
  const updateLifeProject = useCallback((id, changes) => {
    setLifeProjects(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
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
    // Save onboarding hobbies as proper objects — milestones generated lazily in HobbiesScreen
    setHobbies(
      Array.isArray(initialHobbies) && initialHobbies.length > 0
        ? initialHobbies.map(name => makeHobby(name, 'beginner', []))
        : []
    );
    setHasOnboarded(true);
  }, []);

  const setGoogleUser = useCallback((user) => setGoogleUserState(user), []);
  const clearGoogleUser = useCallback(() => {
    signOutGoogle();
    setGoogleUserState(null);
  }, []);

  const clearAllData = useCallback(() => {
    setTasks([]);
    setFinishedTasks([]);
    setPoints(0);
    setHobbies([]);
    setGoals([]);
    setLifeProjects([]);
    setLastDumpDate('');
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
      finishedTasks, finishTask, clearFinishedTask, points,
      hobbies, addHobby, completeMilestone, removeHobby, updateHobby,
      goals, addGoal, advanceGoalAction, deleteGoal, updateGoal,
      lifeProjects, addLifeProject, removeLifeProject, updateLifeProject,
      userName, setUserName,
      userAge, setUserAge,
      userOccupation, setUserOccupation,
      lastDumpDate,
      calendarConnected, setCalendarConnected,
      googleUser, setGoogleUser, clearGoogleUser, clearAllData,
      ndSupport, setNdSupport,
      ndToggles, setNdToggles, updateNdToggles,
      tutorialSeen, setTutorialSeen,
      showTutorialReplay, openTutorial, closeTutorial,
      checkIn, checkInDone, saveCheckIn,
      screenTimeLogs, screenTimeGoal, logScreenTime, setScreenTimeGoal,
      bloomTimeLogs, addBloomTime,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
