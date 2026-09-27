// js/prescription.js

const token = localStorage.getItem('medlink_doctor_token');
const doctorName = localStorage.getItem('medlink_doctor_name');

// Auth guard: bounce back to login if there's no token at all.
// (This does NOT verify the token is still valid — the server does that
// on the actual request, and we handle a 401 response below.)
if (!token) {
  window.location.href = 'index.html';
}

document.getElementById('doctorNameLabel').textContent = doctorName || 'Doctor';

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('medlink_doctor_token');
  localStorage.removeItem('medlink_doctor_name');
  window.location.href = 'index.html';
});

const medicationsList = document.getElementById('medicationsList');
const addMedicationBtn = document.getElementById('addMedicationBtn');
const prescriptionForm = document.getElementById('prescriptionForm');
const messageBox = document.getElementById('message');

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

function addMedicationRow() {
  const row = document.createElement('div');
  row.className = 'medication-row';
  row.innerHTML = `
    <input type="text" class="med-name" placeholder="Medication name" required />
    <input type="text" class="med-dosage" placeholder="Dosage (e.g. 500mg)" required />
    <input type="text" class="med-duration" placeholder="Duration (e.g. 7 days)" required />
    <button type="button" class="removeMedBtn">✕</button>
  `;
  row.querySelector('.removeMedBtn').addEventListener('click', () => row.remove());
  medicationsList.appendChild(row);
}

// Start with one medication row already visible.
addMedicationRow();
addMedicationBtn.addEventListener('click', addMedicationRow);

prescriptionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('', '');

  const patientInternalId = Number(document.getElementById('patientInternalId').value);
  const instructions = document.getElementById('instructions').value.trim();

  const medications = Array.from(medicationsList.querySelectorAll('.medication-row')).map((row) => ({
    name: row.querySelector('.med-name').value.trim(),
    dosage: row.querySelector('.med-dosage').value.trim(),
    duration: row.querySelector('.med-duration').value.trim(),
  }));

  if (medications.length === 0) {
    showMessage('Add at least one medication.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/doctor/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ patientInternalId, medications, instructions }),
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      // Token expired/invalid — send them back to log in again.
      localStorage.removeItem('medlink_doctor_token');
      localStorage.removeItem('medlink_doctor_name');
      window.location.href = 'index.html';
      return;
    }

    if (!response.ok) {
      showMessage(data.error || 'Failed to create prescription', 'error');
      return;
    }

    showMessage(
      `Prescription created. Anonymous code: ${data.anonymousCode} (expires ${new Date(data.expiryDate).toLocaleDateString()})`,
      'success'
    );
    prescriptionForm.reset();
    medicationsList.innerHTML = '';
    addMedicationRow();
  } catch (err) {
    showMessage('Could not reach the server. Is the backend running?', 'error');
  }
});
