function create_pickers(attributes, group_order) {
  let result = {pickers: [], onchange: () => null};
  let container = document.getElementById('picker');
  let groups_container = document.getElementById('groups');
  let current_picker;

  group_order.forEach((group) => {
    let elem = document.createElement('span');
    elem.innerText = group;
    elem.id = group;
    elem.className = group == group_order[0] ? 'selected' : 'deselected';
    elem.onclick = () => result.pickers.forEach((picker) => {
      picker.style.display = picker.group == group ? 'block' : 'none';
      group_order.forEach((gr_name) => {
        document.getElementById(gr_name).className = gr_name == group ? 'selected' : 'deselected';
      });
    });
    groups_container.appendChild(elem);
    attributes[group].forEach((attr) => {
      let picker = document.createElement('div');
      picker.group = group;
      picker.style.position = 'absolute';
      picker.style.top = attr.default_x || 0;
      picker.style.left = attr.default_y || 0;
      picker.innerText = attr.short;
      picker.title = attr.title;
      picker.attr = attr;
      picker.addEventListener('mousedown', (event) => {
        current_picker = picker;
      });
      container.appendChild(picker);
      result.pickers.push(picker);
      picker.style.display = picker.group == group_order[0] ? 'block' : 'none';
    });
  });

  container.addEventListener('mousemove', (event) => {
    if (current_picker) {
      let x = clamp(event.clientX - container.parentElement.offsetLeft - (current_picker.offsetWidth / 2), 0, container.offsetWidth - 10);
      let y = clamp(event.clientY - container.parentElement.offsetTop - (current_picker.offsetHeight / 2), 0, container.offsetHeight - 10);
      current_picker.style.top = y + 'px';
      current_picker.style.left = x + 'px';
      result.onchange(current_picker.attr, x, y);
    }
  });
  container.addEventListener('mouseup', () => {
    current_picker = null;
  });
  return result;
}

let attrs = [
    {
      short: 'Rn',
      title: 'Range'
    },
    {
      short: 'Pw',
      title: 'Power'
    },
    {
      short: 'Ef',
      title: 'Efficiency'
    }
  ];

create_pickers({
  Attack: attrs,
  Mine: attrs,
  Construct: attrs,
  Misc: [
    {
      short: 'Ac',
      title: 'Acceleration'
    },
    {
      short: 'De',
      title: 'Defence'
    },
    {
      short: 'Cp',
      title: 'Capacity'
    },
    {
      short: 'Tr',
      title: 'Transfer'
    }
  ]
}, ['Attack', 'Mine', 'Construct', 'Misc']);
