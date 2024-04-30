document.addEventListener("DOMContentLoaded", function() {
    loadHTMLComponent('navbar-container', 'navbar.html');
    loadHTMLComponent('footer-container', 'footer.html');

    function loadHTMLComponent(containerId, filePath) {
        const container = document.getElementById(containerId);
        fetch(filePath)
            .then(response => response.text())
            .then(data => {
                container.innerHTML = data;
                if (filePath === 'navbar.html') {
                    setActiveLink();
                }
            });
    }

    function setActiveLink() {
        const path = window.location.pathname;
        const page = path.split("/").pop();
        const activeLink = document.querySelector(`#navbarNav .nav-item a[href="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
});
