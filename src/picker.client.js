function make_picker(groups) {
  let picker = {};
  picker.onchange = () => {};
  let ce = (tag) => document.createElement(tag);
  let sr = (o, p) => { p.entries().forEach(([k, v]) => typeof(v) === 'object' ? sr(o[k], v) : o[k] = v); return o; };
  let cc = (e, cl) => { e.classList.add(cl); }
  let el = ce('div');
  Node.prototype.ac = Node.prototype.appendChild;
  Node.prototype.sr = function(p) { return sr(this, p); };
  Node.prototype.cc = function(cl) { cc(this, cl); };
  let table = el.ac(ce('table'));
  groups = groups.map(({ name: name, stats: stats }) => {
    let tr = table.ac(ce('tr'));
    let th = tr.ac(ce('th').sr({ colSpan: '2', innerText: name + ' ▼' }));
    let expanded = true;
    stats = stats.map((name) => {
      let tr = table.ac(ce('tr'));
      let label = tr.ac(ce('td').sr({ innerText: name }));
      let range = tr.ac(ce('input').sr({ type: 'range', min: '0', max: '1', step: 'any' }));
      range.addEventListener('input', () => picker.onchange(picker.get_value()));
      return {
        name: name,
        get_value = () => parseFloat(range.value),
        set_value = (v) => { range.value = v; },
        element: tr
      }
    });
    th.onclick = () => {
      expanded = !expanded;
      th.sr({ innerText: name + (expanded ? ' ▼' : ' ▲') });
      stats.forEach(({ element: element }) => {
        element.style.display = expanded ? 'table-row' : 'none';
      });
    }
    return {
      name: name,
      stats: stats
    }
  });
  let presets = [];
  let preset_table = el.ac(ce('table'));
  let presets_expanded = true;
  let draw_presets = () => {
    while (preset_table.hasChildNodes()) preset_table.removeChild(preset_table.lastChild);
    let tr = preset_table.ac(ce('tr'));
    let th = tr.ac(ce('th').sr({ colSpan: '2', innerText: 'presets ' + (presets_expanded ? '▼' : '▲') }));
    th.cc('selectable');
    th.onclick = () => {
      presets_expanded = !presets_expanded;
      draw_presets();
    };
    if (!presets_expanded) return;
    presets.forEach((preset) => {
      let name = ce('td').sr({ style: { width: '100%' }, innerText: preset.name });
      name.cc('selectable');
      name.onclick = () => {
        picker.set_value(preset.stats);
      }
      let del = ce('td').sr({ innerText: 'del' });
      del.cc('selectable');
      del.onclick = () => {
        presets.splice(presets.indexOf(preset), 1);
        draw_presets();
      }
      let tr = ce('tr');
      tr.ac(name);
      tr.ac(del);
      preset_table.ac(tr);
    });
    let name_input = ce('input').sr({ type: 'text', style: { width: '90%' }  });
    name_input.addEventListener('keydown', (event) => event.stopPropagation());
    name_input.addEventListener('keyup', (event) => event.stopPropagation());
    name_input.addEventListener('keypress', (event) => {
      event.stopPropagation()
      if (event.key === 'Enter') {
        picker.add_preset({ name: name_input.value, stats: picker.get_value() });
      }
    });
    let name_cell = ce('td');
    name_cell.ac(name_input);
    let new_button = ce('td').sr({ innerText: 'save' });
    new_button.cc('selectable');
    new_button.onclick = () => picker.add_preset({ name: name_input.value, stats: picker.get_value() });
    tr = ce('tr');
    tr.ac(name_cell);
    tr.ac(new_button);
    preset_table.ac(tr);
  };
  picker.add_preset = (preset) => {
    presets.push(preset);
    draw_presets();
  }
  picker.get_value = () => {
    let stats = {};
    groups.forEach((group) => {
      let group_stats = {};
      group.stats.forEach((stats) => {
        group_stats[stats.name] = stats.get_value();
      });
      stats[group.name] = group_stats;
    });
    return stats;
  };
  picker.set_value = (v) => {
    groups.forEach((group) => {
      group.stats.forEach((stat) => {
        stat.set_value(v[group.name][stat.name]);
      });
    });
    picker.onchange(picker.get_value());
  };
  picker.element = el;
  return picker;
}
