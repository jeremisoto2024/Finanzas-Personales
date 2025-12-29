// Configuración global para Chart.js
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';

// Función para formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Función para calcular el color según porcentaje
function getPorcentajeColor(porcentaje) {
    if (porcentaje < 60) return '#10b981';
    if (porcentaje < 85) return '#f59e0b';
    return '#ef4444';
}

// Función para generar alertas inteligentes basadas en datos reales
function generarAlertasInteligentes(data) {
    const alertas = [];
    
    if (!data) return alertas;
    
    // Calcular porcentaje de gastos vs ingresos
    const porcentajeGastos = (data.totalGastos / data.totalIngresos) * 100;
    
    if (porcentajeGastos > 70) {
        alertas.push({
            icono: '⚠️',
            mensaje: `Estás gastando el ${porcentajeGastos.toFixed(1)}% de tus ingresos. Considera reducir gastos no esenciales.`,
            tipo: 'alerta-warning'
        });
    } else if (porcentajeGastos > 0) {
        alertas.push({
            icono: '✅',
            mensaje: `¡Buen trabajo! Tus gastos representan el ${porcentajeGastos.toFixed(1)}% de tus ingresos.`,
            tipo: 'alerta-success'
        });
    }
    
    // Verificar saldo disponible
    if (data.balance > 1000) {
        alertas.push({
            icono: '💰',
            mensaje: '¡Excelente! Tienes un buen colchón financiero.',
            tipo: 'alerta-success'
        });
    } else if (data.balance < 0) {
        alertas.push({
            icono: '🚨',
            mensaje: '¡Atención! Tienes saldo negativo. Revisa tus gastos urgentemente.',
            tipo: 'alerta-warning'
        });
    }
    
    // Aquí puedes añadir más lógica basada en tus datos reales
    // Por ejemplo, detectar categorías con mayor gasto
    if (data.gastosPorCategoria && Object.keys(data.gastosPorCategoria).length > 0) {
        const maxCategoria = Object.entries(data.gastosPorCategoria)
            .reduce((max, [cat, val]) => val > max.val ? {cat, val} : max, {val: 0});
        
        if (maxCategoria.val > 0) {
            alertas.push({
                icono: '📊',
                mensaje: `Tu mayor gasto es en ${maxCategoria.cat}: ${formatCurrency(maxCategoria.val)}`,
                tipo: 'alerta-info'
            });
        }
    }
    
    return alertas;
}

