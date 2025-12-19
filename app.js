// Константы
const FIXED_MIN_LEVEL = 30;    // Минимальный остаток
const FIXED_ORDER_VOLUME = 45; // Объем заказа
const MAX_SAFE_LEVEL = 90;     // Максимальный уровень после заправки
const REQUIRED_DAYS = 7;       // Количество дней для расчета

// Глобальные переменные
let dayData = Array(REQUIRED_DAYS).fill(null);
let consumptionChart = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    generateDayInputs();
    loadSavedData();
    updateCompletionBadge();
    updateTankVisual();
    
    document.getElementById('nitrogenForm').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateDelivery();
    });
});

// Генерация 7 полей для ввода
function generateDayInputs() {
    const container = document.getElementById('daysInputsContainer');
    container.innerHTML = '';
    
    const today = new Date();
    
    for (let i = 0; i < REQUIRED_DAYS; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayName = getDayName(date.getDay());
        const dateStr = date.toLocaleDateString('ru-RU');
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'mb-3 day-input empty';
        dayDiv.id = `dayInput${i}`;
        
        dayDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="date-header">
                    <i class="bi bi-calendar-day"></i> ${dayName}, ${dateStr}
                </span>
                <span class="badge bg-light text-dark day-status">Не заполнено</span>
            </div>
            <div class="input-group">
                <span class="input-group-text">
                    <i class="bi bi-percent"></i>
                </span>
                <input type="number" 
                       class="form-control day-level-input" 
                       data-day="${i}"
                       min="0" 
                       max="100" 
                       step="0.1"
                       placeholder="Введите уровень (0-100%)">
                <button class="btn btn-outline-secondary" type="button" onclick="fillTodayLevel(${i})">
                    Сегодня
                </button>
                <button class="btn btn-outline-secondary" type="button" onclick="copyPreviousDay(${i})">
                    <i class="bi bi-copy"></i>
                </button>
            </div>
            <div class="form-text small">
                День ${REQUIRED_DAYS - i} из ${REQUIRED_DAYS} (${getDaysAgoText(i)})
            </div>
        `;
        
        container.appendChild(dayDiv);
        
        // Добавляем обработчик события
        const input = dayDiv.querySelector('.day-level-input');
        input.addEventListener('input', function() {
            updateDayStatus(this.dataset.day, this.value);
        });
        
        input.addEventListener('change', function() {
            saveData();
        });
    }
    
    // Добавляем обработчик для поля доставки
    document.getElementById('deliveryDays').addEventListener('change', saveData);
}

// Обновление статуса дня
function updateDayStatus(dayIndex, value) {
    const dayDiv = document.getElementById(`dayInput${dayIndex}`);
    const statusBadge = dayDiv.querySelector('.day-status');
    
    if (value && value.trim() !== '') {
        const level = parseFloat(value);
        
        if (isNaN(level) || level < 0 || level > 100) {
            dayDiv.className = 'mb-3 day-input invalid';
            statusBadge.className = 'badge bg-danger';
            statusBadge.textContent = 'Некорректно';
            dayData[dayIndex] = null;
        } else {
            dayDiv.className = 'mb-3 day-input filled';
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = `${level}%`;
            dayData[dayIndex] = level;
        }
    } else {
        dayDiv.className = 'mb-3 day-input empty';
        statusBadge.className = 'badge bg-light text-dark';
        statusBadge.textContent = 'Не заполнено';
        dayData[dayIndex] = null;
    }
    
    updateCompletionBadge();
    updateTankVisual();
    saveData();
}

// Обновление бейджа заполнения
function updateCompletionBadge() {
    const filledCount = dayData.filter(day => day !== null).length;
    const badge = document.getElementById('completionBadge');
    
    if (filledCount === REQUIRED_DAYS) {
        badge.className = 'badge bg-success';
    } else if (filledCount >= REQUIRED_DAYS - 2) {
        badge.className = 'badge bg-warning';
    } else {
        badge.className = 'badge bg-secondary';
    }
    
    badge.textContent = `${filledCount}/${REQUIRED_DAYS} заполнено`;
    
    // Обновляем бейдж текущего уровня
    const currentLevel = getCurrentLevel();
    const levelBadge = document.getElementById('currentLevelBadge');
    if (currentLevel !== null) {
        levelBadge.textContent = `${currentLevel.toFixed(1)}%`;
        if (currentLevel <= FIXED_MIN_LEVEL) {
            levelBadge.className = 'badge bg-danger';
        } else if (currentLevel <= FIXED_MIN_LEVEL + 20) {
            levelBadge.className = 'badge bg-warning';
        } else {
            levelBadge.className = 'badge bg-info';
        }
    } else {
        levelBadge.textContent = '0%';
        levelBadge.className = 'badge bg-secondary';
    }
}

// Обновление визуализации емкости
function updateTankVisual() {
    const currentLevel = getCurrentLevel();
    const tankLevel = document.getElementById('tankLevel');
    const tankLabel = document.getElementById('tankLabel');
    
    const levelPercent = currentLevel !== null ? Math.min(currentLevel, 100) : 0;
    
    // Рассчитываем высоту (30% = min, 90% = max в визуализации)
    let visualHeight;
    if (levelPercent <= 30) {
        visualHeight = (levelPercent / 30) * 30; // От 0 до 30%
    } else {
        visualHeight = 30 + ((levelPercent - 30) / 70) * 60; // От 30 до 90%
    }
    
    tankLevel.style.height = `${visualHeight}%`;
    tankLabel.textContent = currentLevel !== null ? `${levelPercent.toFixed(0)}%` : '0%';
    
    // Меняем цвет в зависимости от уровня
    if (levelPercent <= FIXED_MIN_LEVEL) {
        tankLevel.style.background = 'linear-gradient(to top, #dc3545, #c82333)';
    } else if (levelPercent <= FIXED_MIN_LEVEL + 20) {
        tankLevel.style.background = 'linear-gradient(to top, #ffc107, #e0a800)';
    } else {
        tankLevel.style.background = 'linear-gradient(to top, #339af0, #1c7ed6)';
    }
}

// Получение текущего уровня (последний заполненный день)
function getCurrentLevel() {
    for (let i = 0; i < dayData.length; i++) {
        if (dayData[i] !== null) {
            return dayData[i];
        }
    }
    return null;
}

// Основная функция расчета
function calculateDelivery() {
    // Проверяем, что все поля заполнены
    const filledDays = dayData.filter(day => day !== null).length;
    
    if (filledDays < REQUIRED_DAYS) {
        showError(`Заполните все ${REQUIRED_DAYS} дней для расчета. Сейчас заполнено: ${filledDays}/${REQUIRED_DAYS}`);
        return;
    }
    
    // Проверяем корректность данных
    for (let i = 0; i < dayData.length; i++) {
        if (dayData[i] === null || dayData[i] < 0 || dayData[i] > 100) {
            showError(`Некорректные данные в дне ${i + 1}. Проверьте ввод.`);
            return;
        }
    }
    
    // Получаем текущий уровень (последний день)
    const currentLevel = dayData[0]; // День 0 - самый свежий
    
    // Рассчитываем скорость потребления
    const consumptionRate = calculateConsumptionRate();
    
    if (consumptionRate <= 0) {
        showError("Не удалось рассчитать скорость потребления. Проверьте данные.");
        return;
    }
    
    // Получаем дни на доставку
    const deliveryDays = parseInt(document.getElementById('deliveryDays').value) || 2;
    
    // Расчет
    const daysToMin = (currentLevel - FIXED_MIN_LEVEL) / consumptionRate;
    const daysToOrder = daysToMin - deliveryDays;
    
    // Проверяем, не пора ли уже заказывать
    let status, statusClass, statusIcon, recommendation;
    if (currentLevel <= FIXED_MIN_LEVEL) {
        status = "КРИТИЧЕСКИЙ УРОВЕНЬ!";
        statusClass = "urgent";
        statusIcon = "bi-exclamation-triangle-fill text-danger";
        recommendation = "Немедленно свяжитесь с поставщиком!";
    } else if (daysToOrder <= 0) {
        status = "СРОЧНО ЗАКАЗАТЬ!";
        statusClass = "urgent";
        statusIcon = "bi-exclamation-triangle-fill text-danger";
        recommendation = "Закажите сегодня же";
    } else if (daysToOrder <= 2) {
        status = "Рекомендуется заказать";
        statusClass = "warning";
        statusIcon = "bi-exclamation-circle-fill text-warning";
        recommendation = "Запланируйте заказ в ближайшие дни";
    } else {
        status = "Запас достаточный";
        statusClass = "normal";
        statusIcon = "bi-check-circle-fill text-success";
        recommendation = "Продолжайте регулярный мониторинг";
    }
    
    // Расчет дат
    const today = new Date();
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() + Math.floor(daysToOrder));
    
    const arrivalDate = new Date(orderDate);
    arrivalDate.setDate(arrivalDate.getDate() + deliveryDays);
    
    const depletionDate = new Date(today);
    depletionDate.setDate(depletionDate.getDate() + Math.ceil(daysToMin));
    
    // Расчет уровня после поставки
    const levelAfterDelivery = Math.min(currentLevel + FIXED_ORDER_VOLUME, MAX_SAFE_LEVEL);
    
    // Форматирование результатов
    const resultHTML = `
        <div class="alert ${statusClass}">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h4><i class="bi ${statusIcon}"></i> ${status}</h4>
                    <p class="mb-0">${recommendation}</p>
                </div>
                <div class="text-end">
                    <div class="badge bg-dark mb-1">${consumptionRate.toFixed(2)}%/день</div>
                    <div class="small">Скорость потребления</div>
                </div>
            </div>
            
            <hr>
            
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="bi bi-calendar-event"></i> Даты:</h6>
                    <ul class="list-unstyled">
                        <li class="mb-2">
                            <strong>Заказ до:</strong><br>
                            <span class="badge bg-primary">${orderDate.toLocaleDateString('ru-RU')}</span>
                        </li>
                        <li class="mb-2">
                            <strong>Поставка:</strong><br>
                            <span class="badge bg-info">${arrivalDate.toLocaleDateString('ru-RU')}</span>
                        </li>
                        <li>
                            <strong>Исчерпание:</strong><br>
                            <span class="badge bg-secondary">${depletionDate.toLocaleDateString('ru-RU')}</span>
                        </li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6><i class="bi bi-graph-up-arrow"></i> Показатели:</h6>
                    <ul class="list-unstyled">
                        <li class="mb-2">
                            <strong>Текущий уровень:</strong><br>
                            <span class="badge ${currentLevel <= 40 ? 'bg-danger' : currentLevel <= 60 ? 'bg-warning' : 'bg-success'}">
                                ${currentLevel.toFixed(1)}%
                            </span>
                        </li>
                        <li class="mb-2">
                            <strong>Дней до минимума:</strong><br>
                            <span class="badge ${daysToOrder <= 2 ? 'bg-danger' : 'bg-warning'}">
                                ${daysToMin.toFixed(1)}
                            </span>
                        </li>
                        <li>
                            <strong>После поставки:</strong><br>
                            <span class="badge bg-success">~${levelAfterDelivery.toFixed(0)}%</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="mt-3 small text-muted">
                <i class="bi bi-info-circle"></i> 
                Расчет на основе данных за ${REQUIRED_DAYS} дней.
                Уровень после заправки не превысит ${MAX_SAFE_LEVEL}%.
            </div>
        </div>
    `;
    
    // Обновляем контейнер с результатами
    document.getElementById('resultContainer').innerHTML = resultHTML;
    
    // Показываем детали расчета
    showCalculationDetails(consumptionRate, daysToMin);
    
    // Обновляем график
    updateConsumptionChart(consumptionRate, daysToMin, currentLevel);
    
    // Показываем детали расчета
    document.getElementById('calculationDetails').style.display = 'block';
}

// Расчет скорости потребления
function calculateConsumptionRate() {
    let totalConsumption = 0;
    let totalDays = 0;
    
    // Рассчитываем среднее потребление между всеми днями
    for (let i = 1; i < dayData.length; i++) {
        const prevLevel = dayData[i];
        const currLevel = dayData[i - 1];
        
        if (prevLevel !== null && currLevel !== null && prevLevel > currLevel) {
            const consumption = prevLevel - currLevel;
            totalConsumption += consumption;
            totalDays++;
        }
    }
    
    // Если есть потребление, возвращаем среднее за день
    // Если потребления нет или уровень растет, возвращаем 0
    return totalDays > 0 ? totalConsumption / totalDays : 0.1; // Минимальное значение, если данных нет
}

// Показать детали расчета
function showCalculationDetails(rate, daysToMin) {
    const tableBody = document.getElementById('calculationTable');
    let html = '';
    
    const today = new Date();
    
    for (let i = 0; i < REQUIRED_DAYS; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (REQUIRED_DAYS - 1 - i));
        
        const dayName = getDayName(date.getDay());
        const dateStr = date.toLocaleDateString('ru-RU');
        const level = dayData[i];
        
        let change = '';
        let dailyRate = '';
        
        if (i > 0) {
            const prevLevel = dayData[i - 1];
            if (prevLevel !== null && level !== null) {
                const diff = prevLevel - level;
                if (diff > 0) {
                    change = `-${diff.toFixed(1)}%`;
                    dailyRate = `${rate.toFixed(2)}%/день`;
                } else if (diff < 0) {
                    change = `+${Math.abs(diff).toFixed(1)}%`;
                    dailyRate = `Заправка`;
                } else {
                    change = '0%';
                    dailyRate = 'Нет расхода';
                }
            }
        }
        
        html += `
            <tr>
                <td>${dayName}<br><small class="text-muted">${dateStr}</small></td>
                <td>
                    <span class="badge ${level <= 40 ? 'bg-danger' : level <= 60 ? 'bg-warning' : 'bg-success'}">
                        ${level.toFixed(1)}%
                    </span>
                </td>
                <td>${change || '-'}</td>
                <td>${dailyRate || '-'}</td>
            </tr>
        `;
    }
    
    tableBody.innerHTML = html;
}

// Обновление графика
function updateConsumptionChart(rate, daysToMin, currentLevel) {
    const ctx = document.getElementById('consumptionChart').getContext('2d');
    
    if (consumptionChart) {
        consumptionChart.destroy();
    }
    
    // Подготовка данных для графика
    const today = new Date();
    const labels = [];
    const actualData = [];
    const forecastData = [];
    const minLevelData = [];
    
    // Исторические данные (7 дней назад до сегодня)
    for (let i = REQUIRED_DAYS - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('ru-RU'));
        actualData.push(dayData[REQUIRED_DAYS - 1 - i]);
    }
    
    // Прогноз на 14 дней вперед
    const forecastDays = 14;
    for (let i = 1; i <= forecastDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        labels.push(date.toLocaleDateString('ru-RU'));
        
        const forecastLevel = Math.max(FIXED_MIN_LEVEL, currentLevel - (rate * i));
        forecastData.push(forecastLevel);
        minLevelData.push(FIXED_MIN_LEVEL);
    }
    
    // Объединяем данные
    const allData = [...actualData, ...forecastData];
    
    consumptionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Фактический уровень',
                    data: actualData,
                    borderColor: '#339af0',
                    backgroundColor: 'rgba(51, 154, 240, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.2
                },
                {
                    label: 'Прогноз',
                    data: forecastData,
                    borderColor: '#868e96',
                    backgroundColor: 'rgba(134, 142, 150, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.2
                },
                {
                    label: 'Минимальный уровень',
                    data: minLevelData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 1,
                    borderDash: [3, 3],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Динамика уровня жидкого азота'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Уровень (%)'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Вспомогательные функции
function fillTodayLevel(dayIndex) {
    const today = new Date();
    const inputDate = new Date(today);
    inputDate.setDate(today.getDate() - dayIndex);
    
    // Если это сегодняшний день (dayIndex = 0), можно предложить текущий уровень
    if (dayIndex === 0) {
        // Можно добавить логику для получения реального уровня
        // Пока просто ставим 75% как пример
        document.querySelector(`#dayInput${dayIndex} .day-level-input`).value = 75;
        updateDayStatus(dayIndex, 75);
    } else {
        // Для прошлых дней можно предложить примерное значение
        const exampleLevel = 80 - (dayIndex * 2);
        document.querySelector(`#dayInput${dayIndex} .day-level-input`).value = Math.max(30, exampleLevel);
        updateDayStatus(dayIndex, Math.max(30, exampleLevel));
    }
}

