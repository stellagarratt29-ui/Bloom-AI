import { WORLDS, TASK_STATUSES, TEAM_MEMBERS } from './constants';

export const devTaskSchema = {
  titleKey: 'name',
  fields: [
    { key: 'name', label: 'Task Name', type: 'text' },
    { key: 'world', label: 'World / Area', type: 'select', options: WORLDS.concat(['General']) },
    { key: 'assignee', label: 'Assigned To', type: 'select', options: ['Unassigned', ...TEAM_MEMBERS] },
    { key: 'priority', label: 'Priority (1 = first)', type: 'number' },
    { key: 'estimatedTime', label: 'Estimated Time', type: 'text', placeholder: 'e.g. 5-6 hours' },
    { key: 'status', label: 'Status', type: 'select', options: TASK_STATUSES },
    { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    { key: 'breakdown', label: 'Breakdown', type: 'list', fullWidth: true },
  ],
};

export const paletteColorSchema = {
  titleKey: 'name',
  fields: [
    { key: 'group', label: 'Group (e.g. Forest, UI/HUD, DNA Lab)', type: 'text' },
    { key: 'name', label: 'Color Name', type: 'text', placeholder: 'e.g. Grass/Ground' },
    { key: 'hex', label: 'Hex Value', type: 'color' },
  ],
};

export const referenceImageSchema = {
  titleKey: 'caption',
  fields: [
    { key: 'group', label: 'World / Group', type: 'select', options: WORLDS },
    { key: 'caption', label: 'Caption', type: 'text' },
    { key: 'image', label: 'Image', type: 'image' },
  ],
};
