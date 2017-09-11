let create_presets = (pickers) => {
  let preset_list = el('preset_list');
  let preset_name = el('preset_name');
  let presets = {};

  let redisplay = () => {
    while (preset_list.hasChildNodes()) {
      preset_list.removeChild(preset_list.lastChild);
    }
    console.log(presets);
    for (let [name, stats] of Object.entries(presets)) {
      let preset = document.createElement('li');
      console.log(name, preset);
      preset.innerText = name;
      preset.onclick = () => {
        console.log('restoring preset...', stats);
        pickers.from_object(stats.serialize());
      }
      preset_list.appendChild(preset);
    }
  };

  preset_name.addEventListener('keydown', (event) => event.stopPropagation());
  preset_name.addEventListener('keyup', (event) => event.stopPropagation());
  preset_name.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      console.log('saving preset...');
      presets[preset_name.value] = pickers.to_object();
      preset_name.value = '';
      redisplay();
    }
  });

  return presets
};
