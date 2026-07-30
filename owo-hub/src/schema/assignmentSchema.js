import { TEAM_MEMBERS, TASK_STATUSES } from './constants';

export const assignmentSchema = {
  titleKey: 'title',
  fields: [
    { key: 'title', label: 'Task', type: 'text', placeholder: 'e.g. Design the Chef class icon' },
    { key: 'assignedTo', label: 'Assigned To', type: 'select', options: ['Unassigned', ...TEAM_MEMBERS] },
    { key: 'dueDate', label: 'Due', type: 'text', placeholder: 'e.g. By Friday' },
    { key: 'status', label: 'Status', type: 'select', options: TASK_STATUSES },
    { key: 'notes', label: 'Details', type: 'textarea', fullWidth: true },
    { key: 'attachment', label: 'Reference Image (optional)', type: 'image', fullWidth: true },
  ],
};
