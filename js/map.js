(function (global) {
  const rooms = {
    atrium: {
      id: 'atrium',
      nombre: 'Atrio de entrada',
      descripcion: 'Puertas de cristal, folletos motivacionales y eco del timbre.',
      tipo: 'neutra',
      vecinos: ['pasillo_principal', 'secretaria', 'cafeteria_nocturna'],
      eventos: ['nota_atrio', 'rumor_escape', 'aliado_luis'],
    },
    pasillo_principal: {
      id: 'pasillo_principal',
      nombre: 'Pasillo principal',
      descripcion: 'Fila infinita de taquillas y fluorescentes parpadeando.',
      tipo: 'neutra',
      vecinos: ['atrium', 'aula_informatica', 'aula_redes', 'biblioteca', 'comedor', 'enfermeria'],
      eventos: ['inspeccion', 'rumor_escape', 'snack_pasillo'],
    },
    aula_informatica: {
      id: 'aula_informatica',
      nombre: 'Aula de informática',
      descripcion: 'Ordenadores que arrancan cuando quieren y ventiladores polvorientos.',
      tipo: 'peligrosa',
      vecinos: ['pasillo_principal', 'cpd'],
      eventos: ['examen_pop', 'hallazgo_usb', 'enemigo_fernando'],
    },
    aula_redes: {
      id: 'aula_redes',
      nombre: 'Aula de redes',
      descripcion: 'Switches, cables cruzados y diagramas ilegibles.',
      tipo: 'neutra',
      vecinos: ['pasillo_principal', 'banos', 'sala_profesores'],
      eventos: ['aliado_pablo', 'inspeccion', 'hallazgo_herramientas'],
    },
    biblioteca: {
      id: 'biblioteca',
      nombre: 'Biblioteca',
      descripcion: 'Silencio sospechoso, cafetera rota y apuntes ilegibles.',
      tipo: 'segura',
      vecinos: ['pasillo_principal', 'patio', 'azotea', 'sala_profesores', 'sala_audiovisual'],
      eventos: ['estudiar_evento', 'aliado_catalufo', 'rumor_escape', 'proyecto_final'],
    },
    comedor: {
      id: 'comedor',
      nombre: 'Comedor',
      descripcion: 'Bandejas tibias y olor a sopa eterna.',
      tipo: 'segura',
      vecinos: ['pasillo_principal', 'cafeteria_nocturna', 'gimnasio', 'taller'],
      eventos: ['comida', 'descanso', 'cache_snacks'],
    },
    cafeteria_nocturna: {
      id: 'cafeteria_nocturna',
      nombre: 'Cafetería nocturna',
      descripcion: 'Luces bajas, microondas prestados y rumores frescos.',
      tipo: 'segura',
      vecinos: ['atrium', 'comedor', 'patio'],
      eventos: ['cafeteria_midnight', 'aliado_yoli', 'cache_snacks'],
    },
    gimnasio: {
      id: 'gimnasio',
      nombre: 'Gimnasio',
      descripcion: 'Pesas, colchonetas y olor a esfuerzo.',
      tipo: 'neutra',
      vecinos: ['comedor', 'patio', 'residencia_alumnos'],
      eventos: ['entrenamiento_gimnasio', 'aliado_raul', 'descanso'],
    },
    taller: {
      id: 'taller',
      nombre: 'Taller',
      descripcion: 'Herramientas colgando y ruido metálico constante.',
      tipo: 'peligrosa',
      vecinos: ['comedor', 'laboratorio_electronica', 'almacen_general'],
      eventos: ['aliado_iker', 'hallazgo_materiales', 'enemigo_inigo', 'arsenal_robotica'],
    },
    laboratorio_electronica: {
      id: 'laboratorio_electronica',
      nombre: 'Laboratorio de electrónica',
      descripcion: 'Componentes, osciloscopios y olor a estaño.',
      tipo: 'peligrosa',
      vecinos: ['taller', 'laboratorio_robotica', 'sala_audiovisual', 'cpd', 'almacen_general'],
      eventos: ['arsenal_robotica', 'hallazgo_componentes', 'apagones'],
    },
    laboratorio_robotica: {
      id: 'laboratorio_robotica',
      nombre: 'Laboratorio de robótica',
      descripcion: 'Componentes de sobra, humo de soldador y proyectos a medias.',
      tipo: 'peligrosa',
      vecinos: ['laboratorio_electronica', 'cpd', 'azotea'],
      eventos: ['arsenal_robotica', 'proyecto_robotica', 'aliado_sara'],
    },
    sala_audiovisual: {
      id: 'sala_audiovisual',
      nombre: 'Sala audiovisual',
      descripcion: 'Pizarras luminosas, focos y equipo de sonido desactualizado.',
      tipo: 'neutra',
      vecinos: ['laboratorio_electronica', 'biblioteca', 'residencia_alumnos'],
      eventos: ['armas_audiovisual', 'aliado_nerea', 'ensayo_improvisado'],
    },
    residencia_alumnos: {
      id: 'residencia_alumnos',
      nombre: 'Residencia',
      descripcion: 'Literas crujientes y posters motivacionales a medias.',
      tipo: 'segura',
      vecinos: ['sala_audiovisual', 'gimnasio', 'patio'],
      eventos: ['suenio_profetico', 'descanso', 'cache_snacks'],
    },
    almacen_general: {
      id: 'almacen_general',
      nombre: 'Almacén general',
      descripcion: 'Cajas apiladas, material confiscado y polvo histórico.',
      tipo: 'peligrosa',
      vecinos: ['taller', 'laboratorio_electronica'],
      eventos: ['almacen_recursos', 'armadura_laboratorio'],
    },
    secretaria: {
      id: 'secretaria',
      nombre: 'Secretaría',
      descripcion: 'Montañas de papeles y personas desesperadas.',
      tipo: 'peligrosa',
      vecinos: ['atrium', 'sala_profesores', 'salida_emergencia'],
      eventos: ['burocracia', 'rumor_escape', 'enemigo_fernando'],
    },
    salida_emergencia: {
      id: 'salida_emergencia',
      nombre: 'Salida de emergencia',
      descripcion: 'Puerta metálica asegurada con demasiados candados.',
      tipo: 'final',
      vecinos: ['secretaria'],
      eventos: ['escape_final'],
    },
    cpd: {
      id: 'cpd',
      nombre: 'CPD',
      descripcion: 'Sala fría llena de racks y secretos.',
      tipo: 'peligrosa',
      vecinos: ['aula_informatica', 'laboratorio_electronica', 'laboratorio_robotica'],
      eventos: ['enemigo_iniesta', 'hallazgo_cpd', 'rumor_escape', 'armadura_cpd', 'aliado_sara'],
    },
    azotea: {
      id: 'azotea',
      nombre: 'Azotea',
      descripcion: 'Vistas al skyline de Zaragoza y aire sospechosamente limpio.',
      tipo: 'neutra',
      vecinos: ['biblioteca', 'laboratorio_robotica'],
      eventos: ['hallazgo_azotea', 'descanso'],
    },
    banos: {
      id: 'banos',
      nombre: 'Baños',
      descripcion: 'Graffitis motivacionales y cisternas rebeldes.',
      tipo: 'neutra',
      vecinos: ['aula_redes', 'enfermeria'],
      eventos: ['refugio', 'inspeccion', 'aliado_miriam'],
    },
    enfermeria: {
      id: 'enfermeria',
      nombre: 'Enfermería',
      descripcion: 'Camas plegables, tiritas vintage y olor a desinfectante.',
      tipo: 'segura',
      vecinos: ['pasillo_principal', 'banos'],
      eventos: ['aliado_miriam', 'descanso', 'armadura_enfermeria'],
    },
    sala_profesores: {
      id: 'sala_profesores',
      nombre: 'Sala de profesores',
      descripcion: 'Café recalentado, cotilleos y planes secretos.',
      tipo: 'peligrosa',
      vecinos: ['biblioteca', 'aula_redes', 'secretaria'],
      eventos: ['burocracia', 'rumor_escape', 'aliado_nerea'],
    },
    patio: {
      id: 'patio',
      nombre: 'Patio',
      descripcion: 'Gaviotas agresivas pero libertad relativa.',
      tipo: 'segura',
      vecinos: ['biblioteca', 'cafeteria_nocturna', 'gimnasio', 'residencia_alumnos'],
      eventos: ['descanso', 'hallazgo_comida', 'campamento_evento'],
    },
  };

  const MapManager = {
    getCurrentRoom() {
      const state = global.GameState.getState();
      return rooms[state.location];
    },

    getRoom(id) {
      return rooms[id];
    },

    canMoveTo(id) {
      const room = MapManager.getCurrentRoom();
      return room && room.vecinos.includes(id);
    },

    moveTo(id) {
      if (!MapManager.canMoveTo(id)) {
        return { ok: false, message: 'No puedes teletransportarte sin permiso del tutor.' };
      }
      const state = global.GameState.getState();
      state.location = id;
      global.GameState.registerRoomVisit(id);
      const newRoom = rooms[id];
      global.GameState.addLogEntry(`Te desplazas a ${newRoom.nombre}.`);
      return { ok: true, room: newRoom };
    },

    getNeighbors() {
      const room = MapManager.getCurrentRoom();
      return room ? room.vecinos.map((roomId) => rooms[roomId]) : [];
    },

    getRoomEvents(id) {
      return rooms[id]?.eventos || [];
    },

    listRooms() {
      return Object.values(rooms);
    },
  };

  global.MapManager = MapManager;
})(window);
