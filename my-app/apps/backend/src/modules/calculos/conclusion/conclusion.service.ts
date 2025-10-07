import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FlujoCajaService } from '../flujo-caja/flujo-caja.service';
import { CreateAnalisisConclusionDto } from './dto/create-analisis-conclusion.dto';
import {
  ConclusionResponse,
  DatosMaquinaComparativa,
  ResumenEstadistico,
} from './interfaces/conclusion-response.interface';
import { serializeBigInt } from '../../../utils/bigint-serializer';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ConclusionService {
  constructor(
    private prisma: PrismaService,
    private flujoCajaService: FlujoCajaService,
  ) {}

  /**
   * Genera análisis comparativo de múltiples máquinas
   */
  async generarAnalisisComparativo(
    dto: CreateAnalisisConclusionDto,
  ): Promise<ConclusionResponse> {
    console.log(
      `[CONCLUSION] ========== INICIANDO ANÁLISIS COMPARATIVO ==========`,
    );
    console.log(`[CONCLUSION] Lugar de trabajo: ${dto.lugarTrabajo}`);
    console.log(
      `[CONCLUSION] Total máquinas a analizar: ${dto.maquinas.length}`,
    );

    // Validar que se proporcionen máquinas para comparar
    if (!dto.maquinas || dto.maquinas.length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos una máquina para analizar',
      );
    }

    if (dto.maquinas.length > 20) {
      throw new BadRequestException(
        'Máximo 20 máquinas permitidas por análisis comparativo',
      );
    }

    // Obtener datos de cada máquina
    const datosMaquinas: DatosMaquinaComparativa[] = [];
    const erroresProcesamiento: string[] = [];

    for (const maquinaDto of dto.maquinas) {
      console.log(
        `[CONCLUSION] Procesando máquina ID: ${maquinaDto.machineId}, Versión: ${maquinaDto.versionId}`,
      );

      try {
        const datosMaquina = await this.extraerDatosMaquina(
          maquinaDto.machineId,
          maquinaDto.versionId,
        );
        datosMaquinas.push(datosMaquina);

        console.log(
          `[CONCLUSION] ✅ Máquina ${maquinaDto.machineId} procesada exitosamente`,
        );
      } catch (error) {
        console.log(
          `[CONCLUSION] ❌ Error procesando máquina ${maquinaDto.machineId}: ${error.message}`,
        );
        erroresProcesamiento.push(
          `Máquina ID ${maquinaDto.machineId} (Versión ${maquinaDto.versionId}): ${error.message}`,
        );
      }
    }

    // Si hubo errores al procesar alguna máquina, lanzar un error detallado
    if (erroresProcesamiento.length > 0) {
      const totalMaquinas = dto.maquinas.length;
      const maquinasExitosas = datosMaquinas.length;
      const maquinasConError = erroresProcesamiento.length;

      throw new BadRequestException(
        `No se pudieron procesar ${maquinasConError} de ${totalMaquinas} máquinas solicitadas. ` +
          `Máquinas procesadas exitosamente: ${maquinasExitosas}. Errores encontrados:\n\n` +
          erroresProcesamiento
            .map((error, index) => `${index + 1}. ${error}`)
            .join('\n'),
      );
    }

    console.log(
      `[CONCLUSION] Total máquinas procesadas exitosamente: ${datosMaquinas.length}`,
    );

    // Generar resumen estadístico
    const resumen = this.calcularResumenEstadistico(datosMaquinas);

    // Generar recomendaciones determinísticas (reglas)
    const recomendaciones = this.generarRecomendaciones(datosMaquinas, resumen);

    // Generar recomendación y conclusión con Gemini (IA)
    const iaResumen = await this.generarRecomendacionYConclusionGemini({
      lugarTrabajo: dto.lugarTrabajo,
      maquinas: datosMaquinas,
      resumen,
    });

    // Construir respuesta
    const response: ConclusionResponse = {
      parametros: {
        lugarTrabajo: dto.lugarTrabajo,
        fechaAnalisis: new Date().toISOString(),
        comentario: dto.comentario,
        usuarioId: dto.usuarioId,
        totalMaquinasAnalizadas: datosMaquinas.length,
      },
      maquinas: datosMaquinas,
      resumen,
      recomendaciones,
      otrosDatos: {
        ...(iaResumen ? { recomendacionTexto: iaResumen.recomendacion } : {}),
        ...(iaResumen ? { conclusionTexto: iaResumen.conclusion } : {}),
        iaFuente: 'gemini-2.5-flash',
      },
      estado: 'calculado',
    };

    console.log(
      `[CONCLUSION] ========== ANÁLISIS COMPARATIVO COMPLETADO ==========`,
    );
    console.log(
      `[CONCLUSION] Mejor VAN: ${recomendaciones.mejorVAN.marca} ${recomendaciones.mejorVAN.modelo} ($${recomendaciones.mejorVAN.valorPresenteNeto.toLocaleString()})`,
    );
    console.log(
      `[CONCLUSION] Mejor TIR: ${recomendaciones.mejorTIR.marca} ${recomendaciones.mejorTIR.modelo} (${recomendaciones.mejorTIR.tasaInternaRetorno.toFixed(2)}%)`,
    );

    return response;
  }

  /**
   * Cliente Gemini con API key "en duro" (permitiendo override por variable de entorno)
   */
  private getGeminiClient() {
    // Reemplaza por tu API key real si deseas probar en local.
    const HARDCODED_KEY = 'AIzaSyB14JltPrjwfqzpauvRpPhBudmmFcUTguA';
    const apiKey = process.env.GEMINI_API_KEY || HARDCODED_KEY;
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Construye un prompt de sistema y usuario para obtener una recomendación y conclusión ejecutivas.
   */
  private construirPromptGemini(input: {
    lugarTrabajo: string;
    maquinas: DatosMaquinaComparativa[];
    resumen: ResumenEstadistico;
  }) {
    const { lugarTrabajo, maquinas, resumen } = input;

    const system = [
      'Rol: Analista financiero-técnico de maquinaria pesada para minería y construcción.',
      'Objetivo: Redacta recomendación y conclusión ejecutivas, claras y accionables,',
      'comparando alternativas de equipos. Usa criterios financieros (VAN, TIR, B/C, ROI, Payback, AEV),',
      'tarifa horaria y métricas técnicas/logísticas disponibles (procedencia, soporte posventa, tiempos, etc.).',
      'Condiciones:',
      '- Ten en cuenta el lugar de trabajo indicado para contextualizar logística/operación.',
      '- Sé concreto, no repitas datos innecesarios. Evita lenguaje genérico.',
      '- Prioriza la alternativa con mayor creación de valor (VAN, VAN/$ invertido) y solidez (TIR > tasa, payback razonable).',
      '- Si hay trade-offs (mejor técnica vs mejor financiera), explícitalos y segmenta por contexto.',
      'Formato de respuesta: JSON con las claves {"recomendacion": string, "conclusion": string}.',
      'Extensión: recomendacion 120–220 palabras; conclusion 80–160 palabras.',
    ].join(' ');

    // Resumir cada máquina en una línea compacta para el prompt
    const filas = maquinas.map((m, i) => {
      const datosAd = m.datosAdicionales || ({} as any);
      const proc = datosAd.procedencia_pais ?? '-';
      const soporte = datosAd.tiempo_atencion_repuestos_dias ?? '-';
      const vida = m.vidaUtil ?? 0;
      const tarifa = m.tarifaHorariaInterna ?? 0;
      const thEq = m.tarifaHorariaInternaEquivalente ?? 0;
      return (
        `#${i + 1} ${m.marca} ${m.modelo}` +
        ` | VAN=${m.valorPresenteNeto}` +
        ` | TIR=${m.tasaInternaRetorno}%` +
        ` | B/C=${m.beneficioCosto}` +
        ` | ROI=${m.retornoInversion}%` +
        ` | Payback=${m.periodoRecuperacion}` +
        ` | AEV=${m.anualidadEquivalenteVAN}` +
        ` | VAN/h=${m.valorPresenteNetoPorVidaUtil}` +
        ` | VAN/$=${m.valorPresenteNetoPorDolarInvertido}` +
        ` | Th=${tarifa}/h | Th_eq=${thEq}/h` +
        ` | VidaUtil=${vida}h | Procedencia=${proc} | SoporteRep=${soporte}d`
      );
    });

    const resumenLinea = [
      `VAN_prom=${resumen.vanPromedio}, TIR_prom=${resumen.tirPromedio}%,`,
      `Tarifa_prom=${resumen.tarifaPromedio}, B/C_prom=${resumen.beneficioCostoPromedio},`,
      `Payback_prom=${resumen.periodoRecuperacionPromedio}, total=${resumen.totalMaquinas}`,
    ].join(' ');

    const user = [
      `Lugar de trabajo: ${lugarTrabajo}.`,
      'Alternativas evaluadas:',
      ...filas,
      'Resumen estadístico global:',
      resumenLinea,
      'Devuelve únicamente JSON válido con {"recomendacion","conclusion"}.',
    ].join('\n');

    return { system, user };
  }

  /**
   * Llama a Gemini para obtener recomendación y conclusión basadas en los datos calculados.
   */
  private async generarRecomendacionYConclusionGemini(input: {
    lugarTrabajo: string;
    maquinas: DatosMaquinaComparativa[];
    resumen: ResumenEstadistico;
  }): Promise<{ recomendacion: string; conclusion: string } | null> {
    try {
      const genAI = this.getGeminiClient();
      const { system, user } = this.construirPromptGemini(input);

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: system,
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: user }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const text = result.response.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Si por alguna razón no devuelve JSON puro, intentar limpiar
        const cleaned = text.trim().replace(/^```json\n?|```$/g, '');
        parsed = JSON.parse(cleaned);
      }

      if (
        parsed &&
        typeof parsed.recomendacion === 'string' &&
        typeof parsed.conclusion === 'string'
      ) {
        return {
          recomendacion: parsed.recomendacion,
          conclusion: parsed.conclusion,
        };
      }

      return null;
    } catch (error) {
      console.warn(
        '[CONCLUSION] ⚠️ Gemini no disponible o error en la llamada:',
        error?.message || error,
      );
      return null; // Si falla la IA, no bloqueamos el flujo base
    }
  }

  /**
   * Extrae datos de una máquina específica y su versión de flujo de caja
   */
  private async extraerDatosMaquina(
    machineId: number,
    versionId: number,
  ): Promise<DatosMaquinaComparativa> {
    // Obtener datos básicos de la máquina
    const machine = await this.prisma.machines.findUnique({
      where: { id: machineId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
          },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException(`Máquina con ID ${machineId} no encontrada`);
    }

    // Obtener el análisis de flujo de caja específico
    const analisisFlujoCaja =
      await this.flujoCajaService.findHistorialById(versionId);

    if (!analisisFlujoCaja) {
      throw new NotFoundException(
        `Análisis de flujo de caja con ID ${versionId} no encontrado`,
      );
    }

    // Verificar que el análisis corresponda a la máquina correcta
    if (analisisFlujoCaja.machine_id !== machineId) {
      throw new BadRequestException(
        `El análisis de flujo de caja ID ${versionId} no corresponde a la máquina ID ${machineId}`,
      );
    }

    // CORRECCIÓN: Los datos están en 'resultado_flujo_json', NO en 'resultado_completo_json'
    const resultadoFlujo = analisisFlujoCaja.resultado_flujo_json;

    console.log(
      `[CONCLUSION] ✅ Análisis de flujo ID ${versionId} - Datos encontrados`,
    );
    console.log(
      `[CONCLUSION] - Machine ID: ${machineId} (correcto: ${analisisFlujoCaja.machine_id === machineId})`,
    );
    console.log(`[CONCLUSION] - Tiene resultado_flujo_json:`, !!resultadoFlujo);

    if (!resultadoFlujo) {
      const maquinaInfo = `${machine.modelo?.marca?.nombre || 'N/A'} ${machine.modelo?.nombre || 'N/A'}`;
      throw new BadRequestException(
        `El análisis de flujo de caja ID ${versionId} para la máquina "${maquinaInfo}" (ID: ${machineId}) no tiene resultados calculados. ` +
          'Debe ejecutar el cálculo del flujo de caja antes de incluir esta máquina en el análisis comparativo.',
      );
    }

    // Acceder a los datos del reporte final consolidado a través de la estructura correcta
    const flujoOperacion = resultadoFlujo.FlujoDecajaOperacion;
    const reporteConsolidado = flujoOperacion?.reporteFinalConsolidado;

    if (!reporteConsolidado) {
      const maquinaInfo = `${machine.modelo?.marca?.nombre || 'N/A'} ${machine.modelo?.nombre || 'N/A'}`;
      throw new BadRequestException(
        `El análisis de flujo de caja ID ${versionId} para la máquina "${maquinaInfo}" (ID: ${machineId}) no tiene el reporte final consolidado. ` +
          'El cálculo parece estar incompleto.',
      );
    }

    console.log(
      `[CONCLUSION] ✅ Reporte consolidado encontrado para máquina ${machineId}`,
    );
    console.log(
      `[CONCLUSION] - Tiene análisis financiero:`,
      !!reporteConsolidado.analisisFinanciero,
    );

    // Extraer métricas financieras del resultado
    const analisisFinanciero = reporteConsolidado.analisisFinanciero || {};

    // Extraer datos adicionales del campo otros_json
    const otrosJsonData = machine.otros_json as any;
    const datosAdicionales = otrosJsonData
      ? {
          procedencia_pais: otrosJsonData.procedencia_pais,
          potencia_nominal_hp: otrosJsonData.potencia_nominal_hp,
          consumo_combustible_lh: otrosJsonData.consumo_combustible_lh,
          equipos_comercializados_peru:
            otrosJsonData.equipos_comercializados_peru,
          plazo_entrega_dias: otrosJsonData.plazo_entrega_dias,
          capacitacion_horas: otrosJsonData.capacitacion_horas,
          tiempo_atencion_repuestos_dias:
            otrosJsonData.tiempo_atencion_repuestos_dias,
          ofrece_financiamiento: otrosJsonData.ofrece_financiamiento,
        }
      : undefined;

    console.log(
      `[CONCLUSION] ✅ Datos adicionales extraídos:`,
      datosAdicionales,
    );

    // Construir datos de la máquina comparativa
    const datosMaquina: DatosMaquinaComparativa = {
      machineId: Number(machine.id),
      versionFlujoCajaId: Number(versionId),

      // Datos básicos de la máquina
      marca: machine.modelo?.marca?.nombre || 'N/A',
      modelo: machine.modelo?.nombre || 'N/A',
      equipo: machine.modelo?.equipo?.nombre || undefined,
      estado: machine.estado || undefined,
      idEquipo: machine.id_equipo_interno
        ? Number(machine.id_equipo_interno)
        : undefined,

      // Vida útil y valores básicos
      vidaUtil: Number(machine.vida_util) || 0,
      valorAdquisicion:
        Number(resultadoFlujo.valorAdquisicion) ||
        Number(machine.valor_similar_nuevo) ||
        0,
      valorResidual: Number(resultadoFlujo.valorResidual) || 0,

      // Métricas financieras extraídas del flujo de caja
      tarifaHorariaInterna: Number(flujoOperacion?.tarifainternaporhora) || 0,
      tarifaHorariaInternaEquivalente: await this.calcularTarifaEquilibrio(
        resultadoFlujo,
        analisisFlujoCaja,
        Number(machine.vida_util) || 0,
      ),
      margenInternoEquivalente: await this.calcularMargenInternoEquilibrio(
        resultadoFlujo,
        analisisFlujoCaja,
        Number(machine.vida_util) || 0,
      ),

      // Extraer valores base del análisis financiero
      valorPresenteNeto: Number(analisisFinanciero.van?.valor) || 0,
      tasaInternaRetorno: Number(analisisFinanciero.tir?.valor) || 0,
      beneficioCosto:
        Number(analisisFinanciero.ratioBeneficioCosto?.valor) || 0,
      retornoInversion: Number(analisisFinanciero.roi?.valor) || 0,
      periodoRecuperacion: Number(analisisFinanciero.payback?.valor) || 0,

      // Calcular métricas derivadas
      anualidadEquivalenteVAN: this.calcularAnualidadEquivalenteVAN(
        Number(analisisFinanciero.van?.valor) || 0,
        Number(analisisFlujoCaja.tasa_descuento_empresa) || 0.07,
        Number(resultadoFlujo.aniosOperacionEstimados) || 5,
      ),
      valorPresenteNetoPorVidaUtil: this.calcularVANPorVidaUtil(
        Number(machine.vida_util) || 0,
        Number(analisisFinanciero.van?.valor) || 0,
      ),
      valorPresenteNetoPorDolarInvertido: this.calcularVANPorDolarInvertido(
        Number(resultadoFlujo.valorAdquisicion) ||
          Number(machine.valor_similar_nuevo) ||
          0,
        Number(analisisFinanciero.van?.valor) || 0,
      ),

      // Datos adicionales de la máquina
      datosAdicionales,

      // Metadatos
      fechaAnalisisFlujoCaja: new Date(analisisFlujoCaja.fecha_calculo),
      comentarioFlujoCaja:
        (analisisFlujoCaja.otros_datos_json as any)?.comentario || undefined,
    };

    return datosMaquina;
  }

  /**
   * Calcula el resumen estadístico de todas las máquinas
   */
  private calcularResumenEstadistico(
    maquinas: DatosMaquinaComparativa[],
  ): ResumenEstadistico {
    if (maquinas.length === 0) {
      throw new BadRequestException(
        'No hay máquinas para calcular estadísticas',
      );
    }

    // Extraer valores para estadísticas
    const vans = maquinas.map((m) => m.valorPresenteNeto);
    const tirs = maquinas.map((m) => m.tasaInternaRetorno);
    const tarifas = maquinas.map((m) => m.tarifaHorariaInterna);
    const beneficiosCosto = maquinas.map((m) => m.beneficioCosto);
    const periodosRecuperacion = maquinas
      .map((m) => m.periodoRecuperacion)
      .filter((p) => p > 0); // Filtrar valores válidos

    const resumen: ResumenEstadistico = {
      // Estadísticas VAN
      vanPromedio: this.calcularPromedio(vans),
      vanMaximo: Math.max(...vans),
      vanMinimo: Math.min(...vans),
      vanDesviacionEstandar: this.calcularDesviacionEstandar(vans),

      // Estadísticas TIR
      tirPromedio: this.calcularPromedio(tirs),
      tirMaximo: Math.max(...tirs),
      tirMinimo: Math.min(...tirs),
      tirDesviacionEstandar: this.calcularDesviacionEstandar(tirs),

      // Estadísticas Tarifa Horaria
      tarifaPromedio: this.calcularPromedio(tarifas),
      tarifaMaxima: Math.max(...tarifas),
      tarifaMinima: Math.min(...tarifas),
      tarifaDesviacionEstandar: this.calcularDesviacionEstandar(tarifas),

      // Estadísticas Beneficio/Costo
      beneficioCostoPromedio: this.calcularPromedio(beneficiosCosto),
      beneficioCostoMaximo: Math.max(...beneficiosCosto),
      beneficioCostoMinimo: Math.min(...beneficiosCosto),

      // Estadísticas Período de Recuperación
      periodoRecuperacionPromedio:
        periodosRecuperacion.length > 0
          ? this.calcularPromedio(periodosRecuperacion)
          : 0,
      periodoRecuperacionMaximo:
        periodosRecuperacion.length > 0 ? Math.max(...periodosRecuperacion) : 0,
      periodoRecuperacionMinimo:
        periodosRecuperacion.length > 0 ? Math.min(...periodosRecuperacion) : 0,

      // Contadores
      totalMaquinas: maquinas.length,
      maquinasConVANPositivo: vans.filter((v) => v > 0).length,
      maquinasConTIRSuperiorTasaDescuento: tirs.filter((t) => t > 8).length, // Asumiendo 8% como tasa de descuento típica
    };

    return resumen;
  }

  /**
   * Genera recomendaciones automáticas basadas en el análisis
   */
  private generarRecomendaciones(
    maquinas: DatosMaquinaComparativa[],
    resumen: ResumenEstadistico,
  ) {
    const mejorVAN = maquinas.reduce((mejor, actual) =>
      actual.valorPresenteNeto > mejor.valorPresenteNeto ? actual : mejor,
    );

    const mejorTIR = maquinas.reduce((mejor, actual) =>
      actual.tasaInternaRetorno > mejor.tasaInternaRetorno ? actual : mejor,
    );

    const mejorBeneficioCosto = maquinas.reduce((mejor, actual) =>
      actual.beneficioCosto > mejor.beneficioCosto ? actual : mejor,
    );

    const menorPeriodoRecuperacion = maquinas
      .filter((m) => m.periodoRecuperacion > 0)
      .reduce((mejor, actual) =>
        actual.periodoRecuperacion < mejor.periodoRecuperacion ? actual : mejor,
      );

    const tarifaMasCompetitiva = maquinas.reduce((mejor, actual) =>
      actual.tarifaHorariaInterna < mejor.tarifaHorariaInterna ? actual : mejor,
    );

    // Generar resumen ejecutivo
    const resumenEjecutivo = this.generarResumenEjecutivo(
      maquinas,
      resumen,
      mejorVAN,
      mejorTIR,
      mejorBeneficioCosto,
    );

    // Generar advertencias
    const advertencias = this.generarAdvertencias(maquinas, resumen);

    return {
      mejorVAN,
      mejorTIR,
      mejorBeneficioCosto,
      menorPeriodoRecuperacion,
      tarifaMasCompetitiva,
      resumenEjecutivo,
      advertencias,
    };
  }

  /**
   * Genera un resumen ejecutivo automático
   */
  private generarResumenEjecutivo(
    maquinas: DatosMaquinaComparativa[],
    resumen: ResumenEstadistico,
    mejorVAN: DatosMaquinaComparativa,
    mejorTIR: DatosMaquinaComparativa,
    mejorBeneficioCosto: DatosMaquinaComparativa,
  ): string {
    const parrafos: string[] = [];

    parrafos.push(
      `Se analizaron ${maquinas.length} máquinas para determinar la mejor opción de inversión.`,
    );

    parrafos.push(
      `La máquina con mejor Valor Presente Neto es la ${mejorVAN.marca} ${mejorVAN.modelo} ` +
        `con un VAN de $${mejorVAN.valorPresenteNeto.toLocaleString()}.`,
    );

    parrafos.push(
      `La máquina con mejor Tasa Interna de Retorno es la ${mejorTIR.marca} ${mejorTIR.modelo} ` +
        `con un TIR de ${mejorTIR.tasaInternaRetorno.toFixed(2)}%.`,
    );

    if (resumen.maquinasConVANPositivo < maquinas.length) {
      const maquinasVANNegativo =
        maquinas.length - resumen.maquinasConVANPositivo;
      parrafos.push(
        `⚠️ ${maquinasVANNegativo} de ${maquinas.length} máquinas presentan VAN negativo, ` +
          `lo que indica que no generarán valor económico positivo.`,
      );
    }

    parrafos.push(
      `El VAN promedio de todas las máquinas es $${resumen.vanPromedio.toLocaleString()} ` +
        `con una TIR promedio de ${resumen.tirPromedio.toFixed(2)}%.`,
    );

    return parrafos.join(' ');
  }

  /**
   * Genera advertencias basadas en el análisis
   */
  private generarAdvertencias(
    maquinas: DatosMaquinaComparativa[],
    resumen: ResumenEstadistico,
  ): string[] {
    const advertencias: string[] = [];

    // Advertencia por VAN negativo
    const maquinasVANNegativo = maquinas.filter((m) => m.valorPresenteNeto < 0);
    if (maquinasVANNegativo.length > 0) {
      advertencias.push(
        `${maquinasVANNegativo.length} máquina(s) presenta(n) VAN negativo: ` +
          maquinasVANNegativo.map((m) => `${m.marca} ${m.modelo}`).join(', '),
      );
    }

    // Advertencia por TIR muy bajo
    const maquinasTIRBajo = maquinas.filter((m) => m.tasaInternaRetorno < 5);
    if (maquinasTIRBajo.length > 0) {
      advertencias.push(
        `${maquinasTIRBajo.length} máquina(s) presenta(n) TIR muy bajo (<5%): ` +
          maquinasTIRBajo.map((m) => `${m.marca} ${m.modelo}`).join(', '),
      );
    }

    // Advertencia por período de recuperación muy alto
    const maquinasPeriodoAlto = maquinas.filter(
      (m) => m.periodoRecuperacion > 10,
    );
    if (maquinasPeriodoAlto.length > 0) {
      advertencias.push(
        `${maquinasPeriodoAlto.length} máquina(s) presenta(n) período de recuperación muy alto (>10 años): ` +
          maquinasPeriodoAlto.map((m) => `${m.marca} ${m.modelo}`).join(', '),
      );
    }

    return advertencias;
  }

  /**
   * Calcula el promedio de un array de números
   */
  private calcularPromedio(valores: number[]): number {
    return valores.length > 0
      ? valores.reduce((suma, valor) => suma + valor, 0) / valores.length
      : 0;
  }

  /**
   * Calcula la desviación estándar de un array de números
   */
  private calcularDesviacionEstandar(valores: number[]): number {
    if (valores.length <= 1) return 0;

    const promedio = this.calcularPromedio(valores);
    const sumaCuadrados = valores.reduce(
      (suma, valor) => suma + Math.pow(valor - promedio, 2),
      0,
    );

    return Math.sqrt(sumaCuadrados / (valores.length - 1));
  }

  /**
   * Método de diagnóstico para inspeccionar un análisis de flujo específico
   * Temporal para debugging
   */
  async diagnosticarAnalisisFlujo(versionId: number): Promise<any> {
    console.log(
      `[CONCLUSION] 🔍 Diagnosticando análisis de flujo ID: ${versionId}`,
    );

    const analisis = await this.flujoCajaService.findHistorialById(versionId);

    if (!analisis) {
      return { error: 'Análisis no encontrado' };
    }

    return {
      id: analisis.id,
      machine_id: analisis.machine_id,
      fecha_calculo: analisis.fecha_calculo,
      usuario_id: analisis.usuario_id,
      hasResultadoCompleto: !!analisis.resultado_completo_json,
      resultadoKeys: analisis.resultado_completo_json
        ? Object.keys(analisis.resultado_completo_json)
        : null,
      hasReporteFinal:
        !!analisis.resultado_completo_json?.reporteFinalConsolidado,
      reporteFinalKeys: analisis.resultado_completo_json
        ?.reporteFinalConsolidado
        ? Object.keys(analisis.resultado_completo_json.reporteFinalConsolidado)
        : null,
      allKeys: Object.keys(analisis),
      // Estructura básica sin datos sensibles
      estructura: {
        porcentaje_residual: analisis.porcentaje_residual,
        margen_interno: analisis.margen_interno,
        deleted_at: analisis.deleted_at,
      },
    };
  }

  /**
   * Guarda el análisis de conclusión en la base de datos
   * TODO: Crear tabla analisis_conclusion en el esquema de Prisma
   */
  async guardarAnalisis(data: ConclusionResponse): Promise<any> {
    try {
      console.log(
        `[CONCLUSION] Guardando análisis comparativo en la base de datos`,
      );

      // Usar la primera máquina como referencia para machine_id
      const firstMachine = data.maquinas[0];
      if (!firstMachine) {
        throw new BadRequestException(
          'No hay máquinas en el análisis para guardar',
        );
      }

      // Generar texto de conclusión resumido
      const conclusionTexto = [
        `Análisis comparativo de ${data.parametros.totalMaquinasAnalizadas} máquinas en ${data.parametros.lugarTrabajo}`,
        `Mejor VAN: ${data.recomendaciones.mejorVAN.marca} ${data.recomendaciones.mejorVAN.modelo} ($${data.recomendaciones.mejorVAN.valorPresenteNeto.toLocaleString()})`,
        `Mejor TIR: ${data.recomendaciones.mejorTIR.marca} ${data.recomendaciones.mejorTIR.modelo} (${data.recomendaciones.mejorTIR.tasaInternaRetorno.toFixed(2)}%)`,
        data.otrosDatos?.recomendacionTexto
          ? `Recomendación: ${data.otrosDatos.recomendacionTexto.substring(0, 200)}...`
          : '',
      ]
        .filter(Boolean)
        .join('. ');

      const saved = await this.prisma.conclusiones_historial.create({
        data: {
          machine_id: BigInt(firstMachine.machineId),
          usuario_id: data.parametros.usuarioId || null,
          lugar_trabajo_equipo: data.parametros.lugarTrabajo,
          conclusion_texto: conclusionTexto,
          fecha_calculo: new Date(data.parametros.fechaAnalisis),
        },
      });

      console.log(`[CONCLUSION] ✅ Análisis guardado con ID: ${saved.id}`);

      return {
        ...data,
        analisisId: Number(saved.id),
        estado: 'guardado',
        message: 'Análisis guardado correctamente',
      };
    } catch (error) {
      console.error(`[CONCLUSION] ❌ Error guardando análisis:`, error);
      throw new BadRequestException(
        `Error guardando el análisis: ${error.message}`,
      );
    }
  }

  /**
   * Obtiene el historial de análisis de conclusión
   * TODO: Implementar cuando se cree la tabla analisis_conclusion
   */
  async findTodos(): Promise<any[]> {
    try {
      console.log(
        '[CONCLUSION] findTodos() - Obteniendo historial de análisis...',
      );

      const analisis = await this.prisma.conclusiones_historial.findMany({
        where: {
          deleted_at: null,
        },
        orderBy: { fecha_calculo: 'desc' },
        include: {
          machines: {
            include: {
              modelo: {
                include: {
                  marca: true,
                },
              },
            },
          },
          users: true,
        },
      });

      const result = analisis.map((item) => ({
        id: Number(item.id),
        lugar_trabajo: item.lugar_trabajo_equipo,
        fecha_calculo: item.fecha_calculo,
        comentario: item.conclusion_texto,
        total_maquinas: 1, // Por ahora solo guardamos una máquina de referencia
        machine_id: Number(item.machine_id),
        maquina: item.machines
          ? {
              marca: item.machines.modelo?.marca?.nombre,
              modelo: item.machines.modelo?.nombre,
            }
          : null,
        usuario_id: item.usuario_id,
      }));

      console.log(`[CONCLUSION] ✅ Encontrados ${result.length} análisis`);
      return result;
    } catch (error) {
      console.error('[CONCLUSION] ❌ Error al obtener historial:', error);
      throw new BadRequestException(
        `Error al obtener el historial: ${error.message}`,
      );
    }
  }

  /**
   * Obtiene un análisis específico por ID
   * TODO: Implementar cuando se cree la tabla analisis_conclusion
   */
  async findById(id: number): Promise<any> {
    try {
      console.log(
        `[CONCLUSION] findById(${id}) - Obteniendo análisis específico...`,
      );

      const analisis = await this.prisma.conclusiones_historial.findUnique({
        where: { id: BigInt(id), deleted_at: null },
        include: {
          machines: {
            include: {
              modelo: {
                include: {
                  marca: true,
                  equipo: true,
                },
              },
            },
          },
          users: true,
        },
      });

      if (!analisis) {
        console.log(`[CONCLUSION] ❌ Análisis ${id} no encontrado`);
        throw new NotFoundException(
          `Análisis de conclusión con ID ${id} no encontrado`,
        );
      }

      // Convertir de vuelta a formato ConclusionResponse básico para visualización
      const result = {
        parametros: {
          lugarTrabajo: analisis.lugar_trabajo_equipo || '',
          fechaAnalisis:
            analisis.fecha_calculo?.toISOString() || new Date().toISOString(),
          comentario: '', // El comentario original no se guarda separado
          usuarioId: analisis.usuario_id || undefined,
          totalMaquinasAnalizadas: 1, // Solo guardamos datos de una máquina de referencia
        },
        maquinas: [
          {
            machineId: Number(analisis.machine_id),
            versionFlujoCajaId: 0, // No disponible en historial
            marca: analisis.machines?.modelo?.marca?.nombre || 'N/A',
            modelo: analisis.machines?.modelo?.nombre || 'N/A',
            equipo: analisis.machines?.modelo?.equipo?.nombre || 'N/A',
            estado: 'guardado',
            // Datos no disponibles en historial - valores por defecto
            vidaUtil: 0,
            valorAdquisicion: 0,
            valorResidual: 0,
            tarifaHorariaInterna: 0,
            tarifaHorariaInternaEquivalente: 0,
            margenInternoEquivalente: 0,
            valorPresenteNeto: 0,
            anualidadEquivalenteVAN: 0,
            valorPresenteNetoPorVidaUtil: 0,
            valorPresenteNetoPorDolarInvertido: 0,
            tasaInternaRetorno: 0,
            beneficioCosto: 0,
            retornoInversion: 0,
            periodoRecuperacion: 0,
            fechaAnalisisFlujoCaja: analisis.fecha_calculo || new Date(),
          },
        ],
        resumen: {
          vanPromedio: 0,
          vanMaximo: 0,
          vanMinimo: 0,
          vanDesviacionEstandar: 0,
          tirPromedio: 0,
          tirMaximo: 0,
          tirMinimo: 0,
          tirDesviacionEstandar: 0,
          tarifaPromedio: 0,
          tarifaMaxima: 0,
          tarifaMinima: 0,
          tarifaDesviacionEstandar: 0,
          beneficioCostoPromedio: 0,
          beneficioCostoMaximo: 0,
          beneficioCostoMinimo: 0,
          periodoRecuperacionPromedio: 0,
          periodoRecuperacionMaximo: 0,
          periodoRecuperacionMinimo: 0,
          totalMaquinas: 1,
          maquinasConVANPositivo: 0,
          maquinasConTIRSuperiorTasaDescuento: 0,
        },
        recomendaciones: {
          mejorVAN: {} as any,
          mejorTIR: {} as any,
          mejorBeneficioCosto: {} as any,
          menorPeriodoRecuperacion: {} as any,
          tarifaMasCompetitiva: {} as any,
          resumenEjecutivo:
            analisis.conclusion_texto || 'Análisis guardado en historial',
          advertencias: [
            'Este análisis fue recuperado del historial con datos limitados',
          ],
        },
        otrosDatos: {
          recomendacionTexto: 'Análisis recuperado desde historial',
          conclusionTexto:
            analisis.conclusion_texto || 'Sin conclusión disponible',
          iaFuente: 'historial',
        },
        estado: 'guardado' as const,
        analisisId: Number(analisis.id),
      };

      console.log(`[CONCLUSION] ✅ Análisis ${id} encontrado y convertido`);
      return result;
    } catch (error) {
      console.error(`[CONCLUSION] ❌ Error al obtener análisis ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Error al obtener el análisis: ${error.message}`,
      );
    }
  }

  /**
   * Genera y guarda automáticamente el análisis de conclusión
   */
  async calcularYGuardar(dto: CreateAnalisisConclusionDto): Promise<any> {
    const analisis = await this.generarAnalisisComparativo(dto);
    return this.guardarAnalisis(analisis);
  }

  /**
   * Calcula la Anualidad Equivalente del VAN
   * Fórmula: (VAN * tasa_descuento) / (1 - ((1 + tasa_descuento) ^ -años))
   */
  private calcularAnualidadEquivalenteVAN(
    van: number,
    tasaDescuento: number,
    anios: number,
  ): number {
    if (van === 0 || tasaDescuento === 0 || anios === 0) {
      return 0;
    }

    const factor = 1 - Math.pow(1 + tasaDescuento, -anios);
    if (factor === 0) {
      return 0;
    }

    return (van * tasaDescuento) / factor;
  }

  /**
   * Calcula VAN por Vida Útil
   * Fórmula: VAN / vida_util
   */
  private calcularVANPorVidaUtil(vidaUtil: number, van: number): number {
    if (vidaUtil === 0) {
      return 0;
    }
    return van / vidaUtil;
  }

  /**
   * Calcula VAN por Dólar Invertido
   * Fórmula: VAN / valor_adquisicion
   */
  private calcularVANPorDolarInvertido(
    valorAdquisicion: number,
    van: number,
  ): number {
    if (valorAdquisicion === 0) {
      return 0;
    }
    return van / valorAdquisicion;
  }

  /**
   * Calcula la tarifa horaria interna equivalente que hace que el VAN sea 0
   * Utiliza el método de bisección para encontrar la tarifa de equilibrio
   */
  private async calcularTarifaEquilibrio(
    resultadoFlujo: any,
    analisisFlujoCaja: any,
    vidaUtil: number,
  ): Promise<number> {
    try {
      // Extraer parámetros necesarios del análisis (consistentes con el reporte consolidado)
      const valorAdquisicion = Number(resultadoFlujo.valorAdquisicion) || 0;
      const valorResidual = Number(resultadoFlujo.valorResidual) || 0;
      const tasaDescuento =
        Number(analisisFlujoCaja.tasa_descuento_empresa) || 0.07;

      const flujoOperacion = resultadoFlujo.FlujoDecajaOperacion || {};
      const horasOperativasMes = Number(flujoOperacion.horasOperativasMes) || 0;
      const mesesAlAnio = Number(flujoOperacion.mesesAlAnio) || 12;
      const horasOperacionAnual = horasOperativasMes * mesesAlAnio;

      const aniosParaEscenarios =
        Number(resultadoFlujo.aniosParaEscenarios) || 5;
      const aniosOperacionEstimados =
        Number(resultadoFlujo.aniosOperacionEstimados) || aniosParaEscenarios;

      console.log(
        `[CONCLUSION] Calculando tarifa de equilibrio (VAN total = 0) ...`,
      );
      console.log(
        `[CONCLUSION] - Valor adquisición: $${valorAdquisicion.toLocaleString()}`,
      );
      console.log(
        `[CONCLUSION] - Valor residual: $${valorResidual.toLocaleString()}`,
      );
      console.log(
        `[CONCLUSION] - Tasa descuento: ${(tasaDescuento * 100).toFixed(2)}%`,
      );
      console.log(
        `[CONCLUSION] - Años escenarios: ${aniosParaEscenarios} | Años estimados: ${aniosOperacionEstimados}`,
      );
      console.log(
        `[CONCLUSION] - Horas anuales: ${horasOperacionAnual.toFixed(0)}`,
      );

      if (horasOperacionAnual <= 0) {
        console.log(
          `[CONCLUSION] ⚠️ Horas operación inválidas, usando tarifa original`,
        );
        return Number(flujoOperacion?.tarifainternaporhora) || 0;
      }

      // Resolver por VAN = 0 detectando automáticamente si el reporte usa VAN RESULTANTE (sin inversión)
      // o VAN TOTAL (con inversión). Comparamos contra el VAN original del reporte.
      const tarifaHorariaOriginal =
        Number(resultadoFlujo?.FlujoDecajaOperacion?.tarifainternaporhora) || 0;
      const vanReporteResRaw =
        resultadoFlujo?.reporteFinalConsolidado?.analisisFinanciero?.van?.valor;
      const vanReporteTotRaw =
        resultadoFlujo?.reporteFinalConsolidado?.analisisFinanciero?.vanTotal
          ?.valor;
      const vanReporteRes = isFinite(Number(vanReporteResRaw))
        ? Number(Number(vanReporteResRaw).toFixed(2))
        : undefined;
      const vanReporteTot = isFinite(Number(vanReporteTotRaw))
        ? Number(Number(vanReporteTotRaw).toFixed(2))
        : undefined;

      const vanOriginalResultante = Number(
        this.calcularVANResultanteConTarifa(
          resultadoFlujo,
          tarifaHorariaOriginal,
          tasaDescuento,
        ).toFixed(2),
      );
      const vanOriginalTotal = Number(
        this.calcularNPVTotalConTarifa(
          resultadoFlujo,
          tarifaHorariaOriginal,
          tasaDescuento,
        ).toFixed(2),
      );

      const diffRes =
        vanReporteRes !== undefined
          ? Math.abs(vanOriginalResultante - vanReporteRes)
          : Number.POSITIVE_INFINITY;
      const diffTot =
        vanReporteTot !== undefined
          ? Math.abs(vanOriginalTotal - vanReporteTot)
          : vanReporteRes !== undefined
            ? Math.abs(vanOriginalTotal - vanReporteRes)
            : Number.POSITIVE_INFINITY;

      const usarVANResultante = diffRes <= diffTot;
      console.log(
        `[CONCLUSION] Modo VAN seleccionado: ${usarVANResultante ? 'RESULTANTE (sin inversión)' : 'TOTAL (con inversión)'} | diffRes=${isFinite(diffRes) ? diffRes.toFixed(2) : 'N/A'}, diffTot=${isFinite(diffTot) ? diffTot.toFixed(2) : 'N/A'}`,
      );

      // Método de bisección con acotamiento robusto
      let tarifaMin = 0;
      let tarifaMax = Math.max(
        1000,
        Number(flujoOperacion?.tarifainternaporhora) * 3 || 1000,
      );
      const precisionTarifa = 0.0001; // precisión de tarifa más fina que centavo
      const toleranciaVAN = 0.01; // queremos VAN en ±$0.01 (centavo)
      const maxIteraciones = 200;
      let iteraciones = 0;

      const evaluarVAN = (tarifa: number) =>
        usarVANResultante
          ? this.calcularVANResultanteConTarifa(
              resultadoFlujo,
              tarifa,
              tasaDescuento,
            )
          : this.calcularNPVTotalConTarifa(
              resultadoFlujo,
              tarifa,
              tasaDescuento,
            );

      // Asegurar cambio de signo entre límites
      let vanMin = evaluarVAN(tarifaMin);
      let vanMax = evaluarVAN(tarifaMax);

      // Expandir el máximo hasta que haya cruce de cero o límite de expansiones
      let expansiones = 0;
      const maxExpansiones = 20;
      while (vanMin * vanMax > 0 && expansiones < maxExpansiones) {
        tarifaMax *= 2;
        vanMax = evaluarVAN(tarifaMax);
        expansiones++;
      }

      // Si aún no hay cruce, retornar tarifa original como fallback
      if (vanMin * vanMax > 0) {
        console.log(
          `[CONCLUSION] ⚠️ No se pudo acotar raíz para VAN=0, devolviendo tarifa original`,
        );
        return Number(flujoOperacion?.tarifainternaporhora) || 0;
      }

      let tarifa = 0;
      while (
        (tarifaMax - tarifaMin > precisionTarifa ||
          Math.abs((vanMin + vanMax) / 2) > toleranciaVAN) &&
        iteraciones < maxIteraciones
      ) {
        tarifa = (tarifaMin + tarifaMax) / 2;
        const van = evaluarVAN(tarifa);

        if (Math.abs(van) <= toleranciaVAN) {
          break; // cercano a cero
        }

        // Decidir nuevo intervalo según el signo
        if (vanMin * van <= 0) {
          tarifaMax = tarifa;
          vanMax = van;
        } else {
          tarifaMin = tarifa;
          vanMin = van;
        }

        iteraciones++;
      }

      // Refinamiento por interpolación lineal (regula falsi)
      if (vanMin !== vanMax) {
        const tarifaInterp =
          tarifaMin - vanMin * ((tarifaMax - tarifaMin) / (vanMax - vanMin));
        const vanInterp = evaluarVAN(tarifaInterp);
        if (Math.abs(vanInterp) < Math.abs(evaluarVAN(tarifa))) {
          tarifa = tarifaInterp;
        }
      }

      // Ajuste al centavo: probar tarifa redondeada y ±$0.01 para minimizar |VAN|
      const round2 = (x: number) => Math.round(x * 100) / 100;
      const candidatos = [
        round2(tarifa),
        round2(tarifa) + 0.01,
        round2(tarifa) - 0.01,
      ];
      let mejorTarifa = tarifa;
      let mejorVAN = evaluarVAN(tarifa);
      for (const c of candidatos) {
        const v = evaluarVAN(c);
        if (Math.abs(v) < Math.abs(mejorVAN)) {
          mejorVAN = v;
          mejorTarifa = c;
        }
      }
      tarifa = mejorTarifa;

      console.log(
        `[CONCLUSION] ✅ Tarifa de equilibrio (centavos) encontrada: $${tarifa.toFixed(
          2,
        )}/h en ${iteraciones} iteraciones (VAN≈${mejorVAN.toFixed(2)})`,
      );

      return tarifa;
    } catch (error) {
      console.error(
        `[CONCLUSION] ❌ Error calculando tarifa de equilibrio:`,
        error,
      );
      // Si hay error, devolver la tarifa original como fallback
      const flujoOperacion = resultadoFlujo.FlujoDecajaOperacion;
      return Number(flujoOperacion?.tarifainternaporhora) || 0;
    }
  }

  /**
   * Calcula el VAN RESULTANTE (excluye inversión inicial) con una tarifa dada,
   * replicando la misma estructura de flujos anual empleada en el Reporte Final Consolidado.
   */
  private calcularVANResultanteConTarifa(
    resultadoFlujo: any,
    tarifaHoraria: number,
    tasaDescuento: number,
  ): number {
    try {
      const valorResidual = Number(resultadoFlujo.valorResidual) || 0;
      const aniosParaEscenarios =
        Number(resultadoFlujo.aniosParaEscenarios) || 5;
      const aniosEstimados =
        Number(resultadoFlujo.aniosOperacionEstimados) || aniosParaEscenarios;

      // Año del valor residual según lógica estandarizada
      const anioValorResidual =
        aniosEstimados > 0 ? Math.ceil(aniosEstimados) : 1;
      const aniosMaximos = Math.max(aniosParaEscenarios, anioValorResidual);

      const flujoOp = resultadoFlujo.FlujoDecajaOperacion || {};
      const horasOperativasMes = Number(flujoOp.horasOperativasMes) || 0;
      const mesesAlAnio = Number(flujoOp.mesesAlAnio) || 12;
      const horasAnio = horasOperativasMes * mesesAlAnio;

      // Costos variables por hora (mantenimiento + gg + seguro)
      const costoMantenimientoPorHora =
        Number(flujoOp.gastosGeneralesdeMantenimiento) || 0;
      const gastosGeneralesPorHora = Number(flujoOp.gastosgenerales) || 0;
      const seguroPorHora = Number(flujoOp.seguro) || 0;
      const costoVariablePorHora =
        costoMantenimientoPorHora + gastosGeneralesPorHora + seguroPorHora;

      // Depreciación anual (negativa) consistente con el cálculo original
      const valorDepreciacion = Number(resultadoFlujo.valorDepreciacion) || 0;
      const depreciacionAnual =
        aniosParaEscenarios > 0
          ? (-1 * valorDepreciacion) / aniosParaEscenarios
          : 0;

      // Tabla de amortización (puede no existir)
      const tabla = flujoOp.tablaAmortizacionAnual || null;

      // Tasa de impuestos usada en el cálculo original
      const tasaImpuestos = 0.295;

      // VAN resultante (sin inversión inicial)
      let van = 0;

      for (let t = 1; t <= aniosMaximos; t++) {
        // Ingresos y egresos operativos sólo dentro de los años de escenarios
        const ingresos =
          t <= aniosParaEscenarios ? tarifaHoraria * horasAnio : 0;
        const egresos =
          t <= aniosParaEscenarios ? -1 * horasAnio * costoVariablePorHora : 0;

        // Intereses y capital del financiamiento para el año t (si existen)
        let interesAnual = 0;
        let capitalAnual = 0;
        if (tabla && Array.isArray(tabla.tablaAnual)) {
          const fila = tabla.tablaAnual.find((a: any) => Number(a.anio) === t);
          if (fila) {
            interesAnual = Number(fila.interesAnual) || 0; // positivo aquí
            capitalAnual = Number(fila.capitalAnual) || 0; // positivo aquí
          }
        }

        // Base imponible
        const interesParaImpuesto = -interesAnual;
        const depreciacionParaImpuesto =
          t <= aniosParaEscenarios ? depreciacionAnual : 0;
        const baseImponible =
          ingresos + egresos + interesParaImpuesto + depreciacionParaImpuesto;
        const impuestos =
          baseImponible > 0 ? -1 * (baseImponible * tasaImpuestos) : 0;

        // Flujos por componente
        const flujoOperacion = ingresos + egresos + impuestos;
        const flujoFinanciamiento = -interesAnual; // solo intereses
        let flujoInversion = -capitalAnual; // capital anual
        if (t === anioValorResidual) {
          flujoInversion += valorResidual; // agregar venta en año VR
        }

        const flujoTotal =
          flujoOperacion + flujoInversion + flujoFinanciamiento;
        const vp = flujoTotal / Math.pow(1 + tasaDescuento, t);
        van += vp;
      }

      return van;
    } catch (e) {
      console.error('[CONCLUSION] Error en calcularVANResultanteConTarifa:', e);
      return 0;
    }
  }

  /**
   * Calcula el VAN TOTAL (incluyendo inversión inicial en t=0) con una tarifa horaria dada,
   * replicando la misma estructura de flujos del Reporte Final Consolidado.
   */
  private calcularNPVTotalConTarifa(
    resultadoFlujo: any,
    tarifaHoraria: number,
    tasaDescuento: number,
  ): number {
    try {
      const valorAdquisicion = Number(resultadoFlujo.valorAdquisicion) || 0;
      const valorResidual = Number(resultadoFlujo.valorResidual) || 0;
      const aniosParaEscenarios =
        Number(resultadoFlujo.aniosParaEscenarios) || 5;
      const aniosEstimados =
        Number(resultadoFlujo.aniosOperacionEstimados) || aniosParaEscenarios;

      // Determinar año del valor residual con lógica financiera estándar
      // El valor residual se realiza al final de la vida útil. Para flujos anuales, es el entero superior.
      const anioValorResidual =
        aniosEstimados > 0 ? Math.ceil(aniosEstimados) : 1;

      const aniosMaximos = Math.max(aniosParaEscenarios, anioValorResidual);

      const flujoOp = resultadoFlujo.FlujoDecajaOperacion || {};
      const horasOperativasMes = Number(flujoOp.horasOperativasMes) || 0;
      const mesesAlAnio = Number(flujoOp.mesesAlAnio) || 12;
      const horasAnio = horasOperativasMes * mesesAlAnio;

      // Costos variables por hora (mantenimiento + gg + seguro)
      const costoMantenimientoPorHora =
        Number(flujoOp.gastosGeneralesdeMantenimiento) || 0; // suma de componentes
      const gastosGeneralesPorHora = Number(flujoOp.gastosgenerales) || 0;
      const seguroPorHora = Number(flujoOp.seguro) || 0;
      const costoVariablePorHora =
        costoMantenimientoPorHora + gastosGeneralesPorHora + seguroPorHora;

      // Depreciación anual (negativa) consistente con el cálculo original
      const valorDepreciacion = Number(resultadoFlujo.valorDepreciacion) || 0;
      const depreciacionAnual =
        aniosParaEscenarios > 0
          ? (-1 * valorDepreciacion) / aniosParaEscenarios
          : 0;

      // Tabla de amortización (puede no existir)
      const tabla = flujoOp.tablaAmortizacionAnual || null;

      // Tasa de impuestos usada en el cálculo original
      const tasaImpuestos = 0.295;

      // VAN total: incluir inversión inicial (t=0)
      let van = -valorAdquisicion;

      for (let t = 1; t <= aniosMaximos; t++) {
        // Ingresos y egresos operativos (solo dentro de los años de escenarios)
        const ingresos =
          t <= aniosParaEscenarios ? tarifaHoraria * horasAnio : 0;
        const egresos =
          t <= aniosParaEscenarios ? -1 * horasAnio * costoVariablePorHora : 0;

        // Intereses y capital del financiamiento para el año t (si existen)
        let interesAnual = 0;
        let capitalAnual = 0;
        if (tabla && Array.isArray(tabla.tablaAnual)) {
          const fila = tabla.tablaAnual.find((a: any) => Number(a.anio) === t);
          if (fila) {
            interesAnual = Number(fila.interesAnual) || 0; // positivo aquí
            capitalAnual = Number(fila.capitalAnual) || 0; // positivo aquí
          }
        }

        // Base imponible (interés entra negativo en la base, como en el original)
        const interesParaImpuesto = -interesAnual;
        const depreciacionParaImpuesto =
          t <= aniosParaEscenarios ? depreciacionAnual : 0;
        const baseImponible =
          ingresos + egresos + interesParaImpuesto + depreciacionParaImpuesto;
        const impuestos =
          baseImponible > 0 ? -1 * (baseImponible * tasaImpuestos) : 0;

        // Flujos por componente (como en Reporte Final Consolidado)
        const flujoOperacion = ingresos + egresos + impuestos;
        const flujoFinanciamiento = -interesAnual; // solo intereses
        const flujoInversion =
          -capitalAnual + (t === anioValorResidual ? valorResidual : 0);

        const flujoTotal =
          flujoOperacion + flujoInversion + flujoFinanciamiento;
        const vp = flujoTotal / Math.pow(1 + tasaDescuento, t);
        van += vp;
      }

      return van;
    } catch (e) {
      console.error('[CONCLUSION] Error en calcularNPVTotalConTarifa:', e);
      return 0;
    }
  }

  /**
   * Extrae los costos operativos anuales del flujo de caja
   */
  private extraerCostosOperativos(
    flujoOperacion: any,
    aniosOperacion: number,
  ): number[] {
    try {
      // Intentar extraer costos de diferentes fuentes posibles
      const costosAnuales: number[] = [];

      // Buscar en diferentes estructuras posibles del flujo
      if (flujoOperacion?.flujoCajaAnual) {
        // Si hay flujo anual estructurado
        for (let i = 0; i < 10; i++) {
          // Máximo 10 años
          const costoAnual =
            Number(
              flujoOperacion.flujoCajaAnual[`ano_${i + 1}`]?.costosOperativos,
            ) || 0;
          if (costoAnual > 0) {
            costosAnuales.push(costoAnual);
          } else {
            break; // No hay más años
          }
        }
      }

      // Si no encontramos costos estructurados, usar estimación
      if (costosAnuales.length === 0) {
        const costoEstimado =
          Number(flujoOperacion?.costoOperativoAnual) ||
          Number(flujoOperacion?.costoMantenimiento) ||
          0;

        if (costoEstimado > 0) {
          // Usar la cantidad de años de operación real del análisis
          for (let i = 0; i < aniosOperacion; i++) {
            costosAnuales.push(costoEstimado);
          }
        }
      }

      return costosAnuales;
    } catch (error) {
      console.error(`[CONCLUSION] Error extrayendo costos operativos:`, error);
      return []; // Array vacío como fallback
    }
  }

  /**
   * Calcula el margen interno equivalente que hace que el VAN sea 0
   */
  private async calcularMargenInternoEquilibrio(
    resultadoFlujo: any,
    analisisFlujoCaja: any,
    vidaUtil: number,
  ): Promise<number> {
    try {
      // Extraer parámetros del análisis original
      const margenInternoOriginal =
        Number(analisisFlujoCaja.margen_interno) || 0;
      const tarifaHorariaOriginal =
        Number(resultadoFlujo.FlujoDecajaOperacion?.tarifainternaporhora) || 0;
      const tarifaEquilibrio = await this.calcularTarifaEquilibrio(
        resultadoFlujo,
        analisisFlujoCaja,
        vidaUtil,
      );

      console.log(`[CONCLUSION] Calculando margen interno de equilibrio...`);
      console.log(
        `[CONCLUSION] - Margen interno original: ${(margenInternoOriginal * 100).toFixed(2)}%`,
      );
      console.log(
        `[CONCLUSION] - Tarifa original: $${tarifaHorariaOriginal.toFixed(2)}/h`,
      );
      console.log(
        `[CONCLUSION] - Tarifa equilibrio: $${tarifaEquilibrio.toFixed(2)}/h`,
      );

      if (tarifaHorariaOriginal === 0) {
        console.log(
          `[CONCLUSION] ⚠️ Tarifa original inválida, usando margen original`,
        );
        return margenInternoOriginal;
      }

      // Calcular margen equivalente a partir del costo base por hora
      // En el flujo original: tarifainternaporhora = base * (1 + margen)
      const costoBaseHora =
        Number(
          resultadoFlujo.FlujoDecajaOperacion?.totalPosesionMantenimientoBase,
        ) || 0;

      if (costoBaseHora <= 0) {
        console.log(
          `[CONCLUSION] ⚠️ Costo base/hora inválido, usando regla proporcional como fallback`,
        );
        const factorCambio = tarifaEquilibrio / tarifaHorariaOriginal;
        const margenProporcional = margenInternoOriginal * factorCambio;
        console.log(
          `[CONCLUSION] ✅ Margen interno equivalente (proporcional): ${(margenProporcional * 100).toFixed(2)}%`,
        );
        return margenProporcional;
      }

      // Margen exacto para alcanzar la tarifa de equilibrio
      const margenInternoEquivalente = tarifaEquilibrio / costoBaseHora - 1;

      // Log de relación con la tarifa original
      const factorTarifa = tarifaEquilibrio / tarifaHorariaOriginal;
      console.log(
        `[CONCLUSION] - Relación tarifa equilibrio/original: ${factorTarifa.toFixed(4)}`,
      );
      console.log(
        `[CONCLUSION] ✅ Margen interno equivalente: ${(margenInternoEquivalente * 100).toFixed(2)}%`,
      );

      return margenInternoEquivalente;
    } catch (error) {
      console.error(
        `[CONCLUSION] ❌ Error calculando margen interno de equilibrio:`,
        error,
      );
      // Si hay error, devolver el margen original como fallback
      return Number(analisisFlujoCaja.margen_interno) || 0;
    }
  }

  /**
   * Calcula el VAN con una tarifa horaria específica
   */
  private calcularVANConTarifa(
    tarifaHoraria: number,
    valorAdquisicion: number,
    valorResidual: number,
    costosOperativosAnuales: number[],
    horasOperacionAnual: number,
    tasaDescuento: number,
    aniosOperacion: number,
  ): number {
    let van = -valorAdquisicion; // Inversión inicial (negativa)

    // Sumar flujos anuales descontados
    for (let ano = 1; ano <= aniosOperacion; ano++) {
      const ingresosAnuales = tarifaHoraria * horasOperacionAnual;
      const costosAnuales = costosOperativosAnuales[ano - 1] || 0;
      const flujoNetoAnual = ingresosAnuales - costosAnuales;

      // Descontar el flujo al presente
      const flujoDescontado = flujoNetoAnual / Math.pow(1 + tasaDescuento, ano);
      van += flujoDescontado;
    }

    // Sumar valor residual descontado al final
    if (valorResidual > 0) {
      const valorResidualDescontado =
        valorResidual / Math.pow(1 + tasaDescuento, aniosOperacion);
      van += valorResidualDescontado;
    }

    return van;
  }
}
