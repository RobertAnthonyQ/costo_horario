// Script temporal para debuggear la conexión con el backend

const API_BASE_URL = "http://localhost:4000";

async function testConnection() {
  console.log("🔍 Probando conexión con el backend...");

  try {
    // Probar conexión básica
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
    });

    console.log("📡 Status:", response.status);
    console.log("📡 Status Text:", response.statusText);

    const data = await response.text();
    console.log("📊 Response:", data);
  } catch (error) {
    console.error("❌ Error de conexión:", error);
  }
}

async function testFlujoCaja() {
  console.log("🧮 Probando endpoint de flujo de caja...");

  const testPayload = {
    machineId: 1,
    porcentajeResidual: 0.1,
    margenInterno: 0.05,
    gastosGeneralesMantenimiento: 0.05,
    horasOperativasMes: 300,
    tasaDescuentoEmpresa: 0.08,
    comentario: "Test de conexión",
    usuarioId: "test-user",
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}/calculos/flujo-caja/preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      }
    );

    console.log("📡 Status:", response.status);
    console.log("📡 Status Text:", response.statusText);

    const data = await response.text();
    console.log("📊 Response:", data);
  } catch (error) {
    console.error("❌ Error en flujo de caja:", error);
  }
}

// Ejecutar pruebas
testConnection();
setTimeout(() => testFlujoCaja(), 2000);
