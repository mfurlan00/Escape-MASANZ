(function (global) {
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
  let currentCombat = null;

  function ensureCombat() {
    if (!currentCombat) throw new Error('No hay combate activo');
  }

  function describeReward(reward) {
    if (!reward) return [];
    const logs = [];
    Object.entries(reward).forEach(([key, value]) => {
      if (key in global.GameState.getState().resources) {
        global.GameState.changeResource(key, value);
        logs.push(`Recurso ${key} ${value >= 0 ? '+' : ''}${value}.`);
      } else if (key === 'tarjetaCPD' && value) {
        global.GameState.setInventoryFlag('tarjetaCPD', true);
        logs.push('Obtienes una tarjeta magnética del CPD.');
      }
    });
    return logs;
  }

  function enemyAttack() {
    const logs = [];
    const state = global.GameState.getState();
    const stats = global.GameState.getEffectiveStats();
    const enemy = currentCombat.enemy;
    if (enemy.saludActual <= 0) return { logs };
    const precision = enemy.precision;
    const hit = Math.random() < precision;
    if (!hit) {
      logs.push(`${enemy.nombre} falla su ataque.`);
      currentCombat.playerGuard = false;
      return { logs };
    }
    let extra = 0;
    if (enemy.effect) {
      extra += enemy.effect(state);
    }
    let damage = Math.max(1, enemy.ataque + extra - stats.defensa + randBetween(-1, 2));
    if (currentCombat.playerGuard) {
      damage = Math.ceil(damage / 2);
      currentCombat.playerGuard = false;
      logs.push('Reduces parte del golpe gracias a tu guardia.');
    }
    if (state.flags.allyIker && Math.random() < 0.2) {
      logs.push('Iker te empuja a tiempo y esquivas el ataque.');
      damage = 0;
    }
    if (damage > 0) {
      global.GameState.changeResource('salud', -damage);
      logs.push(`${enemy.nombre} te golpea por ${damage} de daño.`);
    }
    if (enemy.debuff) {
      currentCombat.precisionPenalty = (currentCombat.precisionPenalty || 0) + enemy.debuff;
      logs.push('La burocracia te nubla la mente (-precisión temporal).');
    }
    return { logs };
  }

  function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function resolveVictory() {
    const enemy = currentCombat.enemy;
    const logs = [`Derrotas a ${enemy.nombre}.`];
    const rewardLogs = describeReward(enemy.recompensa);
    logs.push(...rewardLogs);
    global.GameState.markBossDefeated(enemy.id);
    currentCombat = null;
    return { logs, victory: true };
  }

  function resolveDefeat() {
    currentCombat = null;
    return { logs: ['Caes derrotado. La FP no perdona.'], defeat: true };
  }

  const Combat = {
    start(enemyId) {
      const template = global.Characters.getEnemy(enemyId);
      if (!template) return null;
      currentCombat = {
        enemyId,
        enemy: Object.assign(deepClone(template), { saludActual: template.salud }),
        playerGuard: false,
        precisionPenalty: 0,
      };
      return { enemy: currentCombat.enemy };
    },

    isActive() {
      return Boolean(currentCombat);
    },

    getState() {
      return currentCombat;
    },

    playerAttack() {
      ensureCombat();
      const logs = [];
      const state = global.GameState.getState();
      const stats = global.GameState.getEffectiveStats();
      const playerPrecision = Math.max(0.3, stats.precision - (currentCombat.precisionPenalty || 0));
      let hit = Math.random() < playerPrecision;
      if (currentCombat.enemy.evadeChance && Math.random() < currentCombat.enemy.evadeChance) {
        hit = false;
        logs.push(`${currentCombat.enemy.nombre} esquiva con agilidad.\n`);
      }
      if (hit) {
        let damage = Math.max(2, stats.ataque + randBetween(-1, 3) - currentCombat.enemy.defensa);
        logs.push(`Atacas e infliges ${damage} de daño.`);
        currentCombat.enemy.saludActual -= damage;
      } else {
        logs.push('Fallaste el ataque.');
      }
      if (currentCombat.enemy.saludActual <= 0) {
        return resolveVictory();
      }
      const enemyResult = enemyAttack();
      logs.push(...enemyResult.logs);
      if (global.GameState.getState().flags.derrota) {
        return resolveDefeat();
      }
      return { logs };
    },

    playerDefend() {
      ensureCombat();
      currentCombat.playerGuard = true;
      const logs = ['Te pones en guardia.'];
      const enemyResult = enemyAttack();
      logs.push(...enemyResult.logs);
      if (global.GameState.getState().flags.derrota) {
        return resolveDefeat();
      }
      return { logs };
    },

    attemptEscape() {
      ensureCombat();
      const logs = [];
      const state = global.GameState.getState();
      const baseChance = 0.35 + (state.flags.allyIker ? 0.2 : 0);
      if (Math.random() < baseChance) {
        logs.push('Logras escapar del combate.');
        currentCombat = null;
        return { logs, fled: true };
      }
      logs.push('Intentas huir pero el enemigo te alcanza.');
      const enemyResult = enemyAttack();
      logs.push(...enemyResult.logs);
      if (state.flags.derrota) {
        return resolveDefeat();
      }
      return { logs };
    },

    endCombat() {
      currentCombat = null;
    },
  };

  global.Combat = Combat;
})(window);
