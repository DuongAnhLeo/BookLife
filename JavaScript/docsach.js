// --- 1. KIỂM TRA ĐĂNG NHẬP ---
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Vui lòng đăng nhập để đọc truyện!");
  window.location.href = "dangnhap.html";
}
const currentUser = JSON.parse(currentUserStr);

// --- 2. CẤU HÌNH API ---
const API_URL = "http://localhost:3000";
const USER_API_URL = "http://localhost:3000/users";

// --- 3. BIẾN TOÀN CỤC QUẢN LÝ TRẠNG THÁI ---
let gStoryId = null;
let gChapters = []; // Danh sách toàn bộ chương
let gCurrentChapterIndex = 0; // Index chương hiện tại (0, 1, 2...)
let gChapterPages = []; // Mảng chứa nội dung các trang CỦA CHƯƠNG HIỆN TẠI
let gCurrentPageIndex = 0; // Index trang hiện tại (0, 1, 2...)

// SỐ KÝ TỰ TỐI ĐA TRÊN 1 TRANG (Điều chỉnh số này nếu muốn trang dài/ngắn hơn)
const MAX_CHARS_PER_PAGE = 1500;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  gStoryId = urlParams.get("id");
  const chapterParam = urlParams.get("chapter");

  // Chapter Order từ URL (bắt đầu từ 1)
  let initialChapterOrder = chapterParam ? parseInt(chapterParam) : 1;

  if (!gStoryId) {
    alert("Không tìm thấy ID truyện!");
    window.location.href = "index.html";
    return;
  }

  addToHistory(gStoryId);
  initReadingData(gStoryId, initialChapterOrder);
  setupTocEvents();
});

// --- KHỞI TẠO DỮ LIỆU ---
async function initReadingData(storyId, chapterOrder) {
  try {
    // 1. Lấy thông tin truyện để hiển thị Header
    const storyRes = await fetch(`${API_URL}/stories/${storyId}`);
    const story = await storyRes.json();
    document.getElementById("story-title-header").textContent = story.title;
    document.getElementById(
      "back-link"
    ).href = `thongtinsach.html?id=${story.id}`;

    // 2. Lấy danh sách chương
    const chaptersRes = await fetch(`${API_URL}/chapters?storyId=${storyId}`);
    gChapters = await chaptersRes.json();

    if (gChapters.length === 0) {
      document.getElementById("chapter-content").innerHTML =
        "<p>Truyện chưa có nội dung.</p>";
      return;
    }

    // 3. Xác định index chương hiện tại
    gCurrentChapterIndex = chapterOrder - 1;
    // Validate index
    if (gCurrentChapterIndex < 0) gCurrentChapterIndex = 0;
    if (gCurrentChapterIndex >= gChapters.length)
      gCurrentChapterIndex = gChapters.length - 1;

    // 4. Xử lý chương và hiển thị trang đầu tiên (0)
    loadChapterAndRender(gCurrentChapterIndex, 0);

    // 5. Render Mục lục
    renderTableOfContents(gChapters, storyId, gCurrentChapterIndex + 1);
  } catch (error) {
    console.error(error);
    alert("Lỗi tải dữ liệu!");
  }
}

// --- XỬ LÝ NỘI DUNG CHƯƠNG (CORE LOGIC) ---
function loadChapterAndRender(chapterIndex, pageIndexToStart) {
  const chapter = gChapters[chapterIndex];

  // Hiển thị tiêu đề chương
  document.getElementById("chapter-num").textContent = `Chương ${
    chapterIndex + 1
  }`;
  document.getElementById("chapter-title").textContent = chapter.title;

  // Lấy nội dung thô (có thể là HTML hoặc Text)
  let rawContent = chapter.content || "";

  // CẮT NỘI DUNG THÀNH CÁC TRANG NHỎ
  gChapterPages = splitContentSmartly(rawContent, MAX_CHARS_PER_PAGE);

  // Xử lý vị trí trang bắt đầu
  // Nếu pageIndexToStart = -1 (tức là lùi từ chương sau về), ta set về trang cuối
  if (pageIndexToStart === -1) {
    gCurrentPageIndex = gChapterPages.length - 1;
  } else {
    gCurrentPageIndex = pageIndexToStart;
  }

  renderCurrentPage();
}

