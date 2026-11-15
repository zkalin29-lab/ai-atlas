const samples = {
  chatgpt: { chats: 9, messages: 32, claude: 1, habits: [8, 8, 1, 0], depth: [1, 5, 3] },
  codex: { chats: 9, messages: 45, claude: 2, habits: [7, 6, 5, 6], depth: [3, 1, 5] },
};

const habits = [
  { label: 'Concrete inputs', detail: 'Supplied or pointed to a specific draft, attachment, set of options, or work item.' },
  { label: 'Follow-up messages', detail: 'Sent two or more user messages in the chat, including corrections, choices, or requests to continue.' },
  { label: 'Explicit verification', detail: 'Asked for a check against a concrete source, test, or observable result.' },
  { label: 'Approval or release limits', detail: 'Reserved a decision for a person, set a condition on release, or explicitly limited the work to review.' },
];
const depthLabels = ['1 message', '2–4 messages', '5+ messages'];
const filters = [...document.querySelectorAll('[data-filter]')];
let selected = 'all';
let selectedHabit = 0;

function barContent(label, count, total, showPercent) {
  const percent = Math.round(100 * count / total);
  const top = document.createElement('span');
  top.className = 'bar-top';
  const name = document.createElement('span');
  name.className = 'bar-label';
  name.textContent = label;
  const value = document.createElement('span');
  value.className = 'bar-value';
  value.textContent = showPercent ? count + ' / ' + total + ' · ' + percent + '%' : String(count);
  top.append(name, value);
  const track = document.createElement('span');
  track.className = 'track';
  track.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.className = 'fill';
  fill.style.setProperty('--width', percent + '%');
  track.append(fill);
  return [top, track];
}

function selectHabit(index) {
  selectedHabit = index;
  document.querySelectorAll('#habit-bars button').forEach((button, position) => {
    button.setAttribute('aria-pressed', String(position === index));
  });
  document.getElementById('habit-detail').textContent = habits[index].detail;
}

function render() {
  const active = selected === 'all' ? Object.values(samples) : [samples[selected]];
  const sum = (key, index) => active.reduce((total, sample) => {
    return total + (index === undefined ? sample[key] : sample[key][index]);
  }, 0);
  const chats = sum('chats');
  document.getElementById('chat-count').textContent = chats;
  document.getElementById('turn-count').textContent = sum('messages');
  document.getElementById('claude-count').textContent = sum('claude');
  document.getElementById('denominator').textContent = 'Each bar shows the share of ' + chats + ' chats.';
  const habitList = document.getElementById('habit-bars');
  habitList.replaceChildren(...habits.map((habit, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bar-row';
    button.setAttribute('aria-controls', 'habit-detail');
    button.append(...barContent(habit.label, sum('habits', index), chats, true));
    button.addEventListener('click', () => selectHabit(index));
    item.append(button);
    return item;
  }));
  const depthList = document.getElementById('depth-bars');
  depthList.replaceChildren(...depthLabels.map((label, index) => {
    const item = document.createElement('li');
    item.className = 'bar-row';
    item.append(...barContent(label, sum('depth', index), chats, false));
    return item;
  }));
  selectHabit(selectedHabit);
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
}

filters.forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.filter;
  render();
}));

render();
