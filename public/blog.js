// Adds a Copy button to every <pre> code block on a blog post.
(function () {
  function addCopyButtons() {
    const pres = document.querySelectorAll(".post pre");
    pres.forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return; // idempotent
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = (code ? code.innerText : pre.innerText).replace(/\nCopy$/, "");
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Fallback for older browsers
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch {}
          document.body.removeChild(ta);
        }
        btn.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1800);
      });
      pre.appendChild(btn);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addCopyButtons);
  } else {
    addCopyButtons();
  }
})();