function copyPreviousDay(dayIndex) {
    if (dayIndex > 0) {
        const prevValue = dayData[dayIndex - 1];
        if (prevValue !== null) {
            document.querySelector(`#dayInput${dayIndex} .day-level-input`).value = prevValue;
            updateDayStatus(dayIndex, prevValue);
        }
    }
}

function fillSampleData() {
    // Заполняем тестовыми данными
    const sampleData = [85, 83, 80, 78, 75, 72, 70];
    
    for (let i = 0; i < REQUIRED_DAYS; i++) {
        const input = document.querySelector(`#dayInput${i} .day-level-input`);
        input.value = sampleData[i];
        updateDayStatus(i, sampleData[i]);
    }
    
    showSuccess("Тестовые данные заполнены!");
}

function clearAllData() {
    if (confirm("Очистить все введенные данные?")) {
        for (let i = 0; i < REQUIRED_DAYS; i++) {
            const input = document.querySelector(`#dayInput${i} .day-level-input`);
            input.value = '';
            updateDayStatus(i, '');
        }
        
        document.getElementById('deliveryDays').value = 2;
        document.getElementById('resultContainer').innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calculator display-4 text-muted mb-3"></i>
                <p class="text-muted">Заполните данные за 7 дней и нажмите "Рассчитать"</p>
            </div>
        `;
        
        document.getElementById('calculationDetails').style.display = 'none';
        
        if (consumptionChart) {
            consumptionChart.destroy();
            consumptionChart = null;
        }
        
        localStorage.removeItem('nitrogen_data');
        showSuccess("Все данные очищены!");
    }
}

// Сохранение и загрузка данных
function saveData() {
    const data = {
        days: dayData,
        deliveryDays: document.getElementById('deliveryDays').value
    };
    localStorage.setItem('nitrogen_data', JSON.stringify(data));
}

function loadSavedData() {
    const saved = localStorage.getItem('nitrogen_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            if (data.days && data.days.length === REQUIRED_DAYS) {
                for (let i = 0; i < REQUIRED_DAYS; i++) {
                    if (data.days[i] !== null) {
                        const input = document.querySelector(`#dayInput${i} .day-level-input`);
                        input.value = data.days[i];
                        updateDayStatus(i, data.days[i]);
                    }
                }
            }
            
            if (data.deliveryDays) {
                document.getElementById('deliveryDays').value = data.deliveryDays;
            }
            
            showSuccess("Данные загружены из сохранения");
        } catch (e) {
            console.error("Ошибка загрузки данных:", e);
        }
    }
}

// Вспомогательные функции
function getDayName(dayIndex) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayIndex];
}

function getDaysAgoText(daysAgo) {
    if (daysAgo === 0) return 'сегодня';
    if (daysAgo === 1) return 'вчера';
    if (daysAgo === 2) return 'позавчера';
    return `${daysAgo} дней назад`;
}

function showError(message) {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill"></i> ${message}
        </div>
    `;
}

function showSuccess(message) {
    // Создаем временное уведомление
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle-fill"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}
