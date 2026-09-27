// js/login.js

const loginForm = document.getElementById('loginForm');
const messageBox = document.getElementById('message');

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('', '');

  const name = document.getElementById('name').value.trim();
  const licenseId = document.getElementById('licenseId').value.trim();
  const hospitalName = document.getElementById('hospitalName').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, licenseId, hospitalName, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || 'Login failed', 'error');
      return;
    }

    // Store the token so prescription.html can use it for authenticated requests.
    localStorage.setItem('medlink_doctor_token', data.token);
    localStorage.setItem('medlink_doctor_name', name);

    window.location.href = 'prescription.html';
  } catch (err) {
    showMessage('Could not reach the server. Is the backend running?', 'error');
  }
});
