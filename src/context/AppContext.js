import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { BUDDIES, POINTS } from '../constants/data';

const AppContext = createContext(null);

let _tid = 1;
const makeTask = (text, priority) => ({ id: _tid++, text, priority, done: false });

let _iid = 1;
const makeIdea = (text, returnCondition) => ({ id: _iid++, text, returnCondition, surfaced: false });

export function AppProvider({ children }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [buddy, setBuddy] = useState(BUDDIES[0]);
  const [tasks, setTasks] = useState([
    makeTask('Work on my passion project', 'high'),
    makeTask('Go for a 20-minute walk', 'medium'),
    makeTask('Read for 15 minutes', 'low'),
  ]);
  const [ideas, setIdeas] = useState([]);
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [hobbyProgress, setHobbyProgress] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  // Rolling 7-day points: index 6 = today, 0 = 6 days ago
  const [dailyPoints, setDailyPoints] = useState([0, 0, 0, 0, 0, 0, 0]);
  const sessionTaskCount = useRef(0);

  const momentum = Math.min(100, Math.round(
    dailyPoints.reduce((a, b) => a + b, 0) / (7 * 40) * 100
  ));

  const addPoints = useCallback((pts) => {
    setTotalPoints(p => p + pts);
    setDailyPoints(prev => {
      const next = [...prev];
      next[6] = (next[6] || 0) + pts;
      return next;
    });
  }, []);

  const addTask = useCallback((text, priority) => {
    setTasks(prev => [...prev, makeTask(text, priority)]);
    sessionTaskCount.current += 1;
    return sessionTaskCount.current; // caller checks for 3-task trigger
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      if (nowDone) addPoints(POINTS[t.priority] ?? 10);
      return { ...t, done: nowDone };
    }));
  }, [addPoints]);

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

  const finishOnboarding = useCallback((buddyId, hobbyIds) => {
    setBuddy(BUDDIES.find(b => b.id === buddyId) ?? BUDDIES[0]);
    setSelectedHobbies(hobbyIds);
    setHasOnboarded(true);
  }, []);

  return (
    <AppContext.Provider value={{
      hasOnboarded, finishOnboarding,
      buddy, setBuddy,
      tasks, addTask, toggleTask,
      ideas, saveIdea, promoteIdea, deleteIdea, dismissSurfacedIdea,
      selectedHobbies, toggleHobby,
      hobbyProgress, completeHobbyStep,
      totalPoints, momentum, addPoints,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
