# Полный аудит сайта http://localhost:3000

**Дата аудита:** 21 июня 2026  
**Стек:** Next.js 16.2.9, React 19, Prisma ORM, PostgreSQL, Tailwind CSS  
**Тип:** Dev-сборка (development mode)

---

## 1. Скорость и производительность

### Метрики (на основе анализа ресурсов и ответов сервера)

| Метрика | Значение | Оценка |
|---------|----------|--------|
| Время ответа сервера (login) | 97 мс | Отлично |
| Время ответа сервера (dashboard) | 51 мс | Отлично |
| Время ответа API (/health) | 11 мс | Отлично |
| Общий размер JS-бандлов (dev) | **13 087 КБ (~12.8 МБ)** | Критически много |
| Размер CSS | 114 КБ | Нормально |

### Размер ресурсов

| Ресурс | Размер | Примечание |
|--------|--------|------------|
| main-app.js | **11 680 КБ (11.4 МБ)** | Dev-сборка с eval-source-maps. В продакшене будет ~300-500 КБ |
| app/layout.js | 646 КБ | Крупный — содержит все layout-компоненты |
| app-pages-internals.js | 237 КБ | Фреймворк Next.js |
| login/page.js | 164 КБ | Страница логина |
| webpack.js | 140 КБ | Dev-обёртка |
| polyfills.js | 110 КБ | Полифиллы |
| layout.css | 114 КБ | Все стили в одном файле |

### Критические рекомендации

1. **main-app.js 11.4 МБ** — это dev-сборка с eval-source-maps. В продакшене автоматически уменьшится, но рекомендуется:
   - Проверить tree-shaking: `next build` + анализ через `@next/bundle-analyzer`
   - Разделить крупные layout-компоненты (646 КБ) на ленивые загрузки
   - Убедиться что `optimizePackageImports` в next.config.ts работает для всех библиотек
2. **Нет стратегии код-сплиттинга** — вся страница логина загружается 164 КБ JS
3. **CSS не раздельный** — один файл на 114 КБ;考虑 code-split CSS по маршрутам
4. **Нет lazy-loading для тяжёлых компонентов** (recharts, jspdf и др.)

---

## 2. Ошибки консоли

### Анализ HTML на наличие JS-рисков

| Проверка | Результат |
|----------|-----------|
| Inline script tags | 14 (ожидаемо для SSR/Next.js) |
| Inline event handlers (onclick и др.) | 0 |
| eval() вызовы в HTML | 0 |
| dangerouslySetInnerHTML в HTML | 3 |

### Критические ошибки (в коде)

1. **dangerouslySetInnerHTML без санитизации** — `src/components/ui/sortable-block.tsx:119,138` и `src/components/ui/block-dialogs.tsx:31` — пользовательский контент рендерится без экранирования. Это потенциальная stored XSS.

### Некритичные предупреждения

- Dev mode: в production `console.log/debug` автоматически удаляются через `compiler.removeConsole`
- `console.warn` в seed/route.ts при bootstrap-режиме — ожидаемо

---

## 3. Сетевые проблемы

### Статусы ответов

| URL | Статус | Комментарий |
|-----|--------|-------------|
| `/` | 200 | OK |
| `/dashboard` | 200 | OK (рендерится на клиенте) |
| `/api/health` | 200 | OK |
| `/api/auth/login` | 405 (GET) / 200 (POST) | Корректно |
| `/api/auth/logout` | 401 | Корректно (требует авторизации) |
| `/api/users` | 401 | Корректно |
| `/api/documents` | 401 | Корректно |
| `/api/organizations` | 401 | Корректно |
| `/nonexistent-page-12345` | **200** | Проблема: нет страницы 404 |

### Тяжеловесы

| Ресурс | Размер | Порог |
|--------|--------|-------|
| main-app.js | **11.4 МБ** | > 500 КБ |
| app/layout.js | 646 КБ | > 500 КБ |
| layout.css | 114 КБ | OK |

### Проблема 404

**Критично:** Несуществующий URL `/nonexistent-page-12345` возвращает 200 вместо 404. Это значит:
- Нет кастомной страницы not-found
- Все URL отдают 200 — затрудняет SEO и мониторинг
- Некорректно работает `return notFound()` в серверных компонентах

---

## 4. Безопасность

### HTTP-заголовки безопасности

