const SUPABASE_URL = "https://tgnhbmqgdupnzkbofotf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// AUTH HANDLING
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) document.getElementById('auth-message').innerText = error.message;
  else onLogin(data.user);
});

document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) document.getElementById('auth-message').innerText = error.message;
  else document.getElementById('auth-message').innerText = "Sign-up successful! Please log in.";
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  document.getElementById('app-section').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
});

async function onLogin(user) {
  currentUser = user;
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'block';
  loadApplications();
}

// ADD APPLICATION
document.getElementById('add-btn').addEventListener('click', async () => {
  const { error } = await supabaseClient.from('applications').insert([{
    user_id: currentUser.id,
    application_name: document.getElementById('application_name').value,
    organization: document.getElementById('organization').value,
    deadline: document.getElementById('deadline').value || null,
    status: document.getElementById('status').value,
    date_applied: document.getElementById('date_applied').value || null,
    follow_up_date: document.getElementById('follow_up_date').value || null,
    notes: document.getElementById('notes').value
  }]);
  if (!error) loadApplications();
});

// LOAD APPLICATIONS
async function loadApplications() {
  const { data, error } = await supabaseClient
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (!error) renderApplications(data);
}

// RENDER TABLE
function renderApplications(applications) {
  const tbody = document.getElementById('applications-body');
  tbody.innerHTML = '';
  applications.forEach(app => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${app.application_name}</td>
      <td>${app.organization || ''}</td>
      <td>${app.deadline || ''}</td>
      <td>${app.status}</td>
      <td>${app.date_applied || ''}</td>
      <td>${app.follow_up_date || ''}</td>
      <td>${app.notes || ''}</td>
      <td><button onclick="deleteApplication('${app.id}')">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

// DELETE APPLICATION
async function deleteApplication(id) {
  await supabaseClient.from('applications').delete().eq('id', id);
  loadApplications();
}

// Check if already logged in
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) onLogin(data.session.user);
});
