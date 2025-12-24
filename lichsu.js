document.addEventListener("DOMContentLoaded", () => {
  // Lấy tất cả các nút đóng
  const closeButtons = document.querySelectorAll(".close-btn");

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Tìm thẻ cha chứa cuốn sách (book-card)
      const bookCard = this.closest(".book-card");

      // Hiệu ứng mờ dần trước khi xóa
      bookCard.style.transition = "all 0.3s ease";
      bookCard.style.opacity = "0";
      bookCard.style.transform = "translateX(20px)";

      // Đợi 300ms cho hiệu ứng chạy xong rồi xóa khỏi DOM
      setTimeout(() => {
        bookCard.remove();
      }, 300);
    });
  });
});
