// Small inline-SVG icon set (feather-style, stroke-based) so the nav doesn't
// depend on an icon font/package.
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5 M5 10v9h14v-9',
  users: 'M8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M15 6.5a3 3 0 1 1 3.5 5.9 M17 14c2.8.4 5 2.6 5 6',
  coins: 'M8 8a5 3 0 1 0 10 0 5 3 0 1 0-10 0Z M3 8v6a5 3 0 0 0 10 0 M8 14v6a5 3 0 0 0 10 0V14',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z M9 4v14 M15 6v14',
  palette: 'M12 3a9 9 0 1 0 0 18c1.2 0 2-1 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-7.5-9-7.5Z M7.5 12a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z M11 8a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 11 8Z M15.5 8.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z',
  skull: 'M12 3c-4.4 0-8 3.4-8 8 0 2.4 1 4 2.5 5.2V19a1 1 0 0 0 1 1h1.6v-1.8h1.8V20h2.2v-1.8h1.8V20H17a1 1 0 0 0 1-1v-2.8c1.5-1.2 2.5-2.8 2.5-5.2 0-4.6-3.6-8-8.5-8Z M9.5 11a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z M14.5 11a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z',
  hammer: 'm15 6 3 3-8.5 8.5-4-4L14 4l3 3-2 2 M3 21l4-4',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18 M6 6l12 12',
  plus: 'M12 5v14 M5 12h14',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
};

export default function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.8 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
