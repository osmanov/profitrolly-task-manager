# Техническое задание: Веб-приложение для декомпозиции задач с расчетом рисков

## 1. Общее описание проекта

**Цель проекта:** Создать веб-приложение для команды разработки, предназначенное для декомпозиции задач портфеля с автоматическим расчетом временных затрат, рисков и генерацией summary в формате Markdown для Jira.

**Стек технологий:**
- Backend: Python + FastAPI
- Frontend: React + TypeScript
- Database: SQLite/PostgreSQL
- Authentication: JWT
- UI/UX: В стиле Jira/Confluence
- Deployment: Replit

## 2. Система авторизации

### 2.1 Модель пользователя
```python
class User:
    id: int
    username: str (unique, 3-50 символов)
    email: str (unique, валидный email)
    password_hash: str
    full_name: str (50-200 символов)
    role: str (admin, user)
    created_at: datetime
    is_active: bool
```

### 2.2 Функциональность авторизации
- **Регистрация:** email, username, full_name, password
- **Вход:** username/email + password
- **JWT токены:** access_token (15 мин), refresh_token (7 дней)
- **Защищенные роуты:** все API кроме login/register
- **Роли:**
  - `user` - создание и управление своими портфелями
  - `admin` - управление всеми портфелями и пользователями

### 2.3 Безопасность
- Хеширование паролей: bcrypt
- Валидация сложности пароля: мин 8 символов, цифры, буквы
- Rate limiting: 5 попыток входа в минуту
- CORS настройка для фронтенда

## 3. Функциональные требования

### 3.1 Основная форма

#### 3.1.1 Поле названия портфеля
- **Тип:** Текстовое поле
- **Обязательность:** Да
- **Описание:** Единое поле для всех блоков задач
- **Валидация:** Не пустое, максимум 200 символов

#### 3.1.2 Динамические блоки задач
- **Функциональность:** Возможность добавления/удаления блоков
- **Управление:** Кнопки "Добавить задачу", "Удалить задачу"
- **Минимум:** 1 блок
- **Максимум:** Без ограничений

### 3.2 Структура блока задачи

#### 3.2.1 Название задачи
- **Тип:** Текстовое поле (input)
- **Обязательность:** Да
- **Валидация:** Не пустое, максимум 100 символов
- **Placeholder:** "Краткое название задачи"

#### 3.2.2 Описание задачи
- **Тип:** Текстовое поле (textarea)
- **Обязательность:** Да
- **Валидация:** Не пустое, максимум 1000 символов
- **Placeholder:** "Подробное описание задачи"

#### 3.2.3 Селектор команды
- **Тип:** Выпадающий список
- **Опции по умолчанию:** frontend, backend, тестирование
- **Функциональность:** Выбор из настроенных команд
- **Валидация:** Обязательное поле

#### 3.2.4 Количество дней
- **Тип:** Числовое поле
- **Диапазон:** 1 до настроенного максимума (по умолчанию 3)
- **Валидация:** Целое число в допустимом диапазоне

### 3.3 Настройки системы

#### 3.3.1 Управление командами
- **Функциональность:** 
  - Просмотр списка команд
  - Добавление новой команды
  - Редактирование названия команды
  - Удаление команды (только если не используется в задачах)
- **Интерфейс:** 
  - Таблица команд с кнопками действий
  - Модальное окно для добавления/редактирования
  - Подтверждение удаления
- **Валидация:** 
  - Уникальность названий команд
  - Не пустое название (3-50 символов)

#### 3.3.2 Настройка максимального количества дней
- **Тип:** Числовое поле
- **Диапазон:** 1-10 дней
- **По умолчанию:** 3 дня
- **Применение:** Обновляется для всех новых задач
- **Валидация:** Существующие задачи с превышением лимита помечаются предупреждением

#### 3.3.3 Сохранение настроек
- **Уровень:** Глобальные настройки (для всех пользователей)
- **Доступ:** Только администраторы
- **Хранение:** База данных

