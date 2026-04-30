const API_CONFIG_KEY = "codexa_portfolio_api_config_v1";

const DEFAULT_API_CONFIG = {
  baseUrl: "http://localhost:3333",
  adminToken: "codexa-dev-token"
};

const state = {
  items: [],
  publicItems: [],
  filters: {
    search: "",
    status: "all",
    category: "all"
  },
  api: loadApiConfig(),
  isLoading: false
};

const els = {
  form: document.querySelector("#portfolioForm"),
  projectId: document.querySelector("#projectId"),
  title: document.querySelector("#title"),
  slug: document.querySelector("#slug"),
  shortDescription: document.querySelector("#shortDescription"),
  projectUrl: document.querySelector("#projectUrl"),
  desktopImageFile: document.querySelector("#desktopImageFile"),
  mobileImageFile: document.querySelector("#mobileImageFile"),
  desktopImagePreview: document.querySelector("#desktopImagePreview"),
  mobileImagePreview: document.querySelector("#mobileImagePreview"),
  altText: document.querySelector("#altText"),
  category: document.querySelector("#category"),
  tags: document.querySelector("#tags"),
  order: document.querySelector("#order"),
  status: document.querySelector("#status"),
  featured: document.querySelector("#featured"),
  formTitle: document.querySelector("#formTitle"),
  submitBtn: document.querySelector("#submitBtn"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  clearFormBtn: document.querySelector("#clearFormBtn"),
  newProjectBtn: document.querySelector("#newProjectBtn"),
  refreshBtn: document.querySelector("#refreshBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  categorySuggestions: document.querySelector("#categorySuggestions"),
  tableBody: document.querySelector("#projectsTableBody"),
  emptyState: document.querySelector("#emptyState"),
  preview: document.querySelector("#portfolioPreview"),
  previewCount: document.querySelector("#previewCount"),
  totalProjects: document.querySelector("#totalProjects"),
  publishedProjects: document.querySelector("#publishedProjects"),
  featuredProjects: document.querySelector("#featuredProjects"),
  draftProjects: document.querySelector("#draftProjects"),
  descriptionCount: document.querySelector("#descriptionCount"),
  toast: document.querySelector("#toast"),
  apiBaseUrl: document.querySelector("#apiBaseUrl"),
  adminToken: document.querySelector("#adminToken"),
  saveConfigBtn: document.querySelector("#saveConfigBtn"),
  healthBtn: document.querySelector("#healthBtn"),
  apiStatusDot: document.querySelector("#apiStatusDot"),
  apiStatusTitle: document.querySelector("#apiStatusTitle"),
  apiStatusDetail: document.querySelector("#apiStatusDetail")
};

async function init() {
  applyApiConfigToForm();
  bindEvents();
  resetForm();
  renderLoadingState("Conectando com a API...");

  await testHealth({ silent: true });
  await loadAllData();
}

function loadApiConfig() {
  try {
    const raw = localStorage.getItem(API_CONFIG_KEY);
    const saved = raw ? JSON.parse(raw) : {};

    return {
      baseUrl: sanitizeBaseUrl(saved.baseUrl || DEFAULT_API_CONFIG.baseUrl),
      adminToken: saved.adminToken || DEFAULT_API_CONFIG.adminToken
    };
  } catch {
    return { ...DEFAULT_API_CONFIG };
  }
}

function saveApiConfig() {
  state.api = {
    baseUrl: sanitizeBaseUrl(els.apiBaseUrl.value || DEFAULT_API_CONFIG.baseUrl),
    adminToken: els.adminToken.value || DEFAULT_API_CONFIG.adminToken
  };

  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(state.api));
  applyApiConfigToForm();
}

function applyApiConfigToForm() {
  els.apiBaseUrl.value = state.api.baseUrl;
  els.adminToken.value = state.api.adminToken;
}

function sanitizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

function bindEvents() {
  els.form.addEventListener("submit", handleSubmit);
  els.clearFormBtn.addEventListener("click", resetForm);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.refreshBtn.addEventListener("click", async () => {
    await loadAllData({ showToast: true });
  });

  els.newProjectBtn.addEventListener("click", () => {
    resetForm();
    document.querySelector("#formulario").scrollIntoView({ behavior: "smooth", block: "start" });
    els.title.focus();
  });

  els.saveConfigBtn.addEventListener("click", async () => {
    saveApiConfig();
    toast("Configuração da API salva.");
    await testHealth({ silent: false });
    await loadAllData();
  });

  els.healthBtn.addEventListener("click", async () => {
    saveApiConfig();
    await testHealth({ silent: false });
  });

  els.title.addEventListener("input", () => {
    if (!els.projectId.value) {
      els.slug.value = slugify(els.title.value);
      els.altText.value = els.title.value ? `Projeto ${els.title.value}` : "";
    }
  });

  els.slug.addEventListener("input", () => {
    els.slug.value = slugify(els.slug.value);
  });

  els.shortDescription.addEventListener("input", updateDescriptionCount);

  els.desktopImageFile.addEventListener("change", () => {
    handleImageUploadToApi(els.desktopImageFile, els.desktopImagePreview, "desktopImageUrl", "desktop");
  });

  els.mobileImageFile.addEventListener("change", () => {
    handleImageUploadToApi(els.mobileImageFile, els.mobileImagePreview, "mobileImageUrl", "mobile");
  });

  els.searchInput.addEventListener("input", event => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderListAndPreview();
  });

  els.statusFilter.addEventListener("change", event => {
    state.filters.status = event.target.value;
    renderListAndPreview();
  });

  els.categoryFilter.addEventListener("change", event => {
    state.filters.category = event.target.value;
    renderListAndPreview();
  });

  els.tableBody.addEventListener("click", handleTableClick);
  els.exportBtn.addEventListener("click", exportJson);
  els.importInput.addEventListener("change", importJson);
}

