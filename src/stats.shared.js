let Stats;
{
  Stats = function(norm_stats) {
    this.norm_stats = norm_stats;
    this.attack = {
      range: 1000 * norm_stats.attack.range,
      power: 15 * norm_stats.attack.power,
      efficiency: norm_stats.attack.efficiency,
    }
    this.mine = {
      range: 500 * norm_stats.mine.range,
      power: 20 * norm_stats.mine.power,
      efficiency: norm_stats.mine.efficiency,
    }
    this.construct = {
      range: 350 * norm_stats.construct.range,
      power: 20 * norm_stats.construct.power,
      efficiency: norm_stats.construct.efficiency,
    }
    this.misc = {
      acceleration: 4 * norm_stats.misc.acceleration,
      capacity: 1000 * norm_stats.misc.capacity,
      defence: 1-norm_stats.misc.defence,
      'transfer range': 2000 * norm_stats.misc['transfer range'],
    }
    this.cost = 100 * norm_stats.attack.range * norm_stats.attack.power +
                500 * norm_stats.attack.efficiency +
                100 * norm_stats.mine.range * norm_stats.mine.power +
                100 * norm_stats.mine.efficiency +
                100 * norm_stats.construct.range * norm_stats.construct.power +
                150 * norm_stats.construct.efficiency +
                100 * norm_stats.misc.acceleration +
                100 * norm_stats.misc.capacity +
                100 * norm_stats.misc.defence +
                100 * norm_stats.misc['transfer range'];
  }

  Stats.prototype.serialize = function() {
    return this.norm_stats;
  }
}
