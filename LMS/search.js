// search.js
document.addEventListener('DOMContentLoaded', () => {
    // Fitur Pencarian Real-time Global
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    function performSearch() {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase().trim();
        
        // Element yang dapat dicari di berbagai halaman
        const itemsToSearch = document.querySelectorAll(`
            .accordion-item, 
            .ongoing-class-card, 
            .course-card, 
            .notification, 
            .faq-item,
            .module-item,
            .grades-table tbody tr,
            .profile-card,
            .setting-item,
            .card
        `);

        if (query === '') {
            itemsToSearch.forEach(item => {
                // Return to original display state
                item.style.display = '';
                if (item.classList.contains('accordion-item')) {
                    item.classList.remove('active');
                }
            });
            return;
        }

        itemsToSearch.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = '';
                if (item.classList.contains('accordion-item')) {
                    item.classList.add('active'); // otomatis buka accordion jika cocok
                }
            } else {
                item.style.display = 'none';
            }
        });
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keyup', () => {
            performSearch(); 
        });
    }
});
