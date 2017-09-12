let Stats;
{
  let norm_scaled_value = (value) => (1/(1-value)-1);
  let norm_unscaled_value = (value) => (1-1/(value+1));

  Stats = function(norm_stats) {
    //console.log(Object.getPrototypeOf(norm_stats));
    //console.log(Object.prototype);
    //console.log(Object.getPrototypeOf({}));
    //console.log(typeof(norm_stats));
    //console.log(norm_stats);
    this.norm_stats = norm_stats;
    this.Attack = {
      Rn: leng(Array.prototype.map.call(norm_stats.Attack.Rn, (v) => 60*norm_scaled_value(v))),
      Pw: Array.prototype.map.call(norm_stats.Attack.Pw, (v) => 5*norm_scaled_value(v)),
      Ef: Array.prototype.map.call(norm_stats.Attack.Ef, (v) => norm_unscaled_value(0.1*norm_scaled_value(v)))
    };
    this.Mine = {
      Rn: leng(Array.prototype.map.call(norm_stats.Mine.Rn, (v) => 80*norm_scaled_value(v))),
      Pw: Array.prototype.map.call(norm_stats.Mine.Pw, (v) => 7*norm_scaled_value(v)),
      Ef: Array.prototype.map.call(norm_stats.Mine.Ef, (v) => norm_unscaled_value(30*norm_scaled_value(v)))
    };
    this.Construct = {
      Rn: leng(Array.prototype.map.call(norm_stats.Construct.Rn, (v) => 30*norm_scaled_value(v))),
      Pw: Array.prototype.map.call(norm_stats.Construct.Pw, (v) => 4*norm_scaled_value(v)),
      Ef: Array.prototype.map.call(norm_stats.Construct.Ef, (v) => norm_unscaled_value(40*norm_scaled_value(v)))
    };
    this.Misc = {
      Ac: leng(Array.prototype.map.call(norm_stats.Misc.Ac, (v) => norm_scaled_value(v))),
      De: Array.prototype.map.call(norm_stats.Misc.De, (v) => norm_unscaled_value(3*norm_scaled_value(v))),
      Cp: Array.prototype.map.call(norm_stats.Misc.Cp, (v) => 300*norm_scaled_value(v)),
      Tr: leng(Array.prototype.map.call(norm_stats.Misc.Cp, (v) => 70*norm_scaled_value(v)))
    }
    this.cost = Object.values(norm_stats).map((group) =>
      Object.values(group).map((values) =>
        Array.prototype.map.call(values, (value) => 20*norm_scaled_value(value))
      ).reduce(add)
    ).reduce(add);
  }

  Stats.prototype.serialize = function() {
    return this.norm_stats;
  }
}