// Función para renderizar presupuestos
function renderPresupuestos(presupuestosData) {
    const container = document.getElementById('presupuestos-container');
    
    if (!presupuestosData || presupuestosData.length === 0) {
        container.innerHTML = `
            <div class="presupuesto-card">
                <div class="presupuesto-header">
                    <div class="presupuesto-titulo">
                        📋 Configura tus presupuestos
                    </div>
                </div>
                <p style="color: var(--muted-text); text-align: center; padding: 1rem;">
                    Configura límites de gasto por categoría para un mejor control financiero.
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = presupuestosData.map(presupuesto => {
        const porcentaje = presupuesto.presupuesto > 0 ? 
            (presupuesto.gastado / presupuesto.presupuesto) * 100 : 0;
        const color = getPorcentajeColor(porcentaje);
        
        return `
            <div class="presupuesto-card">
                <div class="presupuesto-header">
                    <div class="presupuesto-titulo">
                        ${presupuesto.icono || '📊'} ${presupuesto.categoria}
                    </div>
                    <div class="presupuesto-monto">
                        ${formatCurrency(presupuesto.gastado)} / ${formatCurrency(presupuesto.presupuesto)}
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" 
                         style="width: ${Math.min(porcentaje, 100)}%; background: ${color};">
                    </div>
                </div>
                <div class="presupuesto-info">
                    <span>${porcentaje.toFixed(1)}% utilizado</span>
                    <span>Restante: ${formatCurrency(presupuesto.presupuesto - presupuesto.gastado)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Función para renderizar proyecciones
function renderProyecciones(data) {
    const container = document.getElementById('proyeccion-container');
    
    if (!data) {
        container.innerHTML = '<div class="cargando">Cargando proyecciones...</div>';
        return;
    }
    
    // Calcular proyecciones basadas en datos reales
    const hoy = new Date();
    const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diasTranscurridos = hoy.getDate();
    const diasRestantes = diasEnMes - diasTranscurridos;
    
    const gastoDiarioPromedio = data.totalGastos / diasTranscurridos;
    const ingresoDiarioPromedio = data.totalIngresos / diasTranscurridos;
    
    const proyeccionRealista = data.totalIngresos + (ingresoDiarioPromedio * diasRestantes) - 
                              (data.totalGastos + (gastoDiarioPromedio * diasRestantes));
    
    const proyeccionOptimista = data.totalIngresos + (ingresoDiarioPromedio * diasRestantes) - 
                               (data.totalGastos + (gastoDiarioPromedio * diasRestantes * 0.8));
    
    const proyeccionPesimista = data.totalIngresos + (ingresoDiarioPromedio * diasRestantes) - 
                               (data.totalGastos + (gastoDiarioPromedio * diasRestantes * 1.2));
    
    container.innerHTML = `
        <div class="proyeccion-card">
            <div class="proyeccion-icono">🚀</div>
            <h3>Optimista</h3>
            <div class="proyeccion-valor" style="color: #10b981;">
                ${formatCurrency(proyeccionOptimista)}
            </div>
            <p>Si reduces gastos en 20%</p>
        </div>
        
        <div class="proyeccion-card">
            <div class="proyeccion-icono">📈</div>
            <h3>Realista</h3>
            <div class="proyeccion-valor" style="color: #3b82f6;">
                ${formatCurrency(proyeccionRealista)}
            </div>
            <p>Manteniendo el ritmo actual</p>
        </div>
        
        <div class="proyeccion-card">
            <div class="proyeccion-icono">⚠️</div>
            <h3>Pesimista</h3>
            <div class="proyeccion-valor" style="color: #ef4444;">
                ${formatCurrency(proyeccionPesimista)}
            </div>
            <p>Si aumentas gastos en 20%</p>
        </div>
    `;
}

// Función para actualizar el dashboard con datos reales
async function actualizarDashboard() {
    try {
        // Muestra loading
        document.getElementById('loading').style.display = 'flex';
        
        // Aquí llamas a tu API para obtener datos reales
        // Ejemplo:
        // const response = await fetch('/api/dashboard-data');
        // const data = await response.json();
        
        // Por ahora, uso datos de ejemplo. Reemplaza esto con tu llamada real:
        const data = await obtenerDatosReales(); // Esta función debería ser tu llamada real a la API
        
        // Actualizar tarjetas de resumen
        document.getElementById('totalIncome').textContent = formatCurrency(data.totalIngresos);
        document.getElementById('totalExpenses').textContent = formatCurrency(data.totalGastos);
        document.getElementById('availableBalance').textContent = formatCurrency(data.balance);
        
        // Renderizar alertas inteligentes
        const alertasContainer = document.getElementById('alertas-container');
        const alertas = generarAlertasInteligentes(data);
        
        alertasContainer.innerHTML = alertas.map(alerta => `
            <div class="alerta-item ${alerta.tipo}">
                <span class="alerta-icono">${alerta.icono}</span>
                <span class="alerta-texto">${alerta.mensaje}</span>
            </div>
        `).join('');
        
        // Renderizar presupuestos (si tienes datos de presupuestos)
        if (data.presupuestos) {
            renderPresupuestos(data.presupuestos);
        }
        
        // Renderizar proyecciones
        renderProyecciones(data);
        
        // Aquí mantienes tu lógica existente para gráficos y lista de gastos
        // Solo asegúrate de que use los mismos datos reales
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        // Manejo de errores
    } finally {
        // Oculta loading
        document.getElementById('loading').style.display = 'none';
    }
}

// Función de ejemplo para obtener datos reales - REEMPLAZA ESTO CON TU LÓGICA REAL
async function obtenerDatosReales() {
    // Esta es una función de ejemplo. Reemplázala con tu lógica real de API
    
    // Simulación de datos - tus datos reales vendrán de tu backend
    return {
        totalIngresos: 4850.75,
        totalGastos: 3120.50,
        balance: 1730.25,
        gastosPorCategoria: {
            'Alimentación': 850.00,
            'Transporte': 420.50,
            'Entretenimiento': 320.00,
            'Servicios': 650.00,
            'Compras': 880.00
        },
        presupuestos: [
            { categoria: 'Alimentación', presupuesto: 1000, gastado: 850, icono: '🍔' },
            { categoria: 'Transporte', presupuesto: 500, gastado: 420.5, icono: '🚗' },
            { categoria: 'Entretenimiento', presupuesto: 400, gastado: 320, icono: '🎬' },
            { categoria: 'Servicios', presupuesto: 700, gastado: 650, icono: '🏠' },
            { categoria: 'Compras', presupuesto: 1000, gastado: 880, icono: '🛍️' }
        ]
    };
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar dashboard
    actualizarDashboard();
    
    // Configurar botón de actualizar
    document.getElementById('refreshBtn').addEventListener('click', () => {
        // Animación del botón
        const btn = document.getElementById('refreshBtn');
        btn.style.transform = 'rotate(180deg)';
        btn.style.transition = 'transform 0.5s';
        
        setTimeout(() => {
            btn.style.transform = 'rotate(0deg)';
            actualizarDashboard();
        }, 500);
    });
    
    // Añadir animaciones de entrada
    setTimeout(() => {
        const elements = document.querySelectorAll('.summary-card, .chart-card, .alerta-item');
        elements.forEach((el, i) => {
            el.style.animation = `fadeInUp 0.6s ease-out ${i * 0.1}s both`;
        });
    }, 300);
});