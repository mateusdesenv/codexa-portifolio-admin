const API_CONFIG_KEY = "codexa_portfolio_api_config_v1";
const TAXONOMY_STORAGE_KEY = "codexa_portfolio_taxonomy_v1";

const DEFAULT_API_CONFIG = {
  baseUrl: "http://localhost:3333",
  adminToken: "codexa-dev-token"
};

const state = {
  items: [],
  publicItems: [],
  taxonomy: loadTaxonomy(),
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
  tagPicker: document.querySelector("#tagPicker"),
  categoryManagerForm: document.querySelector("#categoryManagerForm"),
  categoryEditId: document.querySelector("#categoryEditId"),
  categoryName: document.querySelector("#categoryName"),
  categoryDescription: document.querySelector("#categoryDescription"),
  saveCategoryBtn: document.querySelector("#saveCategoryBtn"),
  cancelCategoryEditBtn: document.querySelector("#cancelCategoryEditBtn"),
  categoryList: document.querySelector("#categoryList"),
  categoryCount: document.querySelector("#categoryCount"),
  tagManagerForm: document.querySelector("#tagManagerForm"),
  tagEditId: document.querySelector("#tagEditId"),
  tagName: document.querySelector("#tagName"),
  saveTagBtn: document.querySelector("#saveTagBtn"),
  cancelTagEditBtn: document.querySelector("#cancelTagEditBtn"),
  tagList: document.querySelector("#tagList"),
  tagCount: document.querySelector("#tagCount"),
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
  apiStatusDetail: document.querySelector("#apiStatusDetail"),
  imageLightbox: document.querySelector("#imageLightbox"),
  imageLightboxTitle: document.querySelector("#imageLightboxTitle"),
  imageLightboxSubtitle: document.querySelector("#imageLightboxSubtitle"),
  imageLightboxGrid: document.querySelector("#imageLightboxGrid")
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

function loadTaxonomy() {
  const defaults = {
    categories: [
      createTaxonomyItem("Advocacia", "Sites para escritórios de advocacia", "category"),
      createTaxonomyItem("Clínicas odontológicas", "Sites para clínicas e consultórios", "category"),
      createTaxonomyItem("Restaurantes", "Sites para restaurantes, pizzarias e bares", "category"),
      createTaxonomyItem("Portfólio", "Projetos institucionais e criativos", "category")
    ],
    tags: [
      createTaxonomyItem("Landing Page", "", "tag"),
      createTaxonomyItem("Institucional", "", "tag"),
      createTaxonomyItem("Responsivo", "", "tag"),
      createTaxonomyItem("Premium", "", "tag")
    ]
  };

  try {
    const raw = localStorage.getItem(TAXONOMY_STORAGE_KEY);
    if (!raw) return defaults;

    const saved = JSON.parse(raw);
    return {
      categories: normalizeTaxonomyList(saved.categories, "category"),
      tags: normalizeTaxonomyList(saved.tags, "tag")
    };
  } catch {
    return defaults;
  }
}

function saveTaxonomy() {
  localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(state.taxonomy));
}

