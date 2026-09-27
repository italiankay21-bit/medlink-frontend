// js/pharmacy-dashboard.js

const token = localStorage.getItem('medlink_pharmacist_token');
const pharmacyName = localStorage.getItem('medlink_pharmacy_name');

if (!token) {
  window.location.href = 'pharmacy-login.html';
}

document.getElementById('pharmacyNameLabel').textContent = pharmacyName || 'Pharmacy';

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('medlink_pharmacist_token');
  localStorage.removeItem('medlink_pharmacist_name');
  localStorage.removeItem('medlink_pharmacy_name');
  window.location.href = 'pharmacy-login.html';
});

const lookupForm = document.getElementById('lookupForm');
const lookupMessage = document.getElementById('lookupMessage');
const rxCard = document.getElementById('rxCard');
const dispenseForm = document.getElementById('dispenseForm');
const dispenseMessage = document.getElementById('dispenseMessage');

let currentCode = null;

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
}

function handleAuthFailure(status) {
  if (status === 401 || status === 403) {
    localStorage.removeItem('medlink_pharmacist_token');
    localStorage.removeItem('medlink_pharmacist_name');
    localStorage.removeItem('medlink_pharmacy_name');
    window.location.href = 'pharmacy-login.html';
    return true;
  }
  return false;
}

lookupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage(lookupMessage, '', '');
  rxCard.style.display = 'none';

  const code = document.getElementById('anonymousCode').value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/api/pharmacy/prescriptions/${encodeURIComponent(code)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (handleAuthFailure(response.status)) return;

    if (!response.ok) {
      showMessage(lookupMessage, data.error || 'Lookup failed', 'error');
      return;
    }

    currentCode = code;
    document.getElementById('rxDoctor').textContent = data.doctor_name;
    document.getElementById('rxHospital').textContent = data.hospital_name;
    document.getElementById('rxIssued').textContent = new Date(data.date_issued).toLocaleString();
    document.getElementById('rxExpiry').textContent = new Date(data.expiry_date).toLocaleDateString();
    document.getElementById('rxStatus').textContent = data.status;
    document.getElementById('rxInstructions').textContent = data.instructions || '(none given)';

    const medsContainer = document.getElementById('rxMedications');
    medsContainer.innerHTML = '';
    data.medications.forEach((med) => {
      const item = document.createElement('div');
      item.className = 'rx-med-item';
      item.textContent = `${med.medication_name} — ${med.dosage} — ${med.duration}`;
      medsContainer.appendChild(item);
    });

    showMessage(dispenseMessage, '', '');
    rxCard.style.display = 'block';
  } catch (err) {
    showMessage(lookupMessage, 'Could not reach the server. Is the backend running?', 'error');
  }
});

dispenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage(dispenseMessage, '', '');

  const quantityDispensed = document.getElementById('quantityDispensed').value.trim();
  const notes = document.getElementById('notes').value.trim();
  const fullyDispensed = document.getElementById('fullyDispensed').checked;

  try {
    const response = await fetch(`${API_BASE_URL}/api/pharmacy/dispense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ anonymousCode: currentCode, quantityDispensed, notes, fullyDispensed }),
    });

    const data = await response.json();

    if (handleAuthFailure(response.status)) return;

    if (!response.ok) {
      showMessage(dispenseMessage, data.error || 'Dispense failed', 'error');
      return;
    }

    showMessage(dispenseMessage, `Dispensed successfully. New status: ${data.status}`, 'success');
    document.getElementById('rxStatus').textContent = data.status;
  } catch (err) {
    showMessage(dispenseMessage, 'Could not reach the server. Is the backend running?', 'error');
  }
});
