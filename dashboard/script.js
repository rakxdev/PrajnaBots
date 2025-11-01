// Highlight active menu link
const currentPage = window.location.pathname.split("/").pop();
const links = document.querySelectorAll(".sidebar nav a");

links.forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
  }
});
