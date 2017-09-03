function create_pickers(attributes, group_order) {
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
    elem.onclick = () => result.pickers.forEach((picker) => {
      current_group = group;
      picker.style.display = picker.group == group ? 'block' : 'none';
      group_order.forEach((gr_name) => {
        document.getElementById(gr_name).className = gr_name == group ? 'selected' : 'deselected';
      });
    });
    if (pos != 0) groups_container.appendChild(document.createTextNode(' | '));
    groups_container.appendChild(elem);
    attributes[group].forEach((attr) => {
      let picker = document.createElement('div');
      picker.group = group;
      picker.style.position = 'absolute';
      picker.style.top = Math.random() * (container.offsetHeight - 10) + 'px';
      picker.style.left = Math.random() * (container.offsetWidth - 10) + 'px';
      picker.innerText = attr.short;
      picker.title = attr.title;
      picker.attr = attr;
      picker.addEventListener('mousedown', (event) => {
        current_picker = picker;
      });
      picker.get_val = () => [
        picker.offsetLeft / (container.offsetWidth - 10), picker.offsetTop / (container.offsetHeight - 10)
      ];
      container.appendChild(picker);
      result.pickers.push(picker);
      picker.style.display = picker.group == group_order[0] ? 'block' : 'none';
    });
  });

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
  result.select_in_n = (n) => () => document.getElementById(group_order[(group_order.indexOf(current_group) + n + group_order.length) % group_order.length]).onclick();
  return result;
}
