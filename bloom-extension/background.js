// Bloom Focus Mode — background service worker
// Manages the blocking ruleset based on user settings

const RULESET_ID = 'default_ruleset';

// On install: default to blocking OFF
chrome.runtime.onInstalled.addListener(async () => {
  const { blocking } = await chrome.storage.sync.get({ blocking: false });
  await applyBlocking(blocking);
});

// Listen for storage changes (popup toggled blocking)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blocking !== undefined) {
    applyBlocking(changes.blocking.newValue);
  }
});

async function applyBlocking(enabled) {
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds:  enabled ? [RULESET_ID] : [],
      disableRulesetIds: enabled ? [] : [RULESET_ID],
    });
  } catch (e) {
    console.error('[Bloom] Failed to update ruleset:', e);
  }
}

// Scheduled break periods — pause blocking during a time window
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'bloom_pause_end') {
    const { blocking } = await chrome.storage.sync.get({ blocking: false });
    if (blocking) await applyBlocking(true);
  }
});

// Message handler from popup/blocked page
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'PAUSE_BLOCKING') {
    // Pause for N minutes, then re-enable
    const minutes = msg.minutes ?? 5;
    applyBlocking(false).then(() => {
      chrome.alarms.create('bloom_pause_end', { delayInMinutes: minutes });
      sendResponse({ ok: true, resumesAt: Date.now() + minutes * 60 * 1000 });
    });
    return true; // async response
  }
  if (msg.type === 'GET_STATE') {
    chrome.storage.sync.get({ blocking: false, blockedToday: 0 }, (data) => {
      sendResponse(data);
    });
    return true;
  }
});
