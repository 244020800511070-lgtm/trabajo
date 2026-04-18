(function () {
  const form = document.getElementById("product-form");
  const nameInput = document.getElementById("product-name");
  const detailInput = document.getElementById("product-detail");
  const valueInput = document.getElementById("product-value");
  const listEl = document.getElementById("product-list");
  const emptyState = document.getElementById("empty-state");
  const countEl = document.getElementById("article-count");
  const formStatus = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  const cfg = window.REDLIST_SUPABASE;
  const hasConfig =
    cfg &&
    typeof cfg.url === "string" &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url.trim()) &&
    typeof cfg.anonKey === "string" &&
    cfg.anonKey.trim().startsWith("eyJ") &&
    cfg.anonKey.length > 80;

  let client = null;
  if (hasConfig && typeof window.supabase !== "undefined") {
    const { createClient } = window.supabase;
    client = createClient(cfg.url, cfg.anonKey);
  }

  /** @type {{ id: string; name: string; detail: string; value: string }[]} */
  let products = [];

  function setStatus(message, kind) {
    formStatus.textContent = message || "";
    formStatus.classList.remove("form-status--error", "form-status--ok");
    if (kind === "error") formStatus.classList.add("form-status--error");
    if (kind === "ok") formStatus.classList.add("form-status--ok");
  }

  function formatCount(n) {
    return n === 1 ? "1 Artículo registrado" : `${n} Artículos registrados`;
  }

  function render() {
    const n = products.length;
    countEl.textContent = formatCount(n);

    if (n === 0) {
      emptyState.hidden = false;
      listEl.innerHTML = "";
      return;
    }

    emptyState.hidden = true;
    listEl.innerHTML = products
      .map(
        (p) => `
      <li class="product-card" data-id="${escapeHtml(p.id)}">
        <h3 class="product-card-name">${escapeHtml(p.name)}</h3>
        <p class="product-card-detail">${escapeHtml(p.detail || "Sin detalle")}</p>
        <p class="product-card-value">${escapeHtml(p.value || "—")}</p>
      </li>`
      )
      .join("");
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadProducts() {
    if (!client) return;
    setStatus("Cargando catálogo…", "ok");
    submitBtn.disabled = true;
    const { data, error } = await client
      .from("products")
      .select("id, name, detail, value, created_at")
      .order("created_at", { ascending: false });

    submitBtn.disabled = false;

    if (error) {
      setStatus("No se pudo cargar la lista: " + error.message, "error");
      return;
    }

    products = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      detail: row.detail ?? "",
      value: row.value ?? "",
    }));
    setStatus("");
    render();
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    const detail = detailInput.value.trim();
    const value = valueInput.value.trim();

    if (!client) {
      setStatus(
        "Configura Supabase: copia config.example.js como config.js y pon url y anonKey.",
        "error"
      );
      return;
    }

    setStatus("Guardando…", "ok");
    submitBtn.disabled = true;

    const { data, error } = await client
      .from("products")
      .insert({ name, detail, value })
      .select("id, name, detail, value")
      .single();

    submitBtn.disabled = false;

    if (error) {
      setStatus("Error al guardar: " + error.message, "error");
      return;
    }

    if (data) {
      products.unshift({
        id: data.id,
        name: data.name,
        detail: data.detail ?? "",
        value: data.value ?? "",
      });
    }

    nameInput.value = "";
    detailInput.value = "";
    valueInput.value = "";
    nameInput.focus();
    setStatus("Producto guardado.", "ok");
    render();
    setTimeout(function () {
      if (formStatus.textContent === "Producto guardado.") setStatus("");
    }, 2500);
  });

  if (!client) {
    setStatus(
      "Sin conexión a Supabase: crea config.js (ver config.example.js) y recarga.",
      "error"
    );
    render();
    return;
  }

  loadProducts();
})();
