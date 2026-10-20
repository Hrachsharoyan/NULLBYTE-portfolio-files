/* NULLBYTE — main.js | dependency-free interactions */
(() => {
  "use strict";

  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  onReady(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const boot = document.getElementById("bootScreen");
    const menu = document.getElementById("navLinks");
    const menuButton = document.querySelector(".hamburger");
    const backToTop = document.querySelector(".back-to-top");

    // Boot screen: dismiss on input or automatically, so it can never trap the visitor.
    if (boot) {
      let dismissed = false;
      let hideTimer;
      const dismissBoot = () => {
        if (dismissed) return;
        dismissed = true;
        window.clearTimeout(hideTimer);
        boot.classList.add("is-dismissed");
        boot.setAttribute("aria-hidden", "true");
        window.setTimeout(() => boot.remove(), reducedMotion ? 0 : 550);
        document.removeEventListener("keydown", dismissOnKey);
        boot.removeEventListener("pointerdown", dismissBoot);
      };
      const dismissOnKey = (event) => {
        if (event.key === "Tab" || event.key === "Shift") return;
        dismissBoot();
      };
      document.addEventListener("keydown", dismissOnKey);
      boot.addEventListener("pointerdown", dismissBoot);
      hideTimer = window.setTimeout(dismissBoot, reducedMotion ? 250 : 3200);
    }

    // Responsive navigation.
    const closeMenu = () => {
      menu?.classList.remove("is-open");
      menuButton?.classList.remove("is-open");
      menuButton?.setAttribute("aria-expanded", "false");
      menuButton?.setAttribute("aria-label", "Open navigation menu");
    };
    const toggleMenu = () => {
      if (!menu || !menuButton) return;
      const open = menu.classList.toggle("is-open");
      menuButton.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    };
    menuButton?.addEventListener("click", toggleMenu);
    menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("click", (event) => {
      if (menu?.classList.contains("is-open") && !menu.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    }, { passive: true });

    // Smooth-scroll anchors, with a reduced-motion fallback.
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        if (history.replaceState) history.replaceState(null, "", href);
      });
    });

    // Reveal content when it enters the viewport; show everything if observers are unavailable.
    const revealItems = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reducedMotion) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -28px 0px" });
      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    // Animate progress bars using the value declared in the markup.
    const progressBars = document.querySelectorAll("[data-width]");
    const setProgress = (bar) => {
      const rawValue = bar.getAttribute("data-width");
      if (!rawValue) return;
      const value = Math.min(100, Math.max(0, Number.parseFloat(rawValue)));
      if (Number.isFinite(value)) bar.style.width = `${value}%`;
    };
    if ("IntersectionObserver" in window && !reducedMotion) {
      const progressObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setProgress(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.3 });
      progressBars.forEach((bar) => progressObserver.observe(bar));
    } else {
      progressBars.forEach(setProgress);
    }

    // Back-to-top control and current navigation section.
    const sections = [...document.querySelectorAll("main section[id]")];
    let scrollTicking = false;
    const updateOnScroll = () => {
      if (backToTop) backToTop.classList.toggle("is-visible", window.scrollY > 500);
      let activeId = "home";
      sections.forEach((section) => {
        if (window.scrollY >= section.offsetTop - 190) activeId = section.id;
      });
      menu?.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
      });
      scrollTicking = false;
    };
    window.addEventListener("scroll", () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateOnScroll);
        scrollTicking = true;
      }
    }, { passive: true });
    backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
    updateOnScroll();

    // Contact form builds a mailto draft in the visitor's email client. It does not pretend to send server-side.
    const form = document.getElementById("contactForm");
    const formNote = document.getElementById("formNote");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const name = document.getElementById("contactName")?.value.trim() || "";
      const email = document.getElementById("contactEmail")?.value.trim() || "";
      const message = document.getElementById("contactMessage")?.value.trim() || "";
      const subject = encodeURIComponent(`Portfolio message from ${name}`);
      const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nReply email: ${email}`);
      if (formNote) formNote.textContent = "Opening your email app with the message draft…";
      window.location.href = `mailto:Hrachprofessional@hotmail.com?subject=${subject}&body=${body}`;
    });

    // Current year is maintained automatically.
    document.querySelectorAll("[data-current-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });

    // Safer external links for every new tab.
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      link.setAttribute("rel", [...rel].join(" "));
    });
  });
})();
