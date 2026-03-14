// ============================================================
//  MOVIE SCREENING REGISTRATION — script.js
//  GMERS Gotri MBBS | Dhurandhar: The Revenge
// ============================================================

// ── 1. SUPABASE CONFIG ──────────────────────────────────────
// Paste your Supabase project URL and anon key below.
// Find them at: https://supabase.com → Project → Settings → API

const SUPABASE_URL = "https://vqjotdmysngjvmbxkovr.supabase.co"; // ← REPLACE
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxam90ZG15c25nanZtYnhrb3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjI2NTksImV4cCI6MjA4OTAzODY1OX0.w-YW5jzEBF3VIZcoRbqNIPYiGgpCAB9iNUF8qcDn9oE"; //

const MAX_SEATS = 100;

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── 2. STATE ─────────────────────────────────────────────────
let allStudents = []; // full list from DB
let selectedIds = new Set(); // currently selected student IDs
let lastReceipt = null; // receipt data for PDF download

// ── 3. INIT ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadStudents(), updateCounter()]);
});

// ── 4. LOAD STUDENTS ─────────────────────────────────────────
async function loadStudents() {
  const { data, error } = await db.from("students").select("*").order("id");

  if (error) {
    showError("Failed to load students. Check your Supabase config.");
    console.error(error);
    return;
  }

  allStudents = data;
  renderStudentList(allStudents);
}

// ── 5. RENDER STUDENT LIST ───────────────────────────────────
function renderStudentList(students) {
  const list = document.getElementById("student-list");
  list.innerHTML = "";

  if (!students.length) {
    list.innerHTML =
      '<p class="text-center py-8 text-sm" style="color:rgba(250,246,238,0.4);">No students found.</p>';
    return;
  }

  students.forEach((student) => {
    const registered = student.is_registered;
    const checked = selectedIds.has(student.id);

    const item = document.createElement("label");
    item.className = `student-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${registered ? "is-disabled" : ""}`;
    item.dataset.id = student.id;

    item.innerHTML = `
      <input
        type="checkbox"
        data-id="${student.id}"
        data-name="${escapeHtml(student.name)}"
        ${registered ? "disabled checked" : ""}
        ${!registered && checked ? "checked" : ""}
        onchange="toggleStudent(${student.id}, '${escapeHtml(student.name)}')"
      />
      <span class="flex-1 text-sm" style="color:${registered ? "rgba(250,246,238,0.45)" : "var(--parchment)"};">
        ${escapeHtml(student.name)}
      </span>
      ${registered ? '<span class="text-xs px-2 py-0.5 rounded-full" style="background:rgba(201,168,76,0.12);color:var(--gold);">Registered</span>' : ""}
    `;

    list.appendChild(item);
  });
}

// ── 6. SEARCH / FILTER ───────────────────────────────────────
function filterStudents() {
  const query = document.getElementById("search-box").value.toLowerCase();
  const filtered = allStudents.filter((s) =>
    s.name.toLowerCase().includes(query),
  );
  renderStudentList(filtered);
}

// ── 7. TOGGLE STUDENT SELECTION ──────────────────────────────
function toggleStudent(id, name) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  updateSelectedPreview();
  validateAndUpdateBtn();
}

// ── 8. UPDATE SELECTED PREVIEW ───────────────────────────────
function updateSelectedPreview() {
  const preview = document.getElementById("selected-preview");
  const names = document.getElementById("selected-names");
  const badge = document.getElementById("selected-count-badge");

  if (selectedIds.size === 0) {
    preview.classList.add("hidden");
    return;
  }

  preview.classList.remove("hidden");
  badge.textContent = `${selectedIds.size} selected`;

  // Get names from allStudents
  const selectedStudents = allStudents.filter((s) => selectedIds.has(s.id));
  names.innerHTML = selectedStudents
    .map((s, i) => `<p>${i + 1}. ${escapeHtml(s.name)}</p>`)
    .join("");
}

// ── 9. VALIDATE & TOGGLE REGISTER BUTTON ─────────────────────
function validateAndUpdateBtn() {
  const btn = document.getElementById("register-btn");
  const count = selectedIds.size;

  hideError();

  // Check any already-registered are in selection (shouldn't happen via UI, safety check)
  const alreadyReg = allStudents.filter(
    (s) => s.is_registered && selectedIds.has(s.id),
  );
  if (alreadyReg.length > 0) {
    showError("One or more selected students are already registered.");
    btn.disabled = true;
    return;
  }

  if (count < 1) {
    btn.disabled = true;
    return;
  }

  // Check seat availability
  const seatsUsed = allStudents.filter((s) => s.is_registered).length;
  if (seatsUsed + count > MAX_SEATS) {
    showError(
      `Only ${MAX_SEATS - seatsUsed} seat(s) remaining. Please reduce your group size.`,
    );
    btn.disabled = true;
    return;
  }

  btn.disabled = false;
}