async function loadAllData(options = {}) {
  setPageLoading(true);
  renderLoadingState("Carregando projetos da API...");

  try {
    const [adminItems, publicItems] = await Promise.all([
      fetchAdminItems(),
      fetchPublicItems()
    ]);

    state.items = adminItems.map(normalizeItem);
    state.publicItems = publicItems.map(normalizeItem);

    setPageLoading(false);
    render();

    if (options.showToast) {
      toast("Dados recarregados da API.");
    }
  } catch (error) {
    console.error(error);
    setPageLoading(false);
    render();
    toast(getErrorMessage(error, "Não foi possível carregar os projetos da API."), "error");
  }
}

async function fetchAdminItems() {
  const response = await apiRequest("/api/v1/admin/portfolio-items", {
    auth: true
  });

  return Array.isArray(response.data) ? response.data : [];
}

async function fetchPublicItems() {
  try {
    const response = await apiRequest("/api/v1/portfolio-items?status=published&featured=true&limit=100");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn("Falha ao carregar preview público. Usando dados admin como fallback.", error);
    return state.items.filter(item => item.status === "published" && item.featured);
  }
}

async function testHealth({ silent = false } = {}) {
  setConnectionStatus("checking", "Testando API...", "Consultando /api/v1/health");

  try {
    const health = await apiRequest("/api/v1/health");
    const db = health.database || {};
    const dbStatus = db.status || "unknown";

    if (dbStatus === "connected") {
      setConnectionStatus(
        "online",
        "API online",
        `${health.environment || "ambiente"} · MongoDB conectado`
      );
    } else {
      setConnectionStatus(
        "warning",
        "API online",
        `MongoDB ${dbStatus}. Rotas de portfólio podem retornar 503.`
      );
    }

    if (!silent) {
      toast(dbStatus === "connected" ? "API e MongoDB conectados." : "API online, mas MongoDB não conectado.", dbStatus === "connected" ? "success" : "warning");
    }

    return health;
  } catch (error) {
    console.error(error);
    setConnectionStatus("offline", "API offline", getErrorMessage(error, "Não foi possível acessar o health check."));
    if (!silent) toast(getErrorMessage(error, "Não foi possível acessar a API."), "error");
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = false,
    headers = {}
  } = options;

  const isFormData = body instanceof FormData;
  const requestHeaders = { ...headers };

  if (auth) {
    requestHeaders.Authorization = `Bearer ${state.api.adminToken}`;
  }

  if (body && !isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${state.api.baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : {};

  if (!response.ok) {
    throw buildApiError(response.status, data);
  }

  return data;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function buildApiError(status, payload) {
  const error = new Error(
    payload?.error?.message ||
    payload?.message ||
    `Erro ${status} na API.`
  );

  error.status = status;
  error.code = payload?.error?.code || payload?.code || "API_ERROR";
  error.fields = payload?.error?.fields || payload?.fields || [];
  error.payload = payload;

  return error;
}

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();

  setFormLoading(true);

  try {
    const payload = await getFormPayload();
    const errors = validatePayload(payload);

    if (errors.length) {
      showErrors(errors);
      toast("Corrija os campos destacados.", "error");
      return;
    }

    const editingId = els.projectId.value;

    if (editingId) {
      await apiRequest(`/api/v1/admin/portfolio-items/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        auth: true,
        body: payload
      });
      toast("Projeto atualizado na API.");
    } else {
      await apiRequest("/api/v1/admin/portfolio-items", {
        method: "POST",
        auth: true,
        body: payload
      });
      toast("Projeto cadastrado na API.");
    }

    resetForm();
    await loadAllData();
  } catch (error) {
    console.error(error);
    handleApiFormError(error);
  } finally {
    setFormLoading(false);
  }
}

async function getFormPayload() {
  const editingId = els.projectId.value;
  const currentItem = editingId ? state.items.find(item => item.id === editingId) : null;

  const desktopImageUrl = await resolveImageValue(
    els.desktopImageFile,
    els.desktopImagePreview,
    "desktopImageUrl",
    "desktop",
    currentItem?.desktopImageUrl || ""
  );

  const mobileImageUrl = await resolveImageValue(
    els.mobileImageFile,
    els.mobileImagePreview,
    "mobileImageUrl",
    "mobile",
    currentItem?.mobileImageUrl || ""
  );

  return {
    title: els.title.value.trim(),
    slug: slugify(els.slug.value),
    shortDescription: els.shortDescription.value.trim(),
    projectUrl: els.projectUrl.value.trim(),
    desktopImageUrl,
    mobileImageUrl,
    altText: els.altText.value.trim(),
    category: els.category.value.trim() || "Sem categoria",
    tags: parseTags(els.tags.value),
    order: Number(els.order.value),
    status: els.status.value,
    featured: els.featured.checked
  };
}

function validatePayload(payload) {
  const errors = [];
  const editingId = els.projectId.value;
  const duplicatedSlug = state.items.some(item => item.slug === payload.slug && item.id !== editingId);

  if (payload.title.length < 2 || payload.title.length > 80) {
    errors.push({ field: "title", message: "O título deve ter entre 2 e 80 caracteres." });
  }

  if (!payload.slug || duplicatedSlug) {
    errors.push({ field: "slug", message: duplicatedSlug ? "Já existe um projeto com esse slug." : "O slug é obrigatório." });
  }

  if (!payload.shortDescription || payload.shortDescription.length > 220) {
    errors.push({ field: "shortDescription", message: "A descrição é obrigatória e deve ter até 220 caracteres." });
  }

  if (!isValidUrl(payload.projectUrl)) {
    errors.push({ field: "projectUrl", message: "Informe uma URL válida para o projeto." });
  }

  if (!payload.desktopImageUrl) {
    errors.push({ field: "desktopImageUrl", message: "Selecione a imagem desktop do projeto." });
  }

  if (!payload.mobileImageUrl) {
    errors.push({ field: "mobileImageUrl", message: "Selecione a imagem mobile do projeto." });
  }

  if (!payload.altText || payload.altText.length > 120) {
    errors.push({ field: "altText", message: "O texto alternativo é obrigatório e deve ter até 120 caracteres." });
  }

  if (!Number.isInteger(payload.order) || payload.order < 1) {
    errors.push({ field: "order", message: "A ordem deve ser um número inteiro positivo." });
  }

  if (!["published", "draft", "archived"].includes(payload.status)) {
    errors.push({ field: "status", message: "Status inválido." });
  }

  return errors;
}

function handleApiFormError(error) {
  if (Array.isArray(error.fields) && error.fields.length) {
    showErrors(error.fields.map(field => ({
      field: field.field,
      message: field.message || "Campo inválido."
    })));
  }

  if (error.code === "SLUG_ALREADY_EXISTS" || error.status === 409) {
    showErrors([{ field: "slug", message: "Já existe um projeto com esse slug." }]);
  }

  toast(getErrorMessage(error, "Não foi possível salvar o projeto na API."), "error");
}

function clearErrors() {
  document.querySelectorAll(".field.invalid").forEach(field => field.classList.remove("invalid"));
  document.querySelectorAll("[data-error-for]").forEach(el => {
    el.textContent = "";
    el.classList.remove("error");
  });
}

function showErrors(errors) {
  errors.forEach(error => {
    const input = document.querySelector(`#${error.field}`) || getInputByContractField(error.field);
    const wrapper = input?.closest(".field");
    const errorEl = document.querySelector(`[data-error-for="${error.field}"]`);

    wrapper?.classList.add("invalid");
    if (errorEl) {
      errorEl.textContent = error.message;
      errorEl.classList.add("error");
    }
  });
}

function getInputByContractField(field) {
  const map = {
    desktopImageUrl: els.desktopImageFile,
    mobileImageUrl: els.mobileImageFile
  };
  return map[field];
}

async function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  button.disabled = true;

  try {
    if (action === "edit") await editItem(id);
    if (action === "delete") await deleteItem(id);
    if (action === "duplicate") await duplicateItem(id);
    if (action === "move-up") await moveItem(id, -1);
    if (action === "move-down") await moveItem(id, 1);
    if (action === "toggle-featured") await toggleFeatured(id);
    if (action === "archive") await archiveItem(id);
  } catch (error) {
    console.error(error);
    toast(getErrorMessage(error, "Não foi possível concluir a ação."), "error");
  } finally {
    button.disabled = false;
  }
}

async function editItem(id) {
  const response = await apiRequest(`/api/v1/admin/portfolio-items/${encodeURIComponent(id)}`, {
    auth: true
  });

  const item = normalizeItem(response.data || response);
  fillForm(item);
}

function fillForm(item) {
  els.projectId.value = item.id;
  els.title.value = item.title;
  els.slug.value = item.slug;
  els.shortDescription.value = item.shortDescription;
  els.projectUrl.value = item.projectUrl;
  els.desktopImageFile.value = "";
  els.mobileImageFile.value = "";
  clearImageInputCache(els.desktopImageFile);
  clearImageInputCache(els.mobileImageFile);
  setImagePreview(els.desktopImagePreview, item.desktopImageUrl, "Imagem desktop atual", "Selecione outro arquivo para substituir.");
  setImagePreview(els.mobileImagePreview, item.mobileImageUrl, "Imagem mobile atual", "Selecione outro arquivo para substituir.");
  els.altText.value = item.altText;
  els.category.value = item.category;
  els.tags.value = item.tags.join(", ");
  els.order.value = item.order;
  els.status.value = item.status;
  els.featured.checked = item.featured;

  els.formTitle.textContent = "Editar projeto";
  els.submitBtn.textContent = "Atualizar projeto";
  els.cancelEditBtn.hidden = false;
  updateDescriptionCount();
  clearErrors();

  document.querySelector("#formulario").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteItem(id) {
  const item = state.items.find(project => project.id === id);
  if (!item) return;

  const confirmed = confirm(`Arquivar/excluir logicamente o projeto "${item.title}" na API?`);
  if (!confirmed) return;

  await apiRequest(`/api/v1/admin/portfolio-items/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true
  });

  toast("Projeto arquivado pela API.");
  await loadAllData();
}

async function archiveItem(id) {
  const item = state.items.find(project => project.id === id);
  if (!item) return;

  if (item.status === "archived") {
    await apiRequest(`/api/v1/admin/portfolio-items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      auth: true,
      body: { status: "draft" }
    });
    toast("Projeto restaurado como rascunho.");
  } else {
    await apiRequest(`/api/v1/admin/portfolio-items/${encodeURIComponent(id)}`, {
      method: "DELETE",
      auth: true
    });
    toast("Projeto arquivado.");
  }

  await loadAllData();
}

async function duplicateItem(id) {
  const item = state.items.find(project => project.id === id);
  if (!item) return;

  const copy = {
    title: `${item.title} cópia`,
    slug: uniqueSlug(`${item.slug}-copia`),
    shortDescription: item.shortDescription,
    projectUrl: item.projectUrl,
    desktopImageUrl: item.desktopImageUrl,
    mobileImageUrl: item.mobileImageUrl,
    altText: item.altText,
    category: item.category,
    tags: item.tags,
    order: getNextOrder(),
    status: "draft",
    featured: false
  };

  await apiRequest("/api/v1/admin/portfolio-items", {
    method: "POST",
    auth: true,
    body: copy
  });

  toast("Projeto duplicado como rascunho.");
  await loadAllData();
}

async function moveItem(id, direction) {
  const ordered = getOrderedItems();
  const currentIndex = ordered.findIndex(item => item.id === id);
  const targetIndex = currentIndex + direction;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;

  [ordered[currentIndex], ordered[targetIndex]] = [ordered[targetIndex], ordered[currentIndex]];

  const items = ordered.map((item, index) => ({
    id: item.id,
    order: index + 1
  }));

  await apiRequest("/api/v1/admin/portfolio-items/reorder", {
    method: "PATCH",
    auth: true,
    body: { items }
  });

  toast("Ordem atualizada na API.");
  await loadAllData();
}

async function toggleFeatured(id) {
  const item = state.items.find(project => project.id === id);
  if (!item) return;

  await apiRequest(`/api/v1/admin/portfolio-items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    auth: true,
    body: { featured: !item.featured }
  });

  toast(!item.featured ? "Projeto marcado como destaque." : "Projeto removido dos destaques.");
  await loadAllData();
}

function resetForm() {
  els.form.reset();
  els.projectId.value = "";
  els.order.value = getNextOrder();
  els.status.value = "published";
  els.featured.checked = true;
  els.formTitle.textContent = "Cadastrar projeto";
  els.submitBtn.textContent = "Salvar projeto";
  els.cancelEditBtn.hidden = true;
  updateDescriptionCount();
  clearImageInputCache(els.desktopImageFile);
  clearImageInputCache(els.mobileImageFile);
  clearImagePreviews();
  clearErrors();
}

function render() {
  renderStats();
  renderCategories();
  renderListAndPreview();
}

function renderStats() {
  els.totalProjects.textContent = state.items.length;
  els.publishedProjects.textContent = state.items.filter(item => item.status === "published").length;
  els.featuredProjects.textContent = state.items.filter(item => item.featured).length;
  els.draftProjects.textContent = state.items.filter(item => item.status === "draft").length;
}

function renderCategories() {
  const categories = [...new Set(state.items.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const currentCategory = els.categoryFilter.value;

  els.categoryFilter.innerHTML = `<option value="all">Todas</option>`;
  els.categorySuggestions.innerHTML = "";

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.appendChild(option);

    const suggestion = document.createElement("option");
    suggestion.value = category;
    els.categorySuggestions.appendChild(suggestion);
  });

  if (["all", ...categories].includes(currentCategory)) {
    els.categoryFilter.value = currentCategory;
  }
}

function renderListAndPreview() {
  const filteredItems = getFilteredItems();
  renderTable(filteredItems);
  renderPreview();
}

function renderTable(items) {
  els.tableBody.innerHTML = "";
  els.emptyState.hidden = items.length > 0 || state.isLoading;

  if (state.isLoading) {
    renderLoadingState("Carregando projetos da API...");
    return;
  }

  const orderedAll = getOrderedItems();

  items.forEach(item => {
    const row = document.querySelector("#projectRowTemplate").content.firstElementChild.cloneNode(true);
    const globalIndex = orderedAll.findIndex(project => project.id === item.id);

    row.querySelector(".order-cell").innerHTML = `
      <div class="order-controls">
        <button class="icon-button" type="button" title="Subir" data-action="move-up" data-id="${escapeAttribute(item.id)}" ${globalIndex === 0 ? "disabled" : ""}>↑</button>
        <span class="order-number">${String(item.order).padStart(2, "0")}</span>
        <button class="icon-button" type="button" title="Descer" data-action="move-down" data-id="${escapeAttribute(item.id)}" ${globalIndex === orderedAll.length - 1 ? "disabled" : ""}>↓</button>
      </div>
    `;

    row.querySelector(".project-cell").innerHTML = `
      <div class="project-info">
        ${renderThumb(item)}
        <div class="project-meta">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.slug)} · ${escapeHtml(item.shortDescription)}</small>
        </div>
      </div>
    `;

    row.querySelector(".category-cell").innerHTML = `<span class="pill">${escapeHtml(item.category)}</span>`;
    row.querySelector(".status-cell").innerHTML = `<span class="pill ${item.status}">${getStatusLabel(item.status)}</span>`;
    row.querySelector(".featured-cell").innerHTML = item.featured
      ? `<button class="pill featured" type="button" data-action="toggle-featured" data-id="${escapeAttribute(item.id)}">Sim</button>`
      : `<button class="pill" type="button" data-action="toggle-featured" data-id="${escapeAttribute(item.id)}">Não</button>`;

    row.querySelector(".actions-cell").innerHTML = `
      <div class="actions">
        <button class="icon-button edit" type="button" title="Editar" data-action="edit" data-id="${escapeAttribute(item.id)}">Editar</button>
        <button class="icon-button" type="button" title="Duplicar" data-action="duplicate" data-id="${escapeAttribute(item.id)}">Duplicar</button>
        <button class="icon-button" type="button" title="Arquivar/restaurar" data-action="archive" data-id="${escapeAttribute(item.id)}">${item.status === "archived" ? "Restaurar" : "Arquivar"}</button>
        <button class="icon-button delete" type="button" title="Excluir lógico" data-action="delete" data-id="${escapeAttribute(item.id)}">Excluir</button>
      </div>
    `;

    els.tableBody.appendChild(row);
  });
}

function renderLoadingState(message) {
  if (!els.tableBody) return;
  els.tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="loading-row">${escapeHtml(message)}</td>
    </tr>
  `;
}

