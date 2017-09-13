if (!is_server) {
  ce = (tag) => document.createElement(tag);
  let sr = (o, p) => {
    p.entries().forEach(([k, v]) => typeof(v) === 'object' ? sr(o[k], v) : o[k] = v); return o;
  };
  Node.prototype.ac = Node.prototype.appendChild;
  Node.prototype.sr = function(p) { return sr(this, p); };
}
function make_picker(groups) {
  let picker = {};
  picker.onchange = () => {};
  let el = ce('div');
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
        get_value: () => parseFloat(range.value),
        set_value: (v) => { range.value = v; },
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