/**
 * Thuật toán cắt văn bản thông minh dựa trên dấu câu
 */
function splitContentSmartly(htmlContent, limit) {
  // 1. Tạo div ảo để lấy text thuần (nếu cần xử lý HTML phức tạp thì cần thư viện, ở đây ta xử lý cơ bản)
  // Để giữ đơn giản và hiệu quả, ta sẽ giả định nội dung là Text hoặc các thẻ <p> đơn giản.

  // Xóa thẻ HTML để đếm ký tự (nhưng khi render ta sẽ bọc lại thẻ p)
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  let fullText = tempDiv.innerText || tempDiv.textContent || "";

  // Nếu nội dung quá ngắn, trả về 1 trang
  if (fullText.length <= limit) {
    return [htmlContent]; // Giữ nguyên HTML gốc
  }

  let pages = [];
  let startIndex = 0;

  while (startIndex < fullText.length) {
    let endIndex = startIndex + limit;

    // Nếu phần còn lại nhỏ hơn limit, lấy hết
    if (endIndex >= fullText.length) {
      let chunk = fullText.slice(startIndex);
      pages.push(formatTextToHTML(chunk));
      break;
    }

    // Tìm điểm ngắt đẹp (dấu chấm, chấm than, chấm hỏi) lùi về từ endIndex
    // Tìm trong khoảng 200 ký tự lùi lại để không cắt giữa câu
    let safeEndIndex = -1;
    const lookBackRange = 300;
    const searchString = fullText.slice(
      Math.max(startIndex, endIndex - lookBackRange),
      endIndex
    );

    // Ưu tiên ngắt sau dấu chấm câu
    const lastPunctuation = Math.max(
      searchString.lastIndexOf("."),
      searchString.lastIndexOf("?"),
      searchString.lastIndexOf("!")
    );

    if (lastPunctuation !== -1) {
      // Cộng thêm offset để lấy đúng vị trí trong fullText
      safeEndIndex =
        Math.max(startIndex, endIndex - lookBackRange) + lastPunctuation + 1;
    } else {
      // Nếu không có dấu câu, tìm khoảng trắng
      const lastSpace = searchString.lastIndexOf(" ");
      if (lastSpace !== -1) {
        safeEndIndex =
          Math.max(startIndex, endIndex - lookBackRange) + lastSpace;
      } else {
        // Đường cùng: Cắt cứng tại limit
        safeEndIndex = endIndex;
      }
    }

    let chunk = fullText.slice(startIndex, safeEndIndex);
    pages.push(formatTextToHTML(chunk));

    startIndex = safeEndIndex;
  }

  return pages;
}

