// Константа НДС
const VAT_RATE = 0.22; // 22%

// Глобальные переменные для хранения данных
let rowCount = 0;
let contractsData = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем первую строку по умолчанию
    addRow();
    
    // Устанавливаем обработчики событий для уже существующих элементов
    document.addEventListener('input', function(event) {
        if (event.target.classList.contains('quantity') || event.target.classList.contains('price')) {
            const rowIndex = parseInt(event.target.closest('tr').dataset.index);
            calculateRow(rowIndex);
            updateTotals();
        }
    });
});

// Функция для добавления новой строки в таблицу
function addRow() {
    const tableBody = document.getElementById('tableBody');
    rowCount++;
    
    // Создаем новый объект для хранения данных строки
    contractsData.push({
        id: rowCount,
        name: '',
        quantity: 0,
        priceWithoutVAT: 0,
        priceWithVAT: 0,
        vatAmount: 0,
        totalWithVAT: 0
    });
    
    // Создаем новую строку
    const newRow = document.createElement('tr');
    newRow.dataset.index = rowCount - 1; // Индекс в массиве
    
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="product-name" placeholder="Введите наименование" value=""></td>
        <td><input type="number" class="quantity" min="0" step="0.01" placeholder="0" value=""></td>
        <td><input type="number" class="price" min="0" step="0.01" placeholder="0.00" value=""></td>
        <td><div class="result" id="priceWithVAT-${rowCount}">0.00</div></td>
        <td><div class="result" id="vatAmount-${rowCount}">0.00</div></td>
        <td><div class="result" id="totalWithVAT-${rowCount}">0.00</div></td>
        <td><button class="btn-delete" onclick="deleteRow(${rowCount - 1})" style="padding: 5px 10px; font-size: 12px;"><i class="fas fa-times"></i></button></td>
    `;
    
    tableBody.appendChild(newRow);
    
    // Устанавливаем обработчики событий для новой строки
    const quantityInput = newRow.querySelector('.quantity');
    const priceInput = newRow.querySelector('.price');
    const nameInput = newRow.querySelector('.product-name');
    
    quantityInput.addEventListener('input', function() {
        const rowIndex = parseInt(this.closest('tr').dataset.index);
        contractsData[rowIndex].quantity = parseFloat(this.value) || 0;
        calculateRow(rowIndex);
        updateTotals();
    });
    
    priceInput.addEventListener('input', function() {
        const rowIndex = parseInt(this.closest('tr').dataset.index);
        contractsData[rowIndex].priceWithoutVAT = parseFloat(this.value) || 0;
        calculateRow(rowIndex);
        updateTotals();
    });
    
    nameInput.addEventListener('input', function() {
        const rowIndex = parseInt(this.closest('tr').dataset.index);
        contractsData[rowIndex].name = this.value;
    });
    
    // Первоначальный расчет для новой строки
    calculateRow(rowCount - 1);
    updateTotals();
}

// Функция для удаления строки по индексу
function deleteRow(index) {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    if (rows.length > 1) {
        // Удаляем строку из DOM
        rows[index].remove();
        
        // Удаляем данные из массива
        contractsData.splice(index, 1);
        
        // Обновляем индексы и номера строк
        updateRowNumbers();
        
        // Пересчитываем итоги
        updateTotals();
    } else {
        alert("Должна остаться хотя бы одна строка!");
    }
}

// Функция для удаления последней строки
function deleteLastRow() {
    if (contractsData.length > 1) {
        deleteRow(contractsData.length - 1);
    } else {
        alert("Должна остаться хотя бы одна строка!");
    }
}

// Функция для обновления номеров строк после удаления
function updateRowNumbers() {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    rowCount = rows.length;
    
    rows.forEach((row, index) => {
        // Обновляем номер в первой ячейке
        row.cells[0].textContent = index + 1;
        
        // Обновляем dataset индекс
        row.dataset.index = index;
        
        // Обновляем ID в данных
        contractsData[index].id = index + 1;
        
        // Обновляем ID элементов результатов
        row.querySelector(`#priceWithVAT-${index + 2}`).id = `priceWithVAT-${index + 1}`;
        row.querySelector(`#vatAmount-${index + 2}`).id = `vatAmount-${index + 1}`;
        row.querySelector(`#totalWithVAT-${index + 2}`).id = `totalWithVAT-${index + 1}`;
        
        // Обновляем обработчик кнопки удаления
        const deleteButton = row.querySelector('button');
        deleteButton.onclick = function() { deleteRow(index); };
    });
}

