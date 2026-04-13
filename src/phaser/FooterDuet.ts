export function buildInteractiveFooter(_reducedMotion?: boolean): HTMLElement {
  const section = document.createElement("section");
  section.className = "footer-duet";
  section.innerHTML = `
    <div class="footer-duet__meta footer-duet__meta--stacked">
      <p class="footer-duet__copyright">Ilya G Mirin 2026</p>
      <p>Cards and UI sounds adapted from open sources.</p>
    </div>
  `;

  return section;
}