### 3.4 Расчеты и аналитика

#### 3.4.1 Группировка по командам
- **Алгоритм:** Суммирование дней по каждой команде
- **Отображение:** Таблица с командами и суммарным временем
- **Обновление:** В реальном времени при изменении данных

#### 3.4.2 Общая сумма дней
- **Расчет:** Сумма всех дней по всем задачам
- **Отображение:** Отдельная строка с выделением

#### 3.4.3 Story Points
- **Формула:** Общая сумма дней / 2
- **Округление:** До целого числа (математическое округление)
- **Отображение:** Отдельная строка "Story Points: X"

### 3.5 Система рисков

#### 3.5.1 Таблица рисков
```
Суммарная оценка в днях | Риски (дополнительные дни)
------------------------|---------------------------
2                      | 1
3-7                    | 2
8-12                   | 3
13-17                  | 4
18-22                  | 5
23-27                  | 6
28-30                  | 7
30+                    | 7 (фиксированно)
```

#### 3.5.2 Расчет с рисками
- **Формула:** Суммарная оценка в днях + значение из колонки "Риски"
- **Отображение:** "Время с рисками: X дней"
- **Примечание:** В Story Points риски НЕ учитываются

### 3.6 Календарные расчеты

#### 3.6.1 Дата начала
- **Тип:** Date picker
- **Обязательность:** Да
- **Валидация:** Не может быть в прошлом
- **По умолчанию:** Текущая дата

#### 3.6.2 Дата окончания
- **Расчет:** Автоматический на основе времени с рисками
- **Исключения:** Выходные (суббота, воскресенье) и праздничные дни РФ
- **Праздники 2025:** 
  - 1-8 января (Новогодние каникулы)
  - 22-23 февраля (День защитника Отечества)
  - 8-9 марта (Международный женский день)
  - 1-4 мая (Праздник весны и труда)
  - 8-11 мая (День Победы)
  - 12-15 июня (День России)
  - 2-4 ноября (День народного единства)
  - 31 декабря

### 3.7 Генерация Summary для Jira

#### 3.7.1 Формат вывода
- **Тип:** Markdown
- **Функциональность:** Копирование в буфер обмена
- **Кнопка:** "Скопировать Summary для Jira"

#### 3.7.2 Структура Summary
```markdown
# [Название портфеля]

## Декомпозиция задач

### Frontend
- **[Название задачи 1]** - [Описание задачи 1] - 2 дня
- **[Название задачи 2]** - [Описание задачи 2] - 3 дня

### Backend  
- **[Название задачи 3]** - [Описание задачи 3] - 1 день

### Тестирование
- **[Название задачи 4]** - [Описание задачи 4] - 2 дня

## Итоговые показатели

- **Общее время:** 8 дней
- **Story Points:** 4
- **Время с рисками:** 11 дней
- **Дата начала:** 01.09.2025
- **Дата окончания:** 16.09.2025

## Распределение по командам

| Команда | Дни |
|---------|-----|
| Frontend | 5 |
| Backend | 1 |
| Тестирование | 2 |
```

## 4. Модели данных

### 4.1 Модель портфеля
```python
class Portfolio:
    id: int
    name: str
    user_id: int (foreign key)
    start_date: date
    created_at: datetime
    updated_at: datetime
    is_archived: bool

class Task:
    id: int
    portfolio_id: int (foreign key)
    title: str
    description: str
    team: str
    days: int
    order: int
    created_at: datetime

class SystemSettings:
    id: int
    max_days_per_task: int
    updated_by: int (foreign key to User)
    updated_at: datetime

class Team:
    id: int
    name: str
    created_at: datetime
    is_active: bool
```

## 5. API Endpoints

