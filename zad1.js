let headers = [];
let wrongHeaders = {};
let goodHeaders = [];
let numery_kontur = [];
const sidebarLegend = document.querySelector(".sidebar-legend");
const headersHTML = document.querySelector(".headers");
const sidebarContent = document.querySelector(".sidebar-content"); 
const sidebarButton = document.querySelector(".sidebar-button"); 

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    headers = [];
    wrongHeaders = {};
    goodHeaders = [];
    numery_kontur = [];

    
    headersHTML.innerHTML = '';
    sidebarLegend.innerHTML = '';
    sidebarContent.innerHTML = '';
    sidebarButton.innerHTML = '';

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const bytes = new Uint8Array(e.target.result);
            const decoder = new TextDecoder('windows-1250');
            const text = decoder.decode(bytes);
            const lines = text.split('\n');
            
            let i = 0;

            while (i < lines.length) {
                let header = lines[i].trim();

                if (header) {
                    let numberLine = lines[i + 2]?.trim();
                    let number = parseInt(numberLine, 10);

                    if (!isNaN(number)) {
                        headers.push(header);
                        i += number + 3;
                    } else {
                        i += 1;
                    }
                } else {
                    i += 1;
                }
            }
            headers.forEach(header => {
                const rightSide = header.includes('/') ? header.split('/')[1] : '';
                checkNumbers(header);
                checkNumberError(header);
                checkSyntaxError(header);
                checkRepetition(header);
                checkOfuError(header, rightSide);
                checkClass(header, rightSide);
            });

            headers.forEach(header => {
                const div = document.createElement('div');
                div.classList.add('header');
                div.textContent = header;
                headersHTML.appendChild(div);
                if (header in wrongHeaders) {
                    div.classList.add('wrong-header');
                    div.style.backgroundColor = errorColors[wrongHeaders[header]];
                }
            });

            sidebarContent.innerHTML = `<p>Liczba nagłówków: <span class = "sidebar-number">${headers.length}</p> \n <p>Liczba błędnych nagłówków: <span class = "sidebar-number">${Object.keys(wrongHeaders).length}</p>`;

            generateLegend();

            buttonLabel = document.createElement('p');
            buttonLabel.innerHTML = "Eksportuj błędne kontury do pliku:";
            exportButton = document.createElement('button');
            exportButton.classList.add('export-button');
            exportButton.innerHTML = "Eksportuj";
            sidebarButton.appendChild(buttonLabel);
            sidebarButton.appendChild(exportButton);

            exportButton.addEventListener("click", exportErrorsToFile);
        };
        reader.readAsArrayBuffer(file);
    }

});

function generateLegend() {
    for (const [error, color] of Object.entries(errorColors)) {
        if (!Object.values(wrongHeaders).includes(error)) {
            continue;
        }
        const legendItem = document.createElement('div');
        legendItem.classList.add('legend-item');

        const legendColor = document.createElement('div');
        legendColor.classList.add('legend-color');
        legendColor.style.backgroundColor = color;

        const legendText = document.createElement('span');
        legendText.classList.add('legend-text');
        legendText.textContent = error;

        legendItem.appendChild(legendColor);
        legendItem.appendChild(legendText);

        sidebarLegend.classList.add('sidebar-legend-after');
        sidebarLegend.appendChild(legendItem);
    }
}

const OFU_unclassified = ['B', 'Ba', 'Bi', 'Bp', 'Bz', 'K', 'dr', 'Tk', 'Ti', 'Tp', 'Wm', 'Wp', 'Ws', 'Tr', 'N'];
const OFU = ["S", "Br", "Wsr", "W", "Lzr"];

const OZU_1 = ['Ł', 'Ps', 'Ls', 'Lz'];
const OZU_2 = ['R'];

const OZK_l_ps_ls_lz = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const OZK_r = ['I', 'II', 'IIIa', 'IIIb', 'IVa', 'IVb', 'V', 'VI', 'VIz'];

const errorColors = {
    "Błędny numer obrębu": "#AE2012",   
    "Błędny numer konturu": "#fbb02d",
    "Błąd składni, niepoprawna ilość '/'": "#CA6702",
    "Błąd składni - nieoczekiwany znak": "#0A9396",
    "Powtórzony numer konturu": "#aad576",
    "Błąd klasyfikacji - OFU nieklasyfikowane": "#E9D8A6",
    "Błąd klasyfikacji - niepoprawne OZK": "#b56576",
    "Błąd klasyfikacji - niepoprawne OFU": "#94D2BD",
    "Błąd klasyfikacji - brak OZK": "#f391a0"
    
};