// Функция для расчета данных одной строки
function calculateRow(rowIndex) {
    if (rowIndex < 0 || rowIndex >= contractsData.length) return;
    
    const data = contractsData[rowIndex];
    
    // Расчет стоимости единицы с НДС
    data.priceWithVAT = data.priceWithoutVAT * (1 + VAT_RATE);
    
    // Расчет НДС для единицы товара
    data.vatPerUnit = data.priceWithoutVAT * VAT_RATE;
    
    // Расчет НДС для общего количества
    data.vatAmount = data.vatPerUnit * data.quantity;
    
    // Расчет общей стоимости с НДС
    data.totalWithVAT = data.priceWithVAT * data.quantity;
    
    // Обновление отображения в таблице
    document.getElementById(`priceWithVAT-${data.id}`).textContent = formatCurrency(data.priceWithVAT);
    document.getElementById(`vatAmount-${data.id}`).textContent = formatCurrency(data.vatAmount);
    document.getElementById(`totalWithVAT-${data.id}`).textContent = formatCurrency(data.totalWithVAT);
}

// Функция для расчета всех строк
function calculateAll() {
    for (let i = 0; i < contractsData.length; i++) {
        calculateRow(i);
    }
    updateTotals();
    alert("Все значения пересчитаны!");
}

// Функция для обновления итоговых значений
function updateTotals() {
    let totalWithoutVAT = 0;
    let totalVAT = 0;
    let totalWithVAT = 0;
    
    // Суммируем данные из всех строк
    contractsData.forEach(data => {
        const rowTotalWithoutVAT = data.priceWithoutVAT * data.quantity;
        totalWithoutVAT += rowTotalWithoutVAT;
        totalVAT += data.vatAmount;
        totalWithVAT += data.totalWithVAT;
    });
    
    // Обновляем отображение итогов
    document.getElementById('totalWithoutVAT').textContent = formatCurrency(totalWithoutVAT) + ' руб.';
    document.getElementById('totalVAT').textContent = formatCurrency(totalVAT) + ' руб.';
    document.getElementById('totalWithVAT').textContent = formatCurrency(totalWithVAT) + ' руб.';
}

// Функция для форматирования чисел в денежный формат
function formatCurrency(value) {
    if (isNaN(value) || value === 0) return '0.00';
    
    // Округляем до 2 знаков после запятой
    const roundedValue = Math.round(value * 100) / 100;
    
    // Форматируем с разделителями тысяч
    return roundedValue.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Экспорт данных в JSON (дополнительная функция)
function exportData() {
    const dataToExport = {
        contracts: contractsData,
        totals: {
            totalWithoutVAT: contractsData.reduce((sum, data) => sum + (data.priceWithoutVAT * data.quantity), 0),
            totalVAT: contractsData.reduce((sum, data) => sum + data.vatAmount, 0),
            totalWithVAT: contractsData.reduce((sum, data) => sum + data.totalWithVAT, 0)
        },
        vatRate: VAT_RATE * 100,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `договора_расчет_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Импорт данных из JSON (дополнительная функция)
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.contracts && Array.isArray(importedData.contracts)) {
                    // Очищаем текущие данные
                    contractsData = [];
                    document.getElementById('tableBody').innerHTML = '';
                    rowCount = 0;
                    
                    // Добавляем импортированные строки
                    importedData.contracts.forEach((contract, index) => {
                        addRow();
                        
                        // Заполняем данные
                        const currentRowIndex = index;
                        contractsData[currentRowIndex].name = contract.name || '';
                        contractsData[currentRowIndex].quantity = contract.quantity || 0;
                        contractsData[currentRowIndex].priceWithoutVAT = contract.priceWithoutVAT || 0;
                        
                        // Обновляем значения в полях ввода
                        const rows = document.getElementById('tableBody').querySelectorAll('tr');
                        const currentRow = rows[currentRowIndex];
                        
                        if (currentRow) {
                            currentRow.querySelector('.product-name').value = contract.name || '';
                            currentRow.querySelector('.quantity').value = contract.quantity || '';
                            currentRow.querySelector('.price').value = contract.priceWithoutVAT || '';
                        }
                    });
                    
                    // Пересчитываем все
                    calculateAll();
                    alert(`Данные успешно импортированы! Загружено ${importedData.contracts.length} строк.`);
                } else {
                    alert('Ошибка: неверный формат файла!');
                }
            } catch (error) {
                alert('Ошибка при чтении файла: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}
