(() => { "use strict"; const y = document.getElementById("current-year"); if (y) y.textContent = new Date().getFullYear(); const t = document.querySelector(".menu-toggle"), m = document.querySelector(".mobile-menu"); function close() { if (!t || !m) return; t.classList.remove("active"); m.classList.remove("active"); t.setAttribute("aria-expanded", "false"); t.setAttribute("aria-label", "Open navigation menu") } if (t && m) { t.addEventListener("click", () => { const o = !m.classList.contains("active"); m.classList.toggle("active", o); t.classList.toggle("active", o); t.setAttribute("aria-expanded", String(o)); t.setAttribute("aria-label", o ? "Close navigation menu" : "Open navigation menu") }); m.querySelectorAll("a").forEach(a => a.addEventListener("click", close)); addEventListener("resize", () => { if (innerWidth > 768) close() }) } const items = document.querySelectorAll(".reveal"), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; 
const heroVideo = document.querySelector(".hero-video");
if (reduce && heroVideo) {
    heroVideo.pause();
    heroVideo.removeAttribute("autoplay");
}
if (reduce || !("IntersectionObserver" in window)) items.forEach(x => x.classList.add("is-visible")); else { const io = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add("is-visible"), Number(e.target.dataset.delay || 0)); o.unobserve(e.target) } }), { threshold: .12 }); items.forEach(x => io.observe(x)) } const form = document.getElementById("lead-form"), status = document.getElementById("form-status"); if (form && status) form.addEventListener("submit", async e => { e.preventDefault(); const b = form.querySelector('button[type="submit"]'), data = Object.fromEntries(new FormData(form).entries()); status.className = "form-status"; status.textContent = "Sending…"; b.disabled = true; try { const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }), j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.detail || "Could not send your enquiry."); status.classList.add("success"); status.textContent = "Thanks — your enquiry has been received."; form.reset() } catch (err) { status.classList.add("error"); status.textContent = location.port === "5500" ? "Run the complete site with FastAPI on port 8000 to use the form." : (err.message || "Something went wrong.") } finally { b.disabled = false } }) })();

/* Enquiry popup */
(() => {
    const modal = document.getElementById("enquiry-modal");

    if (!modal) return;

    const closeButtons = modal.querySelectorAll("[data-close-enquiry]");
    const firstInput = modal.querySelector('input[name="name"]');
        const popupForm = document.getElementById("popup-lead-form");
    const popupStatus = document.getElementById("popup-form-status");

    let appearanceCount = 0;
    let reopenTimer = null;

    function openEnquiryModal() {
        if (appearanceCount >= 2) return;

        appearanceCount += 1;

        modal.hidden = false;
        document.body.classList.add("enquiry-modal-open");

        setTimeout(() => {
            firstInput?.focus();
        }, 100);
    }

    function closeEnquiryModal() {
        modal.hidden = true;
        document.body.classList.remove("enquiry-modal-open");

        if (appearanceCount === 1) {
            reopenTimer = setTimeout(openEnquiryModal, 15000);
        }
    }

    const firstPopupTimer = setTimeout(openEnquiryModal, 3000);

    closeButtons.forEach((button) => {
        button.addEventListener("click", closeEnquiryModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeEnquiryModal();
        }
    });
    if (popupForm && popupStatus) {
        popupForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const button = popupForm.querySelector('button[type="submit"]');
            const data = Object.fromEntries(new FormData(popupForm).entries());

            popupStatus.className = "popup-form-status";
            popupStatus.textContent = "Sending...";
            button.disabled = true;

            try {
                const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        result.detail || "Could not send your enquiry."
                    );
                }

                popupStatus.classList.add("success");
                popupStatus.textContent =
                    "Thank-you for enquiry, our career advisor will connect you soon.";

                popupForm.reset();

                appearanceCount = 2;
                clearTimeout(reopenTimer);

                setTimeout(() => {
                    closeEnquiryModal();
                }, 1000);

            } catch (error) {
                popupStatus.classList.add("error");
                popupStatus.textContent =
                    error.message || "Something went wrong.";
            } finally {
                button.disabled = false;
            }
        });
    }
    window.addEventListener("beforeunload", () => {
        clearTimeout(firstPopupTimer);
        clearTimeout(reopenTimer);
    });
})();