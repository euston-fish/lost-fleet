let Stats;
{
  let norm_scaled_value = (value) => (1/(1-value)-1);
  let norm_unscaled_value = (value) => (1-1/(value+1));

  Stats = function(norm_stats) {
    this.norm_stats = norm_stats;
    this.Attack = {
      Rn: leng(norm_stats.Attack.Rn.map((v) => 60*norm_scaled_value(v))),
      Pw: norm_stats.Attack.Pw.map((v) => 5*norm_scaled_value(v)),
      Ef: norm_stats.Attack.Ef.map((v) => norm_unscaled_value(0.1*norm_scaled_value(v)))
    };
    this.Mine = {
      Rn: leng(norm_stats.Mine.Rn.map((v) => 80*norm_scaled_value(v))),
      Pw: norm_stats.Mine.Pw.map((v) => 7*norm_scaled_value(v)),
      Ef: norm_stats.Mine.Ef.map((v) => norm_unscaled_value(30*norm_scaled_value(v)))
    };
    this.Construct = {
      Rn: leng(norm_stats.Construct.Rn.map((v) => 30*norm_scaled_value(v))),
      Pw: norm_stats.Construct.Pw.map((v) => 4*norm_scaled_value(v)),
      Ef: norm_stats.Construct.Ef.map((v) => norm_unscaled_value(40*norm_scaled_value(v)))
    };
    this.Misc = {
      Ac: leng(norm_stats.Misc.Ac.map((v) => norm_scaled_value(v))),
      De: norm_stats.Misc.De.map((v) => norm_unscaled_value(3*norm_scaled_value(v))),
      Cp: norm_stats.Misc.Cp.map((v) => 300*norm_scaled_value(v)),
      Tr: leng(norm_stats.Misc.Cp.map((v) => 70*norm_scaled_value(v)))
    }
    this.cost = norm_stats.values().map((group) =>
      group.values().map((values) =>
        values.map((value) => 20*norm_scaled_value(value))
      ).reduce(add)
    ).reduce(add);
  }

  Stats.prototype.serialize = function() {
    return this.norm_stats;
  }
}