function renderPreview() {
  const published = getOrderedPublicItems();
  els.previewCount.textContent = published.length;
  els.preview.innerHTML = "";

  if (state.isLoading) {
    els.preview.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div>⌁</div>
        <strong>Carregando preview público</strong>
        <p>Consultando /api/v1/portfolio-items?status=published&featured=true.</p>
      </div>
    `;
    return;
  }

  if (!published.length) {
    els.preview.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div>⌁</div>
        <strong>Nenhum projeto publicado em destaque</strong>
        <p>Marque um projeto como publicado e destaque para aparecer no preview público.</p>
      </div>
    `;
    return;
  }

  published.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "preview-card";
    card.innerHTML = `
      ${renderPreviewImage(item)}
      <div class="preview-card-content">
        <small>${String(index + 1).padStart(2, "0")} · ${escapeHtml(item.category)}</small>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.shortDescription)}</p>
        <a href="${escapeAttribute(item.projectUrl)}" target="_blank" rel="noopener">Ver projeto ↗</a>
      </div>
    `;
    els.preview.appendChild(card);
  });
}

function renderThumb(item) {
  if (!item.desktopImageUrl) {
    return `<div class="project-thumb fallback">${escapeHtml(getInitials(item.title))}</div>`;
  }

  return `<img class="project-thumb" src="${escapeAttribute(item.desktopImageUrl)}" alt="${escapeAttribute(item.altText)}" />`;
}