function createTaxonomyItem(name, description = "", type = "tag") {
  const cleanName = String(name || "").trim();
  const now = new Date().toISOString();

  return {
    id: `${type}-${slugify(cleanName || "item")}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: cleanName,
    slug: slugify(cleanName),
    description: String(description || "").trim(),
    createdAt: now,
    updatedAt: now
  };
}

function normalizeTaxonomyList(list, type) {
  if (!Array.isArray(list)) return [];

  return list
    .map(item => {
      const name = String(item?.name || item || "").trim();
      if (!name) return null;
      return {
        id: item?.id || `${type}-${slugify(name)}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        name,
        slug: slugify(item?.slug || name),
        description: String(item?.description || "").trim(),
        createdAt: item?.createdAt || new Date().toISOString(),
        updatedAt: item?.updatedAt || new Date().toISOString()
      };
    })
    .filter(Boolean);
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
  els.tags.addEventListener("input", renderTagPicker);

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

  els.categoryManagerForm?.addEventListener("submit", handleCategorySubmit);
  els.cancelCategoryEditBtn?.addEventListener("click", resetCategoryForm);
  els.categoryList?.addEventListener("click", handleCategoryListClick);

  els.tagManagerForm?.addEventListener("submit", handleTagSubmit);
  els.cancelTagEditBtn?.addEventListener("click", resetTagForm);
  els.tagList?.addEventListener("click", handleTagListClick);
  els.tagPicker?.addEventListener("click", handleTagPickerClick);

  els.tableBody.addEventListener("click", handleTableClick);

  els.imageLightbox?.addEventListener("click", event => {
    if (event.target.closest('[data-action="close-images"]')) {
      closeImageLightbox();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !els.imageLightbox?.hidden) {
      closeImageLightbox();
    }
  });

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


function handleCategorySubmit(event) {
  event.preventDefault();
  clearFieldError("categoryName");

  const name = els.categoryName.value.trim();
  const description = els.categoryDescription.value.trim();
  const editingId = els.categoryEditId.value;
  const slug = slugify(name);
  const duplicated = state.taxonomy.categories.some(category => category.slug === slug && category.id !== editingId);

  if (!name || name.length < 2) {
    showErrors([{ field: "categoryName", message: "Informe uma categoria com pelo menos 2 caracteres." }]);
    return;
  }

  if (duplicated) {
    showErrors([{ field: "categoryName", message: "Essa categoria já existe." }]);
    return;
  }

  if (editingId) {
    const category = state.taxonomy.categories.find(item => item.id === editingId);
    if (category) {
      category.name = name;
      category.slug = slug;
      category.description = description;
      category.updatedAt = new Date().toISOString();
    }
    toast("Categoria atualizada.");
  } else {
    state.taxonomy.categories.push(createTaxonomyItem(name, description, "category"));
    toast("Categoria cadastrada.");
  }

  state.taxonomy.categories = sortTaxonomy(state.taxonomy.categories);
  saveTaxonomy();
  resetCategoryForm();
  render();
  els.category.value = name;
}

function handleTagSubmit(event) {
  event.preventDefault();
  clearFieldError("tagName");

  const name = els.tagName.value.trim();
  const editingId = els.tagEditId.value;
  const slug = slugify(name);
  const duplicated = state.taxonomy.tags.some(tag => tag.slug === slug && tag.id !== editingId);

  if (!name || name.length < 2) {
    showErrors([{ field: "tagName", message: "Informe uma tag com pelo menos 2 caracteres." }]);
    return;
  }

  if (duplicated) {
    showErrors([{ field: "tagName", message: "Essa tag já existe." }]);
    return;
  }

  if (editingId) {
    const tag = state.taxonomy.tags.find(item => item.id === editingId);
    if (tag) {
      tag.name = name;
      tag.slug = slug;
      tag.updatedAt = new Date().toISOString();
    }
    toast("Tag atualizada.");
  } else {
    state.taxonomy.tags.push(createTaxonomyItem(name, "", "tag"));
    toast("Tag cadastrada.");
  }

  state.taxonomy.tags = sortTaxonomy(state.taxonomy.tags);
  saveTaxonomy();
  resetTagForm();
  render();
  addTagToInput(name);
}