function checkNumbers(header) {
    if (header.includes("/")) {
        let numbers = header.split('/')[0];
        if (numbers.includes("-")) {
            let [firstNumber, secondNumber] = numbers.split('-');
            if (isNaN(firstNumber)) {
                wrongHeaders[header] = "Błędny numer obrębu";
            }
            if (isNaN(secondNumber)) {
                wrongHeaders[header] = "Błędny numer konturu";
            }
        }
    }
}

function checkNumberError(header) {
    if (wrongHeaders[header]) return;
    if (!header.startsWith('23')) {
        wrongHeaders[header] = "Błędny numer obrębu";
    }
}

function checkSyntaxError(header) {
    if (wrongHeaders[header]) return;
    const slashCount = (header.match(/\//g) || []).length;
    if (slashCount > 1 || slashCount < 1) {
        wrongHeaders[header] = "Błąd składni, niepoprawna ilość '/'";
    } else if (header.includes(" ")) {
        wrongHeaders[header] = "Błąd składni - nieoczekiwany znak";
    }
}

function checkRepetition(header) {
    let numer_konturu = header.split('/')[0];
    if (numery_kontur.includes(numer_konturu)) {
        wrongHeaders[header] = "Powtórzony numer konturu";
    }
    else {
        numery_kontur.push(numer_konturu);
    } 
}

function checkOfuError(header, rightSide) {
    if (wrongHeaders[header] || goodHeaders.includes(header)) return;
    if (OFU_unclassified.some(prefix => rightSide.startsWith(prefix)) && !OFU.some(prefix => rightSide.startsWith(prefix))) {
        if (!OFU_unclassified.includes(rightSide)) {
            wrongHeaders[header] = "Błąd klasyfikacji - OFU nieklasyfikowane";
        } else {
            goodHeaders.push(header);
        }
    }
}

function checkClass(header, rightSide) {
    if (wrongHeaders[header] || goodHeaders.includes(header)) return;

    if (OFU.some(prefix => rightSide.includes(prefix))) {
        if (rightSide.includes("-")) {
            const [part1, part2] = rightSide.split("-");
            if ([...OZU_2, ...OZU_1].some(prefix => part2.startsWith(prefix))) {
                const suffixList = OZU_2.some(prefix => part2.startsWith(prefix)) ? OZK_r : OZK_l_ps_ls_lz;
                if (suffixList.some(suffix => part2.endsWith(suffix))) {
                    goodHeaders.push(header);
                } else {
                    wrongHeaders[header] = "Błąd klasyfikacji - niepoprawne OFU";
                }
            } else {
                wrongHeaders[header] = "Błąd klasyfikacji - niepoprawne OFU";
            }
        } else if (OFU_unclassified.includes(rightSide)) {
            goodHeaders.push(header);
        } else if (OFU.some(suffix => rightSide.endsWith(suffix))) {
            wrongHeaders[header] = "Błąd klasyfikacji - brak OZK";
        }
    } else if (OZU_1.some(prefix => rightSide.startsWith(prefix))) {
        if (rightSide.endsWith('Ls') || rightSide.endsWith('Lz')) {
            console.log("brak klasy, sprawdz czy powinien być klasyfikowany, to dopuszcza rozporządzenie");
            goodHeaders.push(header);
        } else if (OZK_l_ps_ls_lz.some(suffix => rightSide.endsWith(suffix))) {
            goodHeaders.push(header);
        } else {
            wrongHeaders[header] = "Błąd klasyfikacji - niepoprawne OZK";
        }
    } else if (OZU_2.some(prefix => rightSide.startsWith(prefix))) {
        if (OZK_r.includes(rightSide.slice(1))) {
            goodHeaders.push(header);
        } else {
            wrongHeaders[header] = "Błąd klasyfikacji - niepoprawne OZK";
        }
    } else {
        wrongHeaders[header] = "Błąd klasyfikacji - niepoprawne OFU";
    }
}

function exportErrorsToFile() {
    let fileContent = 'Błędne nagłówki:\n\n';
    for (const [header, error] of Object.entries(wrongHeaders)) {
        fileContent += `${header} - ${error}\n`;
    }
    const blob = new Blob([fileContent], { type: "text/plain" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bledne_kontury.txt";
    link.click();
    URL.revokeObjectURL(link.href);
}



