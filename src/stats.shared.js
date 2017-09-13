let Stats;
{
  let norm_scaled_value = (value) => (1/(1-value)-1);
  let norm_unscaled_value = (value) => (1-1/(value+1));

  Stats = function(norm_stats) {
    this.norm_stats = norm_stats;
    this.attack = {
      range: 60*norm_scaled_value(norm_stats.attack.range),
      power: 5*norm_scaled_value(norm_stats.attack.power),
      efficiency: norm_unscaled_value(0.1*norm_scaled_value(norm_stats.attack.efficiency)),
    }
    this.mine = {
      range: 80*norm_scaled_value(norm_stats.mine.range),
      power: 7*norm_scaled_value(norm_stats.mine.power),
      efficiency: norm_unscaled_value(30*norm_scaled_value(norm_stats.mine.efficiency)),
    }
    this.construct = {
      range: 30*norm_scaled_value(norm_stats.construct.range),
      power: 4*norm_scaled_value(norm_stats.construct.power),
      efficiency: norm_unscaled_value(40*norm_scaled_value(norm_stats.construct.efficiency)),
    }
    this.misc = {
      acceleration: norm_scaled_value(norm_stats.misc.acceleration),
      capacity: 300*norm_scaled_value(norm_stats.misc.capacity),
      defence: norm_unscaled_value(3*norm_scaled_value(norm_stats.misc.defence)),
      'transfer range': 70*norm_scaled_value(norm_stats.misc['transfer range']),
    }
    this.cost = 100 * norm_stats.attack.range * norm_stats.attack.power * (norm_stats.attack.efficiency + 1) +
                100 * norm_stats.mine.range * norm_stats.mine.power * norm_stats.mine.efficiency +
                100 * norm_stats.construct.range * norm_stats.construct.power * norm_stats.construct.efficiency +
                100 * norm_stats.misc.acceleration +
                100 * norm_stats.misc.capacity +
                100 * norm_stats.misc.defence +
                100 * norm_stats.misc['transfer range'];
  }

  Stats.prototype.serialize = function() {
    return this.norm_stats;
  }
}
