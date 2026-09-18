// 定義本地儲存的 key，讓待辦資料與設定可以在重新整理後保留
const STORAGE_KEY = 'todo-list-items-v1';
const THEME_KEY = 'todo-theme-preference';
const FILTER_KEY = 'todo-filter-preference';

// 取得畫面上的元素
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const remainingCount = document.getElementById('remainingCount');
const themeToggle = document.getElementById('themeToggle');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentFilter = localStorage.getItem(FILTER_KEY) || 'all';

// 從 localStorage 讀取待辦資料，若沒有資料則回傳空陣列
function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    return savedTodos ? JSON.parse(savedTodos) : [];
  } catch (error) {
    console.error('讀取待辦資料失敗:', error);
    return [];
  }
}

// 將待辦資料存回 localStorage
function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 依照使用者選擇，若未手動設定則跟隨作業系統的深淺色設定
function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 套用深色 / 淺色主題，並更新切換按鈕文字
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  if (theme === 'dark') {
    themeToggle.textContent = '☀️ 淺色模式';
    themeToggle.setAttribute('aria-label', '切換到淺色模式');
  } else {
    themeToggle.textContent = '🌙 深色模式';
    themeToggle.setAttribute('aria-label', '切換到深色模式');
  }
}

// 依照目前篩選類型回傳可顯示的待辦項目
function getFilteredTodos(todos) {
  if (currentFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }

  if (currentFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

// 計算未完成項目數量，並更新底部顯示（不受篩選影響）
function updateRemainingCount(todos) {
  const unfinishedCount = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = unfinishedCount;
}

// 更新篩選按鈕的 active 狀態
function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle('active', isActive);
  });
}

// 依據目前篩選條件回傳對應的空狀態提示文字
function getEmptyStateMessage() {
  if (currentFilter === 'active') {
    return '沒有未完成的待辦事項';
  }

  if (currentFilter === 'completed') {
    return '沒有已完成的待辦事項';
  }

  return '還沒有任何待辦事項,新增一個吧!';
}

// 將待辦項目渲染到畫面上
function renderTodos() {
  const todos = loadTodos();
  const visibleTodos = getFilteredTodos(todos);

  updateFilterButtons();
  updateRemainingCount(todos);

  // 若篩選後沒有項目，顯示對應的空狀態文字
  if (visibleTodos.length === 0) {
    todoList.innerHTML = '';
    emptyState.textContent = getEmptyStateMessage();
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  todoList.innerHTML = visibleTodos
    .map(
      (todo) => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <div class="todo-main">
            <input
              class="todo-checkbox"
              type="checkbox"
              ${todo.completed ? 'checked' : ''}
              aria-label="標記完成"
            />
            <span class="todo-text">${escapeHtml(todo.text)}</span>
          </div>
          <button class="todo-delete" type="button" aria-label="刪除待辦">刪除</button>
        </li>
      `
    )
    .join('');
}

// 轉義 HTML 字元，避免輸入內容被當成標籤注入
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 新增待辦事項，空白內容就不新增
function addTodo(text) {
  const trimmedText = text.trim();

  // 若輸入空白，直接忽略，不新增項目
  if (!trimmedText) {
    return;
  }

  const todos = loadTodos();
  const newTodo = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: trimmedText,
    completed: false,
  };

  todos.push(newTodo);
  saveTodos(todos);
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

// 切換待辦完成狀態
function toggleTodo(todoId) {
  const todos = loadTodos();
  const updatedTodos = todos.map((todo) => {
    if (todo.id === todoId) {
      return { ...todo, completed: !todo.completed };
    }
    return todo;
  });

  saveTodos(updatedTodos);
  renderTodos();
}

// 刪除指定待辦事項
function deleteTodo(todoId) {
  const todos = loadTodos().filter((todo) => todo.id !== todoId);
  saveTodos(todos);
  renderTodos();
}

// 切換主題，並儲存使用者選擇
function toggleTheme() {
  const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
}

// 設定目前篩選狀態，並重新渲染列表
function setFilter(filter) {
  currentFilter = filter;
  localStorage.setItem(FILTER_KEY, filter);
  renderTodos();
}

// 表單提交事件：新增待辦
 todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTodo(todoInput.value);
});

// 清單點擊事件：只處理刪除按鈕
 todoList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('.todo-delete');
  const item = event.target.closest('.todo-item');

  if (!item || !deleteButton) {
    return;
  }

  deleteTodo(item.dataset.id);
});

// 清單變更事件：只處理 checkbox 勾選狀態
 todoList.addEventListener('change', (event) => {
  const checkbox = event.target.closest('.todo-checkbox');

  if (!checkbox) {
    return;
  }

  const item = checkbox.closest('.todo-item');
  if (!item) {
    return;
  }

  toggleTodo(item.dataset.id);
});

// 深色模式按鈕點擊事件
 themeToggle.addEventListener('click', toggleTheme);

// 篩選按鈕點擊事件
 filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setFilter(button.dataset.filter);
  });
});

// 初始化頁面：先套用主題與渲染待辦項目
applyTheme(getPreferredTheme());
renderTodos();
