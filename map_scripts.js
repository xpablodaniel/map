// Variable global para almacenar los datos relevantes del archivo CSV
var relevantData = [];

// Función que maneja la selección de un archivo CSV
function handleFileSelect() {
    // Crear un elemento input tipo "file" para seleccionar el archivo CSV
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.addEventListener('change', (event) => {
        // Cuando se selecciona un archivo, leer su contenido
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            // Procesar el contenido del archivo CSV y almacenar los datos relevantes
            const fileContents = reader.result;
            relevantData = processData(fileContents);

            // Actualizar la salida en la página según los datos relevantes obtenidos
            const resultOutput = document.getElementById('resultOutput');
            const noDataMessage = document.getElementById('noDataMessage');

            if (relevantData.length === 0) {
                resultOutput.innerHTML = ''; // Limpiar cualquier contenido existente
                noDataMessage.style.display = 'block'; // Mostrar mensaje si no hay datos relevantes
            } else {
                resultOutput.innerHTML = relevantDataToForm(relevantData);
                noDataMessage.style.display = 'none';
            }
        };

        // Leer el archivo como texto
        reader.readAsText(file);
    });
    // Hacer clic en el elemento input oculto para abrir el diálogo de selección de archivo
    fileInput.click();
}

// Función para procesar el contenido del archivo CSV y extraer los datos relevantes
function processData(fileContents) {
    var lines = fileContents.split('\n');
    relevantData = [];

    // Longitud esperada de campos (basado en el CSV de 28 columnas)
    const EXPECTED_FIELDS_COUNT = 28; 

    for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line !== '') {
            var fields = line.split(',');

            // **************** LÓGICA DE CORRECCIÓN DE CSV (COMAS EN COLUMNA 4) ****************
            if (fields.length > EXPECTED_FIELDS_COUNT) {
                
                const extraFields = fields.length - EXPECTED_FIELDS_COUNT;
                // El índice final del campo de Observación roto (comienza en 4).
                const endObservationIndex = 4 + extraFields; 
                
                // Unir los campos rotos en un solo string, usando ';' como separador de seguridad.
                const correctedObservation = fields.slice(4, endObservationIndex + 1).join(';');
                
                // Crear el nuevo array de campos corregido (índices estables).
                const fixedFields = [
                    ...fields.slice(0, 4), // Campos del 0 al 3 (correctos)
                    correctedObservation, // El campo 4 (Observación) corregido
                    ...fields.slice(endObservationIndex + 1) // Campos del 5 en adelante (que ahora son correctos)
                ];
                
                fields = fixedFields;
            } 
            // **************** FIN DE LA LÓGICA DE CORRECCIÓN ****************

            // Asignación de variables a campos fijos:
            var passengerName = fields[13];
            var dni = fields[12];
            var hotel = fields[1];
            var dinRaw = fields[8];
            var doutRaw = fields[9];
            var din = formatDate(dinRaw);
            var dout = formatDate(doutRaw);
            var roomNumber = fields[2].replace(/[^\d]/g, '');
            var voucher = fields[6];
            var tipo = fields[3]; 
            
            // Columna 16 (Índice 16) = Servicios
            var serviciosRaw = fields[16]; 
            
            // **************** FILTRADO POR MEDIA PENSIÓN ****************
            // Si la columna de servicios NO contiene "MEDIA PENSION" (ignorando mayúsculas), se salta este registro.
            if (!serviciosRaw || !serviciosRaw.toUpperCase().includes('MEDIA PENSION')) {
                continue; 
            }
            
            // Inicializamos cantp a 1 como base
            var cantp = 1; 

            // Lógica de Cantidad de Personas (cantp) basada en el TIPO de habitación
            if (tipo && (tipo.includes('DBL MAT') || tipo.includes('DOBLE MAT') || tipo.includes('DOBLE A COMPARTIR'))) {
                cantp = 2; 
            } else if (tipo && tipo.includes('TRIPLE A COMPARTIR')) {
                cantp = 3; 
            } else if (tipo && tipo.includes('CUADRUPLE')) { 
                cantp = 4;
            } else if (tipo && tipo.includes('DBL IND') || tipo && tipo.includes('SINGLE')) {
                cantp = 1; 
            }

            var stayDuration = calculateStayDuration(dinRaw, doutRaw);
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
                // MAP: 1 comida (Cena) por día
                cenaCount: 1 * cantp * stayDuration, 
            };
            relevantData.push(relevantFields);
        }
    }

    return relevantData;
}


