// js/pharmacy-login.js

const loginForm = document.getElementById('loginForm');
const messageBox = document.getElementById('message');

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('', '');

  const pharmacistName = document.getElementById('pharmacistName').value.trim();
  const pharmacyName = document.getElementById('pharmacyName').value.trim();
  const licenseNumber = document.getElementById('licenseNumber').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/pharmacy/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pharmacistName, pharmacyName, licenseNumber, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || 'Login failed', 'error');
      return;
    }

    localStorage.setItem('medlink_pharmacist_token', data.token);
    localStorage.setItem('medlink_pharmacist_name', pharmacistName);
    localStorage.setItem('medlink_pharmacy_name', pharmacyName);

    window.location.href = 'pharmacy-dashboard.html';
  } catch (err) {
    showMessage('Could not reach the server. Is the backend running?', 'error');
  }
});
