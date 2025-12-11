(function (global) {
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  const resourceLimits = {
    salud: { min: 0, max: 100 },
    energia: { min: 0, max: 100000 },
    hambre: { min: 0, max: 100000 },
    estres: { min: 0, max: 120 },
    progreso: { min: 0, max: 150 },
  };

  const defaultState = {
    turno: 0,
    location: 'pasillo_principal',
    log: [],
    resources: {
      salud: 100,
      energia: 90,
      hambre: 10,
      estres: 20,
      progreso: 0,
    },
    stats: {
      ataque: 6,
      defensa: 3,
      precision: 0.75,
    },
    inventory: {
      snacks: 2,
      llaves: 0,
      tarjetaCPD: false,
      planoAzotea: false,
      pistasEscape: 0,
      weapons: ['lapicero'],
      armors: ['sudadera_base'],
      materiales: 0,
    },
    equipment: {
      weapon: 'lapicero',
      armor: 'sudadera_base',
    },
    flags: {
      escapeRumor: false,
      escapeReady: false,
      codigoCPD: false,
      juegoTerminado: false,
      derrota: false,
      finalTipo: null,
      modoRapido: false,
      campamentoPatio: false,
      allyNerea: false,
      allyRaul: false,
      allyYoli: false,
    },
    allies: [],
    defeatedBosses: {},
    visitedRooms: {
      pasillo_principal: true,
    },
  };

  function normalizeState(source) {
    const clone = deepClone(source);
    clone.inventory = clone.inventory || {};
    if (!Array.isArray(clone.inventory.weapons) || clone.inventory.weapons.length === 0) {
      clone.inventory.weapons = ['lapicero'];
    } else if (!clone.inventory.weapons.includes('lapicero')) {
      clone.inventory.weapons.unshift('lapicero');
    }
    if (!Array.isArray(clone.inventory.armors) || clone.inventory.armors.length === 0) {
      clone.inventory.armors = ['sudadera_base'];
    } else if (!clone.inventory.armors.includes('sudadera_base')) {
      clone.inventory.armors.unshift('sudadera_base');
    }
    if (typeof clone.inventory.materiales !== 'number') {
      clone.inventory.materiales = 0;
    }
    clone.equipment = clone.equipment || { weapon: 'lapicero', armor: 'sudadera_base' };
    if (!clone.equipment.weapon) clone.equipment.weapon = 'lapicero';
    if (!clone.equipment.armor) clone.equipment.armor = 'sudadera_base';
    clone.flags = clone.flags || {};
    if (typeof clone.flags.campamentoPatio !== 'boolean') clone.flags.campamentoPatio = false;
    if (typeof clone.flags.allyNerea !== 'boolean') clone.flags.allyNerea = false;
    if (typeof clone.flags.allyRaul !== 'boolean') clone.flags.allyRaul = false;
    if (typeof clone.flags.allyYoli !== 'boolean') clone.flags.allyYoli = false;
    clone.log = clone.log || [];
    clone.allies = clone.allies || [];
    clone.defeatedBosses = clone.defeatedBosses || {};
    clone.visitedRooms = clone.visitedRooms || { pasillo_principal: true };
    return clone;
  }

  let state = normalizeState(defaultState);

  const GameState = {
    resetState(options = {}) {
      state = normalizeState(defaultState);
      if (options.plus) {
        state.resources.progreso = 10;
        state.inventory.snacks += 1;
        state.stats.ataque += 1;
        GameState.addLogEntry('Empiezas una Nueva Partida+ con rumores frescos de cafetería.');
      }
    },

    setState(newState) {
      state = normalizeState(newState);
    },

    getState() {
      return state;
    },

    getLimits() {
      return resourceLimits;
    },

    changeResource(resource, delta) {
      if (!(resource in state.resources)) return state.resources[resource];
      const limits = resourceLimits[resource] || { min: -Infinity, max: Infinity };
      const next = Math.max(limits.min, Math.min(limits.max, state.resources[resource] + delta));
      state.resources[resource] = Number(next.toFixed(2));
      if (resource === 'salud' && state.resources.salud <= 0) {
        GameState.flagDefeat('Entre la enfermería y la burocracia te quedaste en el sitio.');
      }
      return state.resources[resource];
    },

    setResource(resource, value) {
      if (!(resource in state.resources)) return;
      const limits = resourceLimits[resource] || { min: -Infinity, max: Infinity };
      state.resources[resource] = Math.max(limits.min, Math.min(limits.max, value));
    },

    spendEnergy(amount) {
      if (state.resources.energia < amount) return false;
      state.resources.energia = Math.max(0, state.resources.energia - amount);
      return true;
    },

    addItem(key, amount = 1) {
      if (!(key in state.inventory)) state.inventory[key] = 0;
      state.inventory[key] += amount;
      GameState.ensureEscapeReady();
      return state.inventory[key];
    },

    consumeItem(key, amount = 1) {
      if (!(key in state.inventory)) return false;
      if (state.inventory[key] < amount) return false;
      state.inventory[key] -= amount;
      GameState.ensureEscapeReady();
      return true;
    },

    setInventoryFlag(key, value) {
      state.inventory[key] = value;
      GameState.ensureEscapeReady();
    },

    unlockGear(type, id) {
      const key = type === 'weapon' ? 'weapons' : 'armors';
      if (!Array.isArray(state.inventory[key])) {
        state.inventory[key] = [];
      }
      if (!state.inventory[key].includes(id)) {
        state.inventory[key].push(id);
      }
      if (!state.equipment[type]) {
        state.equipment[type] = id;
      }
    },

    hasGear(type, id) {
      const key = type === 'weapon' ? 'weapons' : 'armors';
      return state.inventory[key]?.includes(id);
    },

    listGear(type) {
      const key = type === 'weapon' ? 'weapons' : 'armors';
      return [...(state.inventory[key] || [])];
    },

    equipGear(type, id) {
      if (!GameState.hasGear(type, id)) return false;
      state.equipment[type] = id;
      return true;
    },

    getEquipmentDetails() {
      const weapon = global.Items?.getWeapon(state.equipment.weapon) || null;
      const armor = global.Items?.getArmor(state.equipment.armor) || null;
      return { weapon, armor };
    },

    getEffectiveStats() {
      const effective = deepClone(state.stats);
      const { weapon, armor } = GameState.getEquipmentDetails();
      if (weapon) {
        effective.ataque += weapon.bonusAtaque;
        effective.precision += weapon.bonusPrecision;
      }
      if (armor) {
        effective.defensa += armor.bonusDefensa;
      }
      return effective;
    },

    addLogEntry(text) {
      state.log.push({ turno: state.turno, text });
      if (state.log.length > 120) {
        state.log = state.log.slice(-120);
      }
    },

    clearLog() {
      state.log = [];
    },

    addAlly(allyId) {
      if (state.allies.includes(allyId)) return false;
      state.allies.push(allyId);
      if (global.Characters && global.Characters.applyAllyBonus) {
        global.Characters.applyAllyBonus(state, allyId);
      }
      return true;
    },

    hasAlly(allyId) {
      return state.allies.includes(allyId);
    },

    setFlag(flag, value = true) {
      state.flags[flag] = value;
    },

    getFlag(flag) {
      return state.flags[flag];
    },

    registerRoomVisit(roomId) {
      state.visitedRooms[roomId] = true;
    },

    hasVisited(roomId) {
      return Boolean(state.visitedRooms[roomId]);
    },

    markBossDefeated(id) {
      state.defeatedBosses[id] = true;
    },

    isBossAlive(id) {
      return !state.defeatedBosses[id];
    },

    applyEndOfTurn({ hunger = 4, stress = 0 } = {}) {
      state.turno += 1;
      GameState.changeResource('hambre', hunger);
      if (stress !== 0) GameState.changeResource('estres', stress);

      if (state.resources.hambre >= 80) {
        GameState.changeResource('energia', -5);
      }
      if (state.resources.hambre >= 100) {
        GameState.changeResource('salud', -5);
      }
      if (state.resources.estres >= 95) {
        GameState.changeResource('energia', -3);
      }
      if (state.flags.allyMiriam) {
        GameState.changeResource('salud', 2);
        GameState.changeResource('estres', -1);
      }
      if (state.flags.allyYoli) {
        GameState.changeResource('hambre', -10);
      }
    },

    flagVictory(type) {
      state.flags.juegoTerminado = true;
      state.flags.finalTipo = type;
    },

    flagDefeat(reason) {
      if (state.flags.juegoTerminado) return;
      state.flags.juegoTerminado = true;
      state.flags.derrota = true;
      GameState.addLogEntry(reason || 'Te han pillado copiando. Adiós.');
    },

    toggleFastMode(value) {
      state.flags.modoRapido = value;
    },

    ensureEscapeReady() {
      const inv = state.inventory;
      if (inv.tarjetaCPD && inv.planoAzotea && inv.llaves >= 1) {
        state.flags.escapeReady = true;
      }
    },
  };

  global.GameState = GameState;
})(window);