### 5.1 Авторизация
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### 5.2 Портфели
```
GET    /api/portfolios/           # Список портфелей пользователя
POST   /api/portfolios/           # Создание портфеля
GET    /api/portfolios/{id}       # Получение портфеля
PUT    /api/portfolios/{id}       # Обновление портфеля
DELETE /api/portfolios/{id}       # Удаление портфеля
POST   /api/portfolios/{id}/calculate  # Расчет метрик
POST   /api/portfolios/{id}/export     # Генерация Markdown
```

### 5.3 Задачи
```
GET    /api/portfolios/{id}/tasks/     # Список задач портфеля
POST   /api/portfolios/{id}/tasks/     # Создание задачи
PUT    /api/tasks/{id}                 # Обновление задачи
DELETE /api/tasks/{id}                 # Удаление задачи
```

### 5.4 Настройки (только админы)
```
GET    /api/settings/              # Получение настроек
PUT    /api/settings/              # Обновление настроек
GET    /api/teams/                 # Список команд
POST   /api/teams/                 # Создание команды
PUT    /api/teams/{id}             # Обновление команды
DELETE /api/teams/{id}             # Удаление команды
```

### 5.5 Утилиты
```
GET /api/holidays/2025             # Праздники
GET /api/risks/table               # Таблица рисков
```

## 6. Frontend архитектура

### 6.1 Структура компонентов
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── portfolio/
│   │   ├── PortfolioForm.tsx
│   │   ├── TaskBlock.tsx
│   │   ├── TaskList.tsx
│   │   └── PortfolioList.tsx
│   ├── settings/
│   │   ├── SystemSettings.tsx
│   │   ├── TeamManagement.tsx
│   │   └── MaxDaysSettings.tsx
│   ├── calculations/
│   │   ├── SummaryDisplay.tsx
│   │   ├── RiskCalculator.tsx
│   │   └── DateCalculator.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePortfolio.ts
│   └── useSettings.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── calculations.ts
└── types/
    ├── auth.ts
    ├── portfolio.ts
    └── settings.ts
```

### 6.2 Роутинг
```typescript
Routes:
- / (redirect to /portfolios or /login)
- /login
- /register
- /portfolios (список портфелей)
- /portfolios/new (создание)
- /portfolios/:id (редактирование)
- /settings (только админы)
- /profile
```

## 7. UI/UX требования

### 7.1 Дизайн система
- **Стиль:** Atlassian Design System
- **Цветовая схема:** 
  - Primary: #0052CC (синий Jira)
  - Secondary: #E4F3FF (светло-синий)
  - Success: #00875A
  - Warning: #FF8B00
  - Error: #DE350B
- **Шрифты:** Inter, system-ui
- **Компоненты:** Современные кнопки, поля, модальные окна

### 7.2 Адаптивность
- Desktop first (1280px+)
- Tablet поддержка (768px+)
- Минимальная мобильная поддержка

### 7.3 Интерактивность
- Валидация форм в реальном времени
- Toast уведомления для операций
- Loader'ы для async операций
- Анимации добавления/удаления задач
- Drag & drop для изменения порядка задач

## 8. Настройка Replit

### 8.1 Структура проекта
```
project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   └── database.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── .replit
├── replit.nix
└── README.md
```

### 8.2 .replit конфигурация
```toml
modules = ["python-3.11", "nodejs-20"]

[nix]
channel = "stable-24_05"

[[ports]]
localPort = 3000
externalPort = 80

[[ports]]
localPort = 8000
externalPort = 3001

[deployment]
run = ["sh", "-c", "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 & cd frontend && npm run dev -- --host 0.0.0.0"]
```

### 8.3 Переменные окружения
```env
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-super-secret-jwt-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## 9. База данных

### 9.1 SQLite для Replit
- Файл: `app.db` в корне backend
- ORM: SQLAlchemy
- Миграции: Alembic
- Инициализация: скрипт создания таблиц

