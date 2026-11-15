{
  const library = {
    start: [
      {
        title: 'Start with a brief',
        when: 'Use this when the task has a clear deliverable.',
        body: `Goal: Produce [deliverable] for [audience].
Source: Use [file, link, or notes]. Flag missing facts.
Check: Verify [pass/fail criterion]. Report what you checked.
Stop at: [draft, review, or approval].`,
      },
      {
        title: 'Compare options',
        when: 'Use this when you need a decision and can name your priorities.',
        body: `Compare [options] for [decision]. Rank them by [criteria in priority order].
Use [source] for facts. Mark estimates and open questions.
Recommend one option, explain the trade-off, and say what evidence would change your choice.`,
      },
      {
        title: 'Turn notes into a plan',
        when: 'Use this when you have rough notes and need next actions.',
        body: `Turn [notes] into a plan for [outcome] by [deadline].
List the next three actions, any dependencies, and a visible sign each action is done.
Flag missing decisions and leave their owners unassigned unless the notes name them.`,
      },
    ],
    refine: [
      {
        title: 'Make a targeted revision',
        when: 'Use this when the draft is close and one part needs work.',
        body: `Revise [section] to fix [specific issue].
Keep [facts, tone, or wording that already works]. Use [source] for any new claim.
Return the revised section and the result of [one check].`,
      },
      {
        title: 'Challenge a recommendation',
        when: 'Use this when you want to pressure-test a decision before acting.',
        body: `Review this recommendation against [evidence or criteria].
Identify the assumption most likely to fail and explain its practical consequence.
Give the cheapest test that would help us decide whether to proceed.`,
      },
      {
        title: 'Hand off to another model',
        when: 'Use this when another AI or reviewer will pick up the work.',
        body: `Write a handoff for [reviewer or model] using [latest draft, commit, or notes].
Include the goal, current state, evidence, and the single next action.
Name the check to run and the action that needs my approval.`,
      },
    ],
    verify: [
      {
        title: 'Check the finished result',
        when: 'Use this when you can define what a passing result looks like.',
        body: `Check [deliverable] against [observable pass/fail criterion].
Report the result, the evidence you observed, and the smallest fix if it failed.
Mark any check you could not run as unverified.`,
      },
      {
        title: 'Audit factual claims',
        when: 'Use this when the draft relies on numbers, dates, or source claims.',
        body: `Check each consequential claim in [draft] against [sources].
For each claim, give its source and mark it supported, uncertain, or contradicted.
Suggest corrected wording for the claims that need revision.`,
      },
      {
        title: 'Review before release',
        when: 'Use this when a publish or deploy decision is coming up.',
        body: `Review [preview or release candidate] against [release requirements].
Run [smoke test] and report the preview result and expected live behavior.
List any blockers. Stop at the release recommendation so I can approve it.`,
      },
    ],
  };

  const groups = document.getElementById('prompt-groups');
  const groupButtons = [...groups.querySelectorAll('[data-prompt-group]')];
  const options = document.getElementById('prompt-options');
  const field = document.getElementById('prompt-template');
  const copy = document.getElementById('copy-prompt');
  const reset = document.getElementById('reset-prompt');
  const status = document.getElementById('copy-status');
  const card = groups.closest('.prompt-card');
  const drafts = new Map();
  let activePrompt;

  function selectPrompt(template, button) {
    activePrompt = template;
    document.getElementById('prompt-title').textContent = template.title;
    document.getElementById('prompt-when').textContent = template.when;
    field.value = drafts.get(template) ?? template.body;
    reset.disabled = !drafts.has(template);
    copy.disabled = !field.value.trim();
    status.textContent = '';
    [...options.children].forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  }

  function selectGroup(group) {
    card.dataset.stage = group;
    groupButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.promptGroup === group)));
    const templates = library[group];
    const buttons = templates.map(template => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = template.title;
      button.setAttribute('aria-controls', 'prompt-template');
      button.addEventListener('click', () => selectPrompt(template, button));
      return button;
    });
    options.replaceChildren(...buttons);
    selectPrompt(templates[0], buttons[0]);
  }

  groupButtons.forEach(button => button.addEventListener('click', () => selectGroup(button.dataset.promptGroup)));
  field.addEventListener('input', () => {
    if (field.value === activePrompt.body) drafts.delete(activePrompt);
    else drafts.set(activePrompt, field.value);
    reset.disabled = !drafts.has(activePrompt);
    copy.disabled = !field.value.trim();
    status.textContent = '';
  });
  reset.addEventListener('click', () => {
    drafts.delete(activePrompt);
    field.value = activePrompt.body;
    field.focus();
    reset.disabled = true;
    copy.disabled = false;
    status.textContent = 'Template restored.';
  });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(field.value);
      status.textContent = 'Prompt copied.';
    } catch {
      field.focus();
      field.select();
      status.textContent = 'Prompt selected. Use your browser’s copy command.';
    }
  });

  selectGroup('start');
  field.readOnly = false;
  groups.hidden = false;
}