| Заголовок | Значение | Статус |
|-----------|----------|--------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` | ⚠️ есть `unsafe-inline` и `unsafe-eval` |
| X-Frame-Options | DENY | ✅ |
| X-Content-Type-Options | nosniff | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| X-XSS-Protection | 1; mode=block | ✅ |
| **Strict-Transport-Security** | — | ❌ **Отсутствует** |
| **Permissions-Policy** | — | ❌ **Отсутствует** |
| X-Powered-By | Next.js | ⚠️ Раскрывает фреймворк |

### Куки

| Кука | HttpOnly | Secure | SameSite | Max-Age | Примечание |
|------|----------|--------|----------|---------|------------|
| accessToken | ✅ | ❌ **Нет** | lax | 86400 (24ч) | Отсутствует флаг Secure |
| refreshToken | ✅ | ❌ **Нет** | lax | 604800 (7д) | Отсутствует флаг Secure |

**Критично:** Куки `accessToken` и `refreshToken` не имеют флага `Secure`. В продакшене (HTTPS) токены могут быть перехвачены через MITM-атаку.

### XSS-тестирование

| Тест | Результат |
|------|-----------|
| Payload в URL-параметрах | ✅ Не отражается |
| Raw payload в URL | ✅ Не отражается |
| dangerouslySetInnerHTML в коде | ❌ **Уязвимость** — пользовательский контент без санитизации |
| innerHTML в коде | ❌ **Уязвимость** — `block-dialogs.tsx:31` |

### Обнаруженные формы

**Форма логина:**
- Поля: `username` (text), `password` (password)
- Метод: POST (через JS)
- Эндпоинт: `/api/auth/login`
- Rate limiting: ✅ Реализован (checkRateLimit/recordFailure/resetAttempts)
- Демо-креды видны: `admin / admin123` — отображаются прямо в HTML

### Другие находки по безопасности

| Находка | Серьёзность | Файл |
|---------|-------------|------|
| Хардкод паролей в seed-скрипте (`admin123`, `manager123`) | Критическая | `src/app/api/seed/route.ts:23-24` |
| Bootstrap auth bypass (нет admin → неавторизованный seed) | Средняя | `src/app/api/seed/route.ts:14-20` |
| Ошибки API возвращают `String(error)` клиенту (утечка деталей) | Средняя | 176+ файлов API |
| SVG-файлы разрешены в загрузке (XSS-вектор) | Средняя | `src/app/api/upload/route.ts:9` |
| Очистка rate-limit через кастомный Bearer (не standard auth) | Средняя | `src/app/api/admin/cleanup-rate-limit/route.ts:5-9` |
| Нет проверки magic bytes при загрузке файлов | Низкая | `src/app/api/upload/route.ts:22-24` |
| Расширение файла берётся от клиента без кросс-проверки | Низкая | `src/app/api/upload/route.ts:33` |

### Положительные моменты

- ✅ Все API-маршруты (кроме health и login) защищены авторизацией
- ✅ Rate limiting на логине
- ✅ Refresh token rotation с версионированием
- ✅ Prisma ORM — параметризованные запросы (SQL injection нет)
- ✅ JWT из env-переменной, не хардкод
- ✅ CSP включает `frame-ancestors 'none'`
- ✅ XSS через URL-параметры не проходит

---

## 5. Структура и контент

### HTML-анализ

| Элемент | Результат |
|---------|-----------|
| `<title>` | ✅ "Вход - KP CRM" |
| `<meta name="description">` | ✅ "Вход в систему управления заказами и производством" |
| `<meta name="viewport">` | ✅ `width=device-width, initial-scale=1` |
| `<html lang>` | ✅ `lang="ru"` |
| `<h1>` | ✅ "KP CRM" |
| `<h2>-<h6>` | ❌ Отсутствуют |
| OpenGraph теги | ❌ Отсутствуют |
| Twitter Card теги | ❌ Отсутствуют |

### Картинки без alt

На странице логина и дашборде нет тегов `<img>` (иконки — SVG inline). Проблема отсутствует.

### Битые ссылки

| Ссылка | Статус |
|--------|--------|
| `/_next/static/css/layout.css` | ✅ 200 |
| `/_next/static/chunks/webpack.js` | ✅ 200 |
| `/favicon.ico` | ✅ 200 |

Битых ссылок не обнаружено.

### SEO-проблемы

1. ❌ Нет OpenGraph тегов (`og:title`, `og:description`, `og:image`)
2. ❌ Нет Twitter Card тегов
3. ❌ Нет `<h2>-<h6>` — только `<h1>`
4. ❌ Нет canonical URL
5. ❌ Нет sitemap.xml / robots.txt (нужно проверить)

---

## 6. Доступность и адаптивность

### Адаптивность

| Проверка | Результат |
|----------|-----------|
| Viewport meta | ✅ `width=device-width, initial-scale=1` |
| Tailwind CSS responsive | ✅ Используется `max-w-md`, responsive breakpoints |
| Горизонтальная прокрутка | ⚠️ Декоративные blur-элементы с `overflow: hidden` на body — потенциально OK, но needs testing |

### Доступность

| Проверка | Результат |
|----------|-----------|
| ARIA roles | ❌ 0 найдено |
| aria-label | ❌ 0 найдено |
| tabindex | ❌ 0 найдено |
| label + input связь | ✅ 2/2 инпута связаны с label |
| Skip navigation link | ❌ Отсутствует |
| Контрастность | ⚠️ Требует проверки визуально |
| Размер кликабельных элементов | ✅ Кнопки и инпуты достаточно велики (py-3 px-4) |

---

## 7. Сводка проблем по критичности

### Критические (мешают работе)

1. **Несуществующие URL возвращают 200** вместо 404 — сломана навигация и SEO
2. **dangerouslySetInnerHTML без санитизации** (`sortable-block.tsx`, `block-dialogs.tsx`) — stored XSS
3. **Куки без флага Secure** — токены уязвимы к MITM в продакшене

### Высокие (угрозы безопасности, большая потеря скорости)

4. **main-app.js 11.4 МБ** в dev-сборке — нужно проверить production-размер
5. **HSTS отсутствует** — нет Strict-Transport-Security
6. **Permissions-Policy отсутствует** — не ограничены browser API
7. **SVG-файлы разрешены в загрузке** — XSS-вектор через вложенный JS
8. **Хардкод паролей в seed-скрипте** — `admin123`, `manager123` в исходниках
9. **CSP содержит `unsafe-inline` и `unsafe-eval`** — ослабляет защиту

### Средние (улучшения)

10. **Demo-креды видны в HTML** (`admin / admin123`) — нужно убрать из production
11. **Ошибки API возвращают `String(error)` клиенту** — утечка деталей реализации
12. **Bootstrap auth bypass в seed** — при удалении всех admin-аккаунтов
13. **X-Powered-By раскрывает фреймворк**
14. **Нет OpenGraph / Twitter Card тегов** — плохое отображение при шаринге
15. **Нет `<h2>-<h6>`** — плоская структура заголовков
16. **Нет ARIA-атрибутов** — проблемы для screen readers
17. **Нет skip-navigation ссылки**
18. **Очистка rate-limit через кастомный Bearer auth**

### Низкие (мелкие замечания)

19. **Нет canonical URL**
20. **Нет sitemap.xml** (требует проверки)
21. **Расширение файла загрузки от клиента** без кросс-проверки с MIME
22. **Нет проверки magic bytes** при загрузке файлов

---

## 8. Мои возможности как ИИ (что я могу сделать дальше)

### Готов автоматизировать

1. **Исправить 404-страницу** — создать `not-found.tsx` в `src/app/` с кастомным дизайном
2. **Добавить санитизацию** для `dangerouslySetInnerHTML` — интегрировать DOMPurify в `sortable-block.tsx` и `block-dialogs.tsx`
3. **Добавить флаг Secure в куки** — изменить `Set-Cookie` header в `/api/auth/login`
4. **Добавить HSTS заголовок** — через next.config.ts или middleware
5. **Добавить Permissions-Policy** — через next.config.ts
6. **Скрыть X-Powered-By** — one-line в next.config.ts
7. **Убрать demo-креды** из HTML (в prod-режиме)
8. **Добавить OpenGraph / Twitter Card теги** в layout metadata
9. **Убрать SVG из allowed upload types** или добавить санитизацию
10. **Заменить `String(error)` на generic messages** в catch-блоках API
11. **Добавить canonical URL** через metadata API
12. **Добавить ARIA-атрибуты** к форме логина (aria-label, role)
13. **Добавить skip-navigation ссылку**
14. **Исправить bootstrap auth bypass** — добавить токен или env-fлаг

### Требует ручного вмешательства

- **Проверка Lighthouse score** — нужен реальный браузер с Chrome DevTools
- **Проверка 404-страницы визуально** — нужен дизайн-ревью
- **Оптимизация bundle size** — требует анализа зависимостей и архитектурных решений
- **Тестирование на мобильных устройствах** — эмуляция не заменяет реальные тесты
- **Настройка HTTPS** — зависит от deployment-окружения
- **Удаление seed-кредов из кода** — нужно согласовать стратегию bootstrap для продакшена
- **Контрастность и accessibility audit** — требует визуальной оценки
- **Настройка robots.txt и sitemap.xml** — зависит от SEO-стратегии