function renderPreviewImage(item) {
  if (!item.desktopImageUrl) {
    return `<div class="project-thumb fallback" style="width:100%;height:100%;min-height:360px;border:0;border-radius:0;font-size:44px;">${escapeHtml(getInitials(item.title))}</div>`;
  }

  return `<img src="${escapeAttribute(item.desktopImageUrl)}" alt="${escapeAttribute(item.altText)}" />`;
}

function getFilteredItems() {
  return getOrderedItems().filter(item => {
    const searchTarget = [
      item.title,
      item.slug,
      item.shortDescription,
      item.category,
      ...item.tags
    ].join(" ").toLowerCase();

    const matchesSearch = !state.filters.search || searchTarget.includes(state.filters.search);
    const matchesStatus = state.filters.status === "all" || item.status === state.filters.status;
    const matchesCategory = state.filters.category === "all" || item.category === state.filters.category;

    return matchesSearch && matchesStatus && matchesCategory;
  });
}

function getOrderedItems() {
  return [...state.items].sort((a, b) => Number(a.order) - Number(b.order) || a.title.localeCompare(b.title));
}

function getOrderedPublicItems() {
  return [...state.publicItems].sort((a, b) => Number(a.order) - Number(b.order) || a.title.localeCompare(b.title));
}

function getNextOrder() {
  return state.items.length ? Math.max(...state.items.map(item => Number(item.order) || 0)) + 1 : 1;
}

