function make_picker(groups) {
  let picker = {};
  picker.onchange = () => {};
  let ce = (tag) => document.createElement(tag);
  let sr = (o, p) => { p.entries().forEach(([k, v]) => typeof(v) === 'object' ? sr(o[k], v) : o[k] = v); return o; };
  let el = ce('div');
  Node.prototype.ac = Node.prototype.appendChild;
  Node.prototype.sr = function(p) { return sr(this, p); };
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

function create_pickers(attributes, group_order) {
  
  /*
  let result = {pickers: [], onchange: () => null};
  let container = document.getElementById('picker');
  let groups_container = document.getElementById('groups');
  let current_picker;
  let current_group = group_order[0];

  group_order.forEach((group, pos) => {
    let elem = document.createElement('span');
    elem.innerText = group;
    elem.id = group;
    elem.className = group == current_group ? 'selected' : 'deselected';
    elem.onclick = () => {
      current_group = group;
      result.pickers.forEach((picker) => {
        picker.style.display = picker.group == group ? 'block' : 'none';
        //picker.style.opacity = picker.group == group ? 1 : 0.3;
      });
      group_order.forEach((gr_name) => {
        document.getElementById(gr_name).className = gr_name == group ? 'selected' : 'deselected';
      });
    };
    if (pos != 0) groups_container.appendChild(document.createTextNode(' | '));
    groups_container.appendChild(elem);
    attributes[group].forEach((attr) => {
      let picker = document.createElement('div');
      picker.group = group;
      picker.style.position = 'absolute';
      picker.style.top = Math.random() * (container.offsetHeight - 10) + 'px';
      picker.style.left = Math.random() * (container.offsetWidth - 10) + 'px';
      picker.innerText = attr.short; // + group[0];
      picker.title = attr.title;
      picker.attr = attr;
      picker.addEventListener('mousedown', (event) => {
        current_picker = picker;
      });
      picker.get_val = () => [
        //picker.offsetLeft / (container.offsetWidth - 10), picker.offsetTop / (container.offsetHeight - 10)
        parseFloat(picker.style.left) / (container.offsetWidth - 10), parseFloat(picker.style.top) / (container.offsetHeight - 10)
      ];
      picker.set_val = ([a, b]) => {
        picker.style.left = a * (container.offsetWidth - 10) + 'px';
        picker.style.top = b * (container.offsetHeight - 10) + 'px';
      }
      container.appendChild(picker);
      result.pickers.push(picker);
      picker.style.display = picker.group == group_order[0] ? 'block' : 'none';
    });
  });
  //groups_container.firstChild.onclick();

  document.addEventListener('mousemove', (event) => {
    if (current_picker) {
      let x = clamp(event.clientX - container.parentElement.offsetLeft - (current_picker.offsetWidth / 2), 0, container.offsetWidth - 10);
      let y = clamp(event.clientY - container.parentElement.offsetTop - (current_picker.offsetHeight / 2), 0, container.offsetHeight - 10);
      current_picker.className = 'selected';
      current_picker.style.top = y + 'px';
      current_picker.style.left = x + 'px';
      result.onchange(current_picker.group, current_picker.attr.short, current_picker.get_val());
    }
  });
  document.addEventListener('mouseup', () => {
    if (current_picker) current_picker.className = 'deselected';
    current_picker = null;
  });

  result.to_object = () => {
    let res = {};
    group_order.forEach((group) => { res[group] = {} })
    result.pickers.forEach((picker) => {
      res[picker.group][picker.attr.short] = picker.get_val();
    });
    return new Stats(res);
  };

  result.from_object = (stats) => {
    result.pickers.forEach((picker) => {
      picker.set_val(stats[picker.group][picker.attr.short]);
    });
  }

  result.select_in_n = (n) => () => document.getElementById(group_order[(group_order.indexOf(current_group) + n + group_order.length) % group_order.length]).onclick();
  return result;
  */
}