function formatDate(dateString) {
    var parts = dateString.split('/');
    // Asegura formato yyyy/mm/dd para new Date()
    var formattedDate = parts[2] + '/' + parts[1] + '/' + parts[0];
    return formattedDate;
}

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
    var groupedData = groupDataByRoomAndVoucher(relevantData);

    for (var key in groupedData) {
        var group = groupedData[key];

        // 1. Priorizar por DNI 
        group.sort(function(a, b) {
            return parseInt(b.dni) - parseInt(a.dni); 
        });

        var item = group[0];
        
        // --- LÓGICA DE CORRECCIÓN DE VOUCHERS INDIVIDUALES/COMPARTIDOS ---
        var finalCantp = item.cantp;
        var finalCenaCount = item.cenaCount;
        
        // Si el grupo (mismo voucher + misma habitación) es de tamaño 1, es individual.
        if (group.length === 1) {
            finalCantp = 1;
            // MAP: 1 Cena por persona/día
            finalCenaCount = 1 * 1 * item.stayDuration; 
        }
        // --- FIN: LÓGICA DE CORRECCIÓN DE BUG ---

        formHTML += '<div class="container">';
        formHTML += '<div class="logo-container"><img src="suteba_logo_3.jpg" alt="Logo"></div>';
        formHTML += '<h1 class="h1-container">Voucher de Media Pensión</h1>';
        formHTML += '<p class="p-cena">Favor de brindar servicio de Cena al siguiente afiliado:</p>';
        formHTML += '<div class="passengerName"><strong>Nombre:</strong> ' + item.passengerName + '</div>';
        formHTML += '<div class="dni"><strong>Dni:</strong> ' + item.dni + '</div>';
        formHTML += '<div class="hotel"><strong>U.Turistica</strong> ' + item.hotel + '</div>';
        formHTML += '<div class="din"><strong>Ingreso:</strong> ' + item.dinRaw + '</div>';
        formHTML += '<div class="dout"><strong>Egreso:</strong> ' + item.doutRaw + '</div>';
        formHTML += '<div class="roomNumber"><strong>Habitacion Nº:</strong> <span class="roomNumberContent">' + item.roomNumber + '</span></div>';
        formHTML += '<div class="cantp"><strong>Cant. Pax:</strong> ' + finalCantp + '</div>';
        formHTML += '<p class="p-servicios"><strong>Servicios a Tomar</strong></p>';
        formHTML += '<div class="cantMap"><strong>Cant. Cenas:</strong> ' + finalCenaCount + '</div>'; 
        formHTML += '<div class="check-container"><img src="JubPc2.png" alt="Logo"></div>';
        formHTML += '</div>';
        if (finalCenaCount === 12) { 
            // Lógica original de filtrado (se mantiene)
        }
    }

    return formHTML;
}

// Función para agrupar los datos por número de habitación y voucher
function groupDataByRoomAndVoucher(relevantData) {
    var groupedData = {};

    for (var i = 0; i < relevantData.length; i++) {
        var item = relevantData[i];
        var key = item.roomNumber + item.voucher; // Agrupación por Habitación + Voucher

        if (!groupedData[key]) {
            groupedData[key] = [];
        }

        groupedData[key].push(item);
    }

    return groupedData;
}


function downloadCSV(csv, filename) {
    var csvFile;
    var downloadLink;

    csvFile = new Blob([csv], {
        type: "text/csv"
    });

    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);

    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function saveAsCSV() {
    if (relevantData.length === 0) {
        const resultOutput = document.getElementById('resultOutput');
        resultOutput.textContent = "No hay media pensión contratada";
        return;
    }

    var csv = relevantDataToCSV(relevantData);
    downloadCSV(csv, 'voucher.csv');
}

function relevantDataToCSV(relevantData) {
    var csv = 'Nombre Pasajero,Numero Dni,Fecha de Ingreso,Fecha de Egreso,Numero de Habitacion,Cantidad de Personas,Duracion de Estadia\n';
    for (var i = 0; i < relevantData.length; i++) {
        var item = relevantData[i];
        csv += item.passengerName + ',' + item.dni + ',' + item.dinRaw + ',' + item.doutRaw + ',' + item.roomNumber + ',' + item.cantp + ',' + item.stayDuration + '\n';
    }

    return csv;
}

function printContent() {
    var headerContainer = document.querySelector('.header-container');
    var printButtonsContainer = document.querySelector('.print-buttons-container');
    headerContainer.style.display = 'none';
    printButtonsContainer.style.display = 'none'; // Ocultar también el botón de imprimir
    window.print();
    headerContainer.style.display = 'block';
    printButtonsContainer.style.display = 'block';
}