function handleCategoryListClick(event) {
  const button = event.target.closest("button[data-taxonomy-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.taxonomyAction;

  if (action === "edit-category") {
    const category = state.taxonomy.categories.find(item => item.id === id);
    if (!category) return;

    els.categoryEditId.value = category.id;
    els.categoryName.value = category.name;
    els.categoryDescription.value = category.description || "";
    els.saveCategoryBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">check</span>Atualizar categoria`;
    els.cancelCategoryEditBtn.hidden = false;
    els.categoryName.focus();
  }

  if (action === "delete-category") {
    const category = state.taxonomy.categories.find(item => item.id === id);
    if (!category) return;

    const usageCount = state.items.filter(item => slugify(item.category) === category.slug).length;
    const confirmed = confirm(usageCount
      ? `Excluir a categoria "${category.name}"? Ela continuará nos ${usageCount} projeto(s) já cadastrados e pode aparecer nos filtros enquanto estiver em uso.`
      : `Excluir a categoria "${category.name}"?`);

    if (!confirmed) return;
    state.taxonomy.categories = state.taxonomy.categories.filter(item => item.id !== id);
    saveTaxonomy();
    resetCategoryForm();
    render();
    toast("Categoria removida da lista de opções.");
  }
}

function handleTagListClick(event) {
  const button = event.target.closest("button[data-taxonomy-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.taxonomyAction;

  if (action === "edit-tag") {
    const tag = state.taxonomy.tags.find(item => item.id === id);
    if (!tag) return;

    els.tagEditId.value = tag.id;
    els.tagName.value = tag.name;
    els.saveTagBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">check</span>Atualizar tag`;
    els.cancelTagEditBtn.hidden = false;
    els.tagName.focus();
  }

  if (action === "delete-tag") {
    const tag = state.taxonomy.tags.find(item => item.id === id);
    if (!tag) return;

    const usageCount = state.items.filter(item => item.tags.some(itemTag => slugify(itemTag) === tag.slug)).length;
    const confirmed = confirm(usageCount
      ? `Excluir a tag "${tag.name}"? Ela continuará nos ${usageCount} projeto(s) já cadastrados e pode aparecer como sugestão enquanto estiver em uso.`
      : `Excluir a tag "${tag.name}"?`);

    if (!confirmed) return;
    state.taxonomy.tags = state.taxonomy.tags.filter(item => item.id !== id);
    saveTaxonomy();
    resetTagForm();
    render();
    toast("Tag removida da lista de opções.");
  }
}

function handleTagPickerClick(event) {
  const button = event.target.closest("button[data-tag]");
  if (!button) return;

  addTagToInput(button.dataset.tag);
}

function addTagToInput(tagName) {
  const existing = parseTags(els.tags.value);
  const alreadyAdded = existing.some(tag => slugify(tag) === slugify(tagName));

  if (!alreadyAdded) {
    existing.push(tagName);
    els.tags.value = existing.join(", ");
  }

  renderTagPicker();
}

function resetCategoryForm() {
  if (!els.categoryManagerForm) return;
  els.categoryManagerForm.reset();
  els.categoryEditId.value = "";
  els.saveCategoryBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">check</span>Salvar categoria`;
  els.cancelCategoryEditBtn.hidden = true;
  clearFieldError("categoryName");
}

function resetTagForm() {
  if (!els.tagManagerForm) return;
  els.tagManagerForm.reset();
  els.tagEditId.value = "";
  els.saveTagBtn.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">check</span>Salvar tag`;
  els.cancelTagEditBtn.hidden = true;
  clearFieldError("tagName");
}

async function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  button.disabled = true;

  try {
    if (action === "view-images") openImageLightbox(id);
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
  renderTaxonomy();
  renderListAndPreview();
}

function renderStats() {
  els.totalProjects.textContent = state.items.length;
  els.publishedProjects.textContent = state.items.filter(item => item.status === "published").length;
  els.featuredProjects.textContent = state.items.filter(item => item.featured).length;
  els.draftProjects.textContent = state.items.filter(item => item.status === "draft").length;
}

function renderCategories() {
  const categories = getAllCategoryNames();
  const currentFilterCategory = els.categoryFilter.value;
  const currentFormCategory = els.category.value || "Sem categoria";

  els.categoryFilter.innerHTML = `<option value="all">Todas</option>`;
  els.category.innerHTML = "";

  categories.forEach(category => {
    const filterOption = document.createElement("option");
    filterOption.value = category;
    filterOption.textContent = category;
    els.categoryFilter.appendChild(filterOption);

    const formOption = document.createElement("option");
    formOption.value = category;
    formOption.textContent = category;
    els.category.appendChild(formOption);
  });

  els.categoryFilter.value = ["all", ...categories].includes(currentFilterCategory) ? currentFilterCategory : "all";
  els.category.value = categories.includes(currentFormCategory) ? currentFormCategory : "Sem categoria";
}

function syncTaxonomyWithProjects() {
  let changed = false;
  const categorySlugs = new Set(state.taxonomy.categories.map(category => category.slug));
  const tagSlugs = new Set(state.taxonomy.tags.map(tag => tag.slug));

  state.items.forEach(item => {
    const categoryName = String(item.category || "Sem categoria").trim() || "Sem categoria";
    const categorySlug = slugify(categoryName);

    if (!categorySlugs.has(categorySlug)) {
      state.taxonomy.categories.push(createTaxonomyItem(categoryName, "Criada a partir dos projetos cadastrados.", "category"));
      categorySlugs.add(categorySlug);
      changed = true;
    }

    item.tags.forEach(tagName => {
      const tagSlug = slugify(tagName);
      if (tagSlug && !tagSlugs.has(tagSlug)) {
        state.taxonomy.tags.push(createTaxonomyItem(tagName, "", "tag"));
        tagSlugs.add(tagSlug);
        changed = true;
      }
    });
  });

  state.taxonomy.categories = sortTaxonomy(state.taxonomy.categories);
  state.taxonomy.tags = sortTaxonomy(state.taxonomy.tags);

  if (changed) saveTaxonomy();
}

function sortTaxonomy(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function getAllCategoryNames() {
  const names = new Set(["Sem categoria"]);
  state.taxonomy.categories.forEach(category => names.add(category.name));
  state.items.forEach(item => names.add(item.category || "Sem categoria"));

  return [...names].sort((a, b) => {
    if (a === "Sem categoria") return -1;
    if (b === "Sem categoria") return 1;
    return a.localeCompare(b, "pt-BR");
  });
}

function getAllTagNames() {
  const names = new Set();
  state.taxonomy.tags.forEach(tag => names.add(tag.name));
  state.items.forEach(item => item.tags.forEach(tag => names.add(tag)));
  return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function renderTaxonomy() {
  renderCategoryManager();
  renderTagManager();
  renderTagPicker();
}

function renderCategoryManager() {
  if (!els.categoryList) return;

  els.categoryCount.textContent = state.taxonomy.categories.length;

  if (!state.taxonomy.categories.length) {
    els.categoryList.innerHTML = renderTaxonomyEmpty("Nenhuma categoria cadastrada", "Crie categorias para padronizar os filtros do portfólio.");
    return;
  }

  els.categoryList.innerHTML = sortTaxonomy(state.taxonomy.categories).map(category => {
    const usageCount = state.items.filter(item => slugify(item.category) === category.slug).length;
    return `
      <article class="taxonomy-item">
        <div>
          <strong>${escapeHtml(category.name)}</strong>
          <small>${escapeHtml(category.description || "Sem descrição interna")} · ${usageCount} projeto(s)</small>
        </div>
        <div class="taxonomy-item-actions">
          <button class="icon-button icon-only" type="button" title="Editar categoria" data-taxonomy-action="edit-category" data-id="${escapeAttribute(category.id)}"><span class="material-symbols-rounded" aria-hidden="true">edit</span></button>
          <button class="icon-button icon-only delete" type="button" title="Excluir categoria" data-taxonomy-action="delete-category" data-id="${escapeAttribute(category.id)}"><span class="material-symbols-rounded" aria-hidden="true">delete</span></button>
        </div>
      </article>
    `;
  }).join("");
}

function renderTagManager() {
  if (!els.tagList) return;

  els.tagCount.textContent = state.taxonomy.tags.length;

  if (!state.taxonomy.tags.length) {
    els.tagList.innerHTML = renderTaxonomyEmpty("Nenhuma tag cadastrada", "Crie tags para usar nos projetos com um clique.");
    return;
  }

  els.tagList.innerHTML = sortTaxonomy(state.taxonomy.tags).map(tag => {
    const usageCount = state.items.filter(item => item.tags.some(itemTag => slugify(itemTag) === tag.slug)).length;
    return `
      <article class="taxonomy-item tag-taxonomy-item">
        <div>
          <strong>${escapeHtml(tag.name)}</strong>
          <small>${usageCount} projeto(s)</small>
        </div>
        <div class="taxonomy-item-actions">
          <button class="icon-button icon-only" type="button" title="Editar tag" data-taxonomy-action="edit-tag" data-id="${escapeAttribute(tag.id)}"><span class="material-symbols-rounded" aria-hidden="true">edit</span></button>
          <button class="icon-button icon-only delete" type="button" title="Excluir tag" data-taxonomy-action="delete-tag" data-id="${escapeAttribute(tag.id)}"><span class="material-symbols-rounded" aria-hidden="true">delete</span></button>
        </div>
      </article>
    `;
  }).join("");
}

function renderTagPicker() {
  if (!els.tagPicker) return;

  const tags = getAllTagNames();

  if (!tags.length) {
    els.tagPicker.innerHTML = `<span class="tag-picker-empty">Nenhuma tag cadastrada ainda.</span>`;
    return;
  }

  const selectedSlugs = new Set(parseTags(els.tags.value).map(tag => slugify(tag)));

  els.tagPicker.innerHTML = tags.map(tag => {
    const isActive = selectedSlugs.has(slugify(tag));
    return `
      <button class="tag-option ${isActive ? "active" : ""}" type="button" data-tag="${escapeAttribute(tag)}">${escapeHtml(tag)}</button>
    `;
  }).join("");
}

function renderTaxonomyEmpty(title, description) {
  return `
    <div class="taxonomy-empty">
      <span class="material-symbols-rounded" aria-hidden="true">inventory_2</span>
      <strong>${escapeHtml(title)}</strong>
      <small>${escapeHtml(description)}</small>
    </div>
  `;
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
        <button class="icon-button icon-only" type="button" title="Subir" data-action="move-up" data-id="${escapeAttribute(item.id)}" ${globalIndex === 0 ? "disabled" : ""}><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_up</span></button>
        <span class="order-number">${String(item.order).padStart(2, "0")}</span>
        <button class="icon-button icon-only" type="button" title="Descer" data-action="move-down" data-id="${escapeAttribute(item.id)}" ${globalIndex === orderedAll.length - 1 ? "disabled" : ""}><span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_down</span></button>
      </div>
    `;

    row.querySelector(".project-cell").innerHTML = `
      <div class="project-info">
        ${renderProjectImages(item)}
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
        <button class="icon-button" type="button" title="Visualizar imagens cadastradas" data-action="view-images" data-id="${escapeAttribute(item.id)}"><span class="material-symbols-rounded" aria-hidden="true">image</span>Imagens</button>
        <button class="icon-button edit" type="button" title="Editar" data-action="edit" data-id="${escapeAttribute(item.id)}"><span class="material-symbols-rounded" aria-hidden="true">edit</span>Editar</button>
        <button class="icon-button" type="button" title="Duplicar" data-action="duplicate" data-id="${escapeAttribute(item.id)}"><span class="material-symbols-rounded" aria-hidden="true">content_copy</span>Duplicar</button>
        <button class="icon-button" type="button" title="Arquivar/restaurar" data-action="archive" data-id="${escapeAttribute(item.id)}"><span class="material-symbols-rounded" aria-hidden="true">${item.status === "archived" ? "unarchive" : "archive"}</span>${item.status === "archived" ? "Restaurar" : "Arquivar"}</button>
        <button class="icon-button delete" type="button" title="Excluir lógico" data-action="delete" data-id="${escapeAttribute(item.id)}"><span class="material-symbols-rounded" aria-hidden="true">delete</span>Excluir</button>
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
        <a href="${escapeAttribute(item.projectUrl)}" target="_blank" rel="noopener">Ver projeto <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span></a>
      </div>
    `;
    els.preview.appendChild(card);
  });
}

function renderProjectImages(item) {
  return `
    <button class="project-image-stack" type="button" data-action="view-images" data-id="${escapeAttribute(item.id)}" aria-label="Visualizar imagens de ${escapeAttribute(item.title)}">
      ${renderMiniScreen(item.desktopImageUrl, item.altText, "desktop", "Desktop")}
      ${renderMiniScreen(item.mobileImageUrl, item.altText, "mobile", "Mobile")}
      <span class="project-image-zoom"><span class="material-symbols-rounded" aria-hidden="true">zoom_in</span>Ver</span>
    </button>
  `;
}

function renderMiniScreen(source, altText, type, label) {
  if (!source) {
    return `
      <span class="project-screen ${type} empty">
        <span>${type === "desktop" ? "D" : "M"}</span>
        <small>${escapeHtml(label)}</small>
      </span>
    `;
  }

  return `
    <span class="project-screen ${type}">
      <img src="${escapeAttribute(source)}" alt="${escapeAttribute(altText || label)}" loading="lazy" />
      <small>${escapeHtml(label)}</small>
    </span>
  `;
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

function openImageLightbox(id) {
  const item = state.items.find(project => project.id === id);
  if (!item || !els.imageLightbox) return;

  els.imageLightboxTitle.textContent = item.title;
  els.imageLightboxSubtitle.textContent = `${item.category} · ${item.slug}`;
  els.imageLightboxGrid.innerHTML = `
    ${renderImageViewerPanel(item.desktopImageUrl, "desktop", "Imagem desktop", item.altText)}
    ${renderImageViewerPanel(item.mobileImageUrl, "mobile", "Imagem mobile", item.altText)}
  `;
  els.imageLightbox.hidden = false;
  document.body.classList.add("lightbox-open");
}

function closeImageLightbox() {
  if (!els.imageLightbox) return;
  els.imageLightbox.hidden = true;
  els.imageLightboxGrid.innerHTML = "";
  document.body.classList.remove("lightbox-open");
}

function renderImageViewerPanel(source, type, title, altText) {
  if (!source) {
    return `
      <article class="image-viewer-panel ${type}">
        <div class="image-viewer-title">
          <strong>${escapeHtml(title)}</strong>
          <small>${type === "desktop" ? "Formato horizontal" : "Formato vertical"}</small>
        </div>
        <div class="image-viewer-empty">
          <strong>Sem imagem cadastrada</strong>
          <small>Cadastre uma imagem ${type === "desktop" ? "desktop" : "mobile"} no formulário.</small>
        </div>
      </article>
    `;
  }

  return `
    <article class="image-viewer-panel ${type}">
      <div class="image-viewer-title">
        <strong>${escapeHtml(title)}</strong>
        <small>${type === "desktop" ? "Preview horizontal do site" : "Preview vertical/mobile"}</small>
      </div>
      <a class="image-viewer-frame ${type}" href="${escapeAttribute(source)}" target="_blank" rel="noopener" title="Abrir imagem em nova aba">
        <img src="${escapeAttribute(source)}" alt="${escapeAttribute(altText || title)}" />
      </a>
      <div class="image-viewer-actions">
        <a class="ghost-button compact" href="${escapeAttribute(source)}" target="_blank" rel="noopener"><span class="material-symbols-rounded" aria-hidden="true">open_in_new</span>Abrir imagem</a>
      </div>
    </article>
  `;
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
