function create_selected_stats(el, picker_stats) {
  let statsers = [];
  let make_statser = () => {
    let ob = statsers.pop();
    if (ob) return ob;
    let container = ce('div');
    container.className = 'stat-cont';
    let added = false;
    ob = {
      visible: (yes) => {
        if (yes != added) {
          if (yes) {
            el.ac(container);
          } else {
            el.removeChild(container);
          }
          added = yes;
        }
      }
    };
    let health = ce('div');
    health.sr({ className: 'stat' });
    ob.health = (_, unit) => {
      health.style.background = unit.health_color();
      health.style.width = (unit.health / unit.stats.cost * 100) + '%';
    }
    container.ac(health)
    let hold = ce('div');
    hold.sr({ className: 'stat' });
    hold.style.background = '#0087CF';
    ob.hold = (_, unit) => {
      hold.style.width = (unit.hold / unit.stats.misc.capacity * 100) + '%';
    }
    container.ac(hold);
    picker_stats.forEach((type) => {
      ob[type.name] = {};
      type.stats.forEach((attr) => {
        let elem = ce('div')
        elem.sr({ className: 'stat' })
        ob[type.name][attr] = (value) => {elem.style.width = (value * 100) + '%';}
        container.ac(elem);
      });
    });
    return ob;
  };
  return {
    update: (selected) => {
      statsers.forEach((statser) => statser.visible(false));
      if (!selected) return;
      let new_statsers = [];
      selected.values().sort((a, b) => a.health - b.health).forEach(unit => {
        let statser = make_statser();
        picker_stats.forEach((type) => {
          type.stats.forEach((attr) => {
            statser[type.name][attr](unit.stats.norm_stats[type.name][attr]);
          });
        });
        statser.health(0, unit);
        statser.hold(0, unit);
        statser.visible(true);
        new_statsers.push(statser);
      });
      statsers = statsers.concat(new_statsers);
    }
  };
}
