function create_pickers(attributes, group_order) {
  let result = {pickers: [], onchange: () => null};
  let container = document.getElementById('picker');
  let groups_container = document.getElementById('groups');
  let current_picker;

  group_order.forEach((group) => {
    let elem = document.createElement('span');
    elem.innerText = group;
    elem.id = group;
    if (group == group_order[0]) elem.className = 'selected';
    elem.onclick = () => result.pickers.forEach((picker) => {
      picker.style.display = picker.attr.group == group ? 'block' : 'none';
      group_order.forEach((gr_name) => {
        document.getElementById(gr_name).className = gr_name == group ? 'selected' : '';
      });
    });
    groups_container.appendChild(elem);
  });

  attributes.forEach((attr) => {
    let picker = document.createElement('div');
    picker.style.position = 'absolute';
    picker.style.top = 0;
    picker.style.left = 0;
    picker.innerText = attr.short;
    picker.title = attr.title;
    picker.attr = attr;
    picker.addEventListener('mousedown', (event) => {
      current_picker = picker;
    });
    container.appendChild(picker);
    result.pickers.push(picker);
    picker.style.display = attr.group == group_order[0] ? 'block' : 'none';
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

create_pickers([
  {
    short: 'Pw',
    title: 'Power',
    group: 'Things'
  },
  {
    short: 'De',
    title: 'Defense',
    group: 'Stuff'
  },
  {
    short: 'Rn',
    title: 'Range',
    group: 'Things'
  }
], ['Things', 'Stuff'])
