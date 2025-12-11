(function (global) {
  const STORAGE_KEY = 'masanzDungeonsSave';

  const StorageManager = {
    save() {
      try {
        const state = global.GameState.getState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (error) {
        console.error('Error guardando', error);
        return false;
      }
    },

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        global.GameState.setState(parsed);
        return parsed;
      } catch (error) {
        console.error('Error cargando', error);
        return null;
      }
    },

    clear() {
      localStorage.removeItem(STORAGE_KEY);
    },

    hasSave() {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    },

    key: STORAGE_KEY,
  };

  global.StorageManager = StorageManager;
})(window);
