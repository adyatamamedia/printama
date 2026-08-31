// Printama Landing Page Script

document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Interactive Mockup Tab Switcher
  const moduleChips = document.querySelectorAll('[data-mockup-tab]');
  const paperSheet = document.getElementById('mockupPaperSheet');
  const mockupTitle = document.getElementById('mockupTitle');

  const MODULE_CONFIGS = {
    'pas-foto': {
      title: 'Printama - Modul Pas Foto (A4 300 DPI)',
      content: `
        <div class="photo-cell filled">4×6 #1</div>
        <div class="photo-cell filled">4×6 #2</div>
        <div class="photo-cell filled">4×6 #3</div>
        <div class="photo-cell filled">4×6 #4</div>
        <div class="photo-cell filled">4×6 #5</div>
        <div class="photo-cell filled">3×4 #1</div>
        <div class="photo-cell filled">3×4 #2</div>
        <div class="photo-cell filled">3×4 #3</div>
        <div class="photo-cell filled">2×3 #1</div>
        <div class="photo-cell filled">2×3 #2</div>
        <div class="photo-cell filled">2×3 #3</div>
        <div class="photo-cell filled">2×3 #4</div>
      `
    },
    'ktp': {
      title: 'Printama - Fotokopi KTP / ID Card 1:1',
      content: `
        <div class="photo-cell filled" style="grid-column: span 3; aspect-ratio: 85.6/54; border-radius: 4px;">KTP SISI DEPAN (1:1)</div>
        <div class="photo-cell filled" style="grid-column: span 3; aspect-ratio: 85.6/54; border-radius: 4px;">KTP SISI BELAKANG (1:1)</div>
      `
    },
    'polaroid': {
      title: 'Printama - Polaroid Studio 9 Grid (Lembar #1)',
      content: `
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #1</div>
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #2</div>
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #3</div>
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #4</div>
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #5</div>
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #6</div>
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #7</div>
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #8</div>
        <div class="photo-cell filled" style="border: 3px solid #f8fafc; border-bottom-width: 10px; border-radius: 2px;">Polaroid #9</div>
      `
    }
  };

  moduleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const tab = chip.getAttribute('data-mockup-tab');
      if (!tab || !MODULE_CONFIGS[tab]) return;

      moduleChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (paperSheet && mockupTitle) {
        mockupTitle.textContent = MODULE_CONFIGS[tab].title;
        paperSheet.innerHTML = MODULE_CONFIGS[tab].content;
      }
    });
  });

  // Download Trigger Feedback
  const downloadBtns = document.querySelectorAll('[data-download-btn]');
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Terima kasih telah mengunduh Printama v1.0.0!\n\nFile installer .exe sedang disiapkan. Hubungi Telegram @dstama jika membutuhkan bantuan instalasi.');
    });
  });
});
