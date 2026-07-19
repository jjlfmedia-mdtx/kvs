"use client";
// DomGuard.tsx — Detecta manipulación del DOM en elementos críticos de autenticidad
// y recarga la página automáticamente para invalidar cualquier intento de alteración
// de los veredictos mostrados en el navegador.
import { useEffect } from "react";

const PROTECTED_SELECTORS = [
  "[data-kvs-verdict]",
  "[data-kvs-id]",
  "[data-kvs-fingerprint]",
  "[data-kvs-status]",
  "[data-c2pa-badge]",
];

export default function DomGuard() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as HTMLElement;
        if (!target || !target.matches) continue;

        const isTamperedNode = PROTECTED_SELECTORS.some(
          (sel) => target.matches(sel) || target.closest?.(sel)
        );

        if (isTamperedNode) {
          console.warn(
            "[KVS DomGuard] 🛡️ Tampering detected on critical element. Reloading...",
            mutation
          );
          window.location.reload();
          return;
        }

        // Detectar cambios en atributos de nodos protegidos
        if (
          mutation.type === "attributes" &&
          PROTECTED_SELECTORS.some(
            (sel) => (mutation.target as HTMLElement).matches?.(sel)
          )
        ) {
          console.warn("[KVS DomGuard] 🛡️ Protected attribute changed. Reloading...");
          window.location.reload();
          return;
        }
      }
    });

    // Observar todo el árbol del documento
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-kvs-verdict",
        "data-kvs-id",
        "data-kvs-fingerprint",
        "data-kvs-status",
        "data-c2pa-badge",
        "textContent",
      ],
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
