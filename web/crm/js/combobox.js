/**
 * Majaz CRM — ComboBox Component v4.0.0
 * Reusable searchable dropdown for relational fields.
 *
 * Usage:
 *   createComboBox({
 *     containerId: 'my-combo-container',
 *     placeholder:  'Search clients...',
 *     fetchOptions: async () => [{ value: 'id1', label: 'Name', sub: 'Location' }],
 *     onSelect:     (option) => { ... },
 *     formatLabel:  (opt) => `${opt.label} (${opt.sub})`,  // optional
 *   })
 */
window.createComboBox = function({ containerId, placeholder, fetchOptions, onSelect, formatLabel }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.classList.add('combobox');
  container.innerHTML = `
    <input type="text" class="combobox-input peek-input" placeholder="${placeholder || 'Search...'}" autocomplete="off" />
    <div class="combobox-dropdown"></div>
    <input type="hidden" class="combobox-value" />
  `;

  const input    = container.querySelector('.combobox-input');
  const dropdown = container.querySelector('.combobox-dropdown');
  const hidden   = container.querySelector('.combobox-value');

  let options  = [];
  let filtered = [];
  let activeIdx = -1;
  let loaded   = false;

  // Lazy-load options on first focus
  input.addEventListener('focus', async () => {
    if (!loaded) {
      dropdown.innerHTML = '<div class="combobox-loading">Loading…</div>';
      dropdown.classList.add('open');
      try {
        options = await fetchOptions();
      } catch (e) {
        options = [];
      }
      loaded = true;
    }
    filter(input.value);
  });

  // Filter on typing
  input.addEventListener('input', () => {
    filter(input.value);
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, filtered.length - 1);
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      highlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) {
        select(filtered[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) close();
  });

  function filter(q) {
    const query = (q || '').toLowerCase();
    filtered = query
      ? options.filter(o => o.label.toLowerCase().includes(query) || (o.sub||'').toLowerCase().includes(query))
      : options;
    activeIdx = -1;
    render();
  }

  function render() {
    if (!filtered.length) {
      dropdown.innerHTML = '<div class="combobox-empty">No matches</div>';
      dropdown.classList.add('open');
      return;
    }
    dropdown.innerHTML = filtered.map((opt, i) => {
      const label = formatLabel ? formatLabel(opt) : opt.label;
      const sub   = opt.sub ? `<span class="combobox-option-sub">${opt.sub}</span>` : '';
      return `<div class="combobox-option${i === activeIdx ? ' active' : ''}" data-idx="${i}">
        <span class="combobox-option-label">${label}</span>${sub}
      </div>`;
    }).join('');
    dropdown.classList.add('open');

    // Click handlers on options
    dropdown.querySelectorAll('.combobox-option').forEach(el => {
      el.addEventListener('click', () => {
        select(filtered[parseInt(el.dataset.idx)]);
      });
    });
  }

  function highlight() {
    dropdown.querySelectorAll('.combobox-option').forEach((el, i) => {
      el.classList.toggle('active', i === activeIdx);
    });
    // Scroll active into view
    const active = dropdown.querySelector('.combobox-option.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function select(opt) {
    input.value = formatLabel ? formatLabel(opt) : opt.label;
    hidden.value = opt.value;
    close();
    if (onSelect) onSelect(opt);
  }

  function close() {
    dropdown.classList.remove('open');
  }

  // Public API
  return {
    getValue: () => hidden.value,
    setValue: (val, label) => { hidden.value = val; input.value = label || ''; },
    clear:   () => { hidden.value = ''; input.value = ''; },
  };
};

/**
 * Inline form validation helper.
 * Usage:
 *   const isValid = validateRequired('my-input-id', 'Field is required');
 *   const isValid = validatePattern('my-input-id', /^\d+$/, 'Must be a number');
 */
window.validateRequired = function(inputId, errorMsg) {
  const el = document.getElementById(inputId);
  if (!el) return false;
  const val = el.value?.trim();
  if (!val) {
    el.classList.add('field-error');
    el.classList.remove('field-valid');
    showFieldError(el, errorMsg || 'This field is required');
    return false;
  }
  el.classList.remove('field-error');
  el.classList.add('field-valid');
  clearFieldError(el);
  return true;
};

window.validatePattern = function(inputId, pattern, errorMsg) {
  const el = document.getElementById(inputId);
  if (!el) return false;
  const val = el.value?.trim();
  if (val && !pattern.test(val)) {
    el.classList.add('field-error');
    el.classList.remove('field-valid');
    showFieldError(el, errorMsg || 'Invalid format');
    return false;
  }
  el.classList.remove('field-error');
  if (val) el.classList.add('field-valid');
  clearFieldError(el);
  return true;
};

function showFieldError(el, msg) {
  clearFieldError(el);
  const err = document.createElement('div');
  err.className = 'field-error-msg';
  err.textContent = msg;
  el.parentNode.insertBefore(err, el.nextSibling);
}

function clearFieldError(el) {
  const next = el.nextElementSibling;
  if (next && next.classList.contains('field-error-msg')) {
    next.remove();
  }
}