function getStatusLabel(status) {
  const labels = {
    published: "Publicado",
    draft: "Rascunho",
    archived: "Arquivado"
  };

  return labels[status] || status;
}

function updateDescriptionCount() {
  els.descriptionCount.textContent = els.shortDescription.value.length;
}

function normalizeItem(item) {
  const now = new Date().toISOString();

  return {
    id: item.id || item._id || "",
    title: item.title || "Projeto sem título",
    slug: item.slug || slugify(item.title || "projeto"),
    shortDescription: item.shortDescription || "",
    projectUrl: item.projectUrl || "",
    desktopImageUrl: item.desktopImageUrl || "",
    mobileImageUrl: item.mobileImageUrl || "",
    altText: item.altText || `Projeto ${item.title || "Codexa"}`,
    category: item.category || "Sem categoria",
    tags: Array.isArray(item.tags) ? item.tags : parseTags(item.tags || ""),
    order: Number(item.order) || 1,
    status: ["published", "draft", "archived"].includes(item.status) ? item.status : "draft",
    featured: Boolean(item.featured),
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now
  };
}

function parseTags(value) {
  if (Array.isArray(value)) return value.map(tag => String(tag).trim()).filter(Boolean);

  return String(value || "")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function uniqueSlug(baseSlug) {
  let slug = slugify(baseSlug);
  let counter = 2;

  while (state.items.some(item => item.slug === slug)) {
    slug = `${slugify(baseSlug)}-${counter}`;
    counter += 1;
  }

  return slug;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function exportJson() {
  const payload = JSON.stringify(getOrderedItems(), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `codexa-portfolio-api-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("JSON exportado com os dados carregados da API.");
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error("O JSON precisa ser uma lista de projetos.");

      const confirmed = confirm(`Importar ${parsed.length} projeto(s) criando registros na API?`);
      if (!confirmed) return;

      setPageLoading(true);

      for (const item of parsed) {
        const normalized = normalizeItem(item);
        const payload = toApiPayload({
          ...normalized,
          slug: uniqueSlug(normalized.slug)
        });

        await apiRequest("/api/v1/admin/portfolio-items", {
          method: "POST",
          auth: true,
          body: payload
        });

        state.items.push(normalized);
      }

      resetForm();
      await loadAllData();
      toast("JSON importado criando projetos na API.");
    } catch (error) {
      console.error(error);
      toast(getErrorMessage(error, "Não foi possível importar o JSON."), "error");
    } finally {
      event.target.value = "";
      setPageLoading(false);
    }
  };

  reader.readAsText(file);
}

function toApiPayload(item) {
  return {
    title: item.title,
    slug: slugify(item.slug || item.title),
    shortDescription: item.shortDescription,
    projectUrl: item.projectUrl,
    desktopImageUrl: item.desktopImageUrl,
    mobileImageUrl: item.mobileImageUrl,
    altText: item.altText,
    category: item.category,
    tags: item.tags,
    order: Number(item.order) || getNextOrder(),
    status: item.status,
    featured: Boolean(item.featured)
  };
}

async function handleImageUploadToApi(input, previewEl, contractFieldName, type) {
  clearFieldError(contractFieldName);
  clearImageInputCache(input);

  const file = input.files?.[0];

  if (!file) {
    setEmptyImagePreview(previewEl);
    return;
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    input.value = "";
    setEmptyImagePreview(previewEl);
    showErrors([{ field: contractFieldName, message: validationError }]);
    return;
  }

  setUploadingImagePreview(previewEl, file);

  try {
    const url = await uploadImageFile(file, type);

    input.dataset.uploadedUrl = url;
    input.dataset.fileName = file.name;
    input.dataset.fileSize = String(file.size);
    input.dataset.mimeType = file.type;

    setImagePreview(
      previewEl,
      url,
      file.name,
      `${formatBytes(file.size)} · enviado para /api/v1/admin/uploads/portfolio`
    );

    toast(`Imagem ${type === "desktop" ? "desktop" : "mobile"} enviada para API.`);
  } catch (error) {
    console.error(error);
    input.value = "";
    clearImageInputCache(input);
    setEmptyImagePreview(previewEl);
    showErrors([{ field: contractFieldName, message: getErrorMessage(error, "Falha no upload da imagem.") }]);
    toast(getErrorMessage(error, "Falha no upload da imagem."), "error");
  }
}

async function resolveImageValue(input, previewEl, contractFieldName, type, currentValue) {
  if (input.dataset.uploadedUrl) return input.dataset.uploadedUrl;

  const file = input.files?.[0];
  if (!file) return currentValue;

  const validationError = validateImageFile(file);
  if (validationError) {
    showErrors([{ field: contractFieldName, message: validationError }]);
    return "";
  }

  setUploadingImagePreview(previewEl, file);
  const url = await uploadImageFile(file, type);
  input.dataset.uploadedUrl = url;

  return url;
}

async function uploadImageFile(file, type) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await apiRequest("/api/v1/admin/uploads/portfolio", {
    method: "POST",
    auth: true,
    body: formData
  });

  const url = response?.data?.url;

  if (!url) {
    throw new Error("A API não retornou a URL/Base64 da imagem.");
  }

  return url;
}

function validateImageFile(file) {
  if (!file.type.startsWith("image/")) {
    return "Selecione um arquivo de imagem válido.";
  }

  if (file.size > 8 * 1024 * 1024) {
    return "Use uma imagem com até 8MB.";
  }

  return "";
}

function clearImageInputCache(input) {
  delete input.dataset.uploadedUrl;
  delete input.dataset.fileName;
  delete input.dataset.fileSize;
  delete input.dataset.mimeType;
}

function setImagePreview(previewEl, source, title, details) {
  if (!source) {
    setEmptyImagePreview(previewEl);
    return;
  }

  previewEl.classList.add("has-image");
  previewEl.innerHTML = `
    <img src="${escapeAttribute(source)}" alt="${escapeAttribute(title)}" />
    <div>
      <strong>${escapeHtml(title)}</strong>
      <small>${escapeHtml(details || "Imagem carregada")}</small>
    </div>
  `;
}

function setEmptyImagePreview(previewEl) {
  previewEl.classList.remove("has-image");
  previewEl.innerHTML = `
    <strong>Nenhuma imagem selecionada</strong>
    <small>PNG, JPG, WEBP ou SVG. A imagem será enviada para a API.</small>
  `;
}

function setUploadingImagePreview(previewEl, file) {
  previewEl.classList.remove("has-image");
  previewEl.innerHTML = `
    <strong>Enviando imagem para a API...</strong>
    <small>${escapeHtml(file.name)} · ${formatBytes(file.size)}</small>
  `;
}

function clearImagePreviews() {
  setEmptyImagePreview(els.desktopImagePreview);
  setEmptyImagePreview(els.mobileImagePreview);
}

function clearFieldError(fieldName) {
  const input = getInputByContractField(fieldName) || document.querySelector(`#${fieldName}`);
  const wrapper = input?.closest(".field");
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);

  wrapper?.classList.remove("invalid");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("error");
  }
}

function setPageLoading(isLoading) {
  state.isLoading = isLoading;
  els.refreshBtn.disabled = isLoading;
  els.newProjectBtn.disabled = isLoading;
  els.exportBtn.disabled = isLoading;
}

function setFormLoading(isLoading) {
  els.submitBtn.disabled = isLoading;
  els.submitBtn.textContent = isLoading
    ? "Salvando na API..."
    : (els.projectId.value ? "Atualizar projeto" : "Salvar projeto");
}

function setConnectionStatus(status, title, detail) {
  els.apiStatusDot.className = `status-dot is-${status}`;
  els.apiStatusTitle.textContent = title;
  els.apiStatusDetail.textContent = detail;
}

function toast(message, type = "success") {
  els.toast.textContent = message;
  els.toast.className = `toast show ${type === "error" ? "error" : ""} ${type === "warning" ? "warning" : ""}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 3200);
}

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (error.status === 401) return "Token admin inválido ou ausente.";
  if (error.status === 503) return "API online, mas MongoDB indisponível.";
  if (error.status === 413) return "Imagem/Base64 maior que o limite da API.";
  if (error.code === "DATABASE_UNAVAILABLE") return "API online, mas MongoDB indisponível.";
  return error.message || fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function getInitials(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join("") || "CX";
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

init();
