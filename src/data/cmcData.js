// src/data/cmcData.js
// Estructura de menú / opciones. Añadimos dos entradas top-level separadas en CATEGORIAS:
// - "PARÁMETROS DE CATEGORÍA" (vacío)
// - "CALCULADORA" (vacío)
// De ese modo aparecen como pestañas independientes en el sidebar.
export const CMC_STRUCTURE = {
  CONDUCTOR: {
    color: "#1976d2",
    options: {
      "CAMBIO DE MONTO CASH (CMC)": { items: ["TICKET", "VIAJE", "CALCULADORA CMC", "CALCULADORA BS (SI ES NECESARIO)"], driverInfo: false, warning: null },
      "VIAJE REALIZADO": { items: ["TICKET", "VIAJE DE ADMIN", "DESCUENTO AL USER", "CALCULADORA"], driverInfo: false, warning: null },
      "VIAJE REALIZADO CASH": { items: ["TICKET", "VIAJE", "CONVERSACIÓN CON EL RIDER (OPCIONAL)", "VUELTO AL USER", "CALCULADORA VIAJE REALIZADO CASH"], driverInfo: false, warning: null },
      "RECÁLCULO": { items: ["TICKET CON EL CONDUCTOR", "VIAJE DE ADMIN", "CALCULADORA", "DISPATCHER", "MAPA DE ADMIN", "ABONO AL USUARIO O DESCUENTO"], driverInfo: false, warning: null },
      "MOVIMIENTO CERO": { items: ["TICKET", "VIAJE DE ADMIN", "CONVERSACIÓN CON EL USUARIO (OPCIONAL)", "CALCULADORA MV CERO", "DESCUENTO AL USUARIO"], driverInfo: false, warning: null },
      "VIAJE YUNO": { items: ["VIAJE CANCELADO", "CONVERSACIÓN (OPCIONAL)", "CALCULADORA DE (VIAJE REALIZADO)", "PAGO DEL USUARIO"], driverInfo: false, warning: "¡IMPORTANTE! NO CANCELAR MANUALMENTE[...]" },
      "ABONO CXC DISPUTA MAL LIBERADA": { items: ["TICKET", "VIAJE DE ADMIN", "DESCUENTO USUARIO", "CALCULADORA"], driverInfo: false, warning: null },
      "ABONO CXC PAGO MÓVIL": { items: ["TICKET", "PAGO EN REPORT", "CAPTURA DEL PAGO MOVIL", "DESCUENTO DE LA CUENTA USUARIO"], driverInfo: false, warning: "Abonado al usuario en vez del rider" }
    }
  },
  USUARIO: {
    color: "#2e7d32",
    options: {
      "CAMBIO DE MONTO CASH (CMC)": { items: ["TICKET CONDUCTOR O USUARIO", "VIAJE DE ADMIN", "PAGO EXTRA (DATOS CONDUCTOR)", "CALCULADORA CMC", "CALCULADORA DISPUTA (SI ES BS)"], driverInfo: true, warning: null },
      "VIAJE REALIZADO CASH": { items: ["TICKET", "VIAJE", "CONVERSACIÓN CON EL RIDER (OPCIONAL)", "VUELTO AL USER", "CALCULADORA VIAJE REALIZADO CASH"], driverInfo: false, warning: null },
      "VIAJE REALIZADO": { items: ["TICKET", "VIAJE DE ADMIN", "CALCULADORA", "NOTAS"], driverInfo: false, warning: null },
      "RECÁLCULO": { items: ["TICKET CON EL USUARIO", "VIAJE DE ADMIN", "CALCULADORA", "DISPATCHER", "MAPA DE ADMIN", "ABONO"], driverInfo: false, warning: null }
    }
  },

  // Top-level: RECALCULO (panel de cálculo independiente)
  RECALCULO: {
    color: "#ffb300",
    options: {
      "RECÁLCULO": { items: [], driverInfo: false, warning: null }
    }
  },

  // Top-level: CATEGORIAS -> separado en dos opciones independientes
  CATEGORIAS: {
    color: "#6a1b9a",
    options: {
      "PARÁMETROS DE CATEGORÍA": { items: [], driverInfo: false, warning: null },
      "CALCULADORA": { items: [], driverInfo: false, warning: null }
    }
  }
};