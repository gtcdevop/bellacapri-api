

var dateFormat = require('dateformat');
var rp = require('request-promise');
var fs = require('fs');

var modeloDados = require("./data.js");

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate.addDays(1);
    while (currentDate <= stopDate.addDays(1)) {
        dateArray.push(dateFormat(new Date(currentDate), "yyyy-mm-dd"));
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

let _CODIGOS = {
    "RPS": 1,
    "MRC": 2,
    "CTC": 5,
    "RPR": 6,
    "RBJ": 12,
    "SCC": 13,
    "RCC": 16,
    "RPB": 35,
    "RPI": 53,
    "RPC": 62,
    "MRD": 71,
    "RPV": 72,
    "RPA": 89,
    "RPN": 98,
    "VTC": 116,
    "ARH": 119,
    "OLI": 122,
    "RBT": 123,
    "RPD": 128,
    "CTQ": 129,
    "CMT": 134,
    "BRL": 137,
    "RBV": 141,
    "FER": 146
}

let todosDados = []
let allPromises = Array();

let LOG_UNIDADES_FALTANDO = []


dataLista = getDates(new Date("2018-09-25"), new Date("2018-09-25"));

for (data of dataLista) {
    console.log(data);

    allPromises.push(rp(
        {
            method: 'GET',
            uri: 'https://ecommerce.microservices.bellacapri.com.br/v1.13/api/EmailMarketing?data=' + data,
            gzip: true
        },
        function (error, response, body) {
            // body is the decompressed response body
            let dadosModulados = {};
            try {
                dadosModulados = JSON.parse(body);
            } catch (e) {
                console.log("explodiu");
                console.log(body);
            }
            for (cada of dadosModulados) {
                // console.log(cada);
                if (!cada.Email) {
                    cada.Email = "NULO"
                }
                if (!cada.Loja) {
                    cada.Loja = "NULO"
                }
                if (!cada.NomeCliente) {
                    cada.NomeCliente = "NULO"
                }
                let codigoLoga = "NULL"
                try {
                    codigoLoga = _CODIGOS[cada.Loja];
                } catch (e) { }
                if (codigoLoga == undefined) {
                    codigoLoga = "NULL";
                    if (LOG_UNIDADES_FALTANDO.indexOf(cada.Loja) == -1) {
                        LOG_UNIDADES_FALTANDO.push(cada.Loja);
                    }
                }
                // console.log(cada);
                if (cada.Loja != "NULL") {
                    todosDados.push(`${codigoLoga};${cada.CodigoCliente};${cada.NomeCliente};${cada.EmailTratado};${cada.Loja};${cada.Telefone}`)
                }
            }
        }
    ).promise());
}


Promise.all(allPromises).then(() => {
    fs.writeFile("/tmp/" + dateFormat(new Date(), "yyyymmdd") + "-" + parseInt(Math.random() * 1000000) + ".txt", todosDados.join([separador = '\n']), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Arquivofoi salvo");
        if(LOG_UNIDADES_FALTANDO) {
            console.log("Estão faltando as unidades");
            console.log(LOG_UNIDADES_FALTANDO);
        }
    });
}).catch(err => {
    console.log(err);
});
