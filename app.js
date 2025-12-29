// app.js - VERSIÓN COMPLETA CON ALERTAS Y PRESUPUESTOS
const API_BASE_URL = 'https://finanzas-personales-swart.vercel.app';
let pieChartInstance = null;

// 🆕 TUS PRESUPUESTOS MENSUALES (ajusta estos valores)
const PRESUPUESTOS = {
    'Alimentación': 250,
    'Salud e higiene': 100,
    'Transporte': 80,
    'Ocio': 150,
    'Vivienda': 500,
    'Otros': 200
};

// ===== FUNCIÓN PRINCIPAL =====
async function loadData() {
    showLoading(true);
    try {
        // Cargar datos de la API
        const [resResumen, resCategorias] = await Promise.all([
            fetch(`${API_BASE_URL}/api/financial-summary`),
            fetch(`${API_BASE_URL}/api/expenses-by-category`)
        ]);
        
        const resumen = await resResumen.json();
        let categorias = await resCategorias.json();
        
        // Corregir caracteres
        categorias = categorias.map(item => ({
            ...item,
            category: fixEncoding(item.category)
        }));
        
        // Actualizar todas las secciones
        updateSummaryCards(resumen);
        updateExpenseList(categorias);
        updatePieChart(categorias);
        
        // 🆕 Alertas inteligentes
        const alertas = generarAlertas(resumen, categorias);
        mostrarAlertas(alertas);
        
        // 🆕 Presupuestos visuales
        mostrarPresupuestos(categorias);
        
        // 🆕 Proyección de fin de mes
        mostrarProyeccionFinDeMes(resumen, categorias);
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarMensajeError('No se pudieron cargar los datos. Revisa tu conexión.');
    } finally {
        showLoading(false);
    }
}

