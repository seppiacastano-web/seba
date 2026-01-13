const view = document.getElementById("view");
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile menu toggle
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
menuBtn.addEventListener("click", () => mobileMenu.classList.toggle("show"));
mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mobileMenu.classList.remove("show")));

// Escape HTML to prevent injection in excerpts and metadata
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#39;'}[s] || s));
}

// Fetch posts metadata from posts.json
async function getPosts(){
  const res = await fetch("posts.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Non riesco a caricare posts.json");
  const posts = await res.json();
  // Sort by date descending (newest first)
  posts.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  return posts;
}

// Router: checks hash fragment and renders appropriate view
function route(){
  const hash = location.hash || "#/";
  const [path] = hash.slice(2).split("?");
  const segments = (path || "").split("/").filter(Boolean);

  if (segments.length === 0) return renderHome();
  if (segments[0] === "chi-sono") return renderAbout();
  if (segments[0] === "blog" && segments.length === 1) return renderBlogList();
  if (segments[0] === "blog" && segments[1]) return renderPost(segments[1]);

  renderNotFound();
}

// Home page content
function renderHome(){
  view.innerHTML = `
    <div class="hero">
      <div>
        <h1>Seb's blog – pensieri sulla vita</h1>
        <p>Questo non è un blog di risposte, ma di domande. Scrivo per capire chi sono, cosa voglio diventare e che senso ha tutto quello che facciamo ogni giorno.</p>
        <p>Qui troverai riflessioni sul senso della vita, sulla possibilità che esista qualcosa dopo la morte e su cosa significhi davvero realizzare se stessi.</p>
        <p>Non prometto certezze. Prometto solo pensieri onesti.</p>
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:14px;">
          <a class="btn primary" href="#/blog">Vai al Blog</a>
          <a class="btn" href="#/chi-sono">Chi sono</a>
        </div>
      </div>
      <div class="card">
        <h2 style="margin:0 0 8px;">Cosa trovi qui</h2>
        <p style="margin:0;">Pensieri, domande e riflessioni scritti in Markdown e pubblicati gratis. Inizia a leggere dal post più recente oppure esplora a caso.</p>
      </div>
    </div>
  `;
}

// About page content
function renderAbout(){
  view.innerHTML = `
    <div class="article">
      <h1>Chi sono</h1>
      <p>Mi chiamo Sebastiano, ma questo spazio è semplicemente Seb’s blog.</p>
      <p>Non sono un filosofo, né un guru. Sono una persona che pensa troppo e che non si accontenta delle risposte facili. Scrivo perché a volte la vita sembra confusa, a volte vuota, a volte piena di possibilità che fanno paura.</p>
      <p>Credo che porsi domande sia una forma di coraggio. Qui raccolgo le mie riflessioni sul senso della vita, sulla morte, su Dio, sul destino, e soprattutto su cosa significhi essere davvero se stessi in un mondo che spinge tutti a essere uguali.</p>
      <p>Se ti ritrovi anche solo in una frase, allora questo blog ha già fatto il suo lavoro.</p>
      <p>Se vuoi monetizzare, aggiungi anche una pagina “Privacy/Cookie” più avanti.</p>
    </div>
  `;
}

// Blog list
async function renderBlogList(){
  view.innerHTML = `<div class="card"><p>Caricamento post…</p></div>`;
  try{
    const posts = await getPosts();
    const items = posts.map(p => `
      <article class="postItem">
        <h3><a href="#/blog/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></h3>
        <div class="meta">${escapeHtml(p.date || "")}</div>
        <p>${escapeHtml(p.excerpt || "")}</p>
      </article>
    `).join("");

    view.innerHTML = `
      <h1>Blog</h1>
      <p>${posts.length} post</p>
      <div class="postList">${items || "<p>Nessun post ancora.</p>"}</div>
    `;
  }catch(err){
    view.innerHTML = `<div class="card"><h2>Errore</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

// Single post
async function renderPost(slug){
  view.innerHTML = `<div class="card"><p>Caricamento articolo…</p></div>`;
  try{
    const posts = await getPosts();
    const postMeta = posts.find(p => p.slug === slug);

    const res = await fetch(`posts/${encodeURIComponent(slug)}.md`, { cache: "no-store" });
    if(!res.ok) throw new Error("Post non trovato");
    const md = await res.text();

    const html = (window.marked ? window.marked.parse(md) : `<pre>${escapeHtml(md)}</pre>`);

    view.innerHTML = `
      <div class="article">
        <a class="btn" href="#/blog">← Tutti i post</a>
        <h1 style="margin-top:14px;">${escapeHtml(postMeta?.title || slug)}</h1>
        <div class="meta">${escapeHtml(postMeta?.date || "")}</div>
        <div style="margin-top:14px;">${html}</div>
      </div>
    `;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }catch(err){
    view.innerHTML = `<div class="card"><h2>Errore</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

// Fallback view for 404
function renderNotFound(){
  view.innerHTML = `
    <div class="card">
      <h1>404</h1>
      <p>Pagina non trovata.</p>
      <a class="btn primary" href="#/">Torna alla Home</a>
    </div>
  `;
}

// Listen to hash changes
window.addEventListener("hashchange", route);
// Initial render
route();