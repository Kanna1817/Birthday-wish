const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

(function dobField(){
  const t=document.getElementById("dobInput"),n=document.getElementById("dobNative"),btn=document.getElementById("dobPick");
  const fmt=v=>{const d=v.replace(/\D/g,"").slice(0,8);return d.slice(0,2)+(d.length>2?" / "+d.slice(2,4):"")+(d.length>4?" / "+d.slice(4):"");};
  t.addEventListener("input",()=>{t.value=fmt(t.value);});
  btn.addEventListener("click",()=>{try{n.showPicker?n.showPicker():n.focus();}catch(e){n.focus();}});
  n.addEventListener("change",()=>{if(n.value){const[y,m,d]=n.value.split("-");t.value=`${d} / ${m} / ${y}`;}});
})();

const unlockForm = $("#unlockForm");
const experience = $("#experience");
const unlockScreen = $("#unlock");
const unlockError = $("#unlockError");

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#nameInput").value.trim().toLowerCase();
  const digits = $("#dobInput").value.replace(/\D/g, "");
  const day = digits.slice(0, 2), month = digits.slice(2, 4), year = digits.slice(4, 8);

  if (name === "gopika" && day === "09" && month === "10" && year === "2004") {
    unlockError.textContent = "";
    unlockScreen.classList.add("hidden");
    experience.classList.remove("hidden");
    document.body.classList.add("unlocked");
    setTimeout(() => {
      $("#home").scrollIntoView({ behavior: "smooth" });
      revealObserver.observe(document.body);
    }, 80);
  } else {
    unlockError.textContent = "That doesn't match the birthday details. Please try again.";
    [$("#nameInput"), $("#dobInput")].forEach(input => input.classList.add("invalid"));
    setTimeout(() => [$("#nameInput"), $("#dobInput")].forEach(input => input.classList.remove("invalid")), 900);
  }
});

const menuToggle = $("#menuToggle");
const siteNav = $("#siteNav");
menuToggle.addEventListener("click", () => {
  const open = siteNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
$$(".site-nav a").forEach(link => link.addEventListener("click", () => siteNav.classList.remove("open")));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
$$(".reveal").forEach(el => revealObserver.observe(el));

const sectionLinks = $$(".site-nav a");
const sections = sectionLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      sectionLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
    }
  });
}, { rootMargin: "-35% 0px -55% 0px" });
sections.forEach(section => navObserver.observe(section));

$("#surpriseButton").addEventListener("click", () => {
  $("#surpriseButton").textContent = "Surprise Opened ♥";
  $("#surpriseReveal").classList.remove("hidden");
  $("#surpriseReveal").scrollIntoView({ behavior: "smooth", block: "center" });
});

$$(".note-card").forEach(card => card.addEventListener("click", () => card.classList.toggle("open")));

const wishInput = $("#wishInput");
const supabaseConfig = () => window.SUPABASE_CONFIG;
const publicWishesPanel = $("#publicWishes");
const wishesList = $("#wishesList");
const wishesStatus = $("#wishesStatus");

function formatWishDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

