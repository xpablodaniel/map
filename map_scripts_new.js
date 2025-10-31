// Variable global para almacenar los datos relevantes del archivo CSV
var relevantData = [];

// Función que maneja la selección de un archivo CSV
function handleFileSelect() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            const fileContents = reader.result;
            relevantData = processData(fileContents);

            const resultOutput = document.getElementById('resultOutput');
            const noDataMessage = document.getElementById('noDataMessage');

            if (relevantData.length === 0) {
                resultOutput.innerHTML = '';
                noDataMessage.style.display = 'block';
            } else {
                resultOutput.innerHTML = relevantDataToForm(relevantData);
                noDataMessage.style.display = 'none';
            }
        };

        reader.readAsText(file);
    });
    fileInput.click();
}

// Función para procesar el contenido del archivo CSV y extraer los datos relevantes
function processData(fileContents) {
    var lines = fileContents.split('\n');
    relevantData = [];

    for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line !== '') {
            var fields = line.split(',');

            // Extraer los campos relevantes del archivo CSV
            var passengerName = fields[13];
            var services = fields[16];
            var dni = fields[12];
            var hotel = fields[1];
            var dinRaw = fields[8];
            var doutRaw = fields[9];
            var din = formatDate(dinRaw);
            var dout = formatDate(doutRaw);
            var roomNumber = fields[2];
            var cantp = fields[5]; // Usar directamente la cantidad de personas del CSV
            var stayDuration = calculateStayDuration(dinRaw, doutRaw);
            var voucher = fields[6];

            // Validar si el pasajero contrató desayuno (si solo tiene desayuno, se ignora)
            if (services.toUpperCase().includes('DESAYUNO') && !services.toUpperCase().includes('MEDIA PENSION')) {
                continue;
            }

            // Verificar si el pasajero viene acompañado
            var isAccompanied = isPassengerAccompanied(relevantData, roomNumber, voucher);

            if (!isAccompanied) {
                var relevantFields = {
                    passengerName,
                    dni,
                    hotel,
                    din,
                    dout,
                    dinRaw,
                    doutRaw,
                    roomNumber,
                    cantp,
                    stayDuration,
                    voucher,
                    cenaCount: parseInt(cantp) * stayDuration,
                };

                relevantData.push(relevantFields);
            }
        }
    }

    return relevantData;
}

// Función para verificar si un pasajero está acompañado
function isPassengerAccompanied(relevantData, roomNumber, voucher) {
    for (var i = 0; i < relevantData.length; i++) {
        var item = relevantData[i];
        if (item.roomNumber === roomNumber && item.voucher === voucher) {
            return true;
        }
    }
    return false;
}

// Función para formatear una fecha
function formatDate(dateString) {
    var parts = dateString.split('/');
    var formattedDate = parts[2] + '/' + parts[1] + '/' + parts[0];
    return formattedDate;
}

// Función para calcular la duración de la estancia
function calculateStayDuration(dinRaw, doutRaw) {
    var dinDate = new Date(formatDate(dinRaw));
    var doutDate = new Date(formatDate(doutRaw));
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    var duration = Math.round((doutDate - dinDate) / millisecondsPerDay);
    return duration;
}

// Función para convertir los datos relevantes a una forma HTML
function relevantDataToForm(relevantData) {
    var formHTML = '';

    for (var i = 0; i < relevantData.length; i++) {
        var item = relevantData[i];

        formHTML += '<div class="container">';
        formHTML += '<div class="logo-container"><img src="suteba_logo_3.jpg" alt="Logo"></div>';
        formHTML += '<h1 class="h1-container">Voucher de Comidas</h1>';
        formHTML += '<p class="p-cena">Favor de brindar servicio de Cena al siguiente afiliado:</p>';
        formHTML += '<div class="passengerName"><strong>Nombre:</strong> ' + item.passengerName + '</div>';
        formHTML += '<div class="dni"><strong>Dni:</strong> ' + item.dni + '</div>';
        formHTML += '<div class="hotel"><strong>U.Turistica</strong> ' + item.hotel + '</div>';
        formHTML += '<div class="din"><strong>Ingreso:</strong> ' + item.dinRaw + '</div>';
        formHTML += '<div class="dout"><strong>Egreso:</strong> ' + item.doutRaw + '</div>';
        formHTML += '<div class="roomNumber"><strong>Habitacion Nº:</strong> <span class="roomNumberContent">' + item.roomNumber + '</span></div>';
        formHTML += '<div class="cantp"><strong>Cant. Pax:</strong> ' + item.cantp + '</div>';
        formHTML += '<p class="p-servicios"><strong>Servicios a Tomar</strong></p>';
        formHTML += '<div class="cantMap"><strong>Cant. Comidas:</strong> ' + item.cenaCount + '</div>';
        formHTML += '<div class="check-container"><img src="MapDay.png" alt="Logo"></div>';
        formHTML += '</div>';
    }

    return formHTML;
}

function printContent() {
    var headerContainer = document.querySelector('.header-container');
    headerContainer.style.display = 'none';
    window.print();
    headerContainer.style.display = 'block';
}

document.addEventListener("DOMContentLoaded", function () {
    var downloadButton = document.getElementById("downloadButton");
    if (downloadButton) {
        downloadButton.style.display = "none";
    }
});