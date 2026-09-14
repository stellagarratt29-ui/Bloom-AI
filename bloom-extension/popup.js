// Bloom Focus — popup controller

const toggle      = document.getElementById('block-toggle');
const statusBadge = document.getElementById('status-badge');
const toggleSub   = document.getElementById('toggle-sub');
const statRow     = document.getElementById('stat-row');
const blockedCount= document.getElementById('blocked-count');
const offNote     = document.getElementById('off-note');

// Load current state
chrome.storage.sync.get({ blocking: false, blockedToday: 0, blockedDate: '' }, (data) => {
  const today = new Date().toDateString();
  const count = data.blockedDate === today ? data.blockedToday : 0;

  setUI(data.blocking, count);
});

// Toggle
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ blocking: enabled }, () => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
      setUI(enabled, state?.blockedToday ?? 0);
    });
  });
});

function setUI(enabled, count) {
  toggle.checked = enabled;

  if (enabled) {
    statusBadge.textContent = 'ON';
    statusBadge.className = 'status-badge status-on';
    toggleSub.textContent = 'Active — distracting sites are blocked.';
    offNote.textContent = 'Blocking is on. Tap a blocked site and you\'ll land here instead.';
    if (count > 0) {
      statRow.style.display = 'flex';
      blockedCount.textContent = count;
    }
  } else {
    statusBadge.textContent = 'OFF';
    statusBadge.className = 'status-badge status-off';
    toggleSub.textContent = 'Turn on to block YouTube, TikTok, Instagram and more.';
    statRow.style.display = 'none';
    offNote.textContent = 'Blocking is off. Toggle above to start.';
  }
}
