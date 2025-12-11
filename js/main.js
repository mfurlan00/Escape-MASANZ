(function (global) {
  let currentEvent = null;

  function addLog(text) {
    global.GameState.addLogEntry(text);
    const state = global.GameState.getState();
    global.UI.appendLog(text, state.turno);
  }

  function updateUI() {
    const state = global.GameState.getState();
    global.UI.render(state);
  }

  function completeTurn(modifiers) {
    global.GameState.applyEndOfTurn(modifiers);
    updateUI();
    checkForCourseEnding();
  }

  function presentEvent(event) {
    currentEvent = event;
    addLog(`[${event.title}] ${event.description}`);
    const actions = event.options.map((option) => ({
      label: option.label,
      onClick: () => handleEventOption(option),
    }));
    if (event.options.length === 0) {
      actions.push({ label: 'Continuar', onClick: showIdleActions });
    }
    global.UI.setActions(actions);
  }

  function handleEventOption(option) {
    if (!option || !option.handler) return;
    const result = option.handler() || {};
    if (result.logs) {
      result.logs.forEach((log) => addLog(log));
    }

    if (result.startCombat) {
      startCombat(result.startCombat);
      return;
    }

    if (result.triggerEscape) {
      handleEscapeEnding();
      return;
    }

    if (result.nextEvent) {
      presentEvent(result.nextEvent);
      return;
    }

    if (result.endTurn !== false) {
      completeTurn();
    } else {
      updateUI();
    }

    if (!global.GameState.getState().flags.juegoTerminado) {
      showIdleActions();
    } else {
      showEndGameActions();
    }
  }

  function startCombat(enemyId) {
    const info = global.Combat.start(enemyId);
    if (!info) {
      addLog('No se pudo iniciar el combate.');
      showIdleActions();
      return;
    }
    addLog(`¡Comienza el combate contra ${info.enemy.nombre}! ${info.enemy.habilidad}`);
    showCombatActions();
  }

  function handleCombat(action) {
    let result = null;
    switch (action) {
      case 'attack':
        result = global.Combat.playerAttack();
        break;
      case 'defend':
        result = global.Combat.playerDefend();
        break;
      case 'flee':
        result = global.Combat.attemptEscape();
        break;
      default:
        break;
    }
    if (!result) return;
    if (result.logs) result.logs.forEach((log) => addLog(log));

    if (result.victory) {
      addLog('Ganas el combate.');
      completeTurn({ hunger: 6, stress: 4 });
      showIdleActions();
      return;
    }
    if (result.defeat || global.GameState.getState().flags.derrota) {
      handleDefeat();
      return;
    }
    if (result.fled) {
      completeTurn({ hunger: 5, stress: 6 });
      showIdleActions();
      return;
    }
    showCombatActions();
  }

  function showCombatActions() {
    const enemy = global.Combat.getState().enemy;
    updateUI();
    global.UI.setActions([
      { label: `Atacar (${enemy.saludActual}/${enemy.salud})`, onClick: () => handleCombat('attack') },
      { label: 'Defenderse', onClick: () => handleCombat('defend') },
      { label: 'Intentar huir', onClick: () => handleCombat('flee') },
    ]);
  }

  function showIdleActions() {
    const state = global.GameState.getState();
    currentEvent = null;
    if (state.flags.juegoTerminado) {
      showEndGameActions();
      return;
    }
    const actions = [];
    actions.push({
      label: 'Explorar la sala',
      disabled: state.resources.energia < 10,
      onClick: handleExplore,
    });
    actions.push({ label: 'Moverse a otra sala', onClick: handleMove });
    actions.push({ label: 'Estudiar', onClick: handleStudy });
    actions.push({ label: 'Descansar un rato', onClick: handleRest });
    actions.push({
      label: `Comer snack (${state.inventory.snacks || 0})`,
      disabled: (state.inventory.snacks || 0) <= 0,
      onClick: handleEat,
    });
    if (state.location === 'patio') {
      if (!state.flags.campamentoPatio) {
        actions.push({
          label: 'Montar campamento',
          disabled: state.resources.energia < 15 || (state.inventory.materiales || 0) < 1,
          onClick: handleCampBuild,
        });
      } else {
        actions.push({
          label: 'Descansar en el campamento',
          onClick: handleCampRest,
        });
      }
    }
    actions.push({ label: 'Gestionar equipo', onClick: handleManageGear });
    global.UI.setActions(actions);
    updateUI();
  }

  function handleExplore() {
    const state = global.GameState.getState();
    let baseCost = state.flags.allyPablo ? 8 : 12;
    if (state.flags.allyNerea) {
      baseCost = Math.max(5, baseCost - 2);
    }
    if (!global.GameState.spendEnergy(baseCost)) {
      addLog('Tus piernas dicen "no". Necesitas energía.');
      updateUI();
      return;
    }
    const roomId = state.location;
    const event = global.Events.getRandomEvent(roomId);
    if (!event) {
      addLog('Nada digno de mencionar ocurre.');
      completeTurn();
      showIdleActions();
      return;
    }
    presentEvent(event);
  }

  function handleMove() {
    const neighbors = global.MapManager.getNeighbors();
    if (!neighbors.length) {
      addLog('No hay salidas claras desde aquí.');
      return;
    }
    const actions = neighbors.map((room) => ({
      label: `Ir a ${room.nombre}`,
      onClick: () => {
        const state = global.GameState.getState();
        let moveCost = state.flags.allyPablo ? 4 : 6;
        if (state.flags.allyNerea) {
          moveCost = Math.max(3, moveCost - 1);
        }
        if (!global.GameState.spendEnergy(moveCost)) {
          addLog('Tu cuerpo pide reposo antes de moverse.');
          showIdleActions();
          return;
        }
        const result = global.MapManager.moveTo(room.id);
        if (!result.ok) {
          addLog(result.message);
        } else {
          addLog(`Llegas a ${room.nombre}.`);
          completeTurn({ hunger: 5, stress: 2 });
        }
        showIdleActions();
      },
    }));
    actions.push({ label: 'Cancelar', onClick: showIdleActions });
    global.UI.setActions(actions);
  }

  function handleStudy() {
    const state = global.GameState.getState();
    const cost = state.flags.allyPablo ? 10 : 15;
    if (!global.GameState.spendEnergy(cost)) {
      addLog('Intentas estudiar pero te quedas dormido encima de los apuntes.');
      updateUI();
      return;
    }
    global.GameState.changeResource('progreso', randBetween(12, 18));
    global.GameState.changeResource('estres', randBetween(4, 8));
    addLog('Estudias con disciplina cuestionable pero ganas progreso.');
    completeTurn({ hunger: 6, stress: 2 });
    showIdleActions();
  }

  function handleRest() {
    const state = global.GameState.getState();
    const gain = state.flags.allyRaul ? 55 : 35;
    global.GameState.changeResource('energia', gain);
    global.GameState.changeResource('estres', -15);
    global.GameState.changeResource('hambre', 5);
    addLog('Descansas en cualquier silla disponible. La vida mejora un poco.');
    completeTurn({ hunger: 2, stress: -3 });
    showIdleActions();
  }

  function handleEat() {
    if (!global.GameState.consumeItem('snacks', 1)) {
      addLog('No tienes snacks. Hora de saquear el comedor.');
      showIdleActions();
      return;
    }
    global.GameState.changeResource('hambre', -30);
    global.GameState.changeResource('energia', 10);
    addLog('El snack digno del FP te devuelve la vida.');
    completeTurn({ hunger: 1, stress: -2 });
    showIdleActions();
  }

  function handleManageGear() {
    showGearManagementMenu();
  }

  function showGearManagementMenu() {
    const state = global.GameState.getState();
    const actions = [];
    actions.push({ label: '--- Armas disponibles ---', disabled: true, onClick: () => {} });
    global.GameState.listGear('weapon').forEach((id) => {
      const weapon = global.Items.getWeapon(id) || { nombre: id, bonusAtaque: 0 };
      actions.push({
        label: `${state.equipment.weapon === id ? '✔ ' : ''}${weapon.nombre} (+${weapon.bonusAtaque} ATQ)`,
        onClick: () => {
          global.GameState.equipGear('weapon', id);
          addLog(`Equipas ${weapon.nombre}.`);
          updateUI();
          showGearManagementMenu();
        },
      });
    });
    actions.push({ label: '--- Armaduras disponibles ---', disabled: true, onClick: () => {} });
    global.GameState.listGear('armor').forEach((id) => {
      const armor = global.Items.getArmor(id) || { nombre: id, bonusDefensa: 0 };
      actions.push({
        label: `${state.equipment.armor === id ? '✔ ' : ''}${armor.nombre} (+${armor.bonusDefensa} DEF)`,
        onClick: () => {
          global.GameState.equipGear('armor', id);
          addLog(`Te colocas ${armor.nombre}.`);
          updateUI();
          showGearManagementMenu();
        },
      });
    });
    actions.push({ label: 'Volver', onClick: showIdleActions });
    global.UI.setActions(actions);
  }

  function handleCampBuild() {
    const state = global.GameState.getState();
    if (state.location !== 'patio') {
      addLog('Solo puedes montar el campamento en el patio.');
      return;
    }
    if (state.inventory.materiales < 1) {
      addLog('Necesitas materiales para levantar el campamento. Rebusca en el taller.');
      return;
    }
    if (!global.GameState.spendEnergy(15)) {
      addLog('Estás exhausto. No consigues ni clavar una estaca.');
      return;
    }
    global.GameState.consumeItem('materiales', 1);
    global.GameState.setFlag('campamentoPatio', true);
    addLog('Levantas un campamento discreto en el patio. Ahora tienes base propia.');
    completeTurn({ hunger: 5, stress: -8 });
    showIdleActions();
  }

  function handleCampRest() {
    const state = global.GameState.getState();
    if (state.location !== 'patio' || !state.flags.campamentoPatio) {
      addLog('Necesitas estar en tu campamento del patio.');
      showIdleActions();
      return;
    }
    const gain = state.flags.allyRaul ? 65 : 35;
    global.GameState.changeResource('energia', gain);
    global.GameState.changeResource('estres', -20);
    global.GameState.changeResource('hambre', 6);
    addLog('Descansas en tu campamento. El viento del patio hasta suena relajante.');
    completeTurn({ hunger: 3, stress: -5 });
    showIdleActions();
  }

  function handleEscapeEnding() {
    global.GameState.flagVictory('escape');
    addLog('Escapas por la salida de emergencia. El viento huele a libertad y café barato.');
    showEndGameActions();
  }

  function handleDefeat() {
    addLog('Has perdido la pelea. Repetirás curso. Tus esfuerzos no han sido suficientes.');
    global.GameState.flagDefeat('Has perdido la pelea. Repetirás curso. Tus esfuerzos no han sido suficientes.');
    showEndGameActions(true);
  }

  function showEndGameActions(includePlus = false) {
    global.UI.setActions([
      { label: 'Nueva partida', onClick: () => startNewGame(false) },
      { label: 'Nueva partida+', onClick: () => startNewGame(true) },
    ]);
  }

  function checkForCourseEnding() {
    const state = global.GameState.getState();
    if (!state.flags.juegoTerminado && state.resources.progreso >= 120 && state.turno >= 40) {
      global.GameState.flagVictory('curso');
      addLog('Aguantas hasta el final del curso y apruebas todo. Te licencias del FP.');
      showEndGameActions();
    }
  }

  function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function handleSave() {
    const ok = global.StorageManager.save();
    addLog(ok ? 'Partida guardada en localStorage.' : 'No se pudo guardar.');
  }

  function handleLoad() {
    const data = global.StorageManager.load();
    if (!data) {
      addLog('No hay partida guardada.');
      return;
    }
    global.UI.renderLog(global.GameState.getState().log);
    updateUI();
    addLog('Partida cargada. Donde lo dejaste, seguías cansado.');
    showIdleActions();
  }

  function handleDelete() {
    if (!confirm('¿Seguro que quieres borrar tu guardado?')) return;
    global.StorageManager.clear();
    addLog('Se borra el guardado. La FP no perdona el olvido.');
  }

  function startNewGame(isPlus) {
    global.Combat.endCombat();
    global.GameState.resetState({ plus: isPlus });
    global.GameState.clearLog();
    global.UI.renderLog([]);
    const state = global.GameState.getState();
    addLog('Te despiertas en el centro María Ana Sanz sin recordar cómo llegaste.');
    updateUI();
    showIdleActions();
  }

  document.addEventListener('DOMContentLoaded', () => {
    global.UI.init({
      onSave: handleSave,
      onLoad: handleLoad,
      onDelete: handleDelete,
      onNewGame: () => startNewGame(false),
    });
    const state = global.GameState.getState();
    global.UI.render(state);
    global.UI.renderLog(state.log);
    addLog('Bienvenido a Masanz Dungeons.');
    showIdleActions();
  });
})(window);