// Hàm format lại text thành HTML (thêm thẻ p và xuống dòng)
function formatTextToHTML(text) {
  // Trim khoảng trắng
  let cleanText = text.trim();
  // Thay thế xuống dòng (\n) thành thẻ <br> hoặc bao quanh bằng <p>
  // Ở đây ta tách theo \n và bọc mỗi đoạn vào <p>
  let paragraphs = cleanText.split("\n").filter((p) => p.trim() !== "");
  if (paragraphs.length === 0) return `<p>${cleanText}</p>`;

  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

// --- HIỂN THỊ TRANG HIỆN TẠI ---
function renderCurrentPage() {
  const contentEl = document.getElementById("chapter-content");
  const pageInfoEl = document.getElementById("page-info");
  const tocList = document.getElementById("toc-list");

  // Hiển thị nội dung
  contentEl.innerHTML = gChapterPages[gCurrentPageIndex];

  // Scroll nội dung lên đầu (nếu có thanh cuộn)
  contentEl.scrollTop = 0;

  // Cập nhật thông tin trang
  pageInfoEl.innerHTML = `
    <span style="color: #2c3e50;">Chương ${gCurrentChapterIndex + 1}</span> 
    <span style="margin: 0 10px; color: #ccc;">|</span> 
    <span>Trang ${gCurrentPageIndex + 1} / ${gChapterPages.length}</span>
  `;

  // Cập nhật trạng thái nút Next/Prev
  updateNavButtons();

  // Update URL (chỉ lưu chương, ko lưu số trang để URL gọn)
  const newUrl = `docsach.html?id=${gStoryId}&chapter=${
    gCurrentChapterIndex + 1
  }`;
  window.history.replaceState(null, "", newUrl);

  // Highlight mục lục
  const links = tocList.querySelectorAll("a");
  links.forEach((a) => (a.style.color = ""));
  if (links[gCurrentChapterIndex]) {
    links[gCurrentChapterIndex].style.color = "#d35400";
    links[gCurrentChapterIndex].style.fontWeight = "bold";
  }
}

// --- ĐIỀU HƯỚNG (LOGIC QUAN TRỌNG) ---
function updateNavButtons() {
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  // Xử lý nút Prev
  btnPrev.onclick = () => {
    if (gCurrentPageIndex > 0) {
      // 1. Còn trang trong chương hiện tại -> Lùi 1 trang
      gCurrentPageIndex--;
      renderCurrentPage();
    } else {
      // 2. Hết trang, lùi về Chương trước
      if (gCurrentChapterIndex > 0) {
        gCurrentChapterIndex--;
        // Load chương trước và nhảy tới trang cuối cùng của chương đó (-1)
        loadChapterAndRender(gCurrentChapterIndex, -1);
      } else {
        alert("Đây là trang đầu tiên của truyện!");
      }
    }
  };

  // Xử lý nút Next
  btnNext.onclick = () => {
    if (gCurrentPageIndex < gChapterPages.length - 1) {
      // 1. Còn trang trong chương hiện tại -> Tiến 1 trang
      gCurrentPageIndex++;
      renderCurrentPage();
    } else {
      // 2. Hết trang, sang Chương kế tiếp
      if (gCurrentChapterIndex < gChapters.length - 1) {
        gCurrentChapterIndex++;
        // Load chương sau và bắt đầu từ trang đầu tiên (0)
        loadChapterAndRender(gCurrentChapterIndex, 0);
      } else {
        alert("Bạn đã đọc hết truyện này!");
      }
    }
  };
}

// --- MỤC LỤC ---
function renderTableOfContents(chapters, storyId, currentOrder) {
  const listContainer = document.getElementById("toc-list");
  listContainer.innerHTML = "";
  chapters.forEach((chap, index) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = chap.title;
    a.href = "#"; // Chặn href mặc định
    a.onclick = (e) => {
      e.preventDefault();
      gCurrentChapterIndex = index;
      loadChapterAndRender(index, 0); // Về trang đầu của chương đó
      document.getElementById("mainContent").classList.remove("toc-open");
    };
    li.appendChild(a);
    listContainer.appendChild(li);
  });
}

function setupTocEvents() {
  const btnOpen = document.getElementById("btnOpenTOC");
  const btnClose = document.getElementById("btnCloseTOC");
  const mainContent = document.getElementById("mainContent");
  if (btnOpen)
    btnOpen.addEventListener("click", () =>
      mainContent.classList.add("toc-open")
    );
  if (btnClose)
    btnClose.addEventListener("click", () =>
      mainContent.classList.remove("toc-open")
    );
}

async function addToHistory(bookId) {
  const bookIdNum = Number(bookId);
  if (!currentUser.history) currentUser.history = [];
  currentUser.history = currentUser.history.filter(
    (id) => Number(id) !== bookIdNum
  );
  currentUser.history.unshift(bookIdNum);
  if (currentUser.history.length > 20) currentUser.history.length = 20;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  try {
    await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: currentUser.history }),
    });
  } catch (error) {
    console.error(error);
  }
}
