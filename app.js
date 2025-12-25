// app.js - логика калькулятора стоимости договоров

document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы DOM
    const quantityInput = document.getElementById('quantity');
    const priceInput = document.getElementById('price');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Элементы для вывода результатов
    const unitPriceWithVAT = document.getElementById('unitPriceWithVAT');
    const totalPriceWithoutVAT = document.getElementById('totalPriceWithoutVAT');
    const vatAmount = document.getElementById('vatAmount');
    const totalPriceWithVAT = document.getElementById('totalPriceWithVAT');
    
    // Ставка НДС (22%)
    const VAT_RATE = 0.22;
    
    // Функция для форматирования чисел с разделителями тысяч
    function formatNumber(number) {
        return number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ').replace('.', ',');
    }
    
    // Функция для расчета всех значений
    function calculate() {
        // Получаем значения из полей ввода
        const quantity = parseFloat(quantityInput.value);
        const pricePerUnit = parseFloat(priceInput.value);
        
        // Проверяем, что значения валидны
        if (isNaN(quantity) || isNaN(pricePerUnit) || quantity <= 0 || pricePerUnit <= 0) {
            alert('Пожалуйста, введите корректные положительные значения для количества и стоимости.');
            return;
        }
        
        // Расчеты
        // 1. Стоимость единицы с НДС
        const unitPriceWithVATValue = pricePerUnit * (1 + VAT_RATE);
        
        // 2. Стоимость договора без НДС
        const totalWithoutVAT = quantity * pricePerUnit;
        
        // 3. Сумма НДС (22%)
        const vatValue = totalWithoutVAT * VAT_RATE;
        
        // 4. Стоимость договора с НДС
        const totalWithVAT = totalWithoutVAT + vatValue;
        
        // Обновляем интерфейс с результатами
        unitPriceWithVAT.textContent = `${formatNumber(unitPriceWithVATValue)} руб.`;
        totalPriceWithoutVAT.textContent = `${formatNumber(totalWithoutVAT)} руб.`;
        vatAmount.textContent = `${formatNumber(vatValue)} руб.`;
        totalPriceWithVAT.textContent = `${formatNumber(totalWithVAT)} руб.`;
    }
    
    // Функция для сброса всех значений
    function resetCalculator() {
        quantityInput.value = '';
        priceInput.value = '';
        unitPriceWithVAT.textContent = '0.00 руб.';
        totalPriceWithoutVAT.textContent = '0.00 руб.';
        vatAmount.textContent = '0.00 руб.';
        totalPriceWithVAT.textContent = '0.00 руб.';
        
        // Возвращаем фокус на первое поле ввода
        quantityInput.focus();
    }
    
    // Функция для проверки ввода и автоматического расчета при изменении значений
    function handleInputChange() {
        // Проверяем, что оба поля заполнены
        if (quantityInput.value && priceInput.value) {
            calculate();
        }
    }
    
    // Назначаем обработчики событий
    calculateBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetCalculator);
    
    // Автоматический расчет при изменении значений в полях ввода
    quantityInput.addEventListener('input', handleInputChange);
    priceInput.addEventListener('input', handleInputChange);
    
    // Автоматический расчет при нажатии Enter в любом поле
    quantityInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && quantityInput.value && priceInput.value) {
            calculate();
        }
    });
    
    priceInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && quantityInput.value && priceInput.value) {
            calculate();
        }
    });
    
    // Инициализация - фокус на первое поле при загрузке
    quantityInput.focus();
    
    // Добавляем небольшой лог для отладки
    console.log('Калькулятор договоров инициализирован и готов к работе.');
});