// ===== FUNCIONES DE AYUDA =====
function fixEncoding(text) {
    return text.replace(/Ã³/g, 'ó').replace(/Ã/g, 'í');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function mostrarMensajeError(mensaje) {
    // Puedes mejorar esto mostrando un mensaje en pantalla
    console.error('Error:', mensaje);
}

// ===== ACTUALIZAR TARJETAS DE RESUMEN =====
function updateSummaryCards(resumen) {
    document.getElementById('totalIncome').textContent = `${resumen.total_income.toFixed(2)} €`;
    document.getElementById('totalExpenses').textContent = `${resumen.total_expenses.toFixed(2)} €`;
    document.getElementById('availableBalance').textContent = `${resumen.available_balance.toFixed(2)} €`;
}

// ===== ACTUALIZAR LISTA DE GASTOS =====
function updateExpenseList(categorias) {
    const expenseList = document.getElementById('expenseList');
    
    if (categorias.length === 0) {
        expenseList.innerHTML = '<div class="empty-state">No hay gastos registrados</div>';
        return;
    }
    
    let html = '';
    categorias.forEach(item => {
        html += `
            <div class="expense-item">
                <div class="expense-category">
                    <span class="expense-color" style="background-color: ${getCategoryColor(item.category)}"></span>
                    <span>${item.category}</span>
                </div>
                <div class="expense-details">
                    <span class="expense-amount">${item.amount.toFixed(2)} €</span>
                    <span class="expense-percentage">${item.percentage}%</span>
                </div>
            </div>
        `;
    });
    
    expenseList.innerHTML = html;
}

// ===== ACTUALIZAR GRÁFICO CIRCULAR =====
function updatePieChart(categorias) {
    const canvas = document.getElementById('pieChart');
    const emptyState = document.getElementById('pieChartEmpty');
    
    if (categorias.length === 0) {
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    if (pieChartInstance) pieChartInstance.destroy();
    
    pieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: categorias.map(item => item.category),
            datasets: [{
                data: categorias.map(item => item.amount),
                backgroundColor: categorias.map(item => getCategoryColor(item.category))
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// ===== COLORES PARA CATEGORÍAS =====
function getCategoryColor(category) {
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// ===== 🆕 SISTEMA DE ALERTAS INTELIGENTES =====
function generarAlertas(resumen, categorias) {
    const alertas = [];
    
    // 🔴 Alerta 1: BALANCE NEGATIVO
    if (resumen.available_balance < 0) {
        alertas.push({
            tipo: 'peligro',
            mensaje: `Balance negativo: €${Math.abs(resumen.available_balance).toFixed(2)}`,
            icono: '🔴'
        });
    }
    
    // 🟠 Alerta 2: GASTÓ MÁS DEL 90% DE INGRESOS
    if (resumen.total_income > 0) {
        const porcentajeGastado = (resumen.total_expenses / resumen.total_income) * 100;
        if (porcentajeGastado >= 90) {
            alertas.push({
                tipo: 'advertencia',
                mensaje: `Cuidado: Has gastado el ${Math.round(porcentajeGastado)}% de tus ingresos`,
                icono: '⚠️'
            });
        }
    }
    
    // 🟢 Alerta 3: GASTOS BAJOS (positiva)
    if (resumen.total_expenses < resumen.total_income * 0.5 && resumen.total_income > 0) {
        alertas.push({
            tipo: 'positiva',
            mensaje: `¡Vas bien! Gastos por debajo del 50% de tus ingresos`,
            icono: '✅'
        });
    }
    
    // 🔵 Alerta 4: SIN DATOS
    if (resumen.total_income === 0 && resumen.total_expenses === 0) {
        alertas.push({
            tipo: 'info',
            mensaje: `Comienza registrando tus primeros ingresos y gastos`,
            icono: '💡'
        });
    }
    
    // 📊 Alerta 5: GENÉRICA (si no hay otras)
    if (alertas.length === 0) {
        alertas.push({
            tipo: 'info',
            mensaje: `Todo en orden. Sigue controlando tus finanzas.`,
            icono: '📊'
        });
    }
    
    return alertas;
}

function mostrarAlertas(alertas) {
    const container = document.getElementById('alertas-container');
    if (!container) return;
    
    let html = '';
    alertas.forEach(alerta => {
        html += `
            <div class="alerta-item alerta-${alerta.tipo}">
                <span class="alerta-icono">${alerta.icono}</span>
                <span class="alerta-texto">${alerta.mensaje}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ===== 🆕 PRESUPUESTOS VISUALES =====
function mostrarPresupuestos(gastosPorCategoria) {
    const container = document.getElementById('presupuestos-container');
    if (!container) return;
    
    if (gastosPorCategoria.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay datos para mostrar presupuestos</div>';
        return;
    }
    
    let html = '<div class="presupuestos-grid">';
    
    gastosPorCategoria.forEach(item => {
        const presupuesto = PRESUPUESTOS[item.category] || 100;
        const porcentaje = Math.min((item.amount / presupuesto) * 100, 100);
        const esExcedido = porcentaje >= 90;
        const esAdvertencia = porcentaje >= 70 && porcentaje < 90;
        
        html += `
            <div class="presupuesto-item ${esExcedido ? 'excedido' : esAdvertencia ? 'advertencia' : 'bueno'}">
                <div class="presupuesto-header">
                    <span>${item.category}</span>
                    <span>€${item.amount.toFixed(2)} / €${presupuesto}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${porcentaje}%"></div>
                </div>
                <div class="presupuesto-footer">
                    <span>${porcentaje.toFixed(0)}%</span>
                    ${esExcedido ? '<span class="alerta-texto">¡Cerca del límite!</span>' : 
                      esAdvertencia ? '<span class="advertencia-texto">Controla tus gastos</span>' : 
                      '<span class="positivo-texto">Bien</span>'}
                </div>
            </div>
        `;
    });
    
    // Añadir categorías sin gastos
    Object.keys(PRESUPUESTOS).forEach(categoria => {
        const tieneGastos = gastosPorCategoria.some(gasto => gasto.category === categoria);
        if (!tieneGastos) {
            html += `
                <div class="presupuesto-item bueno">
                    <div class="presupuesto-header">
                        <span>${categoria}</span>
                        <span>€0 / €${PRESUPUESTOS[categoria]}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="presupuesto-footer">
                        <span>0%</span>
                        <span class="positivo-texto">Sin gastos</span>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ===== 🆕 PROYECCIÓN FIN DE MES =====
function mostrarProyeccionFinDeMes(resumen, categorias) {
    const container = document.getElementById('proyeccion-container');
    if (!container) return;
    
    const hoy = new Date();
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diasTranscurridos = hoy.getDate();
    const diasRestantes = ultimoDiaMes - diasTranscurridos;
    
    // Gasto promedio diario
    const gastoPromedioDiario = resumen.total_expenses / diasTranscurridos;
    
    // Proyección
    const proyeccionGasto = resumen.total_expenses + (gastoPromedioDiario * diasRestantes);
    const balanceProyectado = resumen.total_income - proyeccionGasto;
    
    // Gasto diario recomendado para llegar a 0
    const disponibleRestante = resumen.available_balance;
    const gastoDiarioRecomendado = disponibleRestante / diasRestantes;
    
    let html = '';
    
    if (balanceProyectado < 0) {
        html = `
            <div class="proyeccion-item peligro">
                <div class="proyeccion-icono">⚠️</div>
                <div class="proyeccion-contenido">
                    <div class="proyeccion-titulo">Proyección negativa</div>
                    <div class="proyeccion-descripcion">
                        Si sigues así, terminarás con <strong>€${Math.abs(balanceProyectado).toFixed(2)} negativo</strong>
                    </div>
                    <div class="proyeccion-datos">
                        <div class="dato-item">
                            <span>Gasto diario actual:</span>
                            <strong>€${gastoPromedioDiario.toFixed(2)}</strong>
                        </div>
                        <div class="dato-item">
                            <span>Máximo diario recomendado:</span>
                            <strong>€${gastoDiarioRecomendado.toFixed(2)}</strong>
                        </div>
                        <div class="dato-item">
                            <span>Días restantes:</span>
                            <strong>${diasRestantes}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="proyeccion-item positiva">
                <div class="proyeccion-icono">✅</div>
                <div class="proyeccion-contenido">
                    <div class="proyeccion-titulo">Proyección positiva</div>
                    <div class="proyeccion-descripcion">
                        Vas bien. Proyección: <strong>€${balanceProyectado.toFixed(2)} disponible</strong> a fin de mes
                    </div>
                    <div class="proyeccion-datos">
                        <div class="dato-item">
                            <span>Puedes gastar hasta:</span>
                            <strong>€${gastoDiarioRecomendado.toFixed(2)} diarios</strong>
                        </div>
                        <div class="dato-item">
                            <span>Días restantes:</span>
                            <strong>${diasRestantes}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    // Configurar botón de actualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadData);
    }
    
    // Cargar datos iniciales
    loadData();
    
    // Añadir fecha actual al header
    try {
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = date.toLocaleDateString('es-ES', options);
        
        const dateElement = document.createElement('div');
        dateElement.className = 'current-date';
        dateElement.innerHTML = `<span>📅</span> ${dateString}`;
        dateElement.style.cssText = `
            font-size: 0.85rem;
            color: #64748b;
            margin-top: 0.25rem;
            opacity: 0.9;
        `;
        
        const headerTitle = document.querySelector('.header-title');
        if (headerTitle) {
            headerTitle.appendChild(dateElement);
        }
    } catch (e) {
        console.log('No se pudo añadir la fecha:', e);
    }
});
// ===== MEJORAS PREMIUM (añade esto al final de tu app.js original) =====

// Animaciones de entrada
function addPremiumAnimations() {
    setTimeout(() => {
        const elements = document.querySelectorAll('.summary-card, .chart-card, .alerta-item, .presupuesto-card, .proyeccion-card');
        elements.forEach((el, i) => {
            el.style.animation = `fadeInUp 0.6s ease-out ${i * 0.1}s both`;
            el.style.opacity = '0';
        });
    }, 100);
}

// Animación de números
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + eased * (end - start);
        
        element.textContent = formatCurrency(current);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

// Función para formatear moneda (si no la tienes)
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    }).format(amount || 0);
}

// Mejora el botón de refresh
document.getElementById('refreshBtn').addEventListener('click', function() {
    this.style.transform = 'rotate(180deg)';
    this.style.transition = 'transform 0.5s';
    
    setTimeout(() => {
        this.style.transform = 'rotate(0deg)';
        // Aquí llama tu función original de actualización
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }, 500);
});

// Llama a las animaciones cuando cargue la página
document.addEventListener('DOMContentLoaded', addPremiumAnimations);