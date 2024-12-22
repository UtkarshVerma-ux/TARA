document.addEventListener('DOMContentLoaded', function() {
    // Select elements
    const navbar = document.getElementById('navbar');
    const hamburgerMenu = document.querySelector('.hamburger-menu');

    // Toggle 'open' class on the navbar and hamburger menu
    function toggleNavbar() {
        navbar.classList.toggle('open');
        hamburgerMenu.classList.toggle('open');
    }

    // Add event listener to the hamburger menu
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleNavbar);
    }
});