### 9.2 Схема таблиц
```sql
-- Users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Teams
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- System Settings
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    max_days_per_task INTEGER DEFAULT 3,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolios
CREATE TABLE portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT false
);

-- Tasks
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    team VARCHAR(50) NOT NULL,
    days INTEGER NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 10. Дополнительные функции

### 10.1 Интеграция с Mattermost
- **Webhook URL:** Настраиваемый в админке
- **Формат сообщения:** 
  ```
  ✅ Создан новый портфель: [Название]
  👤 Автор: [Имя пользователя]  
  📅 Срок: [Дата окончания]
  ⏱️ Время: [X дней] ([Y] с рисками)
  ```
- **Настройка:** Включение/выключение уведомлений

### 10.2 Экспорт данных
- **PDF отчет:** Генерация через библиотеку (опционально)
- **CSV экспорт:** Список задач портфеля
- **JSON backup:** Полная структура портфеля

### 10.3 История изменений
- **Аудит лог:** Кто, когда, что изменил
- **Версионирование:** Сохранение предыдущих версий портфеля
- **Rollback:** Откат к предыдущей версии

## 11. Тестирование

### 11.1 Backend тесты
- **Unit тесты:** pytest для бизнес-логики
- **Integration тесты:** Тестирование API endpoints
- **Database тесты:** Проверка моделей и связей

### 11.2 Frontend тесты
- **Unit тесты:** Jest + React Testing Library
- **Component тесты:** Тестирование компонентов
- **E2E тесты:** Cypress (опционально)

## 12. Развертывание и мониторинг

### 12.1 Production готовность
- **Логирование:** Структурированные логи
- **Обработка ошибок:** Try-catch блоки, error boundaries
- **Валидация:** Pydantic для backend, Joi/Zod для frontend
- **CORS:** Настройка для production домена

### 12.2 Производительность
- **Кеширование:** Redis для сессий (если нужно)
- **Оптимизация запросов:** Eager loading для связанных данных
- **Frontend оптимизация:** Code splitting, lazy loading

## 13. Документация

### 13.1 API документация
- **Swagger/OpenAPI:** Автогенерация из FastAPI
- **Примеры запросов:** Для каждого endpoint
- **Схемы ответов:** Подробное описание

### 13.2 Пользовательская документация
- **README:** Инструкция по запуску
- **User Guide:** Как пользоваться приложением
- **Admin Guide:** Управление настройками

## 14. Критерии приемки

### 14.1 Функциональность
- ✅ Регистрация и авторизация пользователей
- ✅ Создание портфелей с задачами (название + описание)
- ✅ Управление командами в настройках
- ✅ Настройка максимального количества дней
- ✅ Корректные расчеты времени, рисков и Story Points
- ✅ Правильный расчет дат с учетом выходных/праздников
- ✅ Генерация Markdown summary для Jira
- ✅ Административная панель для настроек

### 14.2 Качество
- ✅ UI в стиле Jira/Confluence
- ✅ Адаптивный интерфейс для desktop
- ✅ Валидация всех полей с понятными сообщениями
- ✅ Обработка ошибок с user-friendly сообщениями
- ✅ Быстрый отклик интерфейса (< 200ms)

### 14.3 Безопасность
- ✅ Хеширование паролей
- ✅ JWT аутентификация
- ✅ Авторизация по ролям
- ✅ Валидация на backend и frontend
- ✅ Rate limiting для критических операций

### 14.4 Готовность к развертыванию
- ✅ Работает в Replit из коробки
- ✅ Инициализация базы данных при первом запуске
- ✅ Документация по настройке и использованию
- ✅ Обработка production ошибок
- ✅ Логирование важных операций

---

**Приоритет разработки:**
1. **Высокий:** Авторизация, CRUD портфелей/задач, базовые расчеты
2. **Средний:** Настройки команд, расширенные расчеты, Markdown генерация
3. **Низкий:** Интеграция с MM, экспорт, история изменений

**Оценка времени разработки:** 3-4 недели (1 разработчик)

**Контакты для уточнений:** Product Owner / Technical Lead  
**Дата создания ТЗ:** 02.09.2025  
**Планируемая дата завершения:** 30.09.2025