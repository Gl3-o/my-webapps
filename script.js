// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние приложения
const state = {
  categories: [],
  items: [],
  currentCategory: null,
  selectedItem: null
};

// DOM элементы
const elements = {
  categoriesScreen: document.getElementById('categories-screen'),
  itemsScreen: document.getElementById('items-screen'),
  checkoutScreen: document.getElementById('checkout-screen'),
  categoriesList: document.getElementById('categories-list'),
  itemsList: document.getElementById('items-list'),
  categoryTitle: document.getElementById('category-title'),
  itemInfo: document.getElementById('item-info'),
  checkoutForm: document.getElementById('checkout-form'),
  errorElement: document.getElementById('error'),
  backToCategoriesBtn: document.getElementById('back-to-categories'),
  backToItemsBtn: document.getElementById('back-to-items'),
  userNameInput: document.getElementById('user_name'),
  userEmailInput: document.getElementById('user_email'),
  userPhoneInput: document.getElementById('user_number')
};

// Основная функция инициализации
async function initApp() {
  setupEventListeners();
  await loadCategories();
  showScreen('categories');
  
  // Автозаполнение имени пользователя из Telegram, если доступно
  if (tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (userName) elements.userNameInput.value = userName;
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  elements.backToCategoriesBtn.addEventListener('click', () => showScreen('categories'));
  elements.backToItemsBtn.addEventListener('click', () => showScreen('items'));
  elements.checkoutForm.addEventListener('submit', handleOrderSubmit);
}

// Загрузка категорий
async function loadCategories() {
  try {
    // Здесь должен быть реальный запрос к вашему API
    // Для примера используем мок данные
    state.categories = [
      { id: 1, name: 'Электроника' },
      { id: 2, name: 'Одежда' },
      { id: 3, name: 'Книги' }
    ];
    renderCategories();
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
    showError('Не удалось загрузить категории');
  }
}

async function loadItems(categoryId) {
  try {
    // 1. Показываем индикатор загрузки
    elements.itemsList.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Загружаем товары...</p>
      </div>
    `;

    // 2. Получаем токен бота из WebApp
    const tgToken = tg.initData || '';
    
    // 3. Отправляем запрос к вашему API
    const response = await fetch(`https://your-api-domain.com/items?category_id=${categoryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tgToken}`
      },
      cache: 'no-cache'
    });

    // 4. Обрабатываем ответ
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // 5. Валидация данных
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Некорректный формат данных');
    }

    // 6. Сохраняем товары в состоянии
    state.items = data.items.map(item => ({
      id: item.id,
      name: item.name || 'Без названия',
      price: item.price || 0,
      description: item.description || '',
      image: item.image_url || 'default-image.jpg'
    }));

    // 7. Обновляем текущую категорию
    state.currentCategory = state.categories.find(c => c.id == categoryId);
    
    // 8. Рендерим товары
    renderItems();

  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
    
    // 9. Показываем ошибку пользователю
    elements.itemsList.innerHTML = `
      <div class="error-block">
        <p>😕 Не удалось загрузить товары</p>
        <button class="retry-btn" onclick="loadItems(${categoryId})">
          Попробовать снова
        </button>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
}

// Отображение категорий
function renderCategories() {
  elements.categoriesList.innerHTML = '';
  
  state.categories.forEach(category => {
    const categoryElement = document.createElement('div');
    categoryElement.className = 'category-card';
    categoryElement.innerHTML = `
      <h3>${category.name}</h3>
      <p>Просмотреть товары</p>
    `;
    
    categoryElement.addEventListener('click', () => {
      loadItems(category.id);
      showScreen('items');
    });
    
    elements.categoriesList.appendChild(categoryElement);
  });
}

// Отображение товаров
function renderItems() {
  elements.categoryTitle.textContent = state.currentCategory.name;
  elements.itemsList.innerHTML = '';
  
  state.items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'item-card';
    itemElement.innerHTML = `
      <h3>${item.name}</h3>
      <p class="item-description">${item.description}</p>
      <p class="item-price">${item.price.toLocaleString()} ₽</p>
    `;
    
    itemElement.addEventListener('click', () => {
      state.selectedItem = item;
      renderItemInfo();
      showScreen('checkout');
    });
    
    elements.itemsList.appendChild(itemElement);
  });
}

// Отображение информации о товаре
function renderItemInfo() {
  elements.itemInfo.innerHTML = `
    <h2>${state.selectedItem.name}</h2>
    <p>${state.selectedItem.description}</p>
    <p class="item-price">Цена: ${state.selectedItem.price.toLocaleString()} ₽</p>
  `;
}

// Обработка оформления заказа
async function handleOrderSubmit(e) {
  e.preventDefault();
  
  // Получаем данные формы
  const formData = {
    name: elements.userNameInput.value.trim(),
    email: elements.userEmailInput.value.trim(),
    phone: elements.userPhoneInput.value.trim(),
    itemId: state.selectedItem.id,
    itemName: state.selectedItem.name,
    itemPrice: state.selectedItem.price
  };
  
  // Валидация
  if (!validateForm(formData)) return;
  
  // Отправка данных в Telegram бот
  try {
    tg.sendData(JSON.stringify(formData));
    // Можно показать сообщение об успехе перед закрытием
    tg.showAlert('Ваш заказ принят в обработку!', () => tg.close());
  } catch (error) {
    console.error('Ошибка отправки данных:', error);
    showError('Ошибка при оформлении заказа');
  }
}

// Валидация формы
function validateForm(formData) {
  if (formData.name.length < 2) {
    showError('Введите корректное имя');
    return false;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    showError('Введите корректный email');
    return false;
  }
  
  if (!/^[\d\+][\d\s\-\(\)]{7,}$/.test(formData.phone)) {
    showError('Введите корректный телефон');
    return false;
  }
  
  return true;
}

// Показать ошибку
function showError(message) {
  elements.errorElement.textContent = message;
  setTimeout(() => {
    elements.errorElement.textContent = '';
  }, 3000);
}

// Переключение между экранами
function showScreen(screenName) {
  // Скрываем все экраны
  Object.keys(elements).forEach(key => {
    if (key.endsWith('Screen')) {
      elements[key].style.display = 'none';
    }
  });
  
  // Показываем нужный экран
  switch (screenName) {
    case 'categories':
      elements.categoriesScreen.style.display = 'block';
      break;
    case 'items':
      elements.itemsScreen.style.display = 'block';
      break;
    case 'checkout':
      elements.checkoutScreen.style.display = 'block';
      break;
  }
  
  // Прокрутка наверх при переключении экранов
  window.scrollTo(0, 0);
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);