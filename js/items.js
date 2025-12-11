(function (global) {
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  const weapons = {
    lapicero: {
      id: 'lapicero',
      nombre: 'Lapicero mordido',
      bonusAtaque: 0,
      bonusPrecision: 0,
      descripcion: 'Arma básica. No impresiona a nadie, pero es mejor que nada.',
    },
    tecladoRoto: {
      id: 'tecladoRoto',
      nombre: 'Teclado roto',
      bonusAtaque: 2,
      bonusPrecision: 0.02,
      descripcion: 'Pesado y lleno de ira reprimida. Sorprendentemente efectivo.',
    },
    lanzaMopa: {
      id: 'lanzaMopa',
      nombre: 'Lanza-mopa telescópica',
      bonusAtaque: 3,
      bonusPrecision: 0.03,
      descripcion: 'El arma preferida de los conserjes antiguos.',
    },
    martilloMultiuso: {
      id: 'martilloMultiuso',
      nombre: 'Martillo multiusos FP',
      bonusAtaque: 4,
      bonusPrecision: 0.01,
      descripcion: 'Sirve para construir, reparar y disuadir a profesores insistentes.',
    },
    katanaImpresora: {
      id: 'katanaImpresora',
      nombre: 'Katana de impresora 3D',
      bonusAtaque: 5,
      bonusPrecision: 0.05,
      descripcion: 'Arma experimental fabricada en el laboratorio. Muy afilada, ligeramente ilegal.',
    },
    lanzaChispas: {
      id: 'lanzaChispas',
      nombre: 'Lanza-chispas arcano',
      bonusAtaque: 6,
      bonusPrecision: 0.04,
      descripcion: 'Una lanza improvisada con cables y bobinas. Electrocuta a cualquiera que se acerque.',
    },
    martilloTitanio: {
      id: 'martilloTitanio',
      nombre: 'Martillo de titanio',
      bonusAtaque: 7,
      bonusPrecision: 0.03,
      descripcion: 'Pesado pero equilibrado. Ideal para demoler muros... o burocracia.',
    },
    canonSonico: {
      id: 'canonSonico',
      nombre: 'Cañón sónico del aula AV',
      bonusAtaque: 8,
      bonusPrecision: 0.06,
      descripcion: 'Arma experimental que dispara ondas musicales a volumen absurdo.',
    },
  };

  const armors = {
    sudadera_base: {
      id: 'sudadera_base',
      nombre: 'Sudadera estándar',
      bonusDefensa: 0,
      descripcion: 'Comodidad ante todo. Cubre lo justo.',
    },
    chalecoReflectante: {
      id: 'chalecoReflectante',
      nombre: 'Chaleco reflectante de taller',
      bonusDefensa: 2,
      descripcion: 'Pensado para no ser atropellado por carretillas, también desvía golpes.',
    },
    chaquetaAntiestatica: {
      id: 'chaquetaAntiestatica',
      nombre: 'Chaqueta antiestática del CPD',
      bonusDefensa: 3,
      descripcion: 'Protege contra descargas y profesores en modo Tormenta.',
    },
    escudoApuntes: {
      id: 'escudoApuntes',
      nombre: 'Escudo de apuntes plastificados',
      bonusDefensa: 4,
      descripcion: 'Apuntes encuadernados a modo de escudo. Brutalmente efectivo.',
    },
    armaduraCampamento: {
      id: 'armaduraCampamento',
      nombre: 'Parka de supervivencia',
      bonusDefensa: 5,
      descripcion: 'Perfeccionada en el campamento del patio. Bloquea golpes y chismes.',
    },
    chalecoFibra: {
      id: 'chalecoFibra',
      nombre: 'Chaleco de fibra óptica',
      bonusDefensa: 4,
      descripcion: 'Los cables actúan como amortiguadores de golpes y dan bastante estilo.',
    },
    armaduraFibra: {
      id: 'armaduraFibra',
      nombre: 'Blindaje modular de laboratorio',
      bonusDefensa: 6,
      descripcion: 'Combinación de placas impresas y fibra experimental. Casi impenetrable.',
    },
    blindajeImpresora: {
      id: 'blindajeImpresora',
      nombre: 'Blindaje de resina endurecida',
      bonusDefensa: 7,
      descripcion: 'Resultado de horas de impresión 3D y cero supervisión. Muy resistente.',
    },
  };

  function getWeapon(id) {
    return weapons[id] ? deepClone(weapons[id]) : null;
  }

  function getArmor(id) {
    return armors[id] ? deepClone(armors[id]) : null;
  }

  function describeWeapon(id) {
    const weapon = getWeapon(id);
    if (!weapon) return 'Desconocido';
    return `${weapon.nombre} (+${weapon.bonusAtaque} ATQ, +${Math.round(weapon.bonusPrecision * 100)}% PREC)`;
  }

  function describeArmor(id) {
    const armor = getArmor(id);
    if (!armor) return 'Desconocido';
    return `${armor.nombre} (+${armor.bonusDefensa} DEF)`;
  }

  global.Items = {
    weapons,
    armors,
    getWeapon,
    getArmor,
    describeWeapon,
    describeArmor,
  };
})(window);