async function loadPublicWishes() {
  const config = supabaseConfig();
  if (!config?.url || !config?.publishableKey) {
    wishesStatus.textContent = "Wishes are temporarily unavailable. Please check the Supabase setup.";
    return;
  }
  wishesStatus.textContent = "Loading wishes…";
  wishesList.replaceChildren();
  try {
    const response = await fetch(`${config.url}/rest/v1/wishes?select=id,name,wish_text,created_at&order=created_at.desc`, {
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}` }
    });
    if (!response.ok) throw new Error(await response.text() || `HTTP ${response.status}`);
    const wishes = await response.json();
    if (!wishes.length) {
      wishesStatus.textContent = "No wishes yet. Be the first to leave Gopika a birthday wish! ♥";
      return;
    }
    wishesStatus.textContent = `${wishes.length} ${wishes.length === 1 ? "wish" : "wishes"} for Gopika ♥`;
    wishes.forEach(wish => {
      const card = document.createElement("article");
      card.className = "public-wish-card";
      const message = document.createElement("p");
      message.textContent = wish.wish_text || "";
      const meta = document.createElement("div");
      meta.className = "public-wish-meta";
      const author = document.createElement("strong");
      author.textContent = wish.name?.trim() || "A friend";
      const date = document.createElement("time");
      date.textContent = formatWishDate(wish.created_at);
      if (wish.created_at) date.dateTime = wish.created_at;
      meta.append(author, date);
      card.append(message, meta);
      wishesList.append(card);
    });
  } catch (error) {
    console.error("Could not load public wishes:", error);
    wishesStatus.textContent = "Could not load wishes. Please refresh and try again.";
  }
}

$("#viewWishesButton").addEventListener("click", async () => {
  const opening = publicWishesPanel.classList.contains("hidden");
  publicWishesPanel.classList.toggle("hidden", !opening);
  $("#viewWishesButton").setAttribute("aria-expanded", String(opening));
  if (opening) await loadPublicWishes();
});

wishInput.addEventListener("input", () => $("#charCount").textContent = `${wishInput.value.length} / 240`);
$("#wishForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const wishText = wishInput.value.trim();
  if (!wishText) { wishInput.focus(); return; }
  if (wishText.length > 240) { showToast("Please keep your wish under 240 characters."); return; }
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey) {
    showToast("Supabase setup is missing. Please check supabase-config.js.");
    return;
  }
  const button = $("#wishForm button[type=submit]");
  button.disabled = true;
  button.textContent = "Saving…";
  try {
    const response = await fetch(`${config.url}/rest/v1/wishes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.publishableKey,
        "Authorization": `Bearer ${config.publishableKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ name: "", wish_text: wishText })
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || `HTTP ${response.status}`);
    }
    $("#wishSaved").textContent = "Wish saved for Gopika ♥";
    $("#wishSaved").classList.remove("hidden");
    wishInput.value = "";
    $("#charCount").textContent = "0 / 240";
    showToast("Your wish has been saved for Gopika ♥");
    if (!publicWishesPanel.classList.contains("hidden")) await loadPublicWishes();
  } catch (error) {
    console.error("Supabase wish save failed:", error);
    showToast("Could not save the wish. Check your Supabase table and RLS policies.");
  } finally {
    button.disabled = false;
    button.textContent = "Save My Wish ✦";
  }
});

$("#giftButton").addEventListener("click", () => {
  $("#gift").classList.add("open");
  $("#giftMessage").classList.remove("hidden");
  $("#giftButton").textContent = "Birthday magic revealed ♥";
});

$$(".balloon").forEach(balloon => {
  balloon.addEventListener("click", () => {
    $$(".balloon").forEach(b => b.classList.remove("selected"));
    balloon.classList.add("selected");
    $("#balloonText").textContent = balloon.dataset.message;
  });
});

let countdownTimer;
$("#finaleButton").addEventListener("click", () => {
  const finale = $("#finale");
  finale.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  const countdown = $("#countdown");
  const celebration = $("#finalCelebration");
  celebration.classList.add("hidden");
  let count = 3;
  countdown.textContent = count;

  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    count -= 1;
    if (count > 0) {
      countdown.textContent = count;
      countdown.style.animation = "none"; void countdown.offsetWidth; countdown.style.animation = "";
    } else {
      clearInterval(countdownTimer);
      countdown.classList.add("hidden");
      celebration.classList.remove("hidden");
      finaleBurst();
    }
  }, 1000);
});

$("#finaleClose").addEventListener("click", () => {
  clearInterval(countdownTimer);
  $("#finale").classList.add("hidden");
  $("#countdown").classList.remove("hidden");
  $("#finalCelebration").classList.add("hidden");
  document.body.style.overflow = "";
  $("#note").scrollIntoView({ behavior: "smooth" });
});

$$(".treat-card").forEach(card => {
  card.addEventListener("click", () => {
    $$(".treat-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    const choice = card.dataset.treat;
    const box = $("#treatConfirmation");
    box.textContent = `Perfect. ${choice} it is! 🎁`;
    box.classList.remove("hidden");
    showToast(`${choice} selected for Gopika ♥`);
  });
});

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#finale").classList.contains("hidden")) {
    $("#finaleClose").click();
  }
});

/* animation helpers */
(function(){
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const err=document.getElementById("unlockError"),card=document.getElementById("unlockForm");
  new MutationObserver(()=>{if(err.textContent){card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");}}).observe(err,{childList:true,characterData:true,subtree:true});
  if(reduce)return;
  const sym=["♥","✦","♡","✧"];
  setInterval(()=>{
    if(document.hidden)return;
    const h=document.createElement("span");h.className="float-heart";h.textContent=sym[Math.floor(Math.random()*sym.length)];
    h.style.left=Math.random()*100+"vw";h.style.fontSize=(12+Math.random()*16)+"px";h.style.animationDuration=(9+Math.random()*7)+"s";
    document.body.appendChild(h);setTimeout(()=>h.remove(),17000);
  },1600);
})();

/* finale sky + burst */
(function(){
  const sky=document.getElementById("finaleSky");
  for(let i=0;i<90;i++){
    const s=document.createElement("span"),big=i%9===0;
    s.className="tstar"+(big?" big":"");
    if(big)s.textContent="✦";
    s.style.left=Math.random()*100+"%";s.style.top=Math.random()*100+"%";
    const sz=big?10+Math.random()*12:1+Math.random()*2.4;
    if(big)s.style.fontSize=sz+"px";else{s.style.width=s.style.height=sz+"px";}
    s.style.setProperty("--d",(2+Math.random()*3.5)+"s");s.style.setProperty("--l",(-Math.random()*5)+"s");
    sky.appendChild(s);
  }
})();
function finaleBurst(){
  const b=document.getElementById("burst");b.innerHTML="";
  const sym=["♥","✦","✧","♡","★","✿"],col=["#ffb3c4","#fff3c4","#c9e4cc","#ffffff","#f6d38a"];
  for(let i=0;i<46;i++){
    const p=document.createElement("span"),a=Math.random()*Math.PI*2,r=140+Math.random()*Math.min(innerWidth,innerHeight)*.55;
    p.textContent=sym[i%sym.length];p.style.color=col[i%col.length];p.style.fontSize=(12+Math.random()*20)+"px";
    p.style.setProperty("--x",Math.cos(a)*r+"px");p.style.setProperty("--y",Math.sin(a)*r+"px");p.style.setProperty("--r",(Math.random()*360-180)+"deg");
    p.style.animationDelay=(Math.random()*.25)+"s";b.appendChild(p);
  }
  const f=document.getElementById("finale");f.classList.remove("flash");void f.offsetWidth;f.classList.add("flash");
}