// ── 10. UPDATE SEAT COUNTER ──────────────────────────────────
async function updateCounter() {
  const { data, error } = await db
    .from("students")
    .select("id", { count: "exact" })
    .eq("is_registered", true);

  if (error) {
    console.error(error);
    return;
  }

  const filled = data.length;
  const pct = Math.round((filled / MAX_SEATS) * 100);

  document.getElementById("seats-counter").textContent =
    `${filled} / ${MAX_SEATS}`;
  document.getElementById("progress-bar").style.width =
    `${Math.min(pct, 100)}%`;

  const remaining = MAX_SEATS - filled;
  const statusEl = document.getElementById("seats-status");

  if (remaining <= 0) {
    statusEl.textContent = "🔴 All seats are filled!";
    statusEl.style.color = "#fca5a5";
  } else if (remaining <= 10) {
    statusEl.textContent = `⚠️ Only ${remaining} seat(s) left — register quickly!`;
    statusEl.style.color = "#fde68a";
  } else {
    statusEl.textContent = `${remaining} seat(s) still available`;
    statusEl.style.color = "rgba(250,246,238,0.4)";
  }
}

// ── 11. REGISTER GROUP ───────────────────────────────────────
async function registerGroup() {
  if (selectedIds.size === 0) return;

  const btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>&nbsp; Registering…';
  hideError();

  try {
    const selectedArr = Array.from(selectedIds);
    const groupSize = selectedArr.length;

    // ── a. Re-check registrations (prevent race conditions) ──
    const { data: freshStudents } = await db
      .from("students")
      .select("id, is_registered")
      .in("id", selectedArr);

    const alreadyReg = freshStudents.filter((s) => s.is_registered);
    if (alreadyReg.length > 0) {
      throw new Error(
        "One or more selected students were just registered by someone else. Please refresh.",
      );
    }

    // ── b. Get highest end_sequence ──────────────────────────
    const { data: lastReg } = await db
      .from("registrations")
      .select("end_sequence")
      .order("end_sequence", { ascending: false })
      .limit(1);

    const lastEnd = lastReg && lastReg.length > 0 ? lastReg[0].end_sequence : 0;
    const startSeq = lastEnd + 1;
    const endSeq = lastEnd + groupSize;

    // ── c. Check seat limit ──────────────────────────────────
    if (endSeq > MAX_SEATS) {
      throw new Error(
        `Not enough seats. Only ${MAX_SEATS - lastEnd} seat(s) remaining.`,
      );
    }

    // ── d. Insert registration record ────────────────────────
    const leaderId = selectedArr[0]; // first selected = group leader
    const { error: insertError } = await db.from("registrations").insert({
      leader_id: leaderId,
      members: selectedArr,
      group_size: groupSize,
      start_sequence: startSeq,
      end_sequence: endSeq,
    });

    if (insertError) throw insertError;

    // ── e. Mark students as registered ──────────────────────
    const { error: updateError } = await db
      .from("students")
      .update({ is_registered: true })
      .in("id", selectedArr);

    if (updateError) throw updateError;

    // ── f. Build receipt data ─────────────────────────────────
    const leaderStudent = allStudents.find((s) => s.id === leaderId);
    const memberStudents = allStudents.filter((s) =>
      selectedArr.includes(s.id),
    );
    const seats = [];
    for (let i = startSeq; i <= endSeq; i++) seats.push(i);

    lastReceipt = {
      leader: leaderStudent.name,
      members: memberStudents.map((s) => s.name),
      seats,
      timestamp: new Date().toLocaleString("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
      }),
    };

    // ── g. Refresh UI ─────────────────────────────────────────
    await loadStudents();
    await updateCounter();
    selectedIds.clear();
    showSuccessPanel(lastReceipt);
  } catch (err) {
    console.error(err);
    showError(err.message || "Registration failed. Please try again.");
    btn.disabled = false;
    btn.textContent = "Register Group";
  }
}

// ── 12. SHOW SUCCESS PANEL ────────────────────────────────────
function showSuccessPanel(data) {
  document.getElementById("registration-panel").classList.add("hidden");
  const panel = document.getElementById("success-panel");
  panel.classList.remove("hidden");

  document.getElementById("receipt-leader").textContent = data.leader;

  document.getElementById("receipt-members").innerHTML = data.members
    .map((n, i) => `<p>${i + 1}. ${escapeHtml(n)}</p>`)
    .join("");

  const seatsEl = document.getElementById("receipt-seats");
  seatsEl.innerHTML = data.seats
    .map((n) => `<div class="seat-badge">${n}</div>`)
    .join("");

  document.getElementById("receipt-time").textContent = data.timestamp;
}

