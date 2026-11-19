(function () {
  "use strict";
  const qp = new URLSearchParams(location.search);
  const token = qp.get("tchoua_token") || "";
  const API = location.origin;
  const $ = (id) => document.getElementById(id);
  const state = { context: null, associationId: "", projects: [], selected: null, report: null, tab: "projects" };

  const TYPE_LABELS = { AIDE: "Aide", PROJET: "Projet", MAIN_LEVEE: "Main levée", AUTRE: "Autre" };
  const SCOPE_LABELS = { ASSOCIATION: "Mon association", ALL_ASSOCIATIONS: "Toutes les associations", PUBLIC: "Espace public" };
  const STATUS_LABELS = { DRAFT: "Brouillon", PUBLISHED: "Ouverte", CLOSED: "Clôturée", CANCELLED: "Annulée" };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (value) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value) || 0) + " FCFA";
  const dateLabel = (value) => value ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
  const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
  const pct = (value) => Math.max(0, Math.min(100, Number(value) || 0));

  function toast(message, error) {
    const el = $("toast");
    el.textContent = message;
    el.className = "toast show" + (error ? " error" : "");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { el.className = "toast"; }, 4200);
  }

  async function api(path, options) {
    const headers = Object.assign({}, (options && options.headers) || {});
    if (token) headers.Authorization = "Bearer " + token;
    if (options && options.body) headers["Content-Type"] = "application/json";
    const response = await fetch(API + path, Object.assign({}, options, { headers }));
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Erreur " + response.status);
    return data;
  }

  function countdownText(project) {
    const now = Date.now();
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    if (now < start) return "Démarre dans " + Math.max(0, Math.ceil((start - now) / 86400000)) + " j";
    if (now > end) return "Terminée";
    return Math.max(0, Math.ceil((end - now) / 86400000)) + " j restants";
  }

  function statusClass(status) {
    return status === "PUBLISHED" ? "pill" : status === "DRAFT" ? "badge" : "badge";
  }

  async function loadContext() {
    if (!token) {
      $("ctx-user").textContent = "Jeton de lancement absent";
      toast("Ouvrez cette app depuis Apps marketplace pour charger le contexte.", true);
      return;
    }
    try {
      const response = await fetch(API + "/api/apps/sdk/context", { headers: { Authorization: "Bearer " + token } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.context) throw new Error(data.error || "Contexte indisponible");
      state.context = data.context;
      state.associationId = data.context.association && data.context.association.id || "";
      $("ctx-user").textContent = data.context.user && data.context.user.name || "Utilisateur";
      $("ctx-assoc").textContent = data.context.association && data.context.association.name || "Association";
    } catch (error) {
      $("ctx-user").textContent = "Contexte indisponible";
      toast(error.message, true);
    }
  }

  async function loadProjects() {
    if (!state.associationId) return;
    try {
      const data = await api("/api/fundraising?associationId=" + encodeURIComponent(state.associationId));
      state.projects = data.projects || [];
      renderStats();
      renderProjects();
      renderReportSelect();
    } catch (error) {
      $("project-list").innerHTML = '<div class="empty">' + esc(error.message) + "</div>";
      toast(error.message, true);
    }
  }

  function renderStats() {
    const projects = state.projects;
    const open = projects.filter((p) => p.status === "PUBLISHED").length;
    const collected = projects.reduce((total, p) => total + ((p.totals && (p.totals.pledged + p.totals.received)) || 0), 0);
    const contributions = projects.reduce((total, p) => total + ((p.totals && p.totals.contributions) || 0), 0);
    const average = projects.length ? Math.round(projects.reduce((total, p) => total + ((p.totals && p.totals.progress) || 0), 0) / projects.length) : 0;
    $("stat-open").textContent = open;
    $("stat-collected").textContent = money(collected).replace(" FCFA", "");
    $("stat-contrib").textContent = contributions;
    $("stat-rate").textContent = average + "%";
  }

  function filteredProjects() {
    const query = ($("search").value || "").toLowerCase().trim();
    const type = $("filter-type").value;
    const scope = $("filter-scope").value;
    return state.projects.filter((project) => {
      if (type && project.type !== type) return false;
      if (scope && project.scope !== scope) return false;
      if (query && !((project.title || "") + " " + (project.contextJustification || "") + " " + (project.objectives || "")).toLowerCase().includes(query)) return false;
      return true;
    });
  }

  function renderProjects() {
    const projects = filteredProjects();
    const root = $("project-list");
    if (!projects.length) {
      root.innerHTML = '<div class="empty" style="grid-column:1/-1">Aucune levée pour ces filtres. Créez la première depuis « Nouvelle levée ».</div>';
      return;
    }
    root.innerHTML = projects.map((project) => {
      const totals = project.totals || {};
      const canPublish = project.status === "DRAFT" && project.canManage;
      return '<article class="project" data-project="' + esc(project.id) + '">' +
        '<div class="project-top"><span class="badge">' + esc(TYPE_LABELS[project.type] || project.type) + '</span><span class="pill">' + esc(STATUS_LABELS[project.status] || project.status) + '</span></div>' +
        '<h3>' + esc(project.title) + '</h3><p>' + esc(project.contextJustification || project.objectives) + '</p>' +
        '<div class="meta"><div class="row"><span>Cagnotte cible</span><strong class="money">' + money(project.targetAmount) + '</strong></div>' +
        '<div class="bar"><i style="width:' + pct(totals.progress) + '%"></i></div>' +
        '<div class="row"><span>' + pct(totals.progress) + '% · ' + money((totals.pledged || 0) + (totals.received || 0)) + '</span><span data-countdown="' + esc(project.endDate) + '">' + esc(countdownText(project)) + '</span></div>' +
        '<div class="row"><span>' + esc(SCOPE_LABELS[project.scope] || project.scope) + '</span><span>' + (totals.contributions || 0) + ' contrib.</span></div>' +
        '<div class="actions" style="margin-top:10px;justify-content:space-between">' +
        '<button class="linkish" data-open="' + esc(project.id) + '">Voir le détail →</button>' +
        (canPublish ? '<button class="btn small" data-publish="' + esc(project.id) + '">Publier</button>' : '') +
        '</div></div></article>';
    }).join("");
    root.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => openProject(button.dataset.open)));
    root.querySelectorAll("[data-publish]").forEach((button) => button.addEventListener("click", () => publishProject(button.dataset.publish)));
  }

  function openModal(content) {
    $("modal-content").innerHTML = content;
    $("modal-back").classList.add("open");
  }
  function closeModal() { $("modal-back").classList.remove("open"); }

  async function openProject(id) {
    try {
      const data = await api("/api/fundraising/" + encodeURIComponent(id) + "?associationId=" + encodeURIComponent(state.associationId));
      const project = data.project;
      state.selected = project;
      const totals = project.totals || {};
      const contributions = project.contributions || [];
      const manager = project.canManage;
      const contributionRows = manager && contributions.length
        ? '<h4>Contributions (' + contributions.length + ')</h4><table class="contrib-table"><thead><tr><th>Date</th><th>Contributeur</th><th>Montant</th><th>Statut</th></tr></thead><tbody>' + contributions.map((c) => '<tr><td>' + dateLabel(c.createdAt) + '</td><td>' + esc(c.contributorName) + '</td><td>' + money(c.amount) + '</td><td>' + esc(c.status) + '</td></tr>').join("") + '</tbody></table>'
        : (manager ? '<p class="hint" style="margin-top:12px">Aucune contribution pour le moment.</p>' : '<p class="hint" style="margin-top:12px">Les contributions détaillées sont réservées au bureau.</p>');
      openModal('<div class="detail"><div class="row" style="margin-top:0"><span class="badge">' + esc(TYPE_LABELS[project.type] || project.type) + '</span><span class="pill">' + esc(STATUS_LABELS[project.status] || project.status) + '</span></div>' +
        '<h2>' + esc(project.title) + '</h2><p class="hint">' + esc(SCOPE_LABELS[project.scope] || project.scope) + ' · ' + esc(dateLabel(project.startDate)) + ' → ' + esc(dateLabel(project.endDate)) + ' · ' + esc(countdownText(project)) + '</p>' +
        '<div class="detail-grid" style="margin-top:14px"><div class="detail-box"><span>Cagnotte cible</span><strong>' + money(project.targetAmount) + '</strong></div><div class="detail-box"><span>Collecté</span><strong>' + money((totals.pledged || 0) + (totals.received || 0)) + ' · ' + pct(totals.progress) + '%</strong></div></div>' +
        '<h4>Contexte & justification</h4><p>' + esc(project.contextJustification) + '</p>' +
        '<h4>Objectifs</h4><p>' + esc(project.objectives) + '</p>' +
        '<h4>Résultats attendus</h4><p>' + esc(project.expectedResults) + '</p>' +
        '<h4>Bénéficiaires</h4><p>' + esc(project.beneficiaries) + '</p>' +
        '<div class="detail-grid" style="margin-top:14px"><div class="detail-box"><span>Contribution</span><strong>' + (project.contributionMode === "FIXE" ? "Fixe : " + money(project.fixedAmount || 0) : "Libre") + '</strong></div><div class="detail-box"><span>Contributeur</span><strong>' + esc(project.contributorMode === "ANONYME" ? "Anonyme" : project.contributorMode === "IDENTIFIE" ? "Identifié" : "Au choix") + '</strong></div></div>' +
        contributionRows +
        '<div class="actions">' + (manager && project.status === "DRAFT" ? '<button class="btn" id="modal-publish">Publier et notifier les associations</button>' : '') + (manager && project.status === "PUBLISHED" ? '<button class="btn ghost" id="modal-close-project">Clôturer la levée</button>' : '') + '</div></div>');
      if ($("modal-publish")) $("modal-publish").addEventListener("click", () => publishProject(project.id));
      if ($("modal-close-project")) $("modal-close-project").addEventListener("click", () => closeProject(project.id));
    } catch (error) { toast(error.message, true); }
  }

  async function publishProject(id) {
    try {
      await api("/api/fundraising/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ status: "PUBLISHED" }) });
      closeModal();
      await loadProjects();
      toast("Levée publiée. Les associations ciblées ont été notifiées dans leur groupe.");
    } catch (error) { toast(error.message, true); }
  }

  async function closeProject(id) {
    if (!confirm("Clôturer cette levée ? Les contributions ne seront plus acceptées.")) return;
    try {
      await api("/api/fundraising/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ status: "CLOSED" }) });
      closeModal();
      await loadProjects();
      toast("Levée clôturée.");
    } catch (error) { toast(error.message, true); }
  }

  function formPayload(status) {
    const mode = $("f-contribution-mode").value;
    return {
      title: $("f-title").value.trim(),
      type: $("f-type").value,
      scope: $("f-scope").value,
      targetAmount: Number($("f-target").value),
      startDate: $("f-start").value,
      endDate: $("f-end").value,
      contributionMode: mode,
      fixedAmount: mode === "FIXE" ? Number($("f-fixed").value) : null,
      contributorMode: $("f-contributor-mode").value,
      contextJustification: $("f-context").value.trim(),
      objectives: $("f-objectives").value.trim(),
      expectedResults: $("f-results").value.trim(),
      beneficiaries: $("f-beneficiaries").value.trim(),
      status: status,
    };
  }

  async function createProject(status) {
    const form = $("create-form");
    if (!form.reportValidity()) return;
    const payload = formPayload(status);
    if (!payload.title || !payload.targetAmount || !payload.startDate || !payload.endDate) return toast("Complétez les champs obligatoires.", true);
    if (new Date(payload.endDate) <= new Date(payload.startDate)) return toast("La date de fin doit être après la date de début.", true);
    try {
      await api("/api/fundraising?associationId=" + encodeURIComponent(state.associationId), { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      setDefaultDates();
      switchTab("projects");
      await loadProjects();
      toast(status === "PUBLISHED" ? "Levée publiée et associations notifiées." : "Brouillon enregistré.");
    } catch (error) { toast(error.message, true); }
  }

  function renderReportSelect() {
    const select = $("report-select");
    const current = select.value;
    select.innerHTML = '<option value="">Choisir une levée…</option>' + state.projects.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.title) + ' — ' + esc(STATUS_LABELS[p.status] || p.status) + '</option>').join("");
    if (current && state.projects.some((p) => p.id === current)) select.value = current;
  }

  async function loadReport() {
    const id = $("report-select").value;
    if (!id) { $("report-body").className = "empty"; $("report-body").textContent = "Aucune levée sélectionnée."; return; }
    try {
      const data = await api("/api/fundraising/" + encodeURIComponent(id) + "/report");
      state.report = data;
      const totals = data.totals || {};
      $("report-body").className = "";
      $("report-body").innerHTML = '<div class="stats" style="margin-top:0"><div class="stat"><span>Cagnotte cible</span><strong>' + money(data.project.targetAmount) + '</strong><small>' + esc(data.project.title) + '</small></div><div class="stat"><span>Total promis/reçu</span><strong>' + money((totals.pledged || 0) + (totals.received || 0)) + '</strong><small>' + pct(totals.progress) + '% de progression</small></div><div class="stat"><span>Contributions</span><strong>' + (totals.contributions || 0) + '</strong><small>' + (totals.uniqueContributors || 0) + ' contributeur(s)</small></div><div class="stat"><span>Compte à rebours</span><strong>' + esc(totals.countdown) + '</strong><small>fin le ' + esc(dateLabel(data.project.endDate)) + '</small></div></div>' +
        '<div class="detail-grid"><div class="detail-box"><span>Promesses</span><strong>' + money(totals.pledged) + '</strong></div><div class="detail-box"><span>Reçues</span><strong>' + money(totals.received) + '</strong></div><div class="detail-box"><span>Annulées</span><strong>' + money(totals.cancelled) + '</strong></div><div class="detail-box"><span>Statut</span><strong>' + esc(STATUS_LABELS[data.project.status] || data.project.status) + '</strong></div></div>' +
        '<p class="hint" style="margin-top:12px">Rapport généré le ' + esc(new Date(data.generatedAt).toLocaleString("fr-FR")) + '. Utilisez « Exporter CSV » pour le suivi complet.</p>';
    } catch (error) { toast(error.message, true); }
  }

  async function exportCsv() {
    const id = $("report-select").value;
    if (!id) return toast("Sélectionnez une levée.", true);
    try {
      const response = await fetch(API + "/api/fundraising/" + encodeURIComponent(id) + "/report?format=csv", { headers: { Authorization: "Bearer " + token } });
      if (!response.ok) throw new Error("Export impossible.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "suivi-levée-" + id + ".csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { toast(error.message, true); }
  }

  function switchTab(tab) {
    state.tab = tab;
    document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    ["projects", "create", "reports"].forEach((name) => $("tab-" + name).classList.toggle("hidden", name !== tab));
  }

  function setDefaultDates() {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 86400000);
    $("f-start").value = start.toISOString().slice(0, 10);
    $("f-end").value = end.toISOString().slice(0, 10);
  }

  function bind() {
    document.querySelectorAll(".tab").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
    $("modal-close").addEventListener("click", closeModal);
    $("modal-back").addEventListener("click", (event) => { if (event.target === $("modal-back")) closeModal(); });
    $("refresh").addEventListener("click", loadProjects);
    $("search").addEventListener("input", renderProjects);
    $("filter-type").addEventListener("change", renderProjects);
    $("filter-scope").addEventListener("change", renderProjects);
    $("f-contribution-mode").addEventListener("change", () => $("fixed-wrap").classList.toggle("hidden", $("f-contribution-mode").value !== "FIXE"));
    $("save-draft").addEventListener("click", () => createProject("DRAFT"));
    $("create-form").addEventListener("submit", (event) => { event.preventDefault(); createProject("PUBLISHED"); });
    $("report-select").addEventListener("change", loadReport);
    $("export-csv").addEventListener("click", exportCsv);
  }

  async function boot() {
    bind();
    setDefaultDates();
    await loadContext();
    await loadProjects();
  }

  boot();
})();
