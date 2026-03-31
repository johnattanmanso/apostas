// js/utils.js
export function showLoader(show = true) {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.toggle('active', show);
}

export function formatCurrency(value) {
    return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

export function showAlert(message, type = 'info') {
    alert(message); // Pode ser substituído por toast mais bonito depois
}

export function confirmAction(message) {
    return confirm(message);
}