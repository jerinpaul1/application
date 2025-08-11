const SUPABASE_URL = "https://tgnhbmqgdupnzkbofotf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

/* ========== AUTH FUNCTIONS ========== */

async function onLogin() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    console.error("Error fetching user:", error);
    return;
  }
  currentUser = user;

  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'block';
  loadApplications();
}

async function portfolio() {
  const email    = "jerinpaul4817@gmail.com";
  const password = "jerinpaul";
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('auth-message').innerText = error.message;
  } else {
    onLogin();
  }
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('auth-message').innerText = error.message;
  } else {
    onLogin();
  }
});

document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    document.getElementById('auth-message').innerText = error.message;
  } else {
    document.getElementById('auth-message').innerText = "Sign-up successful! Please log in.";
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  currentUser = null;
  document.getElementById('app-section').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('auth-message').innerText = '';
});

// Restore session if already logged in
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) onLogin();
});

/* ========== APPLICATION CRUD ========== */

// Add application
document.getElementById('add-btn').addEventListener('click', async () => {
  if (!currentUser) {
    console.error("No user logged in");
    return;
  }

  const application_name = document.getElementById('application_name').value.trim();
  const organization = document.getElementById('organization').value.trim();
  const deadline = document.getElementById('deadline').value || null;
  const status = document.getElementById('status').value;
  const date_applied = document.getElementById('date_applied').value || null;
  const follow_up_date = document.getElementById('follow_up_date').value || null;
  const notes = document.getElementById('notes').value.trim();
  const link = document.getElementById('link').value.trim();

  if (!application_name) {
    alert("Application Name is required");
    return;
  }

  // Optional: Validate URL format here if needed

  const { data, error } = await supabaseClient
    .from('applications')
    .insert([{
      user_id: currentUser.id,
      application_name,
      organization,
      deadline,
      status,
      date_applied,
      follow_up_date,
      notes,
      link
    }]);

  if (error) {
    console.error("Insert error:", error);
    alert("Insert error: " + error.message);
  } else {
    clearForm();
    loadApplications();
  }
});

// Load only current user's applications
async function loadApplications() {
  if (!currentUser) return;
  const { data, error } = await supabaseClient
    .from('applications')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Load error:", error);
    return;
  }
  renderApplications(data);
}

// Render table with editable fields: status, date_applied, follow_up_date, notes; link as button; delete button
function renderApplications(applications) {
  const tbody = document.getElementById('applications-body');
  tbody.innerHTML = '';

  applications.forEach(app => {
    const statusClass = `status-${app.status.toLowerCase().replace(/\s+/g, '-')}`;
    const row = document.createElement('tr');
    row.classList.add(statusClass);

    const safeLink = app.link && app.link.trim() !== '' ? app.link : '#';

    row.innerHTML = `
      <td>${app.application_name}</td>
      <td>${app.organization || ''}</td>
      <td>${app.deadline || ''}</td>
      <td>
        <select onchange="editField('${app.id}', 'status', this.value)">
          ${['Planned','Applied','Interview','Offer','Rejected','Withdrawn'].map(s =>
            `<option value="${s}" ${app.status === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </td>
      <td>
        <input type="date" value="${app.date_applied || ''}" onchange="editField('${app.id}', 'date_applied', this.value)">
      </td>
      <td>
        <input type="date" value="${app.follow_up_date || ''}" onchange="editField('${app.id}', 'follow_up_date', this.value)">
      </td>
      <td>
        <textarea onchange="editField('${app.id}', 'notes', this.value)" style="width: 100%; min-height: 60px;">${app.notes || ''}</textarea>
      </td>
      <td>
        <button onclick="window.open('${safeLink}', '_blank')" ${safeLink === '#' ? 'disabled title="No link saved"' : ''}>Open</button>
      </td>
      <td><button onclick="deleteApplication('${app.id}')">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Edit a single field in a row
async function editField(id, field, value) {
  const { error } = await supabaseClient
    .from('applications')
    .update({ [field]: value })
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (error) console.error("Update error:", error);
}

// Delete application
async function deleteApplication(id) {
  const { error } = await supabaseClient
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (error) {
    console.error("Delete error:", error);
  } else {
    loadApplications();
  }
}

// Clear form inputs after add
function clearForm() {
  document.getElementById('application_name').value = '';
  document.getElementById('organization').value = '';
  document.getElementById('deadline').value = '';
  document.getElementById('status').value = 'Planned';
  document.getElementById('date_applied').value = '';
  document.getElementById('follow_up_date').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('link').value = '';
}
