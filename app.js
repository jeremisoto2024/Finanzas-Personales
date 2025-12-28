// app.js - VERSIÓN OPTIMIZADA PARA MÓVIL
const API_BASE_URL = 'https://finanzas-personales-swart.vercel.app';
let pieChartInstance = null;

async function loadData() {
    showLoading(true);
    try {
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
        
        updateSummaryCards(resumen);
        updateExpenseList(categorias);
        updatePieChart(categorias);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error cargando datos', 'error');
    } finally {
        showLoading(false);
    }
}

function fixEncoding(text) {
    return text.replace(/Ã³/g, 'ó').replace(/Ã/g, 'í');
}

function updateSummaryCards(resumen) {
    document.getElementById('totalIncome').textContent = `${resumen.total_income.toFixed(2)} €`;
    document.getElementById('totalExpenses').textContent = `${resumen.total_expenses.toFixed(2)} €`;
    document.getElementById('availableBalance').textContent = `${resumen.available_balance.toFixed(2)} €`;
}

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
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function getCategoryColor(category) {
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    // Puedes implementar esto después si quieres notificaciones
    console.log(`${type}: ${message}`);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refreshBtn').addEventListener('click', loadData);
    loadData();
});
// Efecto de partículas sutiles en el fondo (opcional)
function addBackgroundEffect() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.2,
            color: `rgba(67, 97, 238, ${Math.random() * 0.1 + 0.05})`
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.y -= p.speed;
            if (p.y < 0) p.y = canvas.height;
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Iniciar efectos cuando la página cargue
document.addEventListener('DOMContentLoaded', () => {
    // Descomenta la siguiente línea si quieres el efecto de partículas
    // addBackgroundEffect();
    
    // Añadir fecha actual al header
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = date.toLocaleDateString('es-ES', options);
    
    const dateElement = document.createElement('div');
    dateElement.className = 'current-date';
    dateElement.innerHTML = `<span>📅</span> ${dateString}`;
    dateElement.style.cssText = `
        font-size: 0.85rem;
        color: var(--gray-800);
        margin-top: 0.25rem;
        opacity: 0.9;
    `;
    
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.appendChild(dateElement);
    }
});