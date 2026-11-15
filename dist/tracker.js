{
  const storageKey = 'ai-work-review-habit-log-v1';
  const weights = [4, 3, 3];
  const focusHabits = [
    { name: 'Concrete inputs', prompt: 'Use [source] for this task. Flag any facts it doesn’t support.' },
    { name: 'Follow-ups', prompt: 'Change [one issue], keep [what works], and check the revised result.' },
    { name: 'Verification', prompt: 'Check whether [observable result] meets [specific criterion]. Tell me what passed.' },
  ];
  const form = document.getElementById('habit-form');
  const choices = [...form.querySelectorAll('[data-habit]')];
  const save = document.getElementById('save-log');
  const undo = document.getElementById('undo-log');
  const logStatus = document.getElementById('log-status');
  const chart = document.getElementById('tracker-chart');
  const bars = document.getElementById('tracker-bars');
  const trendNote = document.getElementById('trend-note');
  const draftScore = document.getElementById('draft-score');
  const dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });
  let logs = [];

  function readLogs() {
    const data = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    const valid = Array.isArray(data) && data.every(entry =>
      entry && typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
      !Number.isNaN(Date.parse(entry.date)) && Array.isArray(entry.habits) &&
      entry.habits.length === weights.length && entry.habits.every(value => typeof value === 'boolean')
    );
    if (!valid) throw new Error('Invalid habit log');
    return data;
  }

  function today() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function score(entry) {
    return entry.habits.reduce((total, used, index) => total + (used ? weights[index] : 0), 0);
  }

  function choiceValues() {
    return choices.map(choice => choice.checked);
  }

  function showDraftScore() {
    draftScore.textContent = `${score({ habits: choiceValues() })} / 10`;
  }

  function renderFocus() {
    document.getElementById('habit-focus').hidden = logs.length === 0;
    if (!logs.length) return;
    const counts = focusHabits.map((_, index) => logs.filter(entry => entry.habits[index]).length);
    const gaps = counts.map((count, index) => (logs.length - count) * weights[index]);
    const priority = [2, 0, 1].reduce((top, index) => gaps[index] > gaps[top] ? index : top);
    document.getElementById('focus-rates').replaceChildren(...focusHabits.map((habit, index) => {
      const item = document.createElement('li');
      item.className = 'bar-row';
      item.append(...barContent(habit.name, counts[index], logs.length, true));
      return item;
    }));

    const habit = focusHabits[priority];
    const reason = document.getElementById('focus-reason');
    const prompt = document.getElementById('focus-prompt');
    prompt.hidden = gaps[priority] === 0;
    if (prompt.hidden) {
      reason.textContent = 'All three habits appear in every logged chat. Keep using the same workflow.';
      return;
    }
    const gap = (gaps[priority] / logs.length).toFixed(1);
    reason.textContent = `The largest gap is ${habit.name.toLowerCase()}, at ${gap} points per chat on average.`;
    prompt.textContent = habit.prompt;
  }

  function renderProgress() {
    let total = 0;
    const history = logs.map((entry, index) => {
      total += score(entry);
      return { date: entry.date, number: index + 1, average: total / (index + 1) };
    });
    const recent = history.slice(-12);
    const latest = recent.at(-1);
    document.getElementById('tracker-average').textContent = latest ? latest.average.toFixed(1) : '—';
    document.getElementById('tracker-count').textContent = logs.length;
    chart.hidden = !latest;
    undo.disabled = save.disabled || !latest;
    trendNote.textContent = latest
      ? 'Running average after each chat. Shows up to 12 recent logs.'
      : 'Log a chat to start your score history.';
    bars.replaceChildren(...recent.map(point => {
      const row = document.createElement('li');
      const label = document.createElement('span');
      const fill = document.createElement('span');
      row.title = `Chat ${point.number} · ${dateLabel.format(new Date(point.date))} · ${point.average.toFixed(1)}/10`;
      label.className = 'sr-only';
      label.textContent = row.title;
      fill.className = 'trend-fill';
      fill.style.setProperty('--bar-height', `${point.average * 10}%`);
      fill.setAttribute('aria-hidden', 'true');
      row.append(label, fill);
      return row;
    }));
    const firstDate = recent[0]?.date;
    document.getElementById('trend-first').textContent = firstDate ? dateLabel.format(new Date(firstDate)) : '';
    document.getElementById('trend-last').textContent = latest && latest.date !== firstDate
      ? dateLabel.format(new Date(latest.date))
      : '';
    renderFocus();
  }

  function loadProgress() {
    try {
      logs = readLogs();
      save.disabled = false;
    } catch {
      save.disabled = true;
      logStatus.textContent = 'Saved progress is unavailable. Check this browser’s site storage.';
    }
    renderProgress();
  }

  function updateLogs(transform) {
    try {
      const next = transform(readLogs());
      localStorage.setItem(storageKey, JSON.stringify(next));
      logs = next;
      renderProgress();
      return true;
    } catch {
      logStatus.textContent = 'Couldn’t save the change. Check this browser’s site storage.';
      return false;
    }
  }

  form.addEventListener('change', showDraftScore);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const entry = { date: today(), habits: choiceValues() };
    if (updateLogs(saved => [...saved, entry])) {
      choices.forEach(choice => { choice.checked = false; });
      showDraftScore();
      logStatus.textContent = `Logged at ${score(entry)}/10.`;
    }
  });

  undo.addEventListener('click', () => {
    if (updateLogs(saved => saved.slice(0, -1))) {
      logStatus.textContent = 'Last log removed.';
      if (undo.disabled) save.focus();
    }
  });

  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      logStatus.textContent = '';
      loadProgress();
    }
  });

  showDraftScore();
  loadProgress();
}
