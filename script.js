const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const formatPrice = (value) => value.toLocaleString("ru-RU").replace(/,/g, " ") + " so'm";

const showToast = (text) => {
  const toast = $("#toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
};

window.addEventListener("load", () => {
  setTimeout(() => {
    $("#loader").classList.add("hide");
    revealOnScroll();
  }, 1700);
});

const header = $("#header");
const toTop = $("#toTop");
const sections = $$("section[id]");
const navLinks = $$(".nav a");

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 60);
  toTop.classList.toggle("show", y > 600);

  sections.forEach((section) => {
    const top = section.offsetTop - 140;
    if (y >= top && y < top + section.offsetHeight) {
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + section.id);
      });
    }
  });
});

toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const nav = $("#nav");
$("#burger").addEventListener("click", () => nav.classList.toggle("open"));
navLinks.forEach((link) => link.addEventListener("click", () => nav.classList.remove("open")));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

function revealOnScroll() {
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 0.12 + "s";
    observer.observe(el);
  });
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.target;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / 2000, 1);
      el.textContent = Math.floor(target * (1 - Math.pow(1 - progress, 3))).toLocaleString() + "+";
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    counterObserver.unobserve(el);
  });
});
$$(".counter").forEach((el) => counterObserver.observe(el));

$$(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    $$(".card").forEach((card) => {
      card.classList.toggle("hidden", filter !== "all" && card.dataset.cat !== filter);
    });
  });
});

$$(".like").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("liked");
    const icon = btn.querySelector("i");
    const liked = btn.classList.contains("liked");
    icon.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
    showToast(liked ? "Sevimlilarga qo'shildi ❤" : "Sevimlilardan olindi");
  });
});

let cart = JSON.parse(localStorage.getItem("luxbag-cart") || "[]");

const cartPanel = $("#cart");
const overlay = $("#overlay");

const openCart = () => {
  cartPanel.classList.add("open");
  overlay.classList.add("show");
  document.body.classList.add("locked");
};

const closeCart = () => {
  cartPanel.classList.remove("open");
  overlay.classList.remove("show");
  document.body.classList.remove("locked");
};

function renderCart() {
  const list = $("#cartItems");
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  list.innerHTML = cart.length
    ? cart.map((item, i) => `
        <li>
          <div><strong>${item.name}</strong><small>${formatPrice(item.price)}</small></div>
          <div class="qty">
            <button data-action="minus" data-index="${i}">−</button>
            <span>${item.qty}</span>
            <button data-action="plus" data-index="${i}">+</button>
          </div>
        </li>`).join("")
    : `<p class="empty">Savat hozircha bo'sh</p>`;

  const badge = $("#cartCount");
  badge.textContent = count;
  badge.classList.remove("bump");
  void badge.offsetWidth;
  badge.classList.add("bump");

  $("#cartTotal").textContent = formatPrice(total);
  localStorage.setItem("luxbag-cart", JSON.stringify(cart));
}

$$(".add").forEach((btn) => {
  btn.addEventListener("click", () => {
    const { name, price } = btn.dataset;
    const found = cart.find((item) => item.name === name);
    found ? found.qty++ : cart.push({ name, price: +price, qty: 1 });
    renderCart();
    showToast(name + " savatga qo'shildi");
  });
});

$("#cartItems").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const item = cart[btn.dataset.index];
  btn.dataset.action === "plus" ? item.qty++ : item.qty--;
  if (item.qty <= 0) cart.splice(btn.dataset.index, 1);
  renderCart();
});

$("#cartBtn").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

$("#checkout").addEventListener("click", () => {
  if (!cart.length) return showToast("Avval mahsulot tanlang");
  cart = [];
  renderCart();
  closeCart();
  showToast("Rahmat! Buyurtmangiz qabul qilindi 🎉");
});

renderCart();

const modal = $("#modal");
$("#storyBtn").addEventListener("click", () => modal.classList.add("show"));
$("#closeModal").addEventListener("click", () => modal.classList.remove("show"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("show");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modal.classList.remove("show");
    closeCart();
  }
});

const slides = $("#slides");
const dotsBox = $("#dots");
const total = slides.children.length;
let current = 0;
let autoplay;

for (let i = 0; i < total; i++) {
  const dot = document.createElement("button");
  dot.setAttribute("aria-label", "Slayd " + (i + 1));
  dot.addEventListener("click", () => goTo(i));
  dotsBox.appendChild(dot);
}

function goTo(index) {
  current = (index + total) % total;
  slides.style.transform = `translateX(-${current * 100}%)`;
  [...dotsBox.children].forEach((d, i) => d.classList.toggle("active", i === current));
  clearInterval(autoplay);
  autoplay = setInterval(() => goTo(current + 1), 5000);
}

$("#prev").addEventListener("click", () => goTo(current - 1));
$("#next").addEventListener("click", () => goTo(current + 1));
goTo(0);

const deadline = Date.now() + 3 * 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");

setInterval(() => {
  const diff = Math.max(deadline - Date.now(), 0);
  $("#d").textContent = pad(Math.floor(diff / 86400000));
  $("#h").textContent = pad(Math.floor(diff / 3600000) % 24);
  $("#m").textContent = pad(Math.floor(diff / 60000) % 60);
  $("#s").textContent = pad(Math.floor(diff / 1000) % 60);
}, 1000);

$("#contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#name").value.trim();
  showToast(`Rahmat, ${name}! Xabaringiz yuborildi`);
  e.target.reset();
});

$("#newsletter").addEventListener("submit", (e) => {
  e.preventDefault();
  showToast("Obuna bo'lganingiz uchun rahmat!");
  e.target.reset();
});
