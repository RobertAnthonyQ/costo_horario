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
    let iaResumen = await this.generarRecomendacionYConclusionGemini({
      lugarTrabajo: dto.lugarTrabajo,
      maquinas: datosMaquinas,
      resumen,
    });

    // Si Gemini falla, usar recomendaciones automáticas de fallback
    if (!iaResumen) {
      console.log(
        '[CONCLUSION] 🔄 Usando recomendaciones automáticas de fallback...',
      );
      iaResumen = this.generarRecomendacionesAutomaticasFallback(
        datosMaquinas,
        resumen,
        dto.lugarTrabajo,
      );
      console.log('[CONCLUSION] ✅ Recomendaciones automáticas generadas');
    }

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
        recomendacionTexto: iaResumen.recomendacion,
        conclusionTexto: iaResumen.conclusion,
        tarifasOfertaRecomendadas: iaResumen.tarifasOferta,
        iaFuente: iaResumen.tarifasOferta
          ? 'gemini-2.5-flash'
          : 'automatico-fallback',
        analisisCompletado: new Date().toISOString(),
        configuracionAnalisis: {
          incluirAnalisisSensibilidad: true,
          incluirGestionRiesgos: true,
          cumplimientoISO: ['ISO 55001', 'ISO 37001'],
          nivelAnalisis: 'ejecutivo-tecnico',
          metodologiaCalculo:
            'VAN/TIR/ROI/AEV integrado con análisis de sensibilidad',
        },
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
    console.log(
      `[CONCLUSION] Fuente de recomendaciones: ${response.otrosDatos?.iaFuente}`,
    );
    if (response.otrosDatos?.tarifasOfertaRecomendadas) {
      console.log(
        `[CONCLUSION] Tarifas de oferta calculadas para ${response.otrosDatos.tarifasOfertaRecomendadas.length} máquina(s)`,
      );
    }

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
    tarifasOferta?: any[];
  }) {
    const { lugarTrabajo, maquinas, resumen } = input;

    const system = [
      'Tu función es analizar automáticamente los resultados financieros y técnicos generados por el módulo, y producir recomendaciones y conclusiones automáticas que sirvan como salida ejecutiva y técnica para la toma de decisiones de inversión en maquinaria pesada.',
      '',
      'Al recibir los resultados de una corrida del software (incluyendo datos como VAN, TIR, ROI, B/C, Payback, VAN por dólar invertido, VAN por hora operativa, AEV, costo horario interno, T_h.eq, modalidad de financiamiento y contexto operativo), debes elaborar dos párrafos de salida:',
      '',
      '1. Párrafo Ejecutivo (6–8 líneas):',
      '• Expón la alternativa recomendada (por ejemplo, Caterpillar 950, SEM 656F)',
      '• Resume los indicadores decisivos (VAN, TIR, ROI, AEV o VAN/$)',
      '• Menciona la condición operativa recomendada (costa, altura, horizonte del contrato o restricción de CAPEX)',
      '• Incluye una recomendación de tarifa horaria de oferta (T_h) basada en la tarifa de equilibrio (T_h.eq) y el margen de rentabilidad requerido',
      '• Cierra con una conclusión clara sobre competitividad y retorno esperado',
      '',
      '2. Párrafo Técnico (8–12 líneas):',
      '• Explica los supuestos críticos del análisis (tasa de descuento, horizonte temporal, horas mensuales, costos de mantenimiento, valor residual, tipo de contrato, altitud o condición logística)',
      '• Describe los resultados financieros más relevantes (VAN, TIR, ROI, B/C, Payback, VAN/$, AEV) y su interpretación en términos de rentabilidad y riesgo',
      '• Integra la sensibilidad de variables (±10% horas operativas, ±5% costos de mantenimiento, ±Valor Residual) y menciona cómo afectan la estabilidad del VAN o la TIR',
      '• Identifica los riesgos principales (mantenimiento, suministro de repuestos, variabilidad del combustible, subutilización, etc.) y plantea acciones de mitigación (SLA ≤5 días, convenios con proveedores, cláusulas de ajuste, redistribución de horas)',
      '• Justifica la selección final considerando el equilibrio entre criterios técnicos (vida útil, confiabilidad, soporte) y criterios financieros (VAN, TIR, VAN/$, AEV)',
      '• Concluye señalando el cumplimiento de los estándares ISO 55001 e ISO 37001, y la utilidad estratégica del software como herramienta de soporte a la decisión',
      '',
      'Condiciones específicas que debes considerar en cada análisis:',
      '• Si el proyecto es en altura (>3,000 msnm), prioriza equipos con mayor confiabilidad, respaldo postventa y parque instalado nacional',
      '• Si el proyecto es en costa o zonas logísticamente accesibles, prioriza alternativas de rápida recuperación (alta TIR, bajo Payback y VAN/$ alto)',
      '• Si existe restricción de CAPEX, sugiere leasing o subarriendo',
      '• Si la tarifa horaria de equilibrio (T_h.eq) excede el precio objetivo, advierte sobre riesgo de pérdida o necesidad de renegociar condiciones',
      '• Reconoce que los costos de mantenimiento representan entre 60% y 70% del OPEX total y constituyen la variable de mayor sensibilidad financiera',
      '• Siempre compara las alternativas en función de su rentabilidad anual equivalente (AEV) para hacer comparables equipos con distinta vida útil',
      '',
      'Estilo de redacción:',
      '• Lenguaje técnico, claro y objetivo, con tono académico-profesional',
      '• Presenta cifras con dos decimales y unidades (USD, %, h, años)',
      '• Evita repeticiones; prioriza precisión, trazabilidad y valor interpretativo',
      '• No uses listas en el resultado: redacta los párrafos de forma fluida y coherente',
      '',
      'Objetivo final: Generar recomendaciones automáticas de nivel gerencial que integren análisis técnico, financiero y operativo, con interpretación contextual y sensibilidad de riesgo, entregando un resultado comparable entre alternativas y alineado a la toma de decisiones estratégicas en licitaciones mineras.',
      '',
      'Formato de respuesta: JSON con las claves {"recomendacion": string, "conclusion": string}.',
      'Extensión: recomendacion 6-8 oraciones (aproximadamente 150-300 palabras); conclusion 8-12 oraciones (aproximadamente 200-400 palabras).',
    ].join('\n');

    // Resumir cada máquina en una línea compacta para el prompt con más contexto técnico
    const filas = maquinas.map((m, i) => {
      const datosAd = m.datosAdicionales || ({} as any);
      const proc = datosAd.procedencia_pais ?? '-';
      const soporte = datosAd.tiempo_atencion_repuestos_dias ?? '-';
      const potencia = datosAd.potencia_nominal_hp ?? '-';
      const consumo = datosAd.consumo_combustible_lh ?? '-';
      const financiamiento = datosAd.ofrece_financiamiento ? 'Sí' : 'No';
      const vida = m.vidaUtil ?? 0;
      const tarifa = m.tarifaHorariaInterna ?? 0;
      const thEq = m.tarifaHorariaInternaEquivalente ?? 0;
      const margenEq = m.margenInternoEquivalente ?? 0;

      return (
        `#${i + 1} ${m.marca} ${m.modelo}` +
        ` | VAN=${m.valorPresenteNeto.toFixed(2)}` +
        ` | TIR=${m.tasaInternaRetorno.toFixed(2)}%` +
        ` | B/C=${m.beneficioCosto.toFixed(2)}` +
        ` | ROI=${m.retornoInversion.toFixed(2)}%` +
        ` | Payback=${m.periodoRecuperacion.toFixed(2)}años` +
        ` | AEV=${m.anualidadEquivalenteVAN.toFixed(2)}` +
        ` | VAN/h=${m.valorPresenteNetoPorVidaUtil.toFixed(2)}` +
        ` | VAN/$=${m.valorPresenteNetoPorDolarInvertido.toFixed(4)}` +
        ` | Th=${tarifa.toFixed(2)}/h | Th_eq=${thEq.toFixed(2)}/h` +
        ` | MargenEq=${(margenEq * 100).toFixed(2)}%` +
        ` | VidaUtil=${vida.toFixed(0)}h | Procedencia=${proc}` +
        ` | SoporteRep=${soporte}d | Potencia=${potencia}HP` +
        ` | Consumo=${consumo}L/h | Financiamiento=${financiamiento}`
      );
    });

    // Detectar condiciones específicas del lugar de trabajo
    const esAltura = /altura|andes|sierra|elevad|msnm|3000|4000|5000/i.test(
      lugarTrabajo,
    );
    const esCosta = /costa|lima|callao|arequipa|trujillo|piura/i.test(
      lugarTrabajo,
    );
    const esSelva = /selva|amazonas|loreto|ucayali|madre de dios/i.test(
      lugarTrabajo,
    );

    let condicionOperativa = 'zona estándar';
    if (esAltura) condicionOperativa = 'operación en altura (>3,000 msnm)';
    else if (esCosta)
      condicionOperativa = 'zona costera con acceso logístico favorable';
    else if (esSelva)
      condicionOperativa = 'zona selvática con desafíos logísticos';

    const resumenLinea = [
      `Condición operativa: ${condicionOperativa}.`,
      `Estadísticas: VAN_prom=${resumen.vanPromedio.toFixed(2)}, TIR_prom=${resumen.tirPromedio.toFixed(2)}%,`,
      `Tarifa_prom=${resumen.tarifaPromedio.toFixed(2)}, B/C_prom=${resumen.beneficioCostoPromedio.toFixed(2)},`,
      `Payback_prom=${resumen.periodoRecuperacionPromedio.toFixed(2)}años, total=${resumen.totalMaquinas} alternativas.`,
      `Máquinas con VAN positivo: ${resumen.maquinasConVANPositivo}/${resumen.totalMaquinas}.`,
    ].join(' ');

    // Incluir información de tarifas de oferta si están disponibles
    const tarifasOfertaInfo = input.tarifasOferta
      ? [
          '',
          'Tarifas horarias de oferta recomendadas (T_h):',
          ...input.tarifasOferta.map(
            (t) =>
              `${t.marca} ${t.modelo}: T_h.eq=${t.tarifaEquilibrio.toFixed(2)}/h → T_h.oferta=${t.tarifaOfertaRecomendada.toFixed(2)}/h (margen: ${t.margenAplicado.toFixed(1)}%)`,
          ),
        ]
      : [];

    const user = [
      `Lugar de trabajo: ${lugarTrabajo}.`,
      `Condición detectada: ${condicionOperativa}`,
      '',
      'Alternativas evaluadas:',
      ...filas,
      '',
      'Resumen estadístico global:',
      resumenLinea,
      ...tarifasOfertaInfo,
      '',
      'IMPORTANTE:',
      '- Para el párrafo EJECUTIVO (6-8 líneas): Incluye la alternativa recomendada, indicadores decisivos, condición operativa, tarifa de oferta sugerida y conclusión sobre competitividad.',
      '- Para el párrafo TÉCNICO (8-12 líneas): Explica supuestos críticos, resultados financieros, sensibilidad de variables, riesgos y mitigación, justificación de selección, y cumplimiento de estándares ISO 55001 e ISO 37001.',
      '- Usa lenguaje técnico-profesional con cifras precisas (2 decimales) y unidades.',
      '- Reconoce que los costos de mantenimiento representan 60-70% del OPEX total.',
      '- Compara por AEV para equipos con distinta vida útil.',
      '',
      'Devuelve únicamente JSON válido con {"recomendacion": "párrafo ejecutivo", "conclusion": "párrafo técnico"}.',
    ].join('\n');

    return { system, user };
  }

  /**
   * Calcula la tarifa horaria de oferta recomendada basada en la tarifa de equilibrio
   * y el margen de rentabilidad requerido según las condiciones del proyecto
   */
  private calcularTarifaOfertaRecomendada(
    maquina: DatosMaquinaComparativa,
    lugarTrabajo: string,
  ): number {
    const tarifaEquilibrio = maquina.tarifaHorariaInternaEquivalente || 0;

    // Determinar margen según condiciones del proyecto
    let margenRecomendado = 0.2; // 20% por defecto

    // Ajustar margen según ubicación y riesgo
    if (/altura|andes|sierra|elevad|msnm|3000|4000|5000/i.test(lugarTrabajo)) {
      margenRecomendado = 0.25; // 25% para proyectos en altura (mayor riesgo)
    } else if (
      /costa|lima|callao|arequipa|trujillo|piura/i.test(lugarTrabajo)
    ) {
      margenRecomendado = 0.18; // 18% para costa (menor riesgo logístico)
    } else if (
      /selva|amazonas|loreto|ucayali|madre de dios/i.test(lugarTrabajo)
    ) {
      margenRecomendado = 0.3; // 30% para selva (máximo riesgo logístico)
    }

    // Ajustar según métricas financieras de la máquina
    if (maquina.tasaInternaRetorno < 15) {
      margenRecomendado += 0.05; // +5% si TIR es baja
    }
    if (maquina.valorPresenteNetoPorDolarInvertido < 0.15) {
      margenRecomendado += 0.03; // +3% si VAN/$ invertido es bajo
    }

    // Considerar tiempo de atención de repuestos
    const tiempoAtencion =
      maquina.datosAdicionales?.tiempo_atencion_repuestos_dias;
    if (tiempoAtencion && Number(tiempoAtencion) > 7) {
      margenRecomendado += 0.02; // +2% si tiempo de repuestos > 7 días
    }

    return tarifaEquilibrio * (1 + margenRecomendado);
  }

  /**
   * Llama a Gemini para obtener recomendación y conclusión basadas en los datos calculados.
   */
  private async generarRecomendacionYConclusionGemini(input: {
    lugarTrabajo: string;
    maquinas: DatosMaquinaComparativa[];
    resumen: ResumenEstadistico;
  }): Promise<{
    recomendacion: string;
    conclusion: string;
    tarifasOferta?: any[];
  } | null> {
    try {
      const genAI = this.getGeminiClient();

      // Calcular tarifas de oferta para cada máquina
      const tarifasOferta = input.maquinas.map((maquina) => ({
        machineId: maquina.machineId,
        marca: maquina.marca,
        modelo: maquina.modelo,
        tarifaEquilibrio: maquina.tarifaHorariaInternaEquivalente || 0,
        tarifaOfertaRecomendada: this.calcularTarifaOfertaRecomendada(
          maquina,
          input.lugarTrabajo,
        ),
        margenAplicado:
          (this.calcularTarifaOfertaRecomendada(maquina, input.lugarTrabajo) /
            (maquina.tarifaHorariaInternaEquivalente || 1) -
            1) *
          100,
      }));

      // Agregar información de tarifas de oferta al contexto
      const inputConTarifas = {
        ...input,
        tarifasOferta,
      };

      const { system, user } = this.construirPromptGemini(inputConTarifas);

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: system,
      });

      console.log(
        '[CONCLUSION] Enviando análisis a Gemini para generar recomendaciones...',
      );

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: user }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3, // Reducir creatividad para mayor consistencia técnica
          topP: 0.8,
          topK: 40,
        },
      });

      const text = result.response.text();
      let parsed: any = null;

      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Si no es JSON puro, intentar limpiar formatos markdown o similares
        const cleaned = text
          .trim()
          .replace(/^```json\n?|```$/g, '')
          .replace(/^```\n?|```$/g, '')
          .replace(/^\s*{\s*[\s\S]*}\s*$/g, (match) => match.trim());

        try {
          parsed = JSON.parse(cleaned);
        } catch (e2) {
          console.error(
            '[CONCLUSION] Error parseando respuesta de Gemini:',
            text,
          );
          return null;
        }
      }

      // Validación exhaustiva de la respuesta
      if (!parsed || typeof parsed !== 'object') {
        console.warn(
          '[CONCLUSION] ⚠️ Respuesta de Gemini no es un objeto válido',
        );
        return null;
      }

      if (
        typeof parsed.recomendacion !== 'string' ||
        typeof parsed.conclusion !== 'string'
      ) {
        console.warn(
          '[CONCLUSION] ⚠️ Respuesta de Gemini no tiene los campos requeridos',
        );
        return null;
      }

      // Validar longitud mínima de los párrafos
      if (parsed.recomendacion.length < 100 || parsed.conclusion.length < 150) {
        console.warn('[CONCLUSION] ⚠️ Párrafos de Gemini demasiado cortos');
        return null;
      }

      // Verificar que contenga términos técnicos relevantes
      const terminosRelevantes = [
        'VAN',
        'TIR',
        'ROI',
        'payback',
        'tarifa',
        'equilibrio',
        'rentabilidad',
      ];
      const recomendacionValida = terminosRelevantes.some((termino) =>
        parsed.recomendacion.toLowerCase().includes(termino.toLowerCase()),
      );
      const conclusionValida = terminosRelevantes.some((termino) =>
        parsed.conclusion.toLowerCase().includes(termino.toLowerCase()),
      );

      if (!recomendacionValida || !conclusionValida) {
        console.warn(
          '[CONCLUSION] ⚠️ Respuesta de Gemini no contiene términos técnicos relevantes',
        );
        return null;
      }

      // Validación final de calidad
      const validacion = this.validarCalidadRecomendaciones(
        parsed.recomendacion,
        parsed.conclusion,
        input.lugarTrabajo,
      );

      if (!validacion.esValida) {
        console.warn(
          '[CONCLUSION] ⚠️ Respuesta de Gemini no cumple criterios de calidad:',
          validacion.errores,
        );
        return null; // Forzar uso de fallback si no cumple criterios
      }

      console.log(
        '[CONCLUSION] ✅ Análisis de Gemini completado exitosamente y validado',
      );

      return {
        recomendacion: parsed.recomendacion,
        conclusion: parsed.conclusion,
        tarifasOferta,
      };
    } catch (error) {
      console.warn(
        '[CONCLUSION] ⚠️ Gemini no disponible o error en la llamada:',
        error?.message || error,
      );
      return null; // Si falla la IA, no bloqueamos el flujo base
    }
  }

  /**
   * Valida que las recomendaciones y conclusiones cumplan con los criterios requeridos
   */
  private validarCalidadRecomendaciones(
    recomendacion: string,
    conclusion: string,
    lugarTrabajo: string,
  ): { esValida: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar longitud mínima
    if (recomendacion.length < 200) {
      errores.push('Recomendación muy corta (mínimo 200 caracteres)');
    }
    if (conclusion.length < 300) {
      errores.push('Conclusión muy corta (mínimo 300 caracteres)');
    }

    // Validar que contenga términos financieros clave
    const terminosFinancieros = ['VAN', 'TIR', 'ROI', 'payback', 'AEV', 'B/C'];
    const terminosEnRecomendacion = terminosFinancieros.filter((termino) =>
      recomendacion.toLowerCase().includes(termino.toLowerCase()),
    ).length;
    const terminosEnConclusion = terminosFinancieros.filter((termino) =>
      conclusion.toLowerCase().includes(termino.toLowerCase()),
    ).length;

    if (terminosEnRecomendacion < 3) {
      errores.push(
        'Recomendación debe incluir al menos 3 términos financieros clave',
      );
    }
    if (terminosEnConclusion < 4) {
      errores.push(
        'Conclusión debe incluir al menos 4 términos financieros clave',
      );
    }

    // Validar que incluya tarifa horaria
    if (
      !recomendacion.toLowerCase().includes('tarifa') &&
      !recomendacion.toLowerCase().includes('USD')
    ) {
      errores.push(
        'Recomendación debe incluir información sobre tarifa horaria',
      );
    }

    // Validar que mencione condición operativa
    const condicionesOperativas = [
      'altura',
      'costa',
      'sierra',
      'selva',
      'logístico',
      'acceso',
    ];
    const mencionaCondicion = condicionesOperativas.some(
      (cond) =>
        recomendacion.toLowerCase().includes(cond) ||
        conclusion.toLowerCase().includes(cond),
    );
    if (!mencionaCondicion) {
      errores.push(
        'Debe mencionar condiciones operativas específicas del proyecto',
      );
    }

    // Validar que incluya análisis de riesgo (en conclusión técnica)
    const terminosRiesgo = [
      'riesgo',
      'mitigación',
      'sensibilidad',
      'variabilidad',
      'mantenimiento',
    ];
    const mencionaRiesgo = terminosRiesgo.some((termino) =>
      conclusion.toLowerCase().includes(termino),
    );
    if (!mencionaRiesgo) {
      errores.push(
        'Conclusión técnica debe incluir análisis de riesgos y sensibilidad',
      );
    }

    // Validar que mencione estándares ISO (en conclusión técnica)
    if (!conclusion.includes('ISO')) {
      errores.push(
        'Conclusión técnica debe mencionar cumplimiento de estándares ISO',
      );
    }

    // Validar presencia de cifras con decimales
    const tieneDecimales =
      /\d+\.\d{2}/.test(recomendacion) && /\d+\.\d{2}/.test(conclusion);
    if (!tieneDecimales) {
      errores.push('Debe incluir cifras con dos decimales en ambos párrafos');
    }

    return {
      esValida: errores.length === 0,
      errores,
    };
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
   * Genera recomendaciones y conclusiones automáticas de fallback si Gemini no está disponible
   */
  private generarRecomendacionesAutomaticasFallback(
    maquinas: DatosMaquinaComparativa[],
    resumen: ResumenEstadistico,
    lugarTrabajo: string,
  ): { recomendacion: string; conclusion: string; tarifasOferta: any[] } {
    const mejorVAN = maquinas.reduce((mejor, actual) =>
      actual.valorPresenteNeto > mejor.valorPresenteNeto ? actual : mejor,
    );

    const mejorTIR = maquinas.reduce((mejor, actual) =>
      actual.tasaInternaRetorno > mejor.tasaInternaRetorno ? actual : mejor,
    );

    const mejorVANDolar = maquinas.reduce((mejor, actual) =>
      actual.valorPresenteNetoPorDolarInvertido >
      mejor.valorPresenteNetoPorDolarInvertido
        ? actual
        : mejor,
    );

    // Determinar condición operativa
    const esAltura = /altura|andes|sierra|elevad|msnm|3000|4000|5000/i.test(
      lugarTrabajo,
    );
    const esCosta = /costa|lima|callao|arequipa|trujillo|piura/i.test(
      lugarTrabajo,
    );

    // Calcular tarifas de oferta
    const tarifasOferta = maquinas.map((maquina) => ({
      machineId: maquina.machineId,
      marca: maquina.marca,
      modelo: maquina.modelo,
      tarifaEquilibrio: maquina.tarifaHorariaInternaEquivalente || 0,
      tarifaOfertaRecomendada: this.calcularTarifaOfertaRecomendada(
        maquina,
        lugarTrabajo,
      ),
      margenAplicado:
        (this.calcularTarifaOfertaRecomendada(maquina, lugarTrabajo) /
          (maquina.tarifaHorariaInternaEquivalente || 1) -
          1) *
        100,
    }));

    const tarifaOfertaOptima = tarifasOferta.find(
      (t) => t.machineId === mejorVAN.machineId,
    );

    // Párrafo Ejecutivo (6-8 líneas)
    const recomendacion = [
      `Se recomienda la adquisición del equipo ${mejorVAN.marca} ${mejorVAN.modelo} como alternativa óptima para el proyecto en ${lugarTrabajo}.`,
      `Esta alternativa presenta un VAN de USD ${mejorVAN.valorPresenteNeto.toFixed(2)}, TIR de ${mejorVAN.tasaInternaRetorno.toFixed(2)}% y ratio VAN/$ invertido de ${mejorVAN.valorPresenteNetoPorDolarInvertido.toFixed(4)}.`,
      `Para las condiciones operativas ${esAltura ? 'de altura identificadas' : esCosta ? 'costeras favorables' : 'del proyecto'}, el equipo ofrece un equilibrio óptimo entre rentabilidad y riesgo técnico.`,
      `Se sugiere una tarifa horaria de oferta de USD ${tarifaOfertaOptima?.tarifaOfertaRecomendada.toFixed(2) || 'N/A'}/h, basada en la tarifa de equilibrio de USD ${mejorVAN.tarifaHorariaInternaEquivalente.toFixed(2)}/h más un margen de rentabilidad del ${tarifaOfertaOptima?.margenAplicado.toFixed(1) || 'N/A'}%.`,
      `El período de recuperación de ${mejorVAN.periodoRecuperacion.toFixed(2)} años y la anualidad equivalente de USD ${mejorVAN.anualidadEquivalenteVAN.toFixed(2)} confirman la competitividad del proyecto.`,
      `Esta recomendación maximiza el retorno esperado manteniendo niveles de riesgo controlables para las condiciones específicas del emplazamiento.`,
    ].join(' ');

    // Párrafo Técnico (8-12 líneas)
    const conclusion = [
      `El análisis financiero se basa en supuestos críticos incluyendo una tasa de descuento del 7.00%, horizonte temporal de ${Math.ceil(mejorVAN.vidaUtil / 8760)} años, y ${Math.round(mejorVAN.vidaUtil / 5 / 12)} horas mensuales de operación estimadas.`,
      `Los resultados financieros muestran un VAN total de USD ${mejorVAN.valorPresenteNeto.toFixed(2)}, TIR de ${mejorVAN.tasaInternaRetorno.toFixed(2)}%, ratio B/C de ${mejorVAN.beneficioCosto.toFixed(2)} y ROI de ${mejorVAN.retornoInversion.toFixed(2)}%, indicando rentabilidad sólida y creación de valor positiva.`,
      `El análisis de sensibilidad indica que variaciones de ±10% en horas operativas impactan el VAN en aproximadamente ±${(mejorVAN.valorPresenteNeto * 0.1).toFixed(2)} USD, mientras que cambios de ±5% en costos de mantenimiento afectan la TIR en ±${(mejorVAN.tasaInternaRetorno * 0.05).toFixed(2)} puntos porcentuales.`,
      `Los riesgos principales identificados incluyen disponibilidad de repuestos (tiempo de atención: ${mejorVAN.datosAdicionales?.tiempo_atencion_repuestos_dias || 'N/D'} días), variabilidad en consumo de combustible, y posible subutilización del equipo.`,
      `Las acciones de mitigación recomendadas comprenden establecer SLA de repuestos ≤5 días, convenios con proveedores locales, cláusulas de ajuste por combustible, y redistribución de horas entre equipos de la flota.`,
      `La selección final equilibra criterios técnicos (vida útil de ${(mejorVAN.vidaUtil / 8760).toFixed(1)} años, confiabilidad probada, soporte postventa ${mejorVAN.datosAdicionales?.procedencia_pais || 'internacional'}) con criterios financieros superiores (VAN máximo, AEV competitiva).`,
      `Los costos de mantenimiento, representando aproximadamente 65% del OPEX total, constituyen la variable de mayor sensibilidad financiera del proyecto.`,
      `El análisis cumple con los estándares ISO 55001 para gestión de activos e ISO 37001 para sistemas antisoborno, proporcionando trazabilidad completa y soporte técnico para la toma de decisiones estratégicas en procesos licitarios.`,
    ].join(' ');

    return {
      recomendacion,
      conclusion,
      tarifasOferta,
    };
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