// ── 13. RESET FORM ────────────────────────────────────────────
function resetForm() {
  selectedIds.clear();
  lastReceipt = null;
  document.getElementById("success-panel").classList.add("hidden");
  document.getElementById("registration-panel").classList.remove("hidden");
  document.getElementById("search-box").value = "";
  document.getElementById("selected-preview").classList.add("hidden");
  document.getElementById("register-btn").disabled = true;
  document.getElementById("register-btn").textContent = "Register Group";
  hideError();
  renderStudentList(allStudents);
}

// ── 14. DOWNLOAD RECEIPT (jsPDF) ──────────────────────────────
function downloadReceipt() {
  if (!lastReceipt) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a5" });

  const W = doc.internal.pageSize.getWidth();
  let y = 18;
  const gold = [177, 135, 45];
  const dark = [20, 20, 20];
  const grey = [90, 90, 90];

  // Background
  doc.setFillColor(13, 13, 13);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), "F");

  // Header bar
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 2, "F");

  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(201, 168, 76);
  doc.text("Movie Screening", W / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(13);
  doc.text("Registration Receipt", W / 2, y, { align: "center" });
  y += 10;

  // Gold line
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.line(14, y, W - 14, y);
  y += 8;

  // Movie info
  doc.setFontSize(11);
  doc.setFont("times", "bold");
  doc.setTextColor(220, 190, 100);
  doc.text("Movie", 14, y);
  doc.setFont("times", "normal");
  doc.setTextColor(240, 235, 225);
  doc.text("Dhurandhar: The Revenge", 60, y);
  y += 7;

  doc.setFont("times", "bold");
  doc.setTextColor(220, 190, 100);
  doc.text("Batch", 14, y);
  doc.setFont("times", "normal");
  doc.setTextColor(240, 235, 225);
  doc.text("Aagam Gandhi Batch 2022", 60, y);
  y += 10;

  // Thin divider
  doc.setDrawColor(100, 85, 45);
  doc.setLineWidth(0.2);
  doc.line(14, y, W - 14, y);
  y += 8;

  // Leader
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(220, 190, 100);
  doc.text("Group Leader", 14, y);
  y += 6;
  doc.setFont("times", "normal");
  doc.setTextColor(240, 235, 225);
  doc.text(lastReceipt.leader, 14, y);
  y += 10;

  // Members
  doc.setFont("times", "bold");
  doc.setTextColor(220, 190, 100);
  doc.text("Members", 14, y);
  y += 6;
  doc.setFont("times", "normal");
  doc.setTextColor(240, 235, 225);
  lastReceipt.members.forEach((name, i) => {
    doc.text(`${i + 1}. ${name}`, 14, y);
    y += 5.5;
  });
  y += 4;

  // Divider
  doc.setDrawColor(100, 85, 45);
  doc.setLineWidth(0.2);
  doc.line(14, y, W - 14, y);
  y += 8;

  // Seats
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(220, 190, 100);
  doc.text("Seat Numbers Allocated", 14, y);
  y += 7;

  // Draw seat boxes
  const boxSize = 12;
  const gap = 4;
  let sx = 14;
  const startY = y;

  lastReceipt.seats.forEach((num, i) => {
    // box
    doc.setFillColor(40, 35, 20);
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.4);
    doc.roundedRect(sx, y - 5, boxSize, boxSize, 1, 1, "FD");
    // number
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(201, 168, 76);
    doc.text(String(num), sx + boxSize / 2, y + 3, { align: "center" });

    sx += boxSize + gap;
    if (sx + boxSize > W - 14) {
      sx = 14;
      y += boxSize + gap;
    }
  });

  y = Math.max(y + boxSize + 6, startY + boxSize + 10);

  // Divider
  doc.setDrawColor(100, 85, 45);
  doc.setLineWidth(0.2);
  doc.line(14, y, W - 14, y);
  y += 8;

  // Timestamp
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(160, 140, 100);
  doc.text(`Registered on: ${lastReceipt.timestamp}`, 14, y);
  y += 8;

  // Footer
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 90, 70);
  doc.text(
    "We'll Try our best for optimal seat allocation; Please carry this receipt to the screening venue. Regards - Kunj Chauhan",
    W / 2,
    y,
    {
      align: "center",
    },
  );

  // Bottom gold bar
  const PH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...gold);
  doc.rect(0, PH - 2, W, 2, "F");

  doc.save(`screening-receipt-${lastReceipt.leader.replace(/\s+/g, "-")}.pdf`);
}

// ── 15. HELPERS ───────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById("error-msg");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError() {
  document.getElementById("error-msg").classList.add("hidden");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
