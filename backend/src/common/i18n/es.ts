export const es = {
  system: {
    genericError: 'Ocurrió un error interno.',
    requestFailed: 'No se pudo completar la solicitud.',
  },
  auth: {
    loginRequired: 'Debes iniciar sesión.',
    invalidSession: 'La sesión no es válida.',
    expiredSession: 'La sesión no es válida o expiró.',
    invalidCredentials: 'Credenciales inválidas.',
    registeredEmail: 'El correo ya está registrado.',
    missingSession: 'La sesión no existe.',
    invalidResetLink: 'El enlace no es válido o expiró.',
    passwordUpdated: 'Contraseña actualizada correctamente.',
    recoveryRequested:
      'Si el correo está registrado, enviaremos instrucciones para recuperar la contraseña.',
    recoveryUnavailable:
      'La recuperación de contraseña aún no está configurada. Inténtalo más tarde.',
  },
  accounts: {
    missing: 'La cuenta no existe.',
    duplicate: 'Ya existe una cuenta activa con ese nombre y moneda.',
    openingBalanceDescription: 'Saldo inicial',
  },
  categories: {
    duplicate: 'Ya existe una categoría activa con ese nombre y tipo.',
    systemImmutable: 'Las categorías del sistema no pueden modificarse.',
    archivedImmutable: 'Una categoría archivada no puede modificarse.',
    missing: 'La categoría no existe o no está disponible.',
  },
  budgets: {
    duplicate: 'Ya existe un presupuesto para ese mes, moneda y categoría.',
    invalidCategory:
      'La categoría debe estar activa, ser de gasto y estar disponible para tu usuario.',
    missing: 'El presupuesto no existe.',
  },
  goals: {
    missing: 'La meta no existe.',
    notEditable: 'Esta meta ya no puede modificarse.',
    notReservable: 'Solo se puede reservar dinero en metas activas.',
    invalidAccount:
      'La cuenta debe estar activa, pertenecer a tu usuario y usar la misma moneda de la meta.',
    reservationExceedsAvailable:
      'La reserva no puede ser mayor al disponible de la cuenta.',
    reservationMissing: 'La reserva no existe.',
    insufficientProgress:
      'La meta solo puede completarse cuando el monto reservado alcanza el objetivo.',
    targetBelowReserved:
      'El objetivo no puede ser menor al monto ya reservado.',
    targetDateInPast: 'La fecha objetivo no puede estar en el pasado.',
    deleteOnlyCancelled: 'Solo puedes borrar metas canceladas.',
    deleted: 'Meta eliminada correctamente.',
  },
  groups: {
    missing: 'El grupo no existe o no tienes acceso.',
    userMissing: 'El usuario invitado debe estar registrado y activo.',
    selfInvitation: 'No puedes invitarte a tu propio grupo.',
    memberDuplicate:
      'Ese usuario ya pertenece al grupo o tiene una invitación pendiente.',
    adminRequired: 'Solo un administrador del grupo puede invitar miembros.',
    ownerRequired: 'Solo el propietario del grupo puede archivar el grupo.',
    invitationMissing: 'La invitación no existe o ya fue respondida.',
    invitationDeclined: 'Invitación rechazada correctamente.',
    invalidPayer: 'La persona que pagó debe ser miembro activo del grupo.',
    invalidParticipants:
      'Todos los participantes deben ser miembros activos del grupo.',
  },
  profile: {
    incompleteOnboarding:
      'Completa tus objetivos y crea una cuenta antes de finalizar.',
  },
  transactions: {
    missing: 'El movimiento no existe.',
    invalidAccount: 'La cuenta no existe o está archivada.',
    invalidCategory:
      'La categoría no corresponde al tipo de movimiento seleccionado.',
    openingImmutable: 'El saldo inicial no puede editarse desde movimientos.',
    duplicate: 'Este movimiento ya fue registrado.',
    deleted: 'Movimiento eliminado correctamente.',
  },
  validation: {
    categoryName:
      'El nombre de la categoría solo puede contener letras, espacios, apóstrofos o guiones.',
    personName:
      'El nombre solo puede contener letras, espacios, apóstrofos o guiones.',
    accountName:
      'El nombre de la cuenta solo puede contener letras, espacios, apóstrofos o guiones.',
    openingBalanceNumber: 'El saldo inicial debe ser un número válido.',
    openingBalanceMinimum: 'El saldo inicial no puede ser negativo.',
    openingBalanceMaximum: 'El saldo inicial es demasiado alto.',
    budgetAmountNumber: 'El presupuesto debe ser un número válido.',
    budgetAmountMinimum: 'El presupuesto debe ser mayor que cero.',
    budgetAmountMaximum: 'El presupuesto es demasiado alto.',
    goalName:
      'El nombre de la meta solo puede contener letras, números, espacios, apóstrofos o guiones.',
    goalAmountNumber: 'El monto objetivo debe ser un número válido.',
    goalAmountMinimum: 'El monto objetivo debe ser mayor que cero.',
    goalAmountMaximum: 'El monto objetivo es demasiado alto.',
    goalReservationAmountNumber: 'La reserva debe ser un número válido.',
    goalReservationAmountMinimum: 'La reserva debe ser mayor que cero.',
    goalReservationAmountMaximum: 'La reserva es demasiado alta.',
    groupName:
      'El nombre del grupo solo puede contener letras, números, espacios, apóstrofos o guiones.',
    groupExpenseDescription:
      'La descripción del gasto solo puede contener letras, números y puntuación básica.',
    groupExpenseAmountNumber: 'El gasto debe ser un número válido.',
    groupExpenseAmountMinimum: 'El gasto debe ser mayor que cero.',
    groupExpenseAmountMaximum: 'El gasto es demasiado alto.',
    monthStart: 'El mes debe enviarse como YYYY-MM-01.',
    password:
      'La contraseña debe incluir una mayúscula, un número y un carácter especial.',
  },
} as const;
