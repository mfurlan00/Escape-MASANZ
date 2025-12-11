(function (global) {
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  const Allies = {
    luis: {
      id: 'luis',
      nombre: 'Luis',
      descripcion: 'Veterano del gimnasio del barrio. Aprueba todo porque nadie le discute las notas.',
      bonus: '+2 al daño cuerpo a cuerpo.',
    },
    pablo: {
      id: 'pablo',
      nombre: 'Pablo',
      descripcion: 'Organiza la agenda del curso mejor que la propia secretaría.',
      bonus: 'Reduce el coste de energía de estudiar/explorar.',
    },
    catalufo: {
      id: 'catalufo',
      nombre: 'Catalufo',
      descripcion: 'Siempre huele a tornillería y trae herramientas mágicas.',
      bonus: 'Más probabilidad de encontrar recursos útiles.',
    },
    iker: {
      id: 'iker',
      nombre: 'Iker',
      descripcion: 'Maestro del parkour de pasillo. Si cae un switch, él lo esquiva.',
      bonus: '+2 a defensa y más evasión en combate.',
    },
    sara: {
      id: 'sara',
      nombre: 'Sara',
      descripcion: 'Hacker del CPD que memoriza contraseñas por diversión.',
      bonus: '+0.05 a precisión y pistas extra en zonas tecnológicas.',
    },
    miriam: {
      id: 'miriam',
      nombre: 'Miriam',
      descripcion: 'Enfermera clandestina con botiquín infinito.',
      bonus: 'Regeneras salud cada turno y el estrés baja al descansar.',
    },
    nerea: {
      id: 'nerea',
      nombre: 'Nerea',
      descripcion: 'Estratega del club de debate. Sabe por dónde pasar para evitar marrones.',
      bonus: 'Explorar y moverte cuesta menos energía y ganas precisión.',
    },
    raul: {
      id: 'raul',
      nombre: 'Raúl',
      descripcion: 'Entrenador improvisado del gimnasio. Nunca descansa sin hacer estiramientos.',
      bonus: 'Descansar recupera mucha más energía.',
    },
    yoli: {
      id: 'yoli',
      nombre: 'Yoli',
      descripcion: 'Dueña no oficial de la cafetería nocturna. Siempre tiene comida de sobra.',
      bonus: 'Reduce el hambre acumulada y consigue snacks extra.',
    },
  };

  const Enemies = {
    inigo: {
      id: 'inigo',
      nombre: 'Iñigo Romanos',
      descripcion: 'Profesor que ataca con trabajos grupales sorpresa.',
      salud: 65,
      ataque: 12,
      defensa: 4,
      precision: 0.75,
      recompensa: { progreso: 12, estres: -10 },
      habilidad: 'Hace más daño si tu estrés es alto.',
      effect: (playerState) => (playerState.resources.estres > 70 ? 4 : 0),
    },
    fernando: {
      id: 'fernando',
      nombre: 'Fernando',
      descripcion: 'Tutor que persigue con papeleo interminable.',
      salud: 55,
      ataque: 10,
      defensa: 5,
      precision: 0.8,
      recompensa: { progreso: 10, energia: 10 },
      habilidad: 'Reduce tu precisión cada vez que habla de burocracia.',
      effect: () => 0,
      debuff: 0.05,
    },
    iniesta: {
      id: 'iniesta',
      nombre: 'Iniesta',
      descripcion: 'Administrador del CPD armado con contraseñas imposibles.',
      salud: 70,
      ataque: 11,
      defensa: 6,
      precision: 0.72,
      recompensa: { progreso: 15, tarjetaCPD: true },
      habilidad: 'Tiene probabilidad de esquivar tus ataques.',
      evadeChance: 0.25,
      effect: () => 0,
    },
  };

  function getAlly(id) {
    return Allies[id] ? deepClone(Allies[id]) : null;
  }

  function getEnemy(id) {
    return Enemies[id] ? deepClone(Enemies[id]) : null;
  }

  function applyAllyBonus(state, allyId) {
    switch (allyId) {
      case 'luis':
        state.stats.ataque += 2;
        state.flags.allyLuis = true;
        break;
      case 'pablo':
        state.flags.allyPablo = true;
        break;
      case 'catalufo':
        state.flags.allyCatalufo = true;
        break;
      case 'iker':
        state.stats.defensa += 2;
        state.flags.allyIker = true;
        break;
      case 'sara':
        state.stats.precision += 0.05;
        state.flags.allySara = true;
        break;
      case 'miriam':
        state.flags.allyMiriam = true;
        break;
      case 'nerea':
        state.stats.precision += 0.03;
        state.flags.allyNerea = true;
        break;
      case 'raul':
        state.flags.allyRaul = true;
        break;
      case 'yoli':
        state.flags.allyYoli = true;
        break;
      default:
        break;
    }
  }

  global.Characters = {
    Allies,
    Enemies,
    getAlly,
    getEnemy,
    applyAllyBonus,
  };
})(window);
